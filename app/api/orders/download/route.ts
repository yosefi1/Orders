import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import { format as formatDate } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const format = searchParams.get('format'); // 'excel', 'word'

    if (!format || !['excel', 'word'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Fetch orders
    let ordersResult;
    if (date) {
      ordersResult = await sql`
        SELECT * FROM orders
        WHERE order_date = ${date}
        ORDER BY created_at ASC
      `;
    } else {
      ordersResult = await sql`
        SELECT * FROM orders
        ORDER BY created_at DESC
        LIMIT 100
      `;
    }

    const orders = ordersResult;

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }

    // Fetch order items for each order
    for (const order of orders) {
      const itemsResult = await sql`
        SELECT 
          oi.quantity,
          oi.price,
          oi.selected_addons,
          oi.selected_variation,
          oi.special_instructions,
          mi.name
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = ${order.id}
      `;
      
      order.order_items = itemsResult.map((row: any) => ({
        quantity: row.quantity,
        price: parseFloat(row.price),
        selected_addons: row.selected_addons,
        selected_variation: row.selected_variation,
        special_instructions: row.special_instructions,
        menu_items: { name: row.name }
      }));
    }

    // Generate file based on format
    const today = formatDate(new Date(), 'yyyy-MM-dd');
    if (format === 'excel') {
      const buffer = await generateExcel(orders);
      const filename = `orders-${date || 'all'}-${today}.xlsx`;
      const excelBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      return new NextResponse(new Uint8Array(excelBuffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (format === 'word') {
      const buffer = await generateWord(orders);
      const filename = `orders-${date || 'all'}-${today}.docx`;
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function generateExcel(orders: any[]): Promise<Buffer | ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('הזמנות');

  // Set column headers and widths
  worksheet.columns = [
    { header: 'שם לקוח', key: 'customerName', width: 15 },
    { header: 'טלפון', key: 'phone', width: 12 },
    { header: 'פריט', key: 'item', width: 20 },
    { header: 'כמות', key: 'quantity', width: 8 },
    { header: 'תוספות', key: 'addons', width: 25 },
    { header: 'הוראות מיוחדות', key: 'instructions', width: 20 },
  ];

  // Set page orientation to landscape
  worksheet.pageSetup = {
    orientation: 'landscape',
  };

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add data rows
  orders.forEach((order) => {
    if (order.order_items && order.order_items.length > 0) {
      const firstRowNumber = worksheet.rowCount + 1;
      
      order.order_items.forEach((item: any, index: number) => {
        const addons = item.selected_addons && Array.isArray(item.selected_addons) 
          ? item.selected_addons.join(', ') 
          : '';
        
        const row = worksheet.addRow({
          customerName: index === 0 ? order.customer_name : '',
          phone: index === 0 ? (order.customer_phone || '') : '',
          item: item.menu_items?.name || '',
          quantity: item.quantity,
          addons: addons,
          instructions: item.special_instructions || '',
        });
      });

      // Merge cells for customer info (name and phone) across all rows of this order
      if (order.order_items.length > 1) {
        const lastRowNumber = worksheet.rowCount;
        // Merge customer name
        worksheet.mergeCells(`A${firstRowNumber}:A${lastRowNumber}`);
        // Merge phone
        worksheet.mergeCells(`B${firstRowNumber}:B${lastRowNumber}`);
      }
    }
  });

  // Add borders to all cells
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function generateWord(orders: any[]): Promise<Buffer> {
  const children: any[] = [
    new Paragraph({
      text: 'דוח הזמנות',
      heading: 'Heading1',
    }),
    new Paragraph({ text: '' }),
  ];

  orders.forEach((order, index) => {
    // Order header
    children.push(
      new Paragraph({
        text: `הזמנה #${index + 1} - ${order.id.slice(0, 8)}`,
        heading: 'Heading2',
      }),
    );

    // Customer info
    children.push(
      new Paragraph(`שם: ${order.customer_name}`),
    );
    if (order.customer_phone) {
      children.push(new Paragraph(`טלפון: ${order.customer_phone}`));
    }
    if (order.customer_email) {
      children.push(new Paragraph(`אימייל: ${order.customer_email}`));
    }
    children.push(
      new Paragraph(`תאריך: ${new Date(order.created_at).toLocaleDateString('he-IL')}`),
      new Paragraph(`סטטוס: ${order.status}`),
      new Paragraph({ text: '' }),
    );

    // Order items
    if (order.order_items && order.order_items.length > 0) {
      children.push(new Paragraph('פריטים:'));
      order.order_items.forEach((item: any) => {
        const itemPrice = parseFloat(String(item.price || 0));
        let itemText = `• ${item.quantity}x ${item.menu_items?.name || ''} - ${itemPrice.toFixed(2)} ₪`;
        if (item.selected_variation) {
          itemText += ` (${item.selected_variation})`;
        }
        if (item.selected_addons && Array.isArray(item.selected_addons) && item.selected_addons.length > 0) {
          itemText += ` [תוספות: ${item.selected_addons.join(', ')}]`;
        }
        if (item.special_instructions) {
          itemText += ` [הוראות: ${item.special_instructions}]`;
        }
        children.push(new Paragraph(itemText));
      });
    }

    // Total
    children.push(
      new Paragraph({ text: '' }),
      new Paragraph({
        text: `סה"כ: ${parseFloat(order.total_amount.toString()).toFixed(2)} ₪`,
        heading: 'Heading3',
      }),
      new Paragraph({ text: '' }),
      new Paragraph({ text: '─────────────────────────' }),
      new Paragraph({ text: '' }),
    );
  });

  const doc = new Document({
    sections: [{
      children: children,
    }],
  });
  return await Packer.toBuffer(doc);
}



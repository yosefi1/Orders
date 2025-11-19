import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import { format as formatDate } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const format = searchParams.get('format'); // 'excel', 'word', 'pdf'

    if (!format || !['excel', 'word', 'pdf'].includes(format)) {
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
      const buffer = generateExcel(orders);
      const filename = `orders-${date || 'all'}-${today}.xlsx`;
      return new NextResponse(new Uint8Array(buffer), {
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

function generateExcel(orders: any[]) {
  const workbook = XLSX.utils.book_new();
  
  const worksheetData = [
    ['שם לקוח', 'טלפון', 'פריט', 'כמות', 'תוספות', 'הוראות מיוחדות', 'תאריך'],
  ];

  let currentRow = 1; // Start from row 1 (0-indexed, so row 1 is after header)
  const merges: any[] = [];

  orders.forEach((order) => {
    const orderStartRow = currentRow;
    let orderRowCount = 0;

    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach((item: any) => {
        const itemPrice = parseFloat(String(item.price || 0));
        const subtotal = itemPrice * item.quantity;
        const addons = item.selected_addons && Array.isArray(item.selected_addons) 
          ? item.selected_addons.join(', ') 
          : '';
        
        worksheetData.push([
          order.customer_name,
          order.customer_phone || '',
          item.menu_items?.name || '',
          item.quantity,
          addons,
          item.special_instructions || '',
          new Date(order.created_at).toLocaleDateString('he-IL'),
        ]);
        currentRow++;
        orderRowCount++;
      });
    } else {
      // If no items, still show the order
      worksheetData.push([
        order.customer_name,
        order.customer_phone || '',
        '',
        '',
        '',
        '',
        new Date(order.created_at).toLocaleDateString('he-IL'),
      ]);
      currentRow++;
      orderRowCount++;
    }

    // Merge cells for customer info columns - columns are 0-indexed
    // Column A (0) = שם לקוח, Column B (1) = טלפון, Column F (5) = תאריך
    if (orderRowCount > 1) {
      // Merge customer name (column A = 0)
      merges.push({ s: { r: orderStartRow, c: 0 }, e: { r: orderStartRow + orderRowCount - 1, c: 0 } });
      // Merge phone (column B = 1)
      merges.push({ s: { r: orderStartRow, c: 1 }, e: { r: orderStartRow + orderRowCount - 1, c: 1 } });
      // Merge date (column F = 6)
      merges.push({ s: { r: orderStartRow, c: 6 }, e: { r: orderStartRow + orderRowCount - 1, c: 6 } });
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Apply merges
  if (merges.length > 0) {
    worksheet['!merges'] = merges;
  }

  // Add borders to all cells
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: '', t: 's' };
      }
      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {};
      }
      worksheet[cellAddress].s.border = {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      };
    }
  }

  // Style header row (bold and background color)
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
    if (worksheet[cellAddress]) {
      if (!worksheet[cellAddress].s) {
        worksheet[cellAddress].s = {};
      }
      worksheet[cellAddress].s.font = { bold: true };
      worksheet[cellAddress].s.fill = {
        fgColor: { rgb: 'E0E0E0' }
      };
      worksheet[cellAddress].s.alignment = {
        horizontal: 'center',
        vertical: 'center'
      };
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'הזמנות');
  
  // Write with cell styles support
  return XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    cellStyles: true
  });
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



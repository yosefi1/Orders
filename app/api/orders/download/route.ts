import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import PDFDocument from 'pdfkit';
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
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (format === 'word') {
      const buffer = await generateWord(orders);
      const filename = `orders-${date || 'all'}-${today}.docx`;
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (format === 'pdf') {
      const buffer = await generatePDF(orders);
      const filename = `orders-${date || 'all'}-${today}.pdf`;
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
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
    ['מספר הזמנה', 'שם לקוח', 'אימייל', 'טלפון', 'תאריך', 'סטטוס', 'סה"כ'],
  ];

  orders.forEach((order) => {
    worksheetData.push([
      order.id.slice(0, 8),
      order.customer_name,
      order.customer_email || '',
      order.customer_phone || '',
      new Date(order.created_at).toLocaleDateString('he-IL'),
      order.status,
      parseFloat(order.total_amount.toString()).toFixed(2),
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'הזמנות');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function generateWord(orders: any[]): Promise<Buffer> {
  const children: any[] = [
    new Paragraph({
      text: 'דוח הזמנות',
      heading: 'Heading1',
    }),
  ];

  orders.forEach((order, index) => {
    children.push(
      new Paragraph({
        text: `הזמנה #${index + 1}`,
        heading: 'Heading2',
      }),
      new Paragraph(`לקוח: ${order.customer_name}`),
      new Paragraph(`תאריך: ${new Date(order.created_at).toLocaleDateString('he-IL')}`),
      new Paragraph(`סה"כ: ${parseFloat(order.total_amount.toString()).toFixed(2)} ₪`),
      new Paragraph(''),
    );
  });

  const doc = new Document({ children });
  return await Packer.toBuffer(doc);
}

async function generatePDF(orders: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    doc.fontSize(20).text('דוח הזמנות', { align: 'center' });
    doc.moveDown();

    orders.forEach((order, index) => {
      doc.fontSize(14).text(`הזמנה #${index + 1}`, { underline: true });
      doc.fontSize(10);
      doc.text(`לקוח: ${order.customer_name}`);
      doc.text(`תאריך: ${new Date(order.created_at).toLocaleDateString('he-IL')}`);
      doc.text(`סה"כ: ${parseFloat(order.total_amount.toString()).toFixed(2)} ₪`);
      doc.moveDown();
    });

    doc.end();
  });
}


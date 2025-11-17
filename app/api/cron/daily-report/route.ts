import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Verify cron secret
function verifyCronSecret(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Fetch today's orders
    const ordersResult = await sql`
      SELECT * FROM orders
      WHERE order_date = ${today}
      ORDER BY created_at ASC
    `;

    const orders = ordersResult;

    if (!orders || orders.length === 0) {
      return NextResponse.json({ message: 'No orders for today' });
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
        menu_items: { name: row.name }
      }));
    }

    // Generate Excel file
    const excelBuffer = generateExcel(orders);
    
    // Generate Word document
    const wordBuffer = await generateWord(orders);
    
    // Generate PDF
    const pdfBuffer = await generatePDF(orders);

    // Send email with attachments
    await sendEmail(excelBuffer, wordBuffer, pdfBuffer, orders.length);

    return NextResponse.json({ 
      success: true, 
      message: `Daily report sent with ${orders.length} orders` 
    });
  } catch (error: any) {
    console.error('Error generating daily report:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function generateExcel(orders: any[]) {
  const workbook = XLSX.utils.book_new();
  
  // Orders summary sheet
  const summaryData = orders.map((order) => ({
    'Order ID': order.id,
    'Customer Name': order.customer_name,
    'Email': order.customer_email || '',
    'Phone': order.customer_phone || '',
    'Total Amount': order.total_amount,
    'Status': order.status,
    'Order Time': format(new Date(order.created_at), 'HH:mm:ss'),
  }));
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Orders Summary');

  // Detailed items sheet
  const itemsData: any[] = [];
  orders.forEach((order) => {
    order.order_items.forEach((item: any) => {
      itemsData.push({
        'Order ID': order.id,
        'Customer Name': order.customer_name,
        'Item': item.menu_items.name,
        'Quantity': item.quantity,
        'Price': item.price,
        'Subtotal': item.quantity * item.price,
      });
    });
  });
  
  const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Order Items');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function generateWord(orders: any[]) {
  const children: any[] = [
    new Paragraph({
      text: 'Daily Orders Report',
      heading: 'Heading1',
    }),
    new Paragraph({
      text: `Date: ${format(new Date(), 'MMMM dd, yyyy')}`,
    }),
    new Paragraph({
      text: `Total Orders: ${orders.length}`,
    }),
    new Paragraph({ text: '' }),
  ];

  // Create table
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Order ID')] }),
        new TableCell({ children: [new Paragraph('Customer')] }),
        new TableCell({ children: [new Paragraph('Items')] }),
        new TableCell({ children: [new Paragraph('Total')] }),
      ],
    }),
  ];

  orders.forEach((order) => {
    const itemsText = order.order_items
      .map((item: any) => `${item.quantity}x ${item.menu_items.name}`)
      .join(', ');
    
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(order.id.substring(0, 8))] }),
          new TableCell({ children: [new Paragraph(order.customer_name)] }),
          new TableCell({ children: [new Paragraph(itemsText)] }),
          new TableCell({ children: [new Paragraph(`${order.total_amount} ILS`)] }),
        ],
      })
    );
  });

  children.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}

async function generatePDF(orders: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(20).text('Daily Orders Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${format(new Date(), 'MMMM dd, yyyy')}`);
    doc.text(`Total Orders: ${orders.length}`);
    doc.moveDown();

    orders.forEach((order, index) => {
      if (index > 0) doc.moveDown();
      
      doc.fontSize(14).text(`Order #${index + 1}`, { underline: true });
      doc.fontSize(10);
      doc.text(`Customer: ${order.customer_name}`);
      if (order.customer_email) doc.text(`Email: ${order.customer_email}`);
      if (order.customer_phone) doc.text(`Phone: ${order.customer_phone}`);
      doc.moveDown(0.5);
      
      doc.text('Items:');
      order.order_items.forEach((item: any) => {
        doc.text(
          `  • ${item.quantity}x ${item.menu_items.name} - ${item.price} ILS each = ${(item.quantity * item.price).toFixed(2)} ILS`,
          { indent: 20 }
        );
      });
      
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total: ${order.total_amount.toFixed(2)} ILS`, { align: 'right' });
      
      if (index < orders.length - 1) {
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });

    doc.end();
  });
}

async function sendEmail(
  excelBuffer: Buffer,
  wordBuffer: Buffer,
  pdfBuffer: Buffer,
  orderCount: number
) {
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP_HOST not configured');
  }

  // Create SMTP transporter (supports Gmail and other SMTP servers)
  const transporterConfig: any = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false, // For some SMTP servers
    },
  };

  // Add auth if provided
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    transporterConfig.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    };
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  const supplierEmail = process.env.SUPPLIER_EMAIL;
  if (!supplierEmail) {
    throw new Error('SUPPLIER_EMAIL not configured');
  }

  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'cafeteria-orders@intel.com';

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: supplierEmail,
      subject: `Daily Orders Report - ${format(new Date(), 'MMMM dd, yyyy')} (${orderCount} orders)`,
      text: `Please find attached the daily orders report with ${orderCount} orders.`,
      html: `
        <h2>Daily Orders Report</h2>
        <p>Date: ${format(new Date(), 'MMMM dd, yyyy')}</p>
        <p>Total Orders: ${orderCount}</p>
        <p>Please find the attached files:</p>
        <ul>
          <li>Orders Report (Excel)</li>
          <li>Orders Report (Word)</li>
          <li>Orders Report (PDF)</li>
        </ul>
      `,
      attachments: [
        {
          filename: `orders-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
          content: excelBuffer,
        },
        {
          filename: `orders-${format(new Date(), 'yyyy-MM-dd')}.docx`,
          content: wordBuffer,
        },
        {
          filename: `orders-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
    console.log(`Daily report email sent successfully to ${supplierEmail}`);
  } catch (error: any) {
    console.error('Error sending daily report email:', {
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}


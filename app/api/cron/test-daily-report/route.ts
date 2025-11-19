import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// This endpoint doesn't require CRON_SECRET - for manual testing
export async function GET(request: NextRequest) {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    console.log('Manual daily report trigger - fetching orders for:', today);

    // Fetch today's orders
    const ordersResult = await sql`
      SELECT * FROM orders
      WHERE order_date = ${today}
      ORDER BY created_at ASC
    `;

    const orders = ordersResult;

    if (!orders || orders.length === 0) {
      console.log('No orders for today, skipping email');
      return NextResponse.json({ 
        message: 'No orders for today',
        date: today,
        ordersCount: 0
      });
    }
    
    console.log(`Found ${orders.length} orders for today, generating report...`);

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

    // Generate Excel file
    const excelBuffer = generateExcel(orders);
    
    // Generate Word document
    const wordBuffer = await generateWord(orders);
    
    // Generate PDF (skip if it fails)
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generatePDF(orders);
    } catch (pdfError: any) {
      console.warn('PDF generation failed, continuing without PDF:', pdfError.message);
      // Continue without PDF
    }

    // Send email with attachments
    try {
      await sendEmail(excelBuffer, wordBuffer, pdfBuffer, orders.length);
      console.log('✅ Daily report email sent successfully!');
    } catch (emailError: any) {
      console.error('❌ Error sending email:', emailError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to send email',
        emailError: emailError.message,
        ordersCount: orders.length
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Daily report sent with ${orders.length} orders`,
      date: today,
      ordersCount: orders.length
    });
  } catch (error: any) {
    console.error('Error generating daily report:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
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
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'הזמנות');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
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

async function generatePDF(orders: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Use standard fonts that don't require external files
    const doc = new PDFDocument({ 
      margin: 50,
      autoFirstPage: true
    });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Use default font (Helvetica) - don't specify font explicitly
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
  pdfBuffer: Buffer | null,
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

  // Support multiple recipients (comma-separated or array)
  // Split by comma and trim whitespace, then filter out empty strings
  const recipientEmails = supplierEmail
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);

  // Determine from address and name
  const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || 'cafeteria-orders@intel.com';
  const emailFromName = process.env.EMAIL_FROM_NAME || 'קפיטריית אינטל';
  
  // Format: "Display Name <email@address.com>"
  const fromAddress = `${emailFromName} <${emailFrom}>`;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: recipientEmails,
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
          ${pdfBuffer ? '<li>Orders Report (PDF)</li>' : ''}
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
        ...(pdfBuffer ? [{
          filename: `orders-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          content: pdfBuffer,
        }] : []),
      ],
    });
    console.log(`Daily report email sent successfully to ${recipientEmails.join(', ')}`);
  } catch (error: any) {
    console.error('Error sending daily report email:', {
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}


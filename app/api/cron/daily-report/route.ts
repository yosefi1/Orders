import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
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
      console.log('No orders for today, skipping email');
      return NextResponse.json({ message: 'No orders for today' });
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
        menu_items: { name: row.name }
      }));
    }

    // Generate Excel file
    const excelBufferRaw = await generateExcel(orders);
    const excelBuffer = Buffer.isBuffer(excelBufferRaw) ? excelBufferRaw : Buffer.from(excelBufferRaw);
    
    // Generate Word document
    const wordBuffer = await generateWord(orders);

    // Send email with attachments
    await sendEmail(excelBuffer, wordBuffer, orders.length);

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

async function sendEmail(
  excelBuffer: Buffer,
  wordBuffer: Buffer,
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

  // Debug logging
  console.log('=== DEBUG: Email Configuration ===');
  console.log('SUPPLIER_EMAIL from env:', supplierEmail);
  console.log('Parsed recipient emails:', recipientEmails);
  console.log('Number of recipients:', recipientEmails.length);
  console.log('===================================');

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
        </ul>
      `,
      attachments: [
        {
          filename: `orders-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
          content: Buffer.isBuffer(excelBuffer) ? excelBuffer : Buffer.from(excelBuffer),
        },
        {
          filename: `orders-${format(new Date(), 'yyyy-MM-dd')}.docx`,
          content: wordBuffer,
        },
      ],
    });
    console.log('=== DEBUG: Email Sent Successfully ===');
    console.log(`Recipients: ${recipientEmails.join(', ')}`);
    console.log(`Number of recipients: ${recipientEmails.length}`);
    console.log(`Order count: ${orderCount}`);
    console.log(`From address: ${fromAddress}`);
    console.log(`Subject: Daily Orders Report - ${format(new Date(), 'MMMM dd, yyyy')} (${orderCount} orders)`);
    console.log('=====================================');
    console.log(`Daily report email sent successfully to ${recipientEmails.join(', ')}`);
  } catch (error: any) {
    console.error('=== DEBUG: Email Send Error ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Recipients attempted:', recipientEmails);
    console.error('From address:', fromAddress);
    console.error('Full error:', error);
    console.error('===============================');
    throw error;
  }
}


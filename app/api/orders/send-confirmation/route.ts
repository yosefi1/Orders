import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, customerEmail, customerName } = body;

    console.log('Send confirmation email request:', { orderId, customerEmail, customerName });

    if (!customerEmail) {
      console.log('No email provided, skipping email');
      return NextResponse.json({ success: true, message: 'No email provided, skipping email' });
    }

    // Check if DATABASE_URL exists, if not, skip email (for local development)
    if (!process.env.DATABASE_URL) {
      console.log('No DATABASE_URL, skipping email send');
      return NextResponse.json({ success: true, message: 'No database configured, email skipped' });
    }

    // Fetch order details
    const orderResult = await sql`
      SELECT * FROM orders WHERE id = ${orderId}
    `;

    if (!orderResult || orderResult.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult[0];

    // Fetch order items
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
      WHERE oi.order_id = ${orderId}
    `;

    const items = itemsResult;

    // Generate email HTML
    const itemsHtml = items.map((item: any) => {
      const price = parseFloat(String(item.price || 0));
      let itemText = `${item.quantity}x ${item.name} - ${price.toFixed(2)} ₪`;
      if (item.selected_variation) {
        itemText += ` (${item.selected_variation})`;
      }
      if (item.selected_addons && Array.isArray(item.selected_addons) && item.selected_addons.length > 0) {
        itemText += ` [תוספות: ${item.selected_addons.join(', ')}]`;
      }
      if (item.special_instructions) {
        itemText += ` [הוראות: ${item.special_instructions}]`;
      }
      return `<li>${itemText}</li>`;
    }).join('');

    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af; text-align: center;">הזמנה התקבלה בהצלחה!</h2>
        <p>שלום ${customerName},</p>
        <p>תודה על ההזמנה שלך. פרטי ההזמנה:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>מספר הזמנה:</strong> ${orderId.slice(0, 8)}</p>
          <p><strong>תאריך:</strong> ${new Date(order.created_at).toLocaleDateString('he-IL')}</p>
          <p><strong>פריטים:</strong></p>
          <ul style="list-style-type: none; padding-right: 20px;">
            ${itemsHtml}
          </ul>
          <p style="text-align: left; font-size: 18px; font-weight: bold; margin-top: 15px;">
            סה"כ: ${parseFloat(order.total_amount.toString()).toFixed(2)} ₪
          </p>
        </div>
        <p>ההזמנה שלך בטיפול. תודה!</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          קפיטריית אינטל
        </p>
      </div>
    `;

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST) {
      console.log('SMTP_HOST not configured, skipping email');
      return NextResponse.json({ success: false, error: 'SMTP_HOST not configured' });
    }

    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      hasUser: !!process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASSWORD,
      emailFrom: process.env.EMAIL_FROM,
    });

    // Create SMTP transporter (Intel SMTP compatible)
    const transporterConfig: any = {
      host: process.env.SMTP_HOST || 'sc-out.intel.com',
      port: parseInt(process.env.SMTP_PORT || '25'),
      secure: false, // true for 465, false for other ports
      tls: {
        rejectUnauthorized: false, // For internal SMTP servers
      },
    };

    // Add auth only if SMTP_USER is provided (Intel SMTP might not need auth)
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      transporterConfig.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      };
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified');
    } catch (verifyError: any) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json({ 
        success: false, 
        error: `SMTP verification failed: ${verifyError.message}` 
      }, { status: 500 });
    }

    // Determine from address
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'cafeteria-orders@intel.com';

    console.log('Sending email:', {
      from: fromAddress,
      to: customerEmail,
      subject: `הזמנה התקבלה - ${orderId.slice(0, 8)}`,
    });

    const mailResult = await transporter.sendMail({
      from: fromAddress,
      to: customerEmail,
      subject: `הזמנה התקבלה - ${orderId.slice(0, 8)}`,
      html: emailHtml,
      text: `הזמנה התקבלה בהצלחה! מספר הזמנה: ${orderId.slice(0, 8)}. סה"כ: ${parseFloat(order.total_amount.toString()).toFixed(2)} ₪`,
    });

    console.log('Confirmation email sent successfully:', {
      messageId: mailResult.messageId,
      to: customerEmail,
      response: mailResult.response,
    });
    return NextResponse.json({ success: true, messageId: mailResult.messageId });
  } catch (error: any) {
    console.error('Error sending confirmation email:', error);
    // Don't fail the order if email fails
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


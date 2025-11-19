import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Fetch all orders for the specified date
    const ordersResult = await sql`
      SELECT * FROM orders
      WHERE order_date = ${date}
      AND customer_email IS NOT NULL
      AND customer_email != ''
      ORDER BY created_at ASC
    `;

    const orders = ordersResult;

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders with email addresses found for this date',
        sentCount: 0,
      });
    }

    // Configure SMTP transporter
    if (!process.env.SMTP_HOST) {
      return NextResponse.json(
        { error: 'SMTP_HOST not configured' },
        { status: 500 }
      );
    }

    const transporterConfig: any = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false,
      },
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      transporterConfig.auth = {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      };
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || 'cafeteria-orders@intel.com';
    const emailFromName = process.env.EMAIL_FROM_NAME || 'קפיטריית אינטל';
    const fromAddress = `${emailFromName} <${emailFrom}>`;

    // Send email to each customer
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const order of orders) {
      try {
        // Fetch order items for this order
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

        const items = itemsResult;

        // Generate email HTML
        const itemsHtml = items.map((item: any) => {
          let itemText = `${item.quantity}x ${item.name}`;
          if (item.selected_variation) {
            itemText += ` (${item.selected_variation})`;
          }
          if (item.selected_addons && Array.isArray(item.selected_addons) && item.selected_addons.length > 0) {
            itemText += ` [תוספות: ${item.selected_addons.join(', ')}]`;
          }
          if (item.special_instructions) {
            itemText += ` [הוראות: ${item.special_instructions}]`;
          }
          return `<li>${itemText} - ${parseFloat(item.price.toString()).toFixed(2)} ₪</li>`;
        }).join('');

        const emailHtml = `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e3a8a; margin-bottom: 20px;">ההזמנה שלך הגיעה! 🎉</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">שלום ${order.customer_name},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">ההזמנה שלך הגיעה ומוכנה לאיסוף!</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1e3a8a; margin-top: 0;">פרטי ההזמנה:</h3>
              <p><strong>מספר הזמנה:</strong> ${order.id.slice(0, 8)}</p>
              <p><strong>תאריך:</strong> ${new Date(order.created_at).toLocaleDateString('he-IL')}</p>
              <p><strong>פריטים:</strong></p>
              <ul style="margin: 10px 0; padding-right: 20px;">
                ${itemsHtml}
              </ul>
              <p style="font-size: 18px; font-weight: bold; color: #1e3a8a; margin-top: 15px;">
                סה"כ: ${parseFloat(order.total_amount.toString()).toFixed(2)} ₪
              </p>
            </div>
            
            <p style="font-size: 16px; margin-top: 20px;">תודה על ההזמנה! 😊</p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">קפיטריית אינטל</p>
          </div>
        `;

        await transporter.sendMail({
          from: fromAddress,
          to: order.customer_email, // Send to the customer's email
          subject: `ההזמנה שלך הגיעה! - ${order.id.slice(0, 8)}`,
          html: emailHtml,
          text: `ההזמנה שלך הגיעה! מספר הזמנה: ${order.id.slice(0, 8)}. סה"כ: ${parseFloat(order.total_amount.toString()).toFixed(2)} ₪`,
        });

        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Order ${order.id.slice(0, 8)} (${order.customer_email}): ${error.message}`);
        console.error(`Error sending email to ${order.customer_email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} emails, ${results.failed} failed`,
      sentCount: results.sent,
      failedCount: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error: any) {
    console.error('Error sending arrival notifications:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


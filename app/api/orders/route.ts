import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const MIN_ORDER_AMOUNT = 25;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, items } = body;

    // Validate minimum order amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    if (totalAmount < MIN_ORDER_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum order amount is ${MIN_ORDER_AMOUNT} ILS` },
        { status: 400 }
      );
    }

    // Create order
    const orderResult = await sql`
      INSERT INTO orders (customer_name, customer_email, customer_phone, total_amount, status)
      VALUES (${customerName}, ${customerEmail || null}, ${customerPhone || null}, ${totalAmount}, 'pending')
      RETURNING id
    `;

    const orderId = orderResult[0].id;

    // Create order items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, menu_item_id, quantity, price, selected_addons, selected_variation, special_instructions)
        VALUES (
          ${orderId}, 
          ${item.id}, 
          ${item.quantity}, 
          ${item.price},
          ${item.selectedAddons ? JSON.stringify(item.selectedAddons) : null},
          ${item.selectedVariation || null},
          ${item.specialInstructions || null}
        )
      `;
    }

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let ordersResult;
    if (date) {
      ordersResult = await sql`
        SELECT * FROM orders
        WHERE order_date = ${date}
        ORDER BY created_at DESC
      `;
    } else {
      ordersResult = await sql`
        SELECT * FROM orders
        ORDER BY created_at DESC
        LIMIT 100
      `;
    }

    const orders = ordersResult;

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

    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const MIN_ORDER_AMOUNT = 24;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone, items } = body;

    // Validate required fields
    if (!customerEmail || !customerEmail.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json(
        { error: 'Phone is required' },
        { status: 400 }
      );
    }

    // Fetch current prices from database to ensure we use the latest prices
    // This prevents issues with old prices stored in localStorage
    const itemIds = items.map((item: any) => item.id);
    let menuItemsMap: Map<string, any> = new Map();
    
    console.log('🔍 Order submission - Items from frontend:', JSON.stringify(items, null, 2));
    console.log('🔍 Order submission - Item IDs:', itemIds);
    
    try {
      if (process.env.DATABASE_URL && itemIds.length > 0) {
        // Fetch menu items from database to get current prices
        // Use a loop to fetch items individually to ensure compatibility
        for (const itemId of itemIds) {
          try {
            const menuItem = await sql`
              SELECT id, price, category, variations FROM menu_items
              WHERE id = ${itemId}
            `;
            
            console.log(`🔍 Fetched menu item ${itemId}:`, menuItem);
            
            if (menuItem && menuItem.length > 0) {
              const item = menuItem[0];
              const dbPrice = parseFloat(String(item.price || 0));
              console.log(`✅ Found item ${itemId} in DB - Price: ${dbPrice}, Category: ${item.category}`);
              menuItemsMap.set(item.id, {
                price: dbPrice,
                category: item.category,
                variations: item.variations ? (typeof item.variations === 'string' ? JSON.parse(item.variations) : item.variations) : item.variations,
              });
            } else {
              console.warn(`⚠️ Item ${itemId} not found in database, will use frontend price`);
            }
          } catch (itemError) {
            console.error(`❌ Error fetching menu item ${itemId}:`, itemError);
            // Continue with other items
          }
        }
      } else {
        console.log('⚠️ No DATABASE_URL or no items, using frontend prices');
      }
    } catch (error) {
      console.error('❌ Error fetching menu items for price validation:', error);
      // Continue with frontend prices if database fetch fails
    }
    
    console.log('🔍 Menu items map:', Array.from(menuItemsMap.entries()));

    // Calculate total amount using current database prices (or fallback to frontend prices)
    let totalAmount = 0;
    const validatedItems = items.map((item: any) => {
      let finalPrice = item.price;
      const originalPrice = item.price;
      
      // Use database price if available
      const dbItem = menuItemsMap.get(item.id);
      if (dbItem) {
        finalPrice = dbItem.price;
        
        // Handle special pricing for מאפים based on variation
        if (dbItem.category === 'מאפים' && item.selectedVariation) {
          finalPrice = item.selectedVariation === 'קטן' ? 4.50 : 8.30;
        }
        
        if (originalPrice !== finalPrice) {
          console.log(`💰 Price updated for item ${item.id} (${item.name}): ${originalPrice} → ${finalPrice}`);
        }
      } else {
        console.log(`⚠️ Using frontend price for item ${item.id} (${item.name}): ${finalPrice}`);
      }
      
      const itemTotal = finalPrice * item.quantity;
      totalAmount += itemTotal;
      
      return {
        ...item,
        price: finalPrice, // Use validated price
      };
    });
    
    console.log(`💰 Total amount calculated: ${totalAmount}`);
    console.log('🔍 Validated items:', JSON.stringify(validatedItems, null, 2));

    if (totalAmount < MIN_ORDER_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum order amount is ${MIN_ORDER_AMOUNT} ILS` },
        { status: 400 }
      );
    }

    // Create order
    const orderResult = await sql`
      INSERT INTO orders (customer_name, customer_email, customer_phone, total_amount, status)
      VALUES (${customerName}, ${customerEmail.trim()}, ${customerPhone.trim()}, ${totalAmount}, 'pending')
      RETURNING id
    `;

    const orderId = orderResult[0].id;

    // Create order items with validated prices
    for (const item of validatedItems) {
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


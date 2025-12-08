-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  has_addons BOOLEAN DEFAULT false,
  has_variations BOOLEAN DEFAULT false,
  addons JSONB,
  variations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  order_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  selected_addons JSONB,
  selected_variation TEXT,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);

-- Insert menu items
INSERT INTO menu_items (name, description, price, category, has_addons, has_variations, addons, variations) VALUES
  -- כריכים
  ('כריך', 'כריך טרי עם לחם לבן', 18.50, 'כריכים', true, false, 
   '["חביתה", "אבוקדו", "טונה", "צהובה"]'::jsonb, NULL),
  
  -- טוסטים
  ('טוסט', 'טוסט חם וטעים', 19.10, 'טוסטים', true, false,
   '["תירס", "עגבניה", "טונה", "זיתים", "בצל", "גמבה", "בולגרית", "חריף"]'::jsonb, NULL),
  
  -- פיצה
  ('פיצה', 'פיצה טרייה', 20.50, 'פיצה', false, false, NULL, NULL),
  
  -- סלטים
  ('סלט אישי', 'סלט טרי ומזין', 24.30, 'סלטים', false, true,
   NULL, '["סלט ישראלי", "סלט טונה", "סלט עם בולגרית"]'::jsonb),
  
  -- מאפה קטן
  ('מאפה קטן', 'מאפה קטן טרי', 4.50, 'מאפה קטן', false, false, NULL, NULL),
  
  -- מאפה גדול
  ('מאפה גדול', 'מאפה גדול טרי', 8.30, 'מאפה גדול', false, false, NULL, NULL),
  
  -- שתייה קרה
  ('פחית משקה', 'פחית משקה קרה', 5.50, 'שתייה קרה', false, false, NULL, NULL),
  ('בקבוק משקה', 'בקבוק משקה 500 מ"ל', 6.50, 'שתייה קרה', false, false, NULL, NULL),
  ('מים', 'בקבוק מים 500 מ"ל', 4.50, 'שתייה קרה', false, false, NULL, NULL),
  
  -- קפה
  ('קפה קטן', 'קפה קטן - נא לציין סוג חלב והוראות', 7.50, 'קפה', false, true,
   NULL, '["חלב רגיל", "חלב סויה", "חלב שקדים", "ללא חלב"]'::jsonb),
  ('קפה גדול', 'קפה גדול - נא לציין סוג חלב והוראות', 9.00, 'קפה', false, true,
   NULL, '["חלב רגיל", "חלב סויה", "חלב שקדים", "ללא חלב"]'::jsonb),
  
  -- חטיפים
  ('תפוצ''יפס', 'תפוצ''יפס', 4.80, 'חטיפים', false, false, NULL, NULL),
  ('במבה', 'במבה', 4.80, 'חטיפים', false, false, NULL, NULL),
  ('אפרופו', 'אפרופו', 4.80, 'חטיפים', false, false, NULL, NULL),
  ('פסק זמן', 'פסק זמן', 5.60, 'חטיפים', false, false, NULL, NULL),
  ('כיף כף', 'כיף כף', 5.60, 'חטיפים', false, false, NULL, NULL),
  ('ריזס', 'ריזס', 4.80, 'חטיפים', false, false, NULL, NULL),
  ('שוקולד ריטר', 'שוקולד ריטר', 12.60, 'חטיפים', false, false, NULL, NULL),
  
  -- מסטיק
  ('מסטיק מנטוס', 'מסטיק מנטוס', 9.30, 'מסטיק', false, false, NULL, NULL),
  ('מסטיק מאסט', 'מסטיק מאסט', 5.50, 'מסטיק', false, false, NULL, NULL)
ON CONFLICT DO NOTHING;


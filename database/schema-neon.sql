-- Menu Items Table (using TEXT for IDs to work with mock data)
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
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

-- Orders Table (using UUID for order IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Order Items Table (menu_item_id is TEXT to match menu_items)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
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
INSERT INTO menu_items (id, name, description, price, category, has_addons, has_variations, addons, variations) VALUES
  -- כריכים - 4 אופציות
  ('1', 'כריך חביתה', 'כריך עם חביתה', 18.50, 'כריכים', true, false, 
   '["אבוקדו", "טונה", "צהובה"]'::jsonb, NULL),
  ('1b', 'כריך אבוקדו', 'כריך עם אבוקדו', 18.50, 'כריכים', true, false, 
   '["חביתה", "טונה", "צהובה"]'::jsonb, NULL),
  ('1c', 'כריך טונה', 'כריך עם טונה', 18.50, 'כריכים', true, false, 
   '["חביתה", "אבוקדו", "צהובה"]'::jsonb, NULL),
  ('1d', 'כריך צהובה', 'כריך עם צהובה', 18.50, 'כריכים', true, false, 
   '["חביתה", "אבוקדו", "טונה"]'::jsonb, NULL),
  
  -- טוסטים
  ('2', 'טוסט', 'טוסט חם וטעים', 19.10, 'טוסטים', true, false,
   '["תירס", "עגבניה", "טונה", "זיתים", "בצל", "גמבה", "בולגרית", "חריף"]'::jsonb, NULL),
  
  -- פיצה - עם תוספות
  ('14', 'פיצה', 'פיצה טרייה', 20.50, 'פיצה', true, false,
   '["תירס", "עגבניה", "זיתים", "בצל", "גמבה", "בולגרית", "חריף"]'::jsonb, NULL),
  
  -- סלטים
  ('3', 'סלט אישי', 'סלט טרי ומזין', 24.30, 'סלטים', false, true,
   NULL, '["סלט ישראלי", "סלט טונה", "סלט עם בולגרית"]'::jsonb),
  
  -- מאפים - 4 אופציות עם גדלים
  ('15', 'קוראסון שוקולד', 'קוראסון שוקולד טרי', 0, 'מאפים', false, true,
   NULL, '["קטן", "גדול"]'::jsonb),
  ('15b', 'קוראסון חמאה', 'קוראסון חמאה טרי', 0, 'מאפים', false, true,
   NULL, '["קטן", "גדול"]'::jsonb),
  ('15c', 'קוראסון שקדים', 'קוראסון שקדים טרי', 0, 'מאפים', false, true,
   NULL, '["קטן", "גדול"]'::jsonb),
  ('15d', 'בורקס גבינה', 'בורקס גבינה טרי', 0, 'מאפים', false, true,
   NULL, '["קטן", "גדול"]'::jsonb),
  
  -- שתייה קרה - כל האופציות
  ('7', 'פחית קולה', 'פחית קולה קרה', 5.50, 'שתייה קרה', false, false, NULL, NULL),
  ('7b', 'פחית זירו', 'פחית קולה זירו', 5.50, 'שתייה קרה', false, false, NULL, NULL),
  ('7c', 'נקטר פירות', 'נקטר פירות טבעי', 5.50, 'שתייה קרה', false, false, NULL, NULL),
  ('8', 'בקבוק קולה', 'בקבוק קולה 500 מ"ל', 6.50, 'שתייה קרה', false, false, NULL, NULL),
  ('8b', 'בקבוק זירו', 'בקבוק קולה זירו 500 מ"ל', 6.50, 'שתייה קרה', false, false, NULL, NULL),
  ('8c', 'בקבוק נסטי', 'בקבוק נסטי 500 מ"ל', 6.50, 'שתייה קרה', false, false, NULL, NULL),
  ('8d', 'בקבוק סודה', 'בקבוק סודה 500 מ"ל', 6.50, 'שתייה קרה', false, false, NULL, NULL),
  ('9', 'מים', 'בקבוק מים 500 מ"ל', 4.50, 'שתייה קרה', false, false, NULL, NULL),
  
  -- קפה - גדול וקטן
  ('12', 'קפה קטן', 'קפה קטן', 7.50, 'קפה', false, false, NULL, NULL),
  ('13', 'קפה גדול', 'קפה גדול', 9.00, 'קפה', false, false, NULL, NULL),
  
  -- חטיפים (כולל מסטיקים)
  ('17', 'תפוצ''יפס', 'תפוצ''יפס', 4.80, 'חטיפים', false, false, NULL, NULL),
  ('18', 'במבה', 'במבה', 4.80, 'חטיפים', false, false, NULL, NULL),
  ('19', 'אפרופו', 'אפרופו', 4.80, 'חטיפים', false, false, NULL, NULL),
  ('20', 'פסק זמן', 'פסק זמן', 5.60, 'חטיפים', false, false, NULL, NULL),
  ('21', 'כיף כף', 'כיף כף', 5.60, 'חטיפים', false, false, NULL, NULL),
  ('22', 'ריזס', 'ריזס', 4.80, 'חטיפים', false, false, NULL, NULL),
  ('23', 'שוקולד ריטר', 'שוקולד ריטר', 12.60, 'חטיפים', false, false, NULL, NULL),
  ('24', 'מסטיק מנטוס', 'מסטיק מנטוס', 9.30, 'חטיפים', false, false, NULL, NULL),
  ('25', 'מסטיק מאסט', 'מסטיק מאסט', 5.50, 'חטיפים', false, false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;


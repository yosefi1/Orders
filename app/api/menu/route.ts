import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Mock data for development when database is not set up
const MOCK_MENU_ITEMS = [
  // כריכים - 4 אופציות
  {
    id: '1',
    name: 'כריך חביתה',
    description: 'כריך עם חביתה',
    price: 18.50,
    category: 'כריכים',
    image_url: '/sandwich-egg.jpg', // הוסף את שם הקובץ שלך כאן
    has_addons: true,
    has_variations: false,
    addons: ['אבוקדו', 'טונה', 'צהובה'],
    variations: null,
    available: true,
  },
  {
    id: '1b',
    name: 'כריך אבוקדו',
    description: 'כריך עם אבוקדו',
    price: 18.50,
    category: 'כריכים',
    has_addons: true,
    has_variations: false,
    addons: ['חביתה', 'טונה', 'צהובה'],
    variations: null,
    available: true,
  },
  {
    id: '1c',
    name: 'כריך טונה',
    description: 'כריך עם טונה',
    price: 18.50,
    category: 'כריכים',
    has_addons: true,
    has_variations: false,
    addons: ['חביתה', 'אבוקדו', 'צהובה'],
    variations: null,
    available: true,
  },
  {
    id: '1d',
    name: 'כריך צהובה',
    description: 'כריך עם צהובה',
    price: 18.50,
    category: 'כריכים',
    has_addons: true,
    has_variations: false,
    addons: ['חביתה', 'אבוקדו', 'טונה'],
    variations: null,
    available: true,
  },
  // טוסטים
  {
    id: '2',
    name: 'טוסט',
    description: 'טוסט חם וטעים',
    price: 19.10,
    category: 'טוסטים',
    has_addons: true,
    has_variations: false,
    addons: ['תירס', 'עגבניה', 'טונה', 'זיתים', 'בצל', 'גמבה', 'בולגרית', 'חריף'],
    variations: null,
    available: true,
  },
  // סלטים
  {
    id: '3',
    name: 'סלט אישי',
    description: 'סלט טרי ומזין',
    price: 17.00,
    category: 'סלטים',
    has_addons: false,
    has_variations: true,
    addons: null,
    variations: ['סלט ישראלי', 'סלט טונה', 'סלט עם בולגרית'],
    available: true,
  },
  // שתייה קרה - כל האופציות
  { id: '7', name: 'פחית קולה', description: 'פחית קולה קרה', price: 5.50, category: 'שתייה קרה', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '7b', name: 'פחית זירו', description: 'פחית קולה זירו', price: 5.50, category: 'שתייה קרה', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '7c', name: 'נקטר פירות', description: 'נקטר פירות טבעי', price: 5.50, category: 'שתייה קרה', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '8', name: 'בקבוק קולה', description: 'בקבוק קולה 500 מ"ל', price: 6.50, category: 'שתייה קרה', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '8b', name: 'בקבוק זירו', description: 'בקבוק קולה זירו 500 מ"ל', price: 6.50, category: 'שתייה קרה', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '8c', name: 'בקבוק נסטי', description: 'בקבוק נסטי 500 מ"ל', price: 6.50, category: 'שתייה קרה', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '8d', name: 'בקבוק סודה', description: 'בקבוק סודה 500 מ"ל', price: 6.50, category: 'שתייה קרה', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '9', name: 'מים', description: 'בקבוק מים 500 מ"ל', price: 4.50, category: 'שתייה קרה', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  // קפה - גדול וקטן
  {
    id: '12',
    name: 'קפה קטן',
    description: 'קפה קטן',
    price: 7.50,
    category: 'קפה',
    has_addons: false,
    has_variations: false,
    addons: null,
    variations: null,
    available: true,
  },
  {
    id: '13',
    name: 'קפה גדול',
    description: 'קפה גדול',
    price: 9.00,
    category: 'קפה',
    has_addons: false,
    has_variations: false,
    addons: null,
    variations: null,
    available: true,
  },
  // פיצה - עם תוספות
  {
    id: '14',
    name: 'פיצה',
    description: 'פיצה טרייה',
    price: 20.50,
    category: 'פיצה',
    has_addons: true,
    has_variations: false,
    addons: ['תירס', 'עגבניה', 'זיתים', 'בצל', 'גמבה', 'בולגרית', 'חריף'],
    variations: null,
    available: true,
  },
  // מאפים - 4 אופציות
  {
    id: '15',
    name: 'קוראסון שוקולד',
    description: 'קוראסון שוקולד טרי',
    price: 0, // מחיר יקבע לפי גדול/קטן
    category: 'מאפים',
    has_addons: false,
    has_variations: true,
    addons: null,
    variations: ['קטן', 'גדול'],
    available: true,
  },
  {
    id: '15b',
    name: 'קוראסון חמאה',
    description: 'קוראסון חמאה טרי',
    price: 0, // מחיר יקבע לפי גדול/קטן
    category: 'מאפים',
    has_addons: false,
    has_variations: true,
    addons: null,
    variations: ['קטן', 'גדול'],
    available: true,
  },
  {
    id: '15c',
    name: 'קוראסון שקדים',
    description: 'קוראסון שקדים טרי',
    price: 0, // מחיר יקבע לפי גדול/קטן
    category: 'מאפים',
    has_addons: false,
    has_variations: true,
    addons: null,
    variations: ['קטן', 'גדול'],
    available: true,
  },
  {
    id: '15d',
    name: 'בורקס גבינה',
    description: 'בורקס גבינה טרי',
    price: 0, // מחיר יקבע לפי גדול/קטן
    category: 'מאפים',
    has_addons: false,
    has_variations: true,
    addons: null,
    variations: ['קטן', 'גדול'],
    available: true,
  },
  // חטיפים
  { id: '17', name: 'תפוצ\'יפס', description: 'תפוצ\'יפס', price: 4.80, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '18', name: 'במבה', description: 'במבה', price: 4.80, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '19', name: 'אפרופו', description: 'אפרופו', price: 4.80, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '20', name: 'פסק זמן', description: 'פסק זמן', price: 5.60, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '21', name: 'כיף כף', description: 'כיף כף', price: 5.60, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '22', name: 'ריזס', description: 'ריזס', price: 4.80, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '23', name: 'שוקולד ריטר', description: 'שוקולד ריטר', price: 12.60, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  // מסטיק - הועבר לחטיפים
  { id: '24', name: 'מסטיק מנטוס', description: 'מסטיק מנטוס', price: 9.30, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
  { id: '25', name: 'מסטיק מאסט', description: 'מסטיק מאסט', price: 5.50, category: 'חטיפים', has_addons: false, has_variations: false, addons: null, variations: null, available: true },
];

export async function GET() {
  try {
    // If no DATABASE_URL, use mock data immediately
    if (!process.env.DATABASE_URL) {
      console.log('No DATABASE_URL found, using mock data');
      return NextResponse.json(MOCK_MENU_ITEMS);
    }

    // Try to get data from database
    const result = await sql`
      SELECT * FROM menu_items
      WHERE available = true
      ORDER BY category ASC, name ASC
    `;

    // If database has data, use it
    if (result && Array.isArray(result) && result.length > 0) {
      // Parse JSONB fields and ensure price is a number
      const parsed = result.map((item: any) => ({
        ...item,
        price: parseFloat(String(item.price || 0)),
        addons: item.addons ? (typeof item.addons === 'string' ? JSON.parse(item.addons) : item.addons) : item.addons,
        variations: item.variations ? (typeof item.variations === 'string' ? JSON.parse(item.variations) : item.variations) : item.variations,
      }));
      return NextResponse.json(parsed);
    }
    
    // If database is empty or not set up, use mock data
    console.log('Database is empty, using mock data');
    return NextResponse.json(MOCK_MENU_ITEMS);
  } catch (error: any) {
    console.error('Database error, using mock data:', error.message);
    // If database connection fails, use mock data
    return NextResponse.json(MOCK_MENU_ITEMS);
  }
}


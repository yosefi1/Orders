-- עדכון מחירים: עד 17 ₪ +0.10, מעל 17 ₪ +0.20
-- מאפים (price=0) לא נכללים – המחיר שלהם ב-lib/prices.ts

UPDATE menu_items
SET
  price = CASE
    WHEN price <= 17 THEN price + 0.10
    ELSE price + 0.20
  END,
  updated_at = NOW()
WHERE price > 0;

-- לבדיקה אחרי העדכון:
-- SELECT name, category, price FROM menu_items ORDER BY category, name;

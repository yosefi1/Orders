# פתרון בעיות - Cron Job לא רץ ב-10:30

## 🔍 בדיקות מהירות:

### 1. בדוק אם יש הזמנות להיום
- אם אין הזמנות → המייל לא יישלח (זה התנהגות תקינה)
- לך ל-Vercel Dashboard → Storage → Postgres → Data → `orders` table
- בדוק אם יש הזמנות עם `order_date` של היום

### 2. בדוק את הלוגים ב-Vercel
- לך ל-Vercel Dashboard → הפרויקט שלך → **Functions** או **Logs**
- חפש קריאות ל-`/api/cron/daily-report` סביב 10:30
- אם יש שגיאות → תראה אותן שם

### 3. בדוק אם CRON_SECRET מוגדר
- לך ל-Vercel Dashboard → Settings → Environment Variables
- ודא שיש `CRON_SECRET` עם ערך

### 4. בדוק את השעה
- **חורף (UTC+2):** 8:30 UTC = 10:30 ישראל ✅
- **קיץ (UTC+3):** 8:30 UTC = 11:30 ישראל ⚠️
- אם זה קיץ, המייל יגיע ב-11:30, לא 10:30!

## 🛠️ פתרונות:

### פתרון 1: בדיקה ידנית (מיד)
נסה לשלוח מייל ידנית כדי לבדוק שהכל עובד:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/daily-report
```

**או דרך הדפדפן:**
1. פתח את הדפדפן
2. פתח Developer Tools (F12) → Console
3. הרץ:
```javascript
fetch('https://your-app.vercel.app/api/cron/daily-report', {
  headers: {
    'Authorization': 'Bearer YOUR_CRON_SECRET'
  }
})
.then(r => r.json())
.then(console.log)
```

### פתרון 2: בדוק את ה-cron job ב-Vercel
1. לך ל-Vercel Dashboard → הפרויקט שלך
2. לך ל-**Settings** → **Cron Jobs**
3. בדוק אם ה-cron job מוגדר נכון:
   - Path: `/api/cron/daily-report`
   - Schedule: `30 8 * * *`

### פתרון 3: אם זה קיץ - שנה את השעה
אם אתה בקיץ (UTC+3) ורוצה 10:30, שנה ב-`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "30 7 * * *"
    }
  ]
}
```
זה יהיה:
- **קיץ:** 7:30 UTC = 10:30 ישראל ✅
- **חורף:** 7:30 UTC = 9:30 ישראל ⚠️

### פתרון 4: הוסף לוגים לבדיקה
אפשר להוסיף לוגים בקוד כדי לראות מה קורה, אבל זה דורש deploy מחדש.

## ⚠️ בעיות נפוצות:

### בעיה: "No orders for today"
**פתרון:** זה תקין! אם אין הזמנות, המייל לא יישלח.

### בעיה: "Unauthorized"
**פתרון:** 
- ודא ש-`CRON_SECRET` מוגדר ב-Vercel
- ודא שהערך זהה למה שב-Environment Variables

### בעיה: Cron job לא רץ בכלל
**פתרונות:**
1. ודא שה-`vercel.json` נדחף ל-GitHub
2. ודא שה-deployment האחרון כולל את ה-`vercel.json`
3. בדוק ב-Vercel Dashboard → Settings → Cron Jobs

### בעיה: Cron job רץ אבל המייל לא נשלח
**פתרונות:**
1. בדוק את הגדרות SMTP
2. בדוק את הלוגים ב-Vercel Functions
3. בדוק אם יש שגיאות בשליחת המייל

## 📝 מה לבדוק עכשיו:

1. ✅ יש הזמנות להיום?
2. ✅ CRON_SECRET מוגדר?
3. ✅ מה השעה עכשיו (חורף/קיץ)?
4. ✅ מה הלוגים אומרים ב-Vercel?

## 🚀 בדיקה מהירה:

נסה לשלוח מייל ידנית עכשיו:
- אם זה עובד → הבעיה היא רק ב-cron job
- אם זה לא עובד → הבעיה היא בהגדרות (SMTP, CRON_SECRET, וכו')


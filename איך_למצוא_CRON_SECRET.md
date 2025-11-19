# איך למצוא את CRON_SECRET

## שלב 1: לך ל-Vercel Dashboard

1. פתח [vercel.com](https://vercel.com)
2. התחבר לחשבון שלך
3. בחר את הפרויקט שלך (Orders או שם אחר)

## שלב 2: מצא את Environment Variables

1. בפרויקט, לחץ על **Settings** (בתפריט העליון)
2. בתפריט הצד, לחץ על **Environment Variables**

## שלב 3: מצא את CRON_SECRET

1. תראה רשימה של משתני סביבה
2. חפש את השורה עם **Key** = `CRON_SECRET`
3. בשורה הזו, יש עמודה **Value** - זה הערך שאתה צריך!

## שלב 4: העתק את הערך

1. לחץ על השורה של `CRON_SECRET`
2. תראה את הערך (זה מחרוזת ארוכה של תווים אקראיים)
3. העתק את הערך הזה

## שלב 5: השתמש בערך

הדבק את הערך במקום `YOUR_CRON_SECRET` בקוד:

```javascript
fetch('https://your-app.vercel.app/api/cron/daily-report', {
  headers: {
    'Authorization': 'Bearer כאן_תדביק_את_הערך_שלך'
  }
})
.then(r => r.json())
.then(console.log)
```

## ⚠️ אם אין CRON_SECRET?

אם אין לך `CRON_SECRET` ב-Environment Variables:

1. לחץ על **Add New** או **Create**
2. **Key:** `CRON_SECRET`
3. **Value:** כתוב מחרוזת אקראית (למשל: `my-secret-key-12345` או השתמש ב-generator)
4. לחץ **Save**
5. **חשוב:** צריך לעשות **Redeploy** כדי שהשינוי ייכנס לתוקף!

## 💡 טיפ:

אם אתה לא רואה את הערך (יש כפתור "Show" או "Reveal"), לחץ עליו כדי לראות את הערך.


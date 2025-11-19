# הגדרה מפורטת - cron-job.org

## הגדרות רגילות:

### Title:
```
Daily Orders Report
```

### URL:
```
https://orders-altera.vercel.app/api/cron/daily-report
```

### Schedule (כל יום בשעה מסוימת):
- **שעה:** `11:00` (או השעה שאתה רוצה)
- **כל יום:** סמן את זה

## הגדרות מתקדמות:

### 1. Requires HTTP authentication:
- **כבוי** (לא צריך - אנחנו משתמשים ב-Headers במקום)

### 2. Headers (חשוב!):
לחץ על **Add Header** או **+** והוסף:

**Header 1:**
- **Name:** `Authorization`
- **Value:** `Bearer altera1`

(החלף את `altera1` ב-CRON_SECRET שלך מ-Vercel אם הוא שונה)

### 3. Time zone:
- בחר: **Asia/Jerusalem**

### 4. Request method:
- בחר: **GET**

### 5. Request body:
- השאר ריק (לא צריך)

### 6. Timeout:
- השאר את הערך הדיפולטיבי (30 שניות זה מספיק)

### 7. Treat redirects with HTTP 3xx status code as success:
- **כבוי** (זה בסדר)

## 🔧 פתרון בעיית 401 Unauthorized:

אם אתה מקבל 401, זה אומר שה-Header לא נשלח נכון. בדוק:

1. **ודא שה-Header נוסף נכון:**
   - Name: `Authorization` (בדיוק כך, עם A גדולה)
   - Value: `Bearer altera1` (עם רווח אחרי Bearer!)

2. **ודא שה-CRON_SECRET נכון:**
   - לך ל-Vercel Dashboard → Settings → Environment Variables
   - מצא את `CRON_SECRET`
   - ודא שהערך ב-cron-job.org זהה

3. **נסה עם Header אחר:**
   - לפעמים צריך לנסות עם `authorization` (אותיות קטנות)
   - או `Authorization` (כמו שכתוב)

## ✅ בדיקה:

1. אחרי שמירת ההגדרות, לחץ על **TEST RUN**
2. אם זה עובד, תראה תשובה כמו:
   ```json
   {
     "success": true,
     "message": "Daily report sent with X orders"
   }
   ```
3. אם זה לא עובד, תראה שגיאה - תגיד מה השגיאה

## 🎯 סיכום ההגדרות:

**רגילות:**
- Title: Daily Orders Report
- URL: https://orders-altera.vercel.app/api/cron/daily-report
- Schedule: כל יום ב-11:00

**מתקדמות:**
- Headers: `Authorization: Bearer altera1`
- Time zone: Asia/Jerusalem
- Request method: GET
- כל השאר: ברירת מחדל

## ⚠️ אם עדיין לא עובד:

1. **בדוק את ה-CRON_SECRET:**
   - ודא שהוא זהה ב-Vercel וב-cron-job.org
   
2. **נסה לשלוח ידנית:**
   - פתח דפדפן → Developer Tools → Console
   - הרץ:
   ```javascript
   fetch('https://orders-altera.vercel.app/api/cron/daily-report', {
     headers: {
       'Authorization': 'Bearer altera1'
     }
   })
   .then(r => r.json())
   .then(console.log)
   ```
   - אם זה עובד, הבעיה היא ב-cron-job.org
   - אם זה לא עובד, הבעיה היא ב-CRON_SECRET

3. **בדוק את הלוגים ב-Vercel:**
   - לך ל-Vercel Dashboard → Logs
   - תראה מה קורה כשמישהו מנסה לגשת ל-endpoint


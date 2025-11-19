# איך לבדוק את Cron Job ידנית

## פתרון 1: באמצעות curl (מהטרמינל)

### Windows (PowerShell):
```powershell
curl -Uri "https://orders-altera.vercel.app/api/cron/daily-report" -Headers @{"Authorization"="Bearer altera1"} -Method GET
```

### Mac/Linux:
```bash
curl -H "Authorization: Bearer altera1" https://orders-altera.vercel.app/api/cron/daily-report
```

## פתרון 2: באמצעות Postman

1. הורד והתקן [Postman](https://www.postman.com/downloads/)
2. צור בקשה חדשה (New Request)
3. בחר **GET**
4. כתוב את הכתובת: `https://orders-altera.vercel.app/api/cron/daily-report`
5. לך ל-**Headers**
6. הוסף:
   - **Key:** `Authorization`
   - **Value:** `Bearer altera1`
7. לחץ **Send**

## פתרון 3: בדיקה דרך Vercel Dashboard

1. לך ל-Vercel Dashboard → הפרויקט שלך
2. לחץ על **Functions** או **Logs**
3. חפש קריאות ל-`/api/cron/daily-report`
4. אם יש שגיאות, תראה אותן שם

## פתרון 4: הוספת CORS זמנית (לא מומלץ)

אם אתה רוצה לבדוק מהדפדפן, אפשר להוסיף CORS headers זמנית, אבל זה לא מומלץ כי זה endpoint פרטי.


# איך לבדוק ולמחוק Webhooks ב-Vercel

## הבעיה:
אחרי כל DEPLOY מגיע מייל - זה לא מ-cron job מתוזמן!

## פתרון:

### 1. בדוק Webhooks ב-Vercel Dashboard

1. **לך ל-Vercel Dashboard** → הפרויקט שלך
2. **Settings** → **Webhooks** (או **Deploy Hooks**)
3. **חפש webhooks שקשורים ל:**
   - `/api/cron/daily-report`
   - `/api/cron/test-daily-report`
   - כל webhook שמופעל אחרי deploy

4. **אם יש webhook כזה:**
   - **מחק אותו** או **השבת אותו**

### 2. בדוק Deploy Hooks

1. **Settings** → **Deploy Hooks**
2. **חפש hooks שמופעלים אחרי deploy**
3. **אם יש hook ששולח מייל:**
   - **מחק אותו**

### 3. בדוק ב-cron-job.org

1. **לך ל-[cron-job.org](https://cron-job.org)**
2. **התחבר לחשבון**
3. **חפש cron jobs שקשורים לפרויקט שלך**
4. **אם יש cron job שמופעל אחרי deploy:**
   - **השבת אותו** או **מחק אותו**

### 4. בדוק את הלוגים ב-Vercel

1. **Deployments** → בחר את ה-deployment האחרון
2. **Functions** → לחץ על הפונקציה
3. **Logs** → חפש:
   - "Daily report email sent"
   - "Manual daily report trigger"
   - כל הודעה שקשורה למייל

4. **זה יעזור לך להבין מה קורא ל-endpoint**

### 5. בדוק את ה-URL של ה-Webhook

אם יש webhook, בדוק את ה-URL שלו:
- אם זה `/api/cron/test-daily-report` → זה הבעיה!
- אם זה `/api/cron/daily-report` → זה צריך CRON_SECRET

## פתרון זמני:

עד שתמצא את ה-webhook, הוספתי הגנה ל-`test-daily-report` endpoint:
- עכשיו הוא דורש CRON_SECRET
- זה ימנע גישה לא מורשית

## מה לעשות עכשיו:

1. ✅ **עשה git push** (השינויים כבר בקוד)
2. 🔍 **בדוק ב-Vercel Dashboard** → Settings → Webhooks
3. 🔍 **בדוק ב-cron-job.org** אם יש cron job נוסף
4. 📧 **בדוק את הלוגים** כדי לראות מה קורא ל-endpoint


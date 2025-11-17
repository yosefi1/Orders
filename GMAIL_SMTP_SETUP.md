# הגדרת Gmail SMTP - מדריך מפורט

## מה זה Gmail SMTP?

**Gmail SMTP** זה שימוש בחשבון Gmail שלך (אישי או עסקי) לשליחת אימיילים דרך האתר.
- ✅ **חינמי לחלוטין** - אין תשלום
- ✅ **500 אימיילים ביום** - מספיק למקרה שלך (1 לספק + כמה ללקוחות)
- ✅ **עובד מ-Vercel** - נגיש מכל מקום
- ✅ **אמין** - שירות של Google

**איך זה עובד?**
- אתה משתמש בחשבון Gmail שלך (לא צריך לפתוח חשבון חדש)
- יוצרים "App Password" (סיסמה מיוחדת לאפליקציות)
- האתר שולח אימיילים דרך Gmail SMTP

---

## שלב 1: הפעלת אימות דו-שלבי (חובה!)

1. לך ל-[Google Account](https://myaccount.google.com/)
2. לחץ על **Security** (אבטחה)
3. תחת **Signing in to Google**, לחץ על **2-Step Verification**
4. פעל את האימות הדו-שלבי (אם עדיין לא פעיל)

---

## שלב 2: יצירת App Password

1. ב-**Security**, גלול למטה ל-**2-Step Verification**
2. לחץ על **App passwords** (סיסמאות אפליקציות)
3. ייתכן שתתבקש להזין את הסיסמה של Google
4. תחת **Select app**, בחר **Mail**
5. תחת **Select device**, בחר **Other (Custom name)**
6. הקלד: `Cafeteria Orders`
7. לחץ **Generate**
8. **העתק את הסיסמה** (16 תווים) - זה חשוב! לא תוכל לראות אותה שוב

**דוגמה לסיסמה:** `abcd efgh ijkl mnop`

---

## שלב 3: הגדרת משתני סביבה ב-Vercel

1. לך ל-Vercel → הפרויקט שלך → **Settings** → **Environment Variables**

2. הוסף/עדכן את המשתנים הבאים:

   | Key | Value | הערות |
   |-----|-------|-------|
   | `SMTP_HOST` | `smtp.gmail.com` | שרת Gmail SMTP |
   | `SMTP_PORT` | `587` | פורט Gmail SMTP |
   | `SMTP_USER` | `your-email@gmail.com` | כתובת Gmail שלך |
   | `SMTP_PASSWORD` | `abcd efgh ijkl mnop` | ה-App Password שיצרת (16 תווים) |
   | `EMAIL_FROM` | `your-email@gmail.com` | כתובת השולח (אותה כתובת) |
   | `SUPPLIER_EMAIL` | `supplier@example.com` | כתובת המייל של הספק |

3. לחץ **Save**

---

## שלב 4: Redeploy

1. לך ל-**Deployments**
2. לחץ על ה-Deployment האחרון → **⋮** → **Redeploy**
3. המתן לסיום ה-Deployment

---

## בדיקה

1. **בדיקת אימייל ללקוח:**
   - בצע הזמנה עם כתובת אימייל
   - בדוק אם האימייל הגיע

2. **בדיקת דוח יומי:**
   - הדוח נשלח אוטומטית כל יום ב-10:30 (8:30 UTC)
   - או תוכל לבדוק ידנית: `https://your-site.vercel.app/api/cron/daily-report`
   - (צריך להוסיף `CRON_SECRET` ב-Environment Variables)

---

## הערות חשובות

- **App Password** זה לא הסיסמה הרגילה של Gmail
- אם תשכח את ה-App Password, תצטרך ליצור אחד חדש
- מגבלה: **500 אימיילים ביום** (מספיק למקרה שלך)
- אם תגיע למגבלה, תקבל שגיאה - זה נדיר מאוד

---

## פתרון בעיות

### שגיאה: "Invalid login"
- ודא שיצרת **App Password** ולא השתמשת בסיסמה הרגילה
- ודא שהעתקת את כל 16 התווים (כולל רווחים)

### שגיאה: "Less secure app access"
- Gmail לא דורש "Less secure apps" יותר
- פשוט השתמש ב-**App Password** (כמו שהסברנו)

### אימיילים לא מגיעים
- בדוק את תיבת ה-Spam
- ודא ש-`SUPPLIER_EMAIL` נכון
- בדוק את ה-Logs ב-Vercel

---

## אלטרנטיבות (אם Gmail לא עובד)

1. **Outlook/Hotmail SMTP:**
   - `SMTP_HOST`: `smtp-mail.outlook.com`
   - `SMTP_PORT`: `587`
   - אותו תהליך של App Password

2. **ProtonMail** (אם יש לך)
   - צריך להגדיר SMTP במיוחד

3. **שירותים חינמיים אחרים:**
   - Mailgun (חינמי עד 5,000 אימיילים/חודש)
   - Brevo (חינמי עד 300 אימיילים/יום)

---

**שאלות?** בדוק את ה-Logs ב-Vercel או פנה אליי!


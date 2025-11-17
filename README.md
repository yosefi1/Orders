# Cafeteria Ordering System

A modern web application for ordering food from the cafeteria, accessible from any device.

Last updated: 2025-01-27

## Features

- 📱 Responsive design (mobile & desktop)
- 🛒 Shopping cart with minimum order validation (25 ILS)
- ⚡ Real-time order updates (shared database)
- 📧 Daily email reports (10:30 AM) with Excel, Word, and PDF attachments
- ☁️ Cloud-based database (Vercel Postgres) - no local server needed

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Vercel Postgres (PostgreSQL)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

## Setup Instructions

### פיתוח מקומי:

1. **התקן dependencies:**
   ```bash
   npm install
   ```

2. **הגדר משתני סביבה:**
   - העתק `.env.local.example` ל-`.env.local`
   - מלא את המשתנים הנדרשים

3. **הרץ שרת פיתוח:**
   ```bash
   npm run dev
   ```

### פריסה לייצור:

**ראה מדריך מפורט ב-`DEPLOYMENT.md`**

1. **הגדר Vercel Postgres:**
   - צור מסד נתונים ב-Vercel Dashboard
   - הרץ את ה-Schema מ-`database/schema-updated.sql`

2. **הגדר משתני סביבה ב-Vercel:**
   - `CRON_SECRET` - מפתח אבטחה אקראי
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - הגדרות אימייל
   - `SUPPLIER_EMAIL` - כתובת האימייל של הספק

3. **פרוס ל-Vercel:**
   - חבר את ה-repository ל-Vercel
   - Vercel יבנה ויפרס אוטומטית

## Database Schema

- `menu_items`: Available food items with prices
- `orders`: Customer orders
- `order_items`: Items in each order

## Daily Email Reports

The system automatically sends daily reports at 10:30 AM with:
- Excel file (.xlsx)
- Word document (.docx)
- PDF file (.pdf)

Configure the Vercel Cron job in `vercel.json` to enable this feature.


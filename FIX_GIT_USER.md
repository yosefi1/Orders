# תיקון הגדרות Git

## שלב 1: שנה את ההגדרות של Git

הרץ את הפקודות הבאות ב-PowerShell:

```powershell
git config --global user.name "yosefi1"
git config --global user.email "sdoko2@gmail.com"
```

## שלב 2: בדוק שהכל תקין

```powershell
git config --global user.name
git config --global user.email
```

אמור להציג:
- yosefi1
- sdoko2@gmail.com

## שלב 3: ודא שאתה מחובר ל-repository הנכון

```powershell
cd C:\Projects\Orders
git remote -v
```

אמור להציג:
```
origin  https://github.com/yosefi1/orders.git (fetch)
origin  https://github.com/yosefi1/orders.git (push)
```

אם לא, שנה:
```powershell
git remote remove origin
git remote add origin https://github.com/yosefi1/orders.git
```

## שלב 4: דחוף את כל השינויים

```powershell
cd C:\Projects\Orders
git add .
git commit -m "Fix build errors - add iconv-lite and fix types"
git push
```

זה הכל! עכשיו Vercel יראה את השינויים.


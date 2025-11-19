import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('הזמנות');

    // Set column headers and widths
    worksheet.columns = [
      { header: 'שם לקוח', key: 'customerName', width: 15 },
      { header: 'טלפון', key: 'phone', width: 12 },
      { header: 'פריט', key: 'item', width: 20 },
      { header: 'כמות', key: 'quantity', width: 8 },
      { header: 'תוספות', key: 'addons', width: 25 },
      { header: 'הוראות מיוחדות', key: 'instructions', width: 20 },
      { header: 'תאריך', key: 'date', width: 12 },
    ];

    // Add sample data
    const sampleData = [
      { customerName: 'יוסף טל', phone: '050-1234567', item: 'טוסט', quantity: 2, addons: 'תירס, עגבניה', instructions: '', date: '2024-01-15' },
      { customerName: 'יוסף טל', phone: '050-1234567', item: 'סלט אישי', quantity: 1, addons: '', instructions: 'ללא בצל', date: '2024-01-15' },
      { customerName: 'גלעד כהן', phone: '052-9876543', item: 'פיצה', quantity: 1, addons: 'זיתים, גמבה', instructions: '', date: '2024-01-15' },
    ];

    // Add header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    sampleData.forEach((row) => {
      worksheet.addRow(row);
    });

    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="test-orders.xlsx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

function parseCsvBuffer(buffer: Buffer): { headers: string[]; rows: any[] } {
  // Decode text (try UTF-8, strip BOM)
  let text = buffer.toString("utf-8");
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // Detect delimiter
  const firstLines = text.split(/\r?\n/).slice(0, 5).join("\n");
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semiCount = (firstLines.match(/;/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;

  let delimiter = ",";
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";

  // Parse CSV rows respecting quotes
  const allRows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\r") {
        // ignore CR
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          allRows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== "")) {
      allRows.push(currentRow);
    }
  }

  if (allRows.length === 0) return { headers: [], rows: [] };

  // Detect header row (first non-empty row)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(allRows.length, 5); i++) {
    if (allRows[i].filter((c) => c !== "").length >= 2) {
      headerRowIdx = i;
      break;
    }
  }

  const rawHeaders = allRows[headerRowIdx].map((h) => h.replace(/^["']|["']$/g, "").trim());
  const headers = rawHeaders.filter((h) => h !== "");

  const rows: any[] = [];
  for (let i = headerRowIdx + 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row || row.every((c) => !c || c.trim() === "")) continue;

    const obj: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      if (h) {
        obj[h] = row[idx] ? row[idx].trim() : "";
      }
    });
    rows.push(obj);
  }

  return { headers, rows };
}

async function parseExcelBuffer(
  buffer: Buffer,
  targetSheetName?: string
): Promise<{ sheets: string[]; activeSheet: string; headers: string[]; rows: any[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);

  const sheets: string[] = [];
  wb.eachSheet((ws) => {
    sheets.push(ws.name);
  });

  let worksheet: ExcelJS.Worksheet | undefined;
  if (targetSheetName) {
    worksheet = wb.getWorksheet(targetSheetName);
  }
  if (!worksheet) {
    worksheet = wb.worksheets[0];
  }

  if (!worksheet) {
    return { sheets: [], activeSheet: "", headers: [], rows: [] };
  }

  const activeSheet = worksheet.name;
  const allRowValues: string[][] = [];

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const vals: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // ExcelJS cell.values are 1-indexed
      let v = cell.text !== undefined && cell.text !== null ? cell.text : String(cell.value || "");
      if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date) {
        v = cell.value.toISOString().slice(0, 10);
      }
      vals[colNumber - 1] = String(v).trim();
    });
    // Fill gaps
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === undefined) vals[i] = "";
    }
    if (vals.some((v) => v !== "")) {
      allRowValues.push(vals);
    }
  });

  if (allRowValues.length === 0) {
    return { sheets, activeSheet, headers: [], rows: [] };
  }

  // Find header row (first row with at least 2 non-empty cells)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(allRowValues.length, 5); i++) {
    if (allRowValues[i].filter((c) => c !== "").length >= 2) {
      headerRowIdx = i;
      break;
    }
  }

  const rawHeaders = allRowValues[headerRowIdx].map((h) => String(h || "").trim());
  const headers = rawHeaders.filter((h) => h !== "");

  const rows: any[] = [];
  for (let i = headerRowIdx + 1; i < allRowValues.length; i++) {
    const row = allRowValues[i];
    if (!row || row.every((c) => !c || String(c).trim() === "")) continue;

    const obj: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      if (h) {
        obj[h] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
      }
    });
    rows.push(obj);
  }

  return { sheets, activeSheet, headers, rows };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sheetName = (formData.get("sheetName") as string) || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: "Vui lòng chọn file để tải lên." }, { status: 400 });
    }

    const fileName = file.name || "upload.xlsx";
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (ext === ".csv" || ext === ".tsv" || ext === ".txt") {
      const parsed = parseCsvBuffer(buffer);
      return NextResponse.json({
        success: true,
        fileName,
        sheets: ["CSV"],
        activeSheet: "CSV",
        headers: parsed.headers,
        rows: parsed.rows,
        total: parsed.rows.length,
      });
    }

    if (ext === ".xlsx" || ext === ".xls" || ext === ".xlsm") {
      const parsed = await parseExcelBuffer(buffer, sheetName);
      return NextResponse.json({
        success: true,
        fileName,
        sheets: parsed.sheets,
        activeSheet: parsed.activeSheet,
        headers: parsed.headers,
        rows: parsed.rows,
        total: parsed.rows.length,
      });
    }

    // Try Excel first, fallback to CSV
    try {
      const parsed = await parseExcelBuffer(buffer, sheetName);
      if (parsed.rows.length > 0) {
        return NextResponse.json({
          success: true,
          fileName,
          sheets: parsed.sheets,
          activeSheet: parsed.activeSheet,
          headers: parsed.headers,
          rows: parsed.rows,
          total: parsed.rows.length,
        });
      }
    } catch {}

    const parsed = parseCsvBuffer(buffer);
    return NextResponse.json({
      success: true,
      fileName,
      sheets: ["Data"],
      activeSheet: "Data",
      headers: parsed.headers,
      rows: parsed.rows,
      total: parsed.rows.length,
    });
  } catch (err: any) {
    console.error("parse-file error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Không thể đọc nội dung file. Vui lòng kiểm tra định dạng file." },
      { status: 500 }
    );
  }
}

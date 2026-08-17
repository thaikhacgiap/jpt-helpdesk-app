import { NextRequest, NextResponse } from "next/server";
import { upsertCustomerFromImport } from "@/lib/customer-operations";

interface SheetRow {
  code: string;
  name: string;
  ten_tieng_anh?: string;
}

// Helper function to parse CSV text into row objects
function parseCSV(text: string): SheetRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header line
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  
  // Find matching column indices for "Mã Khách Hàng", "Tên Hiển Thị", "Tên Tiếng Anh"
  const getIndex = (keys: string[]) => {
    return headers.findIndex(h => keys.some(k => h.includes(k)));
  };

  const codeIdx = getIndex(["mã khách hàng", "ma khach hang", "code", "mã kh"]);
  const nameIdx = getIndex(["tên hiển thị", "ten hien thi", "tên khách hàng", "ten khach hang", "name"]);
  const engIdx = getIndex(["tên tiếng anh", "ten tieng anh", "english name", "name_en"]);

  const rows: SheetRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const code = codeIdx >= 0 ? values[codeIdx] : "";
    const name = nameIdx >= 0 ? values[nameIdx] : "";
    const ten_tieng_anh = engIdx >= 0 ? values[engIdx] : "";

    if (code && name) {
      rows.push({ code, name, ten_tieng_anh });
    }
  }

  return rows;
}

// Convert various Google Sheet URLs to published CSV URL format
function getCsvUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (url.includes("/pub?") || url.endsWith("&output=csv") || url.endsWith("output=csv")) {
    return url;
  }
  
  // Extract spreadsheet ID
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const spreadsheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  }

  return url;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sheetUrl, data: rawRows } = body;

    let rowsToProcess: { code: string; name: string; ten_tieng_anh?: string }[] = [];

    // Case 1: Direct JSON rows array passed (from Webhook or Client)
    if (Array.isArray(rawRows) && rawRows.length > 0) {
      rowsToProcess = rawRows.map(r => ({
        code: r["Mã Khách Hàng"] || r.code || r.ma_khach_hang || "",
        name: r["Tên Hiển Thị"] || r.name || r.ten_hien_thi || "",
        ten_tieng_anh: r["Tên Tiếng Anh"] || r.ten_tieng_anh || "",
      })).filter(r => r.code && r.name);
    } 
    // Case 2: Fetch CSV from Google Sheet URL
    else if (sheetUrl) {
      const csvUrl = getCsvUrl(sheetUrl);
      const res = await fetch(csvUrl, { cache: "no-store" });
      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Không thể kết nối đến Google Sheet (HTTP status: ${res.status}). Vui lòng kiểm tra quyền truy cập công khai của Sheet.`,
        }, { status: 400 });
      }

      const csvText = await res.text();
      rowsToProcess = parseCSV(csvText);
    } else {
      return NextResponse.json({
        success: false,
        error: "Vui lòng cung cấp sheetUrl hoặc dữ liệu data để đồng bộ.",
      }, { status: 400 });
    }

    if (rowsToProcess.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Không tìm thấy dữ liệu hợp lệ trong Google Sheet. Đảm bảo có các cột: 'Mã Khách Hàng', 'Tên Hiển Thị', 'Tên Tiếng Anh'.",
      }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of rowsToProcess) {
      const res = await upsertCustomerFromImport(row);
      if (res.success) {
        if (res.action === "created") createdCount++;
        else updatedCount++;
      } else {
        errorCount++;
        if (res.error) errors.push(`[${row.code}] ${res.error}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: rowsToProcess.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      errorDetails: errors,
      lastSyncedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("Error in sync-sheets route:", err);
    return NextResponse.json({
      success: false,
      error: err.message || String(err),
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("sheetUrl");
  if (!url) {
    return NextResponse.json({ success: false, error: "Missing sheetUrl query parameter." }, { status: 400 });
  }

  try {
    const csvUrl = getCsvUrl(url);
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Failed to fetch CSV: ${res.statusText}` }, { status: 400 });
    }
    const text = await res.text();
    const rows = parseCSV(text);
    return NextResponse.json({ success: true, count: rows.length, sample: rows.slice(0, 5) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

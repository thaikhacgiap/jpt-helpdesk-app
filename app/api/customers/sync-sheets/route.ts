import { NextRequest, NextResponse } from "next/server";
import { upsertCustomerFromImport } from "@/lib/customer-operations";
import { google } from "googleapis";

interface SheetRow {
  code: string;
  name: string;
  ten_tieng_anh?: string;
}

// Extract spreadsheet ID from Google Sheet URL
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// 1. Fetch via Real Google User OAuth 2.0 (Access Token / Refresh Token of Real Google User)
async function fetchFromGoogleSheetsAPIUserOAuth(
  spreadsheetId: string,
  accessToken?: string,
  refreshToken?: string,
  clientId?: string,
  clientSecret?: string
): Promise<SheetRow[]> {
  const oauth2Client = new google.auth.OAuth2(
    clientId || undefined,
    clientSecret || undefined
  );
  
  oauth2Client.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken || undefined,
  });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A1:Z2000",
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h: any) => String(h).trim().toLowerCase());
  const getIndex = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

  const codeIdx = getIndex(["mã khách hàng", "ma khach hang", "code", "mã kh"]);
  const nameIdx = getIndex(["tên hiển thị", "ten hien thi", "tên khách hàng", "ten khach hang", "name"]);
  const engIdx = getIndex(["tên tiếng anh", "ten tieng anh", "english name", "name_en"]);

  const result: SheetRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = codeIdx >= 0 ? String(row[codeIdx] || "").trim() : "";
    const name = nameIdx >= 0 ? String(row[nameIdx] || "").trim() : "";
    const ten_tieng_anh = engIdx >= 0 ? String(row[engIdx] || "").trim() : "";

    if (code && name) {
      result.push({ code, name, ten_tieng_anh });
    }
  }

  return result;
}

// 2. Fetch via Service Account JWT
async function fetchFromGoogleSheetsAPIServiceAccount(
  spreadsheetId: string,
  clientEmail: string,
  privateKey: string
): Promise<SheetRow[]> {
  const formattedKey = privateKey.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: formattedKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A1:Z2000",
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0].map((h: any) => String(h).trim().toLowerCase());
  const getIndex = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

  const codeIdx = getIndex(["mã khách hàng", "ma khach hang", "code", "mã kh"]);
  const nameIdx = getIndex(["tên hiển thị", "ten hien thi", "tên khách hàng", "ten khach hang", "name"]);
  const engIdx = getIndex(["tên tiếng anh", "ten tieng anh", "english name", "name_en"]);

  const result: SheetRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = codeIdx >= 0 ? String(row[codeIdx] || "").trim() : "";
    const name = nameIdx >= 0 ? String(row[nameIdx] || "").trim() : "";
    const ten_tieng_anh = engIdx >= 0 ? String(row[engIdx] || "").trim() : "";

    if (code && name) {
      result.push({ code, name, ten_tieng_anh });
    }
  }

  return result;
}

// Helper function to parse CSV text into row objects (fallback)
function parseCSV(text: string): SheetRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  
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

function getCsvUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (url.includes("/pub?") || url.endsWith("&output=csv") || url.endsWith("output=csv")) {
    return url;
  }
  
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
    const { 
      sheetUrl, 
      clientEmail, 
      privateKey, 
      userAccessToken, 
      userRefreshToken, 
      userClientId, 
      userClientSecret,
      data: rawRows 
    } = body;

    let rowsToProcess: SheetRow[] = [];

    // Case 1: Direct JSON rows array passed (from Webhook or Client)
    if (Array.isArray(rawRows) && rawRows.length > 0) {
      rowsToProcess = rawRows.map(r => ({
        code: String(r["Mã Khách Hàng"] || r.code || r.ma_khach_hang || "").trim(),
        name: String(r["Tên Hiển Thị"] || r.name || r.ten_hien_thi || "").trim(),
        ten_tieng_anh: String(r["Tên Tiếng Anh"] || r.ten_tieng_anh || "").trim(),
      })).filter(r => r.code && r.name);
    } 
    // Case 2: Fetch via REAL Google User OAuth 2.0 (Access Token / Refresh Token)
    else if (sheetUrl && (userAccessToken || userRefreshToken)) {
      const spreadsheetId = extractSpreadsheetId(sheetUrl);
      if (!spreadsheetId) {
        return NextResponse.json({
          success: false,
          error: "Không thể nhận diện Spreadsheet ID từ đường link Google Sheet.",
        }, { status: 400 });
      }

      try {
        rowsToProcess = await fetchFromGoogleSheetsAPIUserOAuth(
          spreadsheetId,
          userAccessToken,
          userRefreshToken,
          userClientId,
          userClientSecret
        );
      } catch (authErr: any) {
        console.error("Real Google User Auth Error:", authErr);
        return NextResponse.json({
          success: false,
          error: `Lỗi xác thực Google User (${authErr.message}). Vui lòng kiểm tra Access Token hoặc Refresh Token của tài khoản Google User.`,
        }, { status: 400 });
      }
    }
    // Case 3: Fetch via Google Service Account (Client Email & Private Key)
    else if (sheetUrl && clientEmail && privateKey) {
      const spreadsheetId = extractSpreadsheetId(sheetUrl);
      if (!spreadsheetId) {
        return NextResponse.json({
          success: false,
          error: "Không thể nhận diện Spreadsheet ID từ đường link Google Sheet.",
        }, { status: 400 });
      }

      try {
        rowsToProcess = await fetchFromGoogleSheetsAPIServiceAccount(spreadsheetId, clientEmail, privateKey);
      } catch (authErr: any) {
        console.error("Google Service Account Auth Error:", authErr);
        return NextResponse.json({
          success: false,
          error: `Lỗi xác thực Google Account (${authErr.message}). Hãy chắc chắn đã bấm Chia sẻ (Share) file Google Sheet cho email tài khoản: ${clientEmail}`,
        }, { status: 400 });
      }
    }
    // Case 4: Public CSV Fetch (Fallback)
    else if (sheetUrl) {
      const csvUrl = getCsvUrl(sheetUrl);
      const res = await fetch(csvUrl, { cache: "no-store" });
      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Không thể kết nối đến Google Sheet (HTTP status: ${res.status}). Vui lòng kiểm tra thông tin Tài khoản Google User hoặc quyền truy cập của Sheet.`,
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

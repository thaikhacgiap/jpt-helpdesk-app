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

// Helper to extract SheetRow items from 2D values array with smart header detection & positional fallbacks
function extractRowsFromValues(rows: any[][]): SheetRow[] {
  if (!rows || rows.length < 1) return [];

  // 1. Smart Header Row Detection (Scan top 10 rows for actual header line)
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const rowText = (rows[r] || []).map(cell => String(cell || "").toLowerCase()).join(" ");
    if (rowText.includes("tên") || rowText.includes("mã") || rowText.includes("khách hàng") || rowText.includes("name") || rowText.includes("code")) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rows[headerRowIdx] || [];
  const headers = headerRow.map((h: any) => String(h || "").trim().toLowerCase());
  
  const getIndex = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

  let codeIdx = getIndex(["mã khách hàng", "ma khach hang", "code", "mã kh"]);
  let displayNameIdx = getIndex(["tên hiển thị", "ten hien thi"]);
  let fullNameIdx = getIndex(["tên khách hàng", "ten khach hang", "tên công ty", "ten cong ty", "name"]);
  let engIdx = getIndex(["tên tiếng anh", "ten tieng anh", "english name", "name_en"]);

  // Positional fallbacks (Matching screenshot layout: A=Code, B=Name, C=DisplayName, F=EngName)
  if (displayNameIdx < 0 && fullNameIdx < 0) {
    fullNameIdx = 1;     // Col B: Tên khách hàng
    displayNameIdx = 2;  // Col C: Tên hiển thị
  }
  if (codeIdx < 0) codeIdx = 0; // Col A: Mã khách hàng
  if (engIdx < 0 && headerRow.length > 5) engIdx = 5; // Col F: Tên tiếng anh

  const result: SheetRow[] = [];
  
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rowCode = codeIdx >= 0 && codeIdx < row.length ? String(row[codeIdx] || "").trim() : "";
    const rowDisplayName = displayNameIdx >= 0 && displayNameIdx < row.length ? String(row[displayNameIdx] || "").trim() : "";
    const rowFullName = fullNameIdx >= 0 && fullNameIdx < row.length ? String(row[fullNameIdx] || "").trim() : "";
    const ten_tieng_anh = engIdx >= 0 && engIdx < row.length ? String(row[engIdx] || "").trim() : "";

    // Name priority: Tên hiển thị -> Tên khách hàng -> any text cell in row
    let name = rowDisplayName || rowFullName;
    if (!name) {
      for (let c = 0; c < Math.min(row.length, 6); c++) {
        const val = String(row[c] || "").trim();
        if (val && !val.toLowerCase().startsWith("tên") && !val.toLowerCase().startsWith("mã") && val.length > 2) {
          name = val;
          break;
        }
      }
    }

    const code = rowCode || `AUTO-${i}`;

    // Skip if row is a repeated header or blank
    if (name && !name.toLowerCase().startsWith("tên khách hàng") && !name.toLowerCase().startsWith("tên hiển thị")) {
      result.push({ code, name, ten_tieng_anh });
    }
  }

  return result;
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

  let rToken = refreshToken?.trim();
  let aToken = accessToken?.trim();

  // Automatic token type detection: Refresh Token in Google OAuth 2.0 starts with "1//"
  if (aToken && (aToken.startsWith("1//") || aToken.startsWith("1/"))) {
    rToken = aToken;
    aToken = undefined;
  }

  oauth2Client.setCredentials({
    access_token: aToken || undefined,
    refresh_token: rToken || undefined,
  });

  // If we have a refresh_token, automatically request/exchange for a fresh live access_token
  if (rToken) {
    try {
      const tokenRes = await oauth2Client.getAccessToken();
      if (tokenRes && tokenRes.token) {
        oauth2Client.setCredentials({
          access_token: tokenRes.token,
          refresh_token: rToken,
        });
      }
    } catch (refreshErr: any) {
      console.error("Error refreshing Google OAuth token:", refreshErr?.message || refreshErr);
    }
  }

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A1:Z2000",
  });

  return extractRowsFromValues(response.data.values || []);
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

  return extractRowsFromValues(response.data.values || []);
}

// Helper function to parse CSV text into row objects (fallback)
function parseCSV(text: string): SheetRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const parsedMatrix = lines.map(line => line.split(",").map(v => v.trim().replace(/^"|"$/g, "")));
  return extractRowsFromValues(parsedMatrix);
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
      rowsToProcess = rawRows.map((r, i) => {
        const rowDisplayName = String(r["Tên Hiển Thị"] || r["Tên hiển thị"] || r.ten_hien_thi || "").trim();
        const rowFullName = String(r["Tên Khách Hàng"] || r["Tên khách hàng"] || r.name || "").trim();
        const name = rowDisplayName || rowFullName;

        const rowCode = String(r["Mã Khách Hàng"] || r["Mã khách hàng"] || r.code || r.ma_khach_hang || "").trim();
        const code = rowCode || `AUTO-${i + 1}`;

        const ten_tieng_anh = String(r["Tên Tiếng Anh"] || r["Tên tiếng anh"] || r.ten_tieng_anh || "").trim();

        return { code, name, ten_tieng_anh };
      }).filter(r => r.name);
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
        error: "Không tìm thấy dữ liệu hợp lệ trong Google Sheet. Đảm bảo bảng có các cột tên: 'Tên hiển thị' / 'Tên khách hàng', 'Mã khách hàng', 'Tên tiếng anh'.",
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
        if (res.error) errors.push(`[${row.name}] ${res.error}`);
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

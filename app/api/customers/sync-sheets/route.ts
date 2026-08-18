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

  // Positional fallbacks
  if (displayNameIdx < 0 && fullNameIdx < 0) {
    fullNameIdx = 1;
    displayNameIdx = 2;
  }
  if (codeIdx < 0) codeIdx = 0;
  if (engIdx < 0 && headerRow.length > 5) engIdx = 5;

  const result: SheetRow[] = [];
  
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const displayName = String(row[displayNameIdx] ?? "").trim();
    const fullName = String(row[fullNameIdx] ?? "").trim();
    const name = displayName || fullName;
    if (!name) continue;

    const rawCode = String(row[codeIdx] ?? "").trim();
    const code = rawCode || `AUTO-${i}`;
    const ten_tieng_anh = engIdx >= 0 ? String(row[engIdx] ?? "").trim() : "";

    result.push({ code, name, ten_tieng_anh });
  }

  return result;
}

// Fetch via Real Google User OAuth 2.0
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

  // Auto-detect refresh token (starts with "1//")
  if (aToken && (aToken.startsWith("1//") || aToken.startsWith("1/"))) {
    rToken = aToken;
    aToken = undefined;
  }

  oauth2Client.setCredentials({
    access_token: aToken || undefined,
    refresh_token: rToken || undefined,
  });

  // If refresh token available, exchange for fresh access token
  if (rToken && clientId && clientSecret) {
    try {
      const tokenRes = await oauth2Client.getAccessToken();
      if (tokenRes?.token) {
        oauth2Client.setCredentials({
          access_token: tokenRes.token,
          refresh_token: rToken,
        });
      }
    } catch (refreshErr: any) {
      console.error("Error refreshing token:", refreshErr?.message);
      // Continue with whatever token we have
    }
  }

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A1:Z2000",
  });

  return extractRowsFromValues(response.data.values || []);
}

// Fetch via Service Account JWT (legacy support)
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

function getCsvUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (url.includes("/pub?") || url.endsWith("&output=csv") || url.endsWith("output=csv")) {
    return url;
  }
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const spreadsheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
  }
  return url;
}

// ============================================================
// POST: Sync with SSE streaming progress (X / Y format)
// ============================================================
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
      data: rawRows,
      stream, // if true → SSE streaming response
    } = body;

    let rowsToProcess: SheetRow[] = [];

    // Case 1: Direct JSON rows
    if (Array.isArray(rawRows) && rawRows.length > 0) {
      rowsToProcess = rawRows.map((r, i) => {
        const displayName = String(r["Tên Hiển Thị"] || r["Tên hiển thị"] || r.ten_hien_thi || "").trim();
        const fullName = String(r["Tên Khách Hàng"] || r["Tên khách hàng"] || r.name || "").trim();
        const name = displayName || fullName;
        const code = String(r["Mã Khách Hàng"] || r["Mã khách hàng"] || r.code || `AUTO-${i + 1}`).trim();
        const ten_tieng_anh = String(r["Tên Tiếng Anh"] || r.ten_tieng_anh || "").trim();
        return { code, name, ten_tieng_anh };
      }).filter(r => r.name);
    }
    // Case 2: Google User OAuth 2.0
    else if (sheetUrl && (userAccessToken || userRefreshToken)) {
      const spreadsheetId = extractSpreadsheetId(sheetUrl);
      if (!spreadsheetId) {
        return NextResponse.json({ success: false, error: "Không thể nhận diện Spreadsheet ID từ link Google Sheet." }, { status: 400 });
      }
      try {
        rowsToProcess = await fetchFromGoogleSheetsAPIUserOAuth(
          spreadsheetId, userAccessToken, userRefreshToken, userClientId, userClientSecret
        );
      } catch (authErr: any) {
        const msg = authErr?.message || String(authErr);
        console.error("Google User OAuth Error:", msg);
        return NextResponse.json({
          success: false,
          error: `Lỗi xác thực Google User: ${msg}`,
        }, { status: 400 });
      }
    }
    // Case 3: Service Account
    else if (sheetUrl && clientEmail && privateKey) {
      const spreadsheetId = extractSpreadsheetId(sheetUrl);
      if (!spreadsheetId) {
        return NextResponse.json({ success: false, error: "Không thể nhận diện Spreadsheet ID từ link Google Sheet." }, { status: 400 });
      }
      try {
        rowsToProcess = await fetchFromGoogleSheetsAPIServiceAccount(spreadsheetId, clientEmail, privateKey);
      } catch (authErr: any) {
        return NextResponse.json({
          success: false,
          error: `Lỗi xác thực Service Account: ${authErr?.message}`,
        }, { status: 400 });
      }
    }
    // Case 4: Public CSV fallback
    else if (sheetUrl) {
      const csvUrl = getCsvUrl(sheetUrl);
      const res = await fetch(csvUrl, { cache: "no-store" });
      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Không thể kết nối đến Google Sheet (HTTP ${res.status}). Vui lòng cấu hình Token Google User.`,
        }, { status: 400 });
      }
      const csvText = await res.text();
      rowsToProcess = extractRowsFromValues(
        csvText.split(/\r?\n/).filter(l => l.trim()).map(line => line.split(",").map(v => v.trim().replace(/^"|"$/g, "")))
      );
    } else {
      return NextResponse.json({ success: false, error: "Vui lòng cung cấp sheetUrl hoặc data." }, { status: 400 });
    }

    if (rowsToProcess.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Không tìm thấy dữ liệu hợp lệ trong Google Sheet. Kiểm tra các cột: 'Tên Hiển Thị', 'Mã Khách Hàng', 'Tên Tiếng Anh'.",
      }, { status: 400 });
    }

    const total = rowsToProcess.length;

    // ── SSE Streaming Mode ──────────────────────────────────────
    if (stream) {
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          const send = (obj: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          };

          send({ type: "start", total });

          let created = 0, updated = 0, errors = 0;

          for (let i = 0; i < rowsToProcess.length; i++) {
            const row = rowsToProcess[i];
            send({ type: "progress", processed: i, total, name: row.name });

            try {
              const res = await upsertCustomerFromImport(row);
              if (res.success) {
                if (res.action === "created") created++;
                else updated++;
              } else {
                errors++;
              }
            } catch {
              errors++;
            }
          }

          send({ type: "done", total, created, updated, errors });
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // ── Normal (non-streaming) Mode ─────────────────────────────
    let createdCount = 0, updatedCount = 0, errorCount = 0;
    const errorDetails: string[] = [];

    for (const row of rowsToProcess) {
      try {
        const res = await upsertCustomerFromImport(row);
        if (res.success) {
          if (res.action === "created") createdCount++;
          else updatedCount++;
        } else {
          errorCount++;
          if (res.error) errorDetails.push(`[${row.name}] ${res.error}`);
        }
      } catch (rowErr: any) {
        errorCount++;
        errorDetails.push(`[${row.name}] ${rowErr?.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      total,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      errorDetails,
      lastSyncedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("sync-sheets error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

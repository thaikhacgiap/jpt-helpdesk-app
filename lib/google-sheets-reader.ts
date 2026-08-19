export interface FetchSheetOptions {
  spreadsheetId: string;
  sheetName: string;
  userAccessToken?: string;
  userRefreshToken?: string;
  userClientId?: string;
  userClientSecret?: string;
}

export interface FetchSheetResult {
  success: boolean;
  rows: string[][];
  error?: string;
  statusCode?: number;
}

// Parse CSV text handling multiline and quotes
export function parseCsvToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

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
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === '\r') {
        // Ignore CR
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c !== "")) {
          rows.push(currentRow);
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
    if (currentRow.some(c => c !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

async function refreshUserAccessToken(
  refreshToken: string,
  clientId?: string,
  clientSecret?: string
): Promise<string> {
  const effectiveClientId =
    clientId?.trim() ||
    process.env.GOOGLE_DRIVE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";
  const effectiveClientSecret =
    clientSecret?.trim() ||
    process.env.GOOGLE_DRIVE_CLIENT_SECRET ||
    "";

  if (!effectiveClientId || !effectiveClientSecret) {
    throw new Error("Thiếu Google Client ID hoặc Client Secret để làm mới token.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: effectiveClientId,
      client_secret: effectiveClientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Làm mới Access Token thất bại: ${data.error_description || data.error || res.statusText}`
    );
  }

  return data.access_token;
}

/**
 * Tự động đọc dữ liệu Google Sheet qua đa phương thức (OAuth Sheets API, Public GViz, Public CSV Export)
 */
export async function fetchGoogleSheetRows(options: FetchSheetOptions): Promise<FetchSheetResult> {
  const {
    spreadsheetId,
    sheetName,
    userAccessToken,
    userRefreshToken,
    userClientId,
    userClientSecret,
  } = options;

  let token = userAccessToken?.trim() || "";

  // 1. Nếu có token hoặc refresh token, thử gọi Sheets API v4
  if (token || userRefreshToken?.trim()) {
    try {
      if (!token && userRefreshToken?.trim()) {
        token = await refreshUserAccessToken(userRefreshToken.trim(), userClientId, userClientSecret);
      }

      let sheetsRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:AZ5000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (sheetsRes.status === 401 && userRefreshToken?.trim()) {
        try {
          token = await refreshUserAccessToken(userRefreshToken.trim(), userClientId, userClientSecret);
          sheetsRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:AZ5000`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch {}
      }

      if (sheetsRes.ok) {
        const sheetData = await sheetsRes.json();
        const rawRows: string[][] = sheetData.values || [];
        return { success: true, rows: rawRows };
      }
    } catch (err) {
      console.warn("Sheets API v4 error, trying fallback methods:", err);
    }
  }

  // 2. Thử tải qua GViz CSV API (Dành cho sheet công khai hoặc được chia sẻ link)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const gvizRes = await fetch(gvizUrl, { headers });
    if (gvizRes.ok) {
      const csvText = await gvizRes.text();
      // Check if returned valid CSV data rather than an HTML login error page
      if (csvText && !csvText.includes("<!DOCTYPE html") && !csvText.includes("<html")) {
        const rows = parseCsvToRows(csvText);
        if (rows.length > 0) {
          return { success: true, rows };
        }
      }
    }
  } catch (err) {
    console.warn("GViz fetch failed:", err);
  }

  // 3. Thử tải qua Google Export CSV API
  try {
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const exportRes = await fetch(exportUrl, { headers });
    if (exportRes.ok) {
      const csvText = await exportRes.text();
      if (csvText && !csvText.includes("<!DOCTYPE html") && !csvText.includes("<html")) {
        const rows = parseCsvToRows(csvText);
        if (rows.length > 0) {
          return { success: true, rows };
        }
      }
    }
  } catch (err) {
    console.warn("Export CSV fetch failed:", err);
  }

  // 4. Nếu tất cả các phương thức đều thất bại
  return {
    success: false,
    rows: [],
    statusCode: 401,
    error: `Không thể truy cập Google Sheet (tab "${sheetName}").\n\n` +
      `💡 Hướng dẫn khắc phục nhanh:\n` +
      `1. Mở file Google Sheet của bạn trên trình duyệt.\n` +
      `2. Nhấn nút "Chia sẻ" (Share) ở góc trên bên phải.\n` +
      `3. Tại mục "Quyền truy cập chung", đổi thành: "Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with the link can view).\n` +
      `4. Kiểm tra chắc chắn tên tab dưới cùng là "${sheetName}".\n` +
      `5. Quay lại đây và nhấn "Kiểm tra thay đổi" / "Tiến hành đồng bộ".`
  };
}

import { NextRequest, NextResponse } from "next/server";
import { upsertCustomerFromImport } from "@/lib/customer-operations";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

interface SheetRow {
  code: string;
  name: string;
  ten_tieng_anh?: string;
}

interface DiffRow {
  code: string;
  name: string;
  ten_tieng_anh?: string;
  // For changed rows - show what's different
  old_name?: string;
  old_ten_tieng_anh?: string;
}

// ─── Extract Spreadsheet ID ───────────────────────────────────
function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// ─── Smart header + column mapping ───────────────────────────
function extractRowsFromValues(rows: any[][]): SheetRow[] {
  if (!rows || rows.length < 1) return [];

  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const text = (rows[r] || []).map((c: any) => String(c || "").toLowerCase()).join(" ");
    if (text.includes("tên") || text.includes("mã") || text.includes("khách hàng") || text.includes("name") || text.includes("code")) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rows[headerRowIdx] || [];
  const headers = headerRow.map((h: any) => String(h || "").trim().toLowerCase());
  const idx = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

  let codeIdx      = idx(["mã khách hàng", "ma khach hang", "code", "mã kh"]);
  let fullNameIdx  = idx(["tên khách hàng", "ten khach hang", "tên công ty", "ten cong ty"]);
  let displayIdx   = idx(["tên hiển thị", "ten hien thi", "name"]);
  let engIdx       = idx(["tên tiếng anh", "ten tieng anh", "english name", "name_en"]);

  // Positional fallbacks for Account sheet: A=Code, B=TênKH, C=TênHiểnThị
  if (codeIdx < 0)     codeIdx = 0;
  if (fullNameIdx < 0) fullNameIdx = 1;
  if (displayIdx < 0)  displayIdx = 2;

  const result: SheetRow[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const fullName = String(row[fullNameIdx] ?? "").trim();
    const displayName = String(row[displayIdx] ?? "").trim();
    const name = fullName || displayName;
    if (!name) continue;

    const code = String(row[codeIdx] ?? "").trim() || `AUTO-${i}`;
    const ten_tieng_anh = engIdx >= 0 ? String(row[engIdx] ?? "").trim() : "";
    result.push({ code, name, ten_tieng_anh });
  }
  return result;
}

// ─── Fetch helpers ────────────────────────────────────────────
async function fetchSheetRows(body: any): Promise<SheetRow[]> {
  const { sheetUrl, sheetName, clientEmail, privateKey,
          userAccessToken, userRefreshToken, userClientId, userClientSecret,
          data: rawRows } = body;

  // Case 1: Direct JSON
  if (Array.isArray(rawRows) && rawRows.length > 0) {
    return rawRows.map((r: any, i: number) => ({
      code: String(r["Mã Khách Hàng"] || r["Mã khách hàng"] || r.code || `AUTO-${i + 1}`).trim(),
      name: String(r["Tên Khách Hàng"] || r["Tên khách hàng"] || r["Tên Hiển Thị"] || r.name || "").trim(),
      ten_tieng_anh: String(r["Tên Tiếng Anh"] || r.ten_tieng_anh || "").trim(),
    })).filter((r: SheetRow) => r.name);
  }

  const spreadsheetId = sheetUrl ? extractSpreadsheetId(sheetUrl) : null;
  if (!spreadsheetId) throw new Error("Không thể nhận diện Spreadsheet ID từ link Google Sheet.");

  const range = sheetName ? `${sheetName}!A1:Z2000` : "A1:Z2000";

  // Case 2: Google User OAuth 2.0
  if (userAccessToken || userRefreshToken) {
    const oauth2Client = new google.auth.OAuth2(userClientId || undefined, userClientSecret || undefined);
    let rToken = (userRefreshToken || "").trim();
    let aToken = (userAccessToken || "").trim();
    if (aToken && (aToken.startsWith("1//") || aToken.startsWith("1/"))) { rToken = aToken; aToken = ""; }
    oauth2Client.setCredentials({ access_token: aToken || undefined, refresh_token: rToken || undefined });
    if (rToken && userClientId && userClientSecret) {
      try {
        const t = await oauth2Client.getAccessToken();
        if (t?.token) oauth2Client.setCredentials({ access_token: t.token, refresh_token: rToken });
      } catch {}
    }
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return extractRowsFromValues(res.data.values || []);
  }

  // Case 3: Service Account
  if (clientEmail && privateKey) {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return extractRowsFromValues(res.data.values || []);
  }

  throw new Error("Chưa cấu hình phương thức xác thực (Token hoặc Service Account).");
}

// ─── Fetch current DB customers ───────────────────────────────
async function fetchDbCustomers(): Promise<Array<{ id: string; code: string; name: string; ten_tieng_anh: string }>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from("customers")
    .select("id, code, name, ten_tieng_anh");
  if (error) throw new Error("Không thể đọc dữ liệu từ Supabase: " + error.message);
  return (data || []).map((r: any) => ({
    id: r.id,
    code: r.code || "",
    name: r.name || "",
    ten_tieng_anh: r.ten_tieng_anh || "",
  }));
}

// ─── Compare Sheet vs DB ──────────────────────────────────────
function normalize(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function computeDiff(sheetRows: SheetRow[], dbRows: Array<{ id: string; code: string; name: string; ten_tieng_anh: string }>) {
  // Build lookup maps with normalized keys
  const dbByCode = new Map(dbRows.map(r => [normalize(r.code), r]));
  const dbByName = new Map(dbRows.map(r => [normalize(r.name), r]));
  // Track which DB IDs are matched by sheet data
  const matchedDbIds = new Set<string>();

  const toAdd: SheetRow[] = [];
  const toUpdate: DiffRow[] = [];

  for (const row of sheetRows) {
    const normCode = normalize(row.code);
    const normName = normalize(row.name);
    const isAutoCode = normCode.startsWith("auto-") || normCode === "";

    // Try matching: code first (if real code), then name
    let dbRow = (!isAutoCode ? dbByCode.get(normCode) : undefined) ?? dbByName.get(normName);

    if (!dbRow) {
      toAdd.push(row);
    } else {
      matchedDbIds.add(dbRow.id);
      const nameChanged = normalize(dbRow.name) !== normName;
      const engChanged = normalize(dbRow.ten_tieng_anh || "") !== normalize(row.ten_tieng_anh || "");
      const codeChanged = !isAutoCode && normalize(dbRow.code) !== normCode;
      if (nameChanged || engChanged || codeChanged) {
        toUpdate.push({ ...row, old_name: dbRow.name, old_ten_tieng_anh: dbRow.ten_tieng_anh });
      }
    }
  }

  // Removed: in DB but not matched by any sheet row
  const toRemove = dbRows.filter(r => !matchedDbIds.has(r.id)).map(r => ({ id: r.id, code: r.code, name: r.name }));

  return { toAdd, toUpdate, toRemove };
}

// ─── POST Handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode = "sync" } = body; // "preview" | "sync_diff" | "sync" (default)

    // ── PREVIEW MODE: compare Sheet vs DB, return diff ──────────
    if (mode === "preview") {
      let sheetRows: SheetRow[];
      try {
        sheetRows = await fetchSheetRows(body);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }

      if (sheetRows.length === 0) {
        return NextResponse.json({ success: false, error: "Không tìm thấy dữ liệu hợp lệ trong Google Sheet." }, { status: 400 });
      }

      let dbRows;
      try {
        dbRows = await fetchDbCustomers();
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }

      const { toAdd, toUpdate, toRemove } = computeDiff(sheetRows, dbRows);

      return NextResponse.json({
        success: true,
        preview: true,
        sheetTotal: sheetRows.length,
        dbTotal: dbRows.length,
        diff: {
          add: { count: toAdd.length, rows: toAdd.slice(0, 20) },         // preview first 20
          update: { count: toUpdate.length, rows: toUpdate.slice(0, 20) },
          remove: { count: toRemove.length, rows: toRemove.slice(0, 20) },
        },
        noChanges: toAdd.length === 0 && toUpdate.length === 0 && toRemove.length === 0,
      });
    }

    // ── SYNC DIFF MODE: re-run diff, write only changed rows (SSE) ──
    if (mode === "sync_diff") {
      let sheetRows: SheetRow[];
      try {
        sheetRows = await fetchSheetRows(body);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }

      let dbRows;
      try {
        dbRows = await fetchDbCustomers();
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }

      const { toAdd, toUpdate, toRemove } = computeDiff(sheetRows, dbRows);
      const rowsToSync = [...toAdd, ...toUpdate];
      const total = rowsToSync.length + toRemove.length;

      if (total === 0) {
        return NextResponse.json({ success: true, total: 0, created: 0, updated: 0, removed: 0, message: "Không có thay đổi để đồng bộ." });
      }

      // SSE streaming
      const { stream } = body;
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const send = (obj: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          };

          send({ type: "start", total, toAdd: toAdd.length, toUpdate: toUpdate.length, toRemove: toRemove.length });

          let created = 0, updated = 0, removed = 0, errors = 0;
          let processed = 0;

          // Upsert new + changed rows
          for (const row of rowsToSync) {
            send({ type: "progress", processed, total, name: row.name });
            try {
              const res = await upsertCustomerFromImport(row);
              if (res.success) {
                if (res.action === "created") created++;
                else updated++;
              } else errors++;
            } catch { errors++; }
            processed++;
          }

          // Mark removed rows as Inactive (soft delete)
          for (const row of toRemove) {
            send({ type: "progress", processed, total, name: `[Xóa] ${row.name}` });
            try {
              const { error } = await supabase
                .from("customers")
                .update({ tinh_trang: "Inactive" })
                .eq("id", row.id);
              if (!error) removed++;
              else errors++;
            } catch { errors++; }
            processed++;
          }

          send({ type: "done", total, created, updated, removed, errors });
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

    // ── DEFAULT SYNC MODE (full sync, SSE) ───────────────────────
    let rowsToProcess: SheetRow[];
    try {
      rowsToProcess = await fetchSheetRows(body);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    if (rowsToProcess.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Không tìm thấy dữ liệu hợp lệ trong Google Sheet. Kiểm tra cột: 'Tên Khách Hàng', 'Mã Khách Hàng'.",
      }, { status: 400 });
    }

    const total = rowsToProcess.length;
    const { stream } = body;

    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const send = (obj: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          send({ type: "start", total });
          let created = 0, updated = 0, errors = 0;
          for (let i = 0; i < rowsToProcess.length; i++) {
            const row = rowsToProcess[i];
            send({ type: "progress", processed: i, total, name: row.name });
            try {
              const res = await upsertCustomerFromImport(row);
              if (res.success) { if (res.action === "created") created++; else updated++; }
              else errors++;
            } catch { errors++; }
          }
          send({ type: "done", total, created, updated, errors });
          controller.close();
        },
      });
      return new Response(readable, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      });
    }

    // Non-streaming fallback
    let createdCount = 0, updatedCount = 0, errorCount = 0;
    for (const row of rowsToProcess) {
      try {
        const res = await upsertCustomerFromImport(row);
        if (res.success) { if (res.action === "created") createdCount++; else updatedCount++; }
        else errorCount++;
      } catch { errorCount++; }
    }

    return NextResponse.json({ success: true, total, created: createdCount, updated: updatedCount, errors: errorCount, lastSyncedAt: new Date().toISOString() });

  } catch (err: any) {
    console.error("sync-sheets error:", err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

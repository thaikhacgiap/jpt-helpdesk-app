import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export interface OppSheetRow {
  code: string;
  name: string;
  customer_code?: string;
  customer_name?: string;
  giai_doan?: string;
  gia_tri?: string;
  xac_suat?: string;
  ngay_du_kien?: string;
  ttkd?: string;
  phu_trach?: string;
  ghi_chu?: string;
}

export interface OppDiffRow extends OppSheetRow {
  dbId: string;
  old_name?: string;
}

export interface SyncErrorItem {
  type: "insert" | "update";
  name: string;
  code?: string;
  message: string;
  detail?: string;
}

function getAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function norm(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function sanitizeCode(rawCode: string, fallbackCode: string): string {
  let c = (rawCode || "").trim().toUpperCase();
  if (!c || c.startsWith("AUTO-")) return fallbackCode;
  return c.slice(0, 48);
}

// ─── Deduplicate Opportunity Sheet Rows ───────────────────────
function deduplicateOppSheetRows(rows: OppSheetRow[]): OppSheetRow[] {
  const byCode = new Map<string, OppSheetRow>();
  const byName = new Map<string, OppSheetRow>();
  const result: OppSheetRow[] = [];

  for (const row of rows) {
    const isAuto = !row.code || row.code.toUpperCase().startsWith("AUTO-");
    const sanitizedCode = sanitizeCode(row.code, isAuto ? "" : row.code);
    const nc = norm(sanitizedCode);
    const nn = norm(row.name);

    const existingByName = byName.get(nn);
    if (existingByName) {
      if (!existingByName.customer_name && row.customer_name) existingByName.customer_name = row.customer_name;
      if (!existingByName.gia_tri && row.gia_tri) existingByName.gia_tri = row.gia_tri;
      if (!existingByName.giai_doan && row.giai_doan) existingByName.giai_doan = row.giai_doan;
      if (!existingByName.phu_trach && row.phu_trach) existingByName.phu_trach = row.phu_trach;
      continue;
    }

    if (!isAuto && nc) {
      const existingByCode = byCode.get(nc);
      if (existingByCode) {
        continue;
      }
      byCode.set(nc, row);
    }

    byName.set(nn, row);
    result.push(row);
  }

  return result;
}

// ─── Smart Header Parsing for Opportunity Sheet ───────────────
function extractOppRowsFromValues(rows: any[][]): OppSheetRow[] {
  if (!rows || rows.length < 1) return [];

  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const text = (rows[r] || []).map((c: any) => String(c || "").toLowerCase()).join(" ");
    if (text.includes("cơ hội") || text.includes("tên") || text.includes("mã") || text.includes("khách") || text.includes("giai đoạn") || text.includes("opportunity")) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rows[headerRowIdx] || [];
  const headers = headerRow.map((h: any) => String(h || "").trim().toLowerCase());
  const idx = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

  let codeIdx         = idx(["mã cơ hội", "ma co hoi", "mã dự án", "ma du an", "mã ch", "code"]);
  let nameIdx         = idx(["tên cơ hội", "ten co hoi", "tên dự án", "ten du an", "opportunity", "name"]);
  let custNameIdx     = idx(["khách hàng", "khach hang", "tên khách hàng", "ten khach hang", "customer"]);
  let custCodeIdx     = idx(["mã kh", "ma kh", "mã khách", "ma khach"]);
  let stageIdx        = idx(["giai đoạn", "giai doan", "trạng thái", "stage", "status"]);
  let valueIdx        = idx(["giá trị", "gia tri", "doanh số", "doanh so", "value", "tiền"]);
  let probIdx         = idx(["xác suất", "xac suat", "probability", "%"]);
  let closeDateIdx    = idx(["ngày dự kiến", "ngay du kien", "dự kiến", "close date", "ngày chốt"]);
  let ttkdIdx         = idx(["ttkd", "trung tâm kinh doanh", "bộ phận"]);
  let salesIdx        = idx(["phụ trách", "phu trach", "sales", "người phụ trách", "nhân viên"]);
  let noteIdx         = idx(["ghi chú", "ghi chu", "note"]);

  // Fallbacks by column position if not matched: A=Code, B=Name, C=Customer, D=Stage, E=Value, F=Sales
  if (codeIdx < 0)     codeIdx = 0;
  if (nameIdx < 0)     nameIdx = headerRow.length > 1 ? 1 : 0;
  if (custNameIdx < 0 && headerRow.length > 2) custNameIdx = 2;
  if (stageIdx < 0 && headerRow.length > 3)    stageIdx = 3;
  if (valueIdx < 0 && headerRow.length > 4)    valueIdx = 4;
  if (salesIdx < 0 && headerRow.length > 5)    salesIdx = 5;

  const rawList: OppSheetRow[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = String(row[nameIdx] ?? "").trim();
    if (!name) continue;

    const rawCode = codeIdx >= 0 ? String(row[codeIdx] ?? "").trim() : "";
    const code = rawCode || `OPP-${i}`;
    const customer_name = custNameIdx >= 0 ? String(row[custNameIdx] ?? "").trim() : "";
    const customer_code = custCodeIdx >= 0 ? String(row[custCodeIdx] ?? "").trim() : "";
    const giai_doan = stageIdx >= 0 ? String(row[stageIdx] ?? "").trim() : "Tiềm năng";
    const gia_tri = valueIdx >= 0 ? String(row[valueIdx] ?? "").trim() : "";
    const xac_suat = probIdx >= 0 ? String(row[probIdx] ?? "").trim() : "";
    const ngay_du_kien = closeDateIdx >= 0 ? String(row[closeDateIdx] ?? "").trim() : "";
    const ttkd = ttkdIdx >= 0 ? String(row[ttkdIdx] ?? "").trim() : "";
    const phu_trach = salesIdx >= 0 ? String(row[salesIdx] ?? "").trim() : "";
    const ghi_chu = noteIdx >= 0 ? String(row[noteIdx] ?? "").trim() : "";

    rawList.push({
      code,
      name,
      customer_code,
      customer_name,
      giai_doan,
      gia_tri,
      xac_suat,
      ngay_du_kien,
      ttkd,
      phu_trach,
      ghi_chu,
    });
  }

  return deduplicateOppSheetRows(rawList);
}

// ─── Fetch Sheet Rows ─────────────────────────────────────────
async function fetchOppSheetRows(body: any): Promise<OppSheetRow[]> {
  const { sheetUrl, sheetName, userAccessToken, userRefreshToken, userClientId, userClientSecret, data: rawRows } = body;

  if (Array.isArray(rawRows) && rawRows.length > 0) {
    const rawList = rawRows.map((r: any, i: number) => ({
      code: String(r["Mã Cơ Hội"] || r["Mã cơ hội"] || r.code || `OPP-${i + 1}`).trim(),
      name: String(r["Tên Cơ Hội"] || r["Tên cơ hội"] || r.name || "").trim(),
      customer_name: String(r["Khách Hàng"] || r["Khách hàng"] || r.customer_name || "").trim(),
      customer_code: String(r["Mã Khách Hàng"] || r["Mã KH"] || r.customer_code || "").trim(),
      giai_doan: String(r["Giai Đoạn"] || r["Giai đoạn"] || r.giai_doan || "Tiềm năng").trim(),
      gia_tri: String(r["Giá Trị"] || r["Giá trị"] || r.gia_tri || "").trim(),
      xac_suat: String(r["Xác Suất"] || r["Xác suất"] || r.xac_suat || "").trim(),
      ngay_du_kien: String(r["Ngày Dự Kiến"] || r["Ngày dự kiến"] || r.ngay_du_kien || "").trim(),
      ttkd: String(r["TTKD"] || r.ttkd || "").trim(),
      phu_trach: String(r["Người Phụ Trách"] || r["Phụ trách"] || r.phu_trach || "").trim(),
      ghi_chu: String(r["Ghi Chú"] || r["Ghi chú"] || r.ghi_chu || "").trim(),
    })).filter((r: OppSheetRow) => r.name);
    return deduplicateOppSheetRows(rawList);
  }

  const spreadsheetId = sheetUrl ? extractSpreadsheetId(sheetUrl) : null;
  if (!spreadsheetId) throw new Error("Không thể nhận diện Spreadsheet ID từ link Google Sheet.");

  const targetTab = sheetName || "Opportunity";
  const range = `${targetTab}!A1:Z3000`;

  if (userAccessToken || userRefreshToken) {
    const oauth2Client = new google.auth.OAuth2(userClientId || undefined, userClientSecret || undefined);
    let rToken = (userRefreshToken || "").trim();
    let aToken = (userAccessToken || "").trim();
    if (aToken && (aToken.startsWith("1//") || aToken.startsWith("1/"))) { rToken = aToken; aToken = ""; }
    oauth2Client.setCredentials({ access_token: aToken || undefined, refresh_token: rToken || undefined });
    if (rToken && userClientId && userClientSecret) {
      try { const t = await oauth2Client.getAccessToken(); if (t?.token) oauth2Client.setCredentials({ access_token: t.token, refresh_token: rToken }); } catch {}
    }
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      return extractOppRowsFromValues(res.data.values || []);
    } catch (sheetErr: any) {
      // Fallback: search for sheet tab with opportunity in name
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const found = (meta.data.sheets || []).find(s => s.properties?.title?.toLowerCase().includes("opp"));
      if (found?.properties?.title) {
        const res2 = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${found.properties.title}!A1:Z3000` });
        return extractOppRowsFromValues(res2.data.values || []);
      }
      throw sheetErr;
    }
  }

  throw new Error("Chưa cấu hình Token xác thực tài khoản Google.");
}

// ─── Fetch All DB Opportunities ───────────────────────────────
async function fetchAllDbOpportunities(admin: SupabaseClient) {
  try {
    const { data, error } = await admin
      .from("opportunities")
      .select("id, code, name, customer_code, customer_name, giai_doan, gia_tri, xac_suat, ngay_du_kien, ttkd, phu_trach, ghi_chu, system_code");
    if (error) {
      console.warn("DB opportunities table not queryable, returning empty list:", error.message);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

// ─── Compute 1-Way Diff ───────────────────────────────────────
function computeOpp1WayDiff(sheetRows: OppSheetRow[], dbRows: any[]) {
  const dbByCode = new Map<string, any>();
  const dbByName = new Map<string, any>();

  for (const r of dbRows) {
    const nc = norm(r.code);
    if (nc && !dbByCode.has(nc)) dbByCode.set(nc, r);
    const nn = norm(r.name);
    if (nn && !dbByName.has(nn)) dbByName.set(nn, r);
  }

  const toAdd: OppSheetRow[] = [];
  const toUpdate: OppDiffRow[] = [];

  for (const row of sheetRows) {
    const isAuto = !row.code || row.code.toUpperCase().startsWith("AUTO-");
    const sanitizedCode = sanitizeCode(row.code, isAuto ? "" : row.code);
    const nc = norm(sanitizedCode);
    const nn = norm(row.name);

    const dbRow = (!isAuto && nc ? dbByCode.get(nc) : undefined) ?? dbByName.get(nn);

    if (!dbRow) {
      toAdd.push(row);
    } else {
      const nameChanged = norm(dbRow.name) !== nn;
      const stageChanged = norm(dbRow.giai_doan || "") !== norm(row.giai_doan || "");
      const valueChanged = norm(dbRow.gia_tri || "") !== norm(row.gia_tri || "");
      const custChanged = norm(dbRow.customer_name || "") !== norm(row.customer_name || "");
      const salesChanged = norm(dbRow.phu_trach || "") !== norm(row.phu_trach || "");

      if (nameChanged || stageChanged || valueChanged || custChanged || salesChanged) {
        toUpdate.push({
          ...row,
          dbId: dbRow.id,
          old_name: dbRow.name,
        });
      }
    }
  }

  return { toAdd, toUpdate };
}

// ─── Execute 1-Way Sync ───────────────────────────────────────
async function executeOppSync(
  admin: SupabaseClient,
  toAdd: OppSheetRow[],
  toUpdate: OppDiffRow[],
  onProgress: (processed: number, total: number, name: string, created: number, updated: number, errors: number, errorItem?: SyncErrorItem) => void
): Promise<{ created: number; updated: number; errors: number; errorLog: SyncErrorItem[] }> {
  const total = toAdd.length + toUpdate.length;
  let processed = 0, created = 0, updated = 0, errors = 0;
  const errorLog: SyncErrorItem[] = [];

  let sysCodeCounter: number | null = null;
  const getNextSysCodeFast = async () => {
    if (sysCodeCounter === null) {
      const { data } = await admin.from("opportunities").select("system_code").not("system_code", "is", null);
      const nums = (data || []).map((r: any) => parseInt((r.system_code || "").replace("CH-", "").replace("OPP-", ""), 10)).filter((n: number) => !isNaN(n));
      sysCodeCounter = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    }
    const code = `CH-${String(sysCodeCounter!).padStart(3, "0")}`;
    sysCodeCounter!++;
    return code;
  };

  // 1. INSERT
  for (const row of toAdd) {
    onProgress(processed, total, row.name, created, updated, errors);
    try {
      const system_code = await getNextSysCodeFast();
      let code = sanitizeCode(row.code, system_code);

      const payload = {
        system_code,
        code,
        name: row.name.trim(),
        customer_code: row.customer_code || null,
        customer_name: row.customer_name || null,
        giai_doan: row.giai_doan || "Tiềm năng",
        gia_tri: row.gia_tri || null,
        xac_suat: row.xac_suat || null,
        ngay_du_kien: row.ngay_du_kien || null,
        ttkd: row.ttkd || null,
        phu_trach: row.phu_trach || null,
        ghi_chu: row.ghi_chu || null,
        tinh_trang: "Active",
      };

      const { error: insErr } = await admin.from("opportunities").insert([payload]);
      if (insErr) {
        // Fallback update if code exists
        const { error: retryUpd } = await admin.from("opportunities").update(payload).eq("code", code);
        if (retryUpd) {
          const errItem: SyncErrorItem = {
            type: "insert",
            name: row.name,
            code,
            message: `Lỗi thêm mới cơ hội vào database`,
            detail: insErr.message,
          };
          errorLog.push(errItem);
          errors++;
          onProgress(processed, total, row.name, created, updated, errors, errItem);
        } else {
          updated++;
        }
      } else {
        created++;
      }
    } catch (e: any) {
      const errItem: SyncErrorItem = {
        type: "insert",
        name: row.name,
        code: row.code,
        message: `Ngoại lệ khi thêm cơ hội`,
        detail: e.message || String(e),
      };
      errorLog.push(errItem);
      errors++;
      onProgress(processed, total, row.name, created, updated, errors, errItem);
    }
    processed++;
  }

  // 2. UPDATE
  for (const row of toUpdate) {
    onProgress(processed, total, row.name, created, updated, errors);
    try {
      const targetId = row.dbId;
      const payload = {
        name: row.name.trim(),
        customer_code: row.customer_code || null,
        customer_name: row.customer_name || null,
        giai_doan: row.giai_doan || "Tiềm năng",
        gia_tri: row.gia_tri || null,
        xac_suat: row.xac_suat || null,
        ngay_du_kien: row.ngay_du_kien || null,
        ttkd: row.ttkd || null,
        phu_trach: row.phu_trach || null,
        ghi_chu: row.ghi_chu || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updErr } = await admin.from("opportunities").update(payload).eq("id", targetId);
      if (updErr) {
        const errItem: SyncErrorItem = {
          type: "update",
          name: row.name,
          code: row.code,
          message: `Lỗi cập nhật cơ hội [ID: ${targetId}]`,
          detail: updErr.message,
        };
        errorLog.push(errItem);
        errors++;
        onProgress(processed, total, row.name, created, updated, errors, errItem);
      } else {
        updated++;
      }
    } catch (e: any) {
      const errItem: SyncErrorItem = {
        type: "update",
        name: row.name,
        code: row.code,
        message: `Ngoại lệ khi cập nhật cơ hội`,
        detail: e.message || String(e),
      };
      errorLog.push(errItem);
      errors++;
      onProgress(processed, total, row.name, created, updated, errors, errItem);
    }
    processed++;
  }

  return { created, updated, errors, errorLog };
}

// ─── POST Handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode = "sync" } = body;
    const admin = getAdmin();

    // ── PREVIEW MODE ─────────────────────────────────────────────
    if (mode === "preview") {
      let sheetRows: OppSheetRow[];
      try {
        sheetRows = await fetchOppSheetRows(body);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }

      if (!sheetRows.length) {
        return NextResponse.json({ success: false, error: "Không tìm thấy dữ liệu hợp lệ trong Google Sheet tab Opportunity." }, { status: 400 });
      }

      const dbRows = await fetchAllDbOpportunities(admin);
      const { toAdd, toUpdate } = computeOpp1WayDiff(sheetRows, dbRows);

      return NextResponse.json({
        success: true,
        preview: true,
        sheetTotal: sheetRows.length,
        dbTotal: dbRows.length,
        diff: {
          add: { count: toAdd.length, rows: toAdd.slice(0, 30) },
          update: { count: toUpdate.length, rows: toUpdate.slice(0, 30) },
        },
        noChanges: !toAdd.length && !toUpdate.length,
      });
    }

    // ── 1-WAY SYNC WITH SSE STREAMING ────────────────────────────
    let sheetRows: OppSheetRow[];
    try {
      sheetRows = await fetchOppSheetRows(body);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    if (!sheetRows.length) {
      return NextResponse.json({ success: false, error: "Không tìm thấy dữ liệu hợp lệ từ Google Sheet tab Opportunity." }, { status: 400 });
    }

    const dbRows = await fetchAllDbOpportunities(admin);
    const { toAdd, toUpdate } = computeOpp1WayDiff(sheetRows, dbRows);
    const total = toAdd.length + toUpdate.length;
    const lastSyncedAt = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");

    if (total === 0) {
      return NextResponse.json({
        success: true,
        total: sheetRows.length,
        created: 0,
        updated: 0,
        lastSyncedAt,
        message: "Dữ liệu Cơ hội trên Supabase đã hoàn toàn trùng khớp với Google Sheet.",
      });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const send = (obj: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        send({
          type: "start",
          total,
          toAdd: toAdd.length,
          toUpdate: toUpdate.length,
          sheetTotal: sheetRows.length,
        });

        const result = await executeOppSync(
          admin,
          toAdd,
          toUpdate,
          (processed, totalCount, name, created, updated, errors, errorItem) => {
            send({
              type: "progress",
              processed,
              total: totalCount,
              name,
              created,
              updated,
              errors,
              errorItem: errorItem || null,
            });
          }
        );

        send({
          type: "done",
          total: sheetRows.length,
          sheetTotal: sheetRows.length,
          lastSyncedAt,
          ...result,
        });
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
  } catch (err: any) {
    console.error("opportunity sync-sheets error:", err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

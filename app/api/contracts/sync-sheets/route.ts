import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export interface ContractSheetRow {
  code: string;
  contract_no?: string;
  name: string;
  contract_type?: string;
  customer_name?: string;
  signed_date?: string;
  start_date?: string;
  end_date?: string;
  value?: string;
  status?: string;
  owner_name?: string;
  ttkd?: string;
  description?: string;
}

export interface ContractDiffRow extends ContractSheetRow {
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

// ─── Deduplicate Contract Sheet Rows ──────────────────────────
function deduplicateContractSheetRows(rows: ContractSheetRow[]): ContractSheetRow[] {
  const byCode = new Map<string, ContractSheetRow>();
  const byName = new Map<string, ContractSheetRow>();
  const result: ContractSheetRow[] = [];

  for (const row of rows) {
    const isAuto = !row.code || row.code.toUpperCase().startsWith("AUTO-");
    const sanitizedCode = sanitizeCode(row.code, isAuto ? "" : row.code);
    const nc = norm(sanitizedCode);
    const nn = norm(row.name);

    const existingByName = byName.get(nn);
    if (existingByName) {
      if (!existingByName.contract_no && row.contract_no) existingByName.contract_no = row.contract_no;
      if (!existingByName.customer_name && row.customer_name) existingByName.customer_name = row.customer_name;
      if (!existingByName.value && row.value) existingByName.value = row.value;
      if (!existingByName.owner_name && row.owner_name) existingByName.owner_name = row.owner_name;
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

// ─── Smart Header Parsing for Contract Sheet ──────────────────
function extractContractRowsFromValues(rows: any[][]): ContractSheetRow[] {
  if (!rows || rows.length < 1) return [];

  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const text = (rows[r] || []).map((c: any) => String(c || "").toLowerCase()).join(" ");
    if (text.includes("hợp đồng") || text.includes("hop dong") || text.includes("contract") || text.includes("số hđ") || text.includes("mã hđ")) {
      headerRowIdx = r;
      break;
    }
  }

  const headerRow = rows[headerRowIdx] || [];
  const headers = headerRow.map((h: any) => String(h || "").trim().toLowerCase());
  const idx = (keys: string[]) => headers.findIndex((h: string) => keys.some(k => h.includes(k)));

  let codeIdx         = idx(["mã hợp đồng", "ma hop dong", "mã hđ", "ma hd", "code"]);
  let noIdx           = idx(["số hợp đồng", "so hop dong", "số hđ", "so hd", "contract no", "số"]);
  let nameIdx         = idx(["tên hợp đồng", "ten hop dong", "nội dung", "noi dung", "contract name", "tên"]);
  let typeIdx         = idx(["loại hợp đồng", "loai hop dong", "loại", "type"]);
  let custNameIdx     = idx(["khách hàng", "khach hang", "tên khách hàng", "customer"]);
  let signedDateIdx   = idx(["ngày ký", "ngay ky", "signed date"]);
  let startDateIdx    = idx(["ngày bắt đầu", "ngay bat dau", "hiệu lực", "start date"]);
  let endDateIdx      = idx(["ngày hết hạn", "ngay het han", "hết hạn", "end date"]);
  let valueIdx        = idx(["giá trị", "gia tri", "doanh số", "value", "tổng tiền"]);
  let statusIdx       = idx(["trạng thái", "trang thai", "tình trạng", "status"]);
  let salesIdx        = idx(["phụ trách", "phu trach", "owner", "sales", "người phụ trách"]);
  let ttkdIdx         = idx(["ttkd", "trung tâm kinh doanh"]);
  let noteIdx         = idx(["ghi chú", "ghi chu", "description", "mô tả"]);

  // Fallbacks by column position
  if (codeIdx < 0)     codeIdx = 0;
  if (nameIdx < 0)     nameIdx = headerRow.length > 1 ? 1 : 0;
  if (custNameIdx < 0 && headerRow.length > 2) custNameIdx = 2;
  if (valueIdx < 0 && headerRow.length > 3)    valueIdx = 3;
  if (salesIdx < 0 && headerRow.length > 4)    salesIdx = 4;

  const rawList: ContractSheetRow[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = String(row[nameIdx] ?? "").trim();
    if (!name) continue;

    const rawCode = codeIdx >= 0 ? String(row[codeIdx] ?? "").trim() : "";
    const code = rawCode || `CTR-${i}`;
    const contract_no = noIdx >= 0 ? String(row[noIdx] ?? "").trim() : "";
    const contract_type = typeIdx >= 0 ? String(row[typeIdx] ?? "").trim() : "Hợp đồng dịch vụ";
    const customer_name = custNameIdx >= 0 ? String(row[custNameIdx] ?? "").trim() : "";
    const signed_date = signedDateIdx >= 0 ? String(row[signedDateIdx] ?? "").trim() : "";
    const start_date = startDateIdx >= 0 ? String(row[startDateIdx] ?? "").trim() : "";
    const end_date = endDateIdx >= 0 ? String(row[endDateIdx] ?? "").trim() : "";
    const value = valueIdx >= 0 ? String(row[valueIdx] ?? "").trim() : "";
    const status = statusIdx >= 0 ? String(row[statusIdx] ?? "").trim() : "Active";
    const owner_name = salesIdx >= 0 ? String(row[salesIdx] ?? "").trim() : "";
    const ttkd = ttkdIdx >= 0 ? String(row[ttkdIdx] ?? "").trim() : "";
    const description = noteIdx >= 0 ? String(row[noteIdx] ?? "").trim() : "";

    rawList.push({
      code,
      contract_no,
      name,
      contract_type,
      customer_name,
      signed_date,
      start_date,
      end_date,
      value,
      status,
      owner_name,
      ttkd,
      description,
    });
  }

  return deduplicateContractSheetRows(rawList);
}

// ─── Fetch Contract Sheet Rows ────────────────────────────────
async function fetchContractSheetRows(body: any): Promise<ContractSheetRow[]> {
  const { sheetUrl, sheetName, userAccessToken, userRefreshToken, userClientId, userClientSecret, data: rawRows } = body;

  if (Array.isArray(rawRows) && rawRows.length > 0) {
    const rawList = rawRows.map((r: any, i: number) => ({
      code: String(r["Mã Hợp Đồng"] || r["Mã hợp đồng"] || r["Mã HĐ"] || r.code || `CTR-${i + 1}`).trim(),
      contract_no: String(r["Số Hợp Đồng"] || r["Số HĐ"] || r.contract_no || "").trim(),
      name: String(r["Tên Hợp Đồng"] || r["Tên hợp đồng"] || r.name || "").trim(),
      contract_type: String(r["Loại Hợp Đồng"] || r["Loại"] || r.contract_type || "Hợp đồng dịch vụ").trim(),
      customer_name: String(r["Khách Hàng"] || r["Khách hàng"] || r.customer_name || "").trim(),
      signed_date: String(r["Ngày Ký"] || r["Ngày ký"] || r.signed_date || "").trim(),
      start_date: String(r["Ngày Hiệu Lực"] || r["Ngày bắt đầu"] || r.start_date || "").trim(),
      end_date: String(r["Ngày Hết Hạn"] || r["Hết hạn"] || r.end_date || "").trim(),
      value: String(r["Giá Trị"] || r["Giá trị"] || r.value || "").trim(),
      status: String(r["Trạng Thái"] || r["Trạng thái"] || r.status || "Active").trim(),
      owner_name: String(r["Người Phụ Trách"] || r["Phụ trách"] || r.owner_name || "").trim(),
      ttkd: String(r["TTKD"] || r.ttkd || "").trim(),
      description: String(r["Ghi Chú"] || r["Ghi chú"] || r.description || "").trim(),
    })).filter((r: ContractSheetRow) => r.name);
    return deduplicateContractSheetRows(rawList);
  }

  const spreadsheetId = sheetUrl ? extractSpreadsheetId(sheetUrl) : null;
  if (!spreadsheetId) throw new Error("Không thể nhận diện Spreadsheet ID từ link Google Sheet.");

  const targetTab = sheetName || "Contract";
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
      return extractContractRowsFromValues(res.data.values || []);
    } catch (sheetErr: any) {
      // Fallback: search for sheet tab with contract or hop dong in name
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const found = (meta.data.sheets || []).find(s => {
        const title = (s.properties?.title || "").toLowerCase();
        return title.includes("contract") || title.includes("hợp đồng") || title.includes("hop dong") || title.includes("hd");
      });
      if (found?.properties?.title) {
        const res2 = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${found.properties.title}!A1:Z3000` });
        return extractContractRowsFromValues(res2.data.values || []);
      }
      throw sheetErr;
    }
  }

  throw new Error("Chưa cấu hình Token xác thực tài khoản Google.");
}

// ─── Fetch All DB Contracts ───────────────────────────────────
async function fetchAllDbContracts(admin: SupabaseClient) {
  try {
    const { data, error } = await admin
      .from("contracts")
      .select("id, code, contract_no, name, contract_type, customer_name, signed_date, start_date, end_date, value, status, owner_name, ttkd, description");
    if (error) {
      console.warn("DB contracts table query error:", error.message);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

// ─── Compute 1-Way Diff ───────────────────────────────────────
function computeContract1WayDiff(sheetRows: ContractSheetRow[], dbRows: any[]) {
  const dbByCode = new Map<string, any>();
  const dbByName = new Map<string, any>();

  for (const r of dbRows) {
    const nc = norm(r.code);
    if (nc && !dbByCode.has(nc)) dbByCode.set(nc, r);
    const nn = norm(r.name);
    if (nn && !dbByName.has(nn)) dbByName.set(nn, r);
  }

  const toAdd: ContractSheetRow[] = [];
  const toUpdate: ContractDiffRow[] = [];

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
      const noChanged = norm(dbRow.contract_no || "") !== norm(row.contract_no || "");
      const custChanged = norm(dbRow.customer_name || "") !== norm(row.customer_name || "");
      const valChanged = norm(dbRow.value || "") !== norm(row.value || "");
      const ownerChanged = norm(dbRow.owner_name || "") !== norm(row.owner_name || "");

      if (nameChanged || noChanged || custChanged || valChanged || ownerChanged) {
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
async function executeContractSync(
  admin: SupabaseClient,
  toAdd: ContractSheetRow[],
  toUpdate: ContractDiffRow[],
  onProgress: (processed: number, total: number, name: string, created: number, updated: number, errors: number, errorItem?: SyncErrorItem) => void
): Promise<{ created: number; updated: number; errors: number; errorLog: SyncErrorItem[] }> {
  const total = toAdd.length + toUpdate.length;
  let processed = 0, created = 0, updated = 0, errors = 0;
  const errorLog: SyncErrorItem[] = [];

  let sysCodeCounter: number | null = null;
  const getNextSysCodeFast = async () => {
    if (sysCodeCounter === null) {
      const { data } = await admin.from("contracts").select("code");
      const nums = (data || []).map((r: any) => parseInt((r.code || "").replace("HD-", "").replace("CTR-", ""), 10)).filter((n: number) => !isNaN(n));
      sysCodeCounter = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    }
    const code = `HD-${String(sysCodeCounter!).padStart(3, "0")}`;
    sysCodeCounter!++;
    return code;
  };

  // 1. INSERT
  for (const row of toAdd) {
    onProgress(processed, total, row.name, created, updated, errors);
    try {
      const autoCode = await getNextSysCodeFast();
      let code = sanitizeCode(row.code, autoCode);

      const payload = {
        code,
        contract_no: row.contract_no || null,
        name: row.name.trim(),
        contract_type: row.contract_type || "Hợp đồng dịch vụ",
        customer_name: row.customer_name || null,
        signed_date: row.signed_date || null,
        start_date: row.start_date || null,
        end_date: row.end_date || null,
        value: row.value || null,
        status: row.status || "Active",
        owner_name: row.owner_name || null,
        description: row.description || null,
      };

      const { error: insErr } = await admin.from("contracts").insert([payload]);
      if (insErr) {
        const { error: retryUpd } = await admin.from("contracts").update(payload).eq("code", code);
        if (retryUpd) {
          const errItem: SyncErrorItem = {
            type: "insert",
            name: row.name,
            code,
            message: `Lỗi thêm hợp đồng vào database`,
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
        message: `Ngoại lệ khi thêm hợp đồng`,
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
        contract_no: row.contract_no || null,
        contract_type: row.contract_type || "Hợp đồng dịch vụ",
        customer_name: row.customer_name || null,
        signed_date: row.signed_date || null,
        start_date: row.start_date || null,
        end_date: row.end_date || null,
        value: row.value || null,
        status: row.status || "Active",
        owner_name: row.owner_name || null,
        description: row.description || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updErr } = await admin.from("contracts").update(payload).eq("id", targetId);
      if (updErr) {
        const errItem: SyncErrorItem = {
          type: "update",
          name: row.name,
          code: row.code,
          message: `Lỗi cập nhật hợp đồng [ID: ${targetId}]`,
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
        message: `Ngoại lệ khi cập nhật hợp đồng`,
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
      let sheetRows: ContractSheetRow[];
      try {
        sheetRows = await fetchContractSheetRows(body);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }

      if (!sheetRows.length) {
        return NextResponse.json({ success: false, error: "Không tìm thấy dữ liệu hợp lệ trong Google Sheet tab Contract." }, { status: 400 });
      }

      const dbRows = await fetchAllDbContracts(admin);
      const { toAdd, toUpdate } = computeContract1WayDiff(sheetRows, dbRows);

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
    let sheetRows: ContractSheetRow[];
    try {
      sheetRows = await fetchContractSheetRows(body);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    if (!sheetRows.length) {
      return NextResponse.json({ success: false, error: "Không tìm thấy dữ liệu hợp lệ từ Google Sheet tab Contract." }, { status: 400 });
    }

    const dbRows = await fetchAllDbContracts(admin);
    const { toAdd, toUpdate } = computeContract1WayDiff(sheetRows, dbRows);
    const total = toAdd.length + toUpdate.length;
    const lastSyncedAt = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");

    if (total === 0) {
      return NextResponse.json({
        success: true,
        total: sheetRows.length,
        created: 0,
        updated: 0,
        lastSyncedAt,
        message: "Dữ liệu Hợp đồng trên Supabase đã hoàn toàn trùng khớp với Google Sheet.",
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

        const result = await executeContractSync(
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
    console.error("contracts sync-sheets error:", err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

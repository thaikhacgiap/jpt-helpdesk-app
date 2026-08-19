import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { google } from "googleapis";

interface SheetRow {
  code: string;
  name: string;
  ten_tieng_anh?: string;
  tax_code?: string;
  address?: string;
}

interface DiffRow extends SheetRow {
  old_name?: string;
  old_ten_tieng_anh?: string;
  old_address?: string;
  old_code?: string;
}

// ─── Service Role Admin Client ────────────────────────────────
function getAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

  let codeIdx     = idx(["mã khách hàng", "ma khach hang", "code", "mã kh"]);
  let fullNameIdx = idx(["tên khách hàng", "ten khach hang", "tên công ty", "ten cong ty"]);
  let displayIdx  = idx(["tên hiển thị", "ten hien thi", "name"]);
  let taxIdx      = idx(["mã số thuế", "ma so thue", "mst", "tax"]);
  let addressIdx  = idx(["địa chỉ", "dia chi", "address"]);
  let engIdx      = idx(["tên tiếng anh", "ten tieng anh", "english name", "name_en"]);

  // Positional fallbacks for Account sheet: A=Code, B=TênKH, C=TênHiểnThị, D=MST, E=Địa chỉ
  if (codeIdx < 0)     codeIdx = 0;
  if (fullNameIdx < 0) fullNameIdx = 1;
  if (displayIdx < 0)  displayIdx = 2;
  if (taxIdx < 0 && headerRow.length > 3) taxIdx = 3;
  if (addressIdx < 0 && headerRow.length > 4) addressIdx = 4;

  const result: SheetRow[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const fullName  = String(row[fullNameIdx] ?? "").trim();
    const displayName = String(row[displayIdx] ?? "").trim();
    const name = fullName || displayName;
    if (!name) continue;

    const code = String(row[codeIdx] ?? "").trim() || `AUTO-${i}`;
    const tax_code = taxIdx >= 0 ? String(row[taxIdx] ?? "").trim() : "";
    const address = addressIdx >= 0 ? String(row[addressIdx] ?? "").trim() : "";
    const ten_tieng_anh = engIdx >= 0 ? String(row[engIdx] ?? "").trim() : "";

    result.push({ code, name, ten_tieng_anh, tax_code, address });
  }
  return result;
}

// ─── Fetch sheet rows ─────────────────────────────────────────
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
      tax_code: String(r["Mã Số Thuế"] || r["Mã số thuế"] || r.tax_code || "").trim(),
      address: String(r["Địa Chỉ"] || r["Địa chỉ"] || r.address || "").trim(),
    })).filter((r: SheetRow) => r.name);
  }

  const spreadsheetId = sheetUrl ? extractSpreadsheetId(sheetUrl) : null;
  if (!spreadsheetId) throw new Error("Không thể nhận diện Spreadsheet ID từ link Google Sheet.");

  const range = sheetName ? `${sheetName}!A1:Z3000` : "A1:Z3000";

  // Case 2: Google User OAuth
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

  throw new Error("Chưa cấu hình thông tin xác thực Google (Token hoặc Service Account).");
}

// ─── Fetch ALL DB customers ────────────────────────────────────
async function fetchAllDbCustomers(admin: SupabaseClient) {
  const PAGE_SIZE = 1000;
  let all: Array<{ id: string; code: string; name: string; ten_tieng_anh: string; system_code: string; address: string; ghi_chu: string }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from("customers")
      .select("id, code, name, ten_tieng_anh, system_code, address, ghi_chu")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error("Không thể đọc Supabase: " + error.message);
    if (!data || data.length === 0) break;
    all = all.concat(data.map((r: any) => ({
      id: r.id,
      code: r.code || "",
      name: r.name || "",
      ten_tieng_anh: r.ten_tieng_anh || "",
      system_code: r.system_code || "",
      address: r.address || "",
      ghi_chu: r.ghi_chu || "",
    })));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

// ─── Normalize for comparison ──────────────────────────────────
function norm(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Compute diff using in-memory maps ────────────────────────
function computeDiff(
  sheetRows: SheetRow[],
  dbRows: Awaited<ReturnType<typeof fetchAllDbCustomers>>
) {
  const dbByCode = new Map<string, typeof dbRows[0]>();
  const dbByName = new Map<string, typeof dbRows[0]>();
  const matchedIds = new Set<string>();

  for (const r of dbRows) {
    const nc = norm(r.code);
    if (nc && !dbByCode.has(nc)) dbByCode.set(nc, r);
    const nn = norm(r.name);
    if (nn && !dbByName.has(nn)) dbByName.set(nn, r);
  }

  const toAdd: SheetRow[] = [];
  const toUpdate: DiffRow[] = [];

  for (const row of sheetRows) {
    const nc = norm(row.code);
    const nn = norm(row.name);
    const isAuto = nc.startsWith("auto-") || nc === "";

    const dbRow = (!isAuto ? dbByCode.get(nc) : undefined) ?? dbByName.get(nn);

    if (!dbRow) {
      toAdd.push(row);
    } else {
      matchedIds.add(dbRow.id);
      const nameChanged = norm(dbRow.name) !== nn;
      const engChanged = norm(dbRow.ten_tieng_anh || "") !== norm(row.ten_tieng_anh || "");
      const addrChanged = norm(dbRow.address || "") !== norm(row.address || "");
      const codeChanged = !isAuto && norm(dbRow.code) !== nc;

      if (nameChanged || engChanged || addrChanged || codeChanged) {
        toUpdate.push({
          ...row,
          old_name: dbRow.name,
          old_ten_tieng_anh: dbRow.ten_tieng_anh,
          old_address: dbRow.address,
          old_code: dbRow.code,
        });
      }
    }
  }

  // Dữ liệu dư thừa trên DB không có trong Sheet
  const toRemove = dbRows.filter(r => !matchedIds.has(r.id)).map(r => ({ id: r.id, code: r.code, name: r.name }));
  return { toAdd, toUpdate, toRemove };
}

// ─── Batch sync execution ─────────────────────────────────────
async function executeSync(
  admin: SupabaseClient,
  toAdd: SheetRow[],
  toUpdate: DiffRow[],
  toRemove: Array<{ id: string; code: string; name: string }>,
  dbRows: Awaited<ReturnType<typeof fetchAllDbCustomers>>,
  hardDeleteOrphans: boolean,
  onProgress: (processed: number, total: number, name: string, created: number, updated: number, errors: number) => void
): Promise<{ created: number; updated: number; removed: number; errors: number }> {
  const total = toAdd.length + toUpdate.length + toRemove.length;
  let processed = 0, created = 0, updated = 0, removed = 0, errors = 0;

  const idByCode = new Map(dbRows.map(r => [norm(r.code), r.id]));
  const idByName = new Map(dbRows.map(r => [norm(r.name), r.id]));

  // ── 1. INSERT new rows ─────────────────────────────────────────
  let sysCodeCounter: number | null = null;
  const getNextSysCodeFast = async () => {
    if (sysCodeCounter === null) {
      const { data } = await admin.from("customers").select("system_code").not("system_code", "is", null);
      const nums = (data || []).map((r: any) => parseInt((r.system_code || "").replace("KH-", ""), 10)).filter((n: number) => !isNaN(n));
      sysCodeCounter = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    }
    const code = `KH-${String(sysCodeCounter!).padStart(3, "0")}`;
    sysCodeCounter!++;
    return code;
  };

  for (const row of toAdd) {
    onProgress(processed, total, row.name, created, updated, errors);
    try {
      const system_code = await getNextSysCodeFast();
      const code = (row.code && !row.code.toUpperCase().startsWith("AUTO-")) ? row.code.trim().toUpperCase() : system_code;
      const { error } = await admin.from("customers").insert([{
        system_code,
        code,
        name: row.name.trim(),
        ten_tieng_anh: row.ten_tieng_anh?.trim() || null,
        address: row.address?.trim() || null,
        ghi_chu: row.tax_code ? `MST: ${row.tax_code}` : null,
        tinh_trang: "Active",
      }]);
      if (error) {
        console.error("INSERT error:", error.message, "code:", code);
        errors++;
      } else {
        created++;
      }
    } catch (e: any) {
      console.error("INSERT exception:", e.message);
      errors++;
    }
    processed++;
  }

  // ── 2. UPDATE changed rows ─────────────────────────────────────
  for (const row of toUpdate) {
    onProgress(processed, total, row.name, created, updated, errors);
    try {
      const nc = norm(row.code);
      const nn = norm(row.name);
      const isAuto = nc.startsWith("auto-") || nc === "";
      const existingId = (!isAuto ? idByCode.get(nc) : undefined) ?? idByName.get(nn);

      if (existingId) {
        const payload: any = {
          name: row.name.trim(),
          ten_tieng_anh: row.ten_tieng_anh?.trim() || null,
          address: row.address?.trim() || null,
          tinh_trang: "Active",
          updated_at: new Date().toISOString(),
        };
        if (row.tax_code) payload.ghi_chu = `MST: ${row.tax_code}`;
        if (!isAuto) payload.code = row.code.trim().toUpperCase();

        const { error } = await admin.from("customers").update(payload).eq("id", existingId);
        if (error) {
          console.error("UPDATE error:", error.message, "id:", existingId);
          errors++;
        } else {
          updated++;
        }
      } else {
        errors++;
      }
    } catch (e: any) {
      console.error("UPDATE exception:", e.message);
      errors++;
    }
    processed++;
  }

  // ── 3. REMOVE or INACTIVATE orphan rows ────────────────────────
  if (toRemove.length > 0) {
    const chunks = [];
    for (let i = 0; i < toRemove.length; i += 50) chunks.push(toRemove.slice(i, i + 50));

    for (const chunk of chunks) {
      onProgress(processed, total, `[Xử lý thừa] ${chunk[0]?.name || ""}`, created, updated, errors);
      const ids = chunk.map(r => r.id);

      if (hardDeleteOrphans) {
        // Xóa hoàn toàn để DB giống 100% Google Sheet
        const { error } = await admin.from("customers").delete().in("id", ids);
        if (error) {
          console.error("DELETE batch error:", error.message);
          errors += chunk.length;
        } else {
          removed += chunk.length;
        }
      } else {
        // Đặt Inactive
        const { error } = await admin.from("customers").update({ tinh_trang: "Inactive" }).in("id", ids);
        if (error) {
          console.error("INACTIVE batch error:", error.message);
          errors += chunk.length;
        } else {
          removed += chunk.length;
        }
      }
      processed += chunk.length;
    }
  }

  return { created, updated, removed, errors };
}

// ─── POST Handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode = "sync", hardDeleteOrphans = true } = body;

    // ── PREVIEW: compare Sheet vs DB ────────────────────────────
    if (mode === "preview") {
      let sheetRows: SheetRow[];
      try {
        sheetRows = await fetchSheetRows(body);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }

      if (!sheetRows.length) {
        return NextResponse.json({ success: false, error: "Không tìm thấy dữ liệu hợp lệ trong Google Sheet." }, { status: 400 });
      }

      const admin = getAdmin();
      let dbRows: Awaited<ReturnType<typeof fetchAllDbCustomers>>;
      try {
        dbRows = await fetchAllDbCustomers(admin);
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
          add:    { count: toAdd.length,    rows: toAdd.slice(0, 30) },
          update: { count: toUpdate.length, rows: toUpdate.slice(0, 30) },
          remove: { count: toRemove.length, rows: toRemove.slice(0, 30) },
        },
        noChanges: !toAdd.length && !toUpdate.length && !toRemove.length,
      });
    }

    // ── SYNC DIFF / FULL SYNC with SSE ───────────────────────────
    let sheetRows: SheetRow[];
    try {
      sheetRows = await fetchSheetRows(body);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    if (!sheetRows.length) {
      return NextResponse.json({ success: false, error: "Không tìm thấy dữ liệu hợp lệ từ Google Sheet." }, { status: 400 });
    }

    const admin = getAdmin();
    let dbRows: Awaited<ReturnType<typeof fetchAllDbCustomers>>;
    try {
      dbRows = await fetchAllDbCustomers(admin);
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    const { toAdd, toUpdate, toRemove } = computeDiff(sheetRows, dbRows);
    const total = toAdd.length + toUpdate.length + toRemove.length;

    if (total === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        created: 0,
        updated: 0,
        removed: 0,
        message: "Dữ liệu trên Supabase đã hoàn toàn trùng khớp với Google Sheet.",
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
          toRemove: toRemove.length,
          sheetTotal: sheetRows.length,
        });

        const result = await executeSync(
          admin,
          toAdd,
          toUpdate,
          toRemove,
          dbRows,
          Boolean(hardDeleteOrphans),
          (processed, totalCount, name, created, updated, errors) => {
            send({ type: "progress", processed, total: totalCount, name, created, updated, errors });
          }
        );

        send({ type: "done", total, sheetTotal: sheetRows.length, ...result });
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
    console.error("sync-sheets error:", err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

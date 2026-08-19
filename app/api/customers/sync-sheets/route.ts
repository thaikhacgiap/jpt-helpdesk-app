import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { google } from "googleapis";

export interface SheetRow {
  code: string;
  name: string;
  ten_tieng_anh?: string;
  tax_code?: string;
  address?: string;
}

export interface DiffRow extends SheetRow {
  dbId: string; // Direct ID of the record in Supabase to update
  old_name?: string;
  old_ten_tieng_anh?: string;
  old_address?: string;
  old_code?: string;
}

export interface SyncErrorItem {
  type: "insert" | "update" | "remove";
  name: string;
  code?: string;
  message: string;
  detail?: string;
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

// ─── Normalize for comparison ──────────────────────────────────
function norm(s: string) {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Sanitize and safely format customer code ─────────────────
function sanitizeCustomerCode(rawCode: string, fallbackCode: string): string {
  let c = (rawCode || "").trim().toUpperCase();
  if (!c || c.startsWith("AUTO-")) return fallbackCode;

  // If code is overly long or looks like full company name placed in code column
  if (c.length > 40 || c.split(/\s+/).length > 3) {
    // Extract short identifier if present at the end (e.g. "... PVGAZPROM" -> "PVGAZPROM")
    const parts = c.split(/[\s\-_\/()]+/);
    const lastWord = parts[parts.length - 1];
    if (lastWord && lastWord.length >= 2 && lastWord.length <= 25 && /^[A-Z0-9.]+$/i.test(lastWord)) {
      return lastWord;
    }
    return c.slice(0, 45);
  }
  return c.slice(0, 48);
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

    const rawCode = String(row[codeIdx] ?? "").trim();
    const code = rawCode || `AUTO-${i}`;
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

// ─── Compute diff with SANITIZED CODE and DIRECT dbId mapping ─
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
    const isAuto = !row.code || row.code.toUpperCase().startsWith("AUTO-");
    const sanitizedCode = sanitizeCustomerCode(row.code, isAuto ? "" : row.code);
    const nc = norm(sanitizedCode);
    const nn = norm(row.name);

    // Match priority: sanitized real code -> then full name
    const dbRow = (!isAuto && nc ? dbByCode.get(nc) : undefined) ?? dbByName.get(nn);

    if (!dbRow) {
      toAdd.push(row);
    } else {
      matchedIds.add(dbRow.id);
      const nameChanged = norm(dbRow.name) !== nn;
      const engChanged = norm(dbRow.ten_tieng_anh || "") !== norm(row.ten_tieng_anh || "");
      const addrChanged = norm(dbRow.address || "") !== norm(row.address || "");
      const codeChanged = !isAuto && nc && norm(dbRow.code) !== nc;

      if (nameChanged || engChanged || addrChanged || codeChanged) {
        toUpdate.push({
          ...row,
          dbId: dbRow.id, // Direct DB ID preserved!
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

// ─── Robust Batch Sync Execution with Error Analysis ──────────
async function executeSync(
  admin: SupabaseClient,
  toAdd: SheetRow[],
  toUpdate: DiffRow[],
  toRemove: Array<{ id: string; code: string; name: string }>,
  hardDeleteOrphans: boolean,
  onProgress: (processed: number, total: number, name: string, created: number, updated: number, errors: number, errorItem?: SyncErrorItem) => void
): Promise<{ created: number; updated: number; removed: number; errors: number; errorLog: SyncErrorItem[] }> {
  const total = toAdd.length + toUpdate.length + toRemove.length;
  let processed = 0, created = 0, updated = 0, removed = 0, errors = 0;
  const errorLog: SyncErrorItem[] = [];

  // Helper for generating next system code
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

  // ── 1. INSERT new rows ─────────────────────────────────────────
  for (const row of toAdd) {
    onProgress(processed, total, row.name, created, updated, errors);
    try {
      const system_code = await getNextSysCodeFast();
      let code = sanitizeCustomerCode(row.code, system_code);

      // Check if code already exists in DB to prevent Unique Constraint failure
      const { data: existingWithCode } = await admin.from("customers").select("id").eq("code", code).maybeSingle();
      if (existingWithCode) {
        // If code already exists, update that record
        const { error: updErr } = await admin.from("customers").update({
          name: row.name.trim(),
          ten_tieng_anh: row.ten_tieng_anh?.trim() || null,
          address: row.address?.trim() || null,
          ghi_chu: row.tax_code ? `MST: ${row.tax_code}` : null,
          tinh_trang: "Active",
          updated_at: new Date().toISOString(),
        }).eq("id", existingWithCode.id);

        if (updErr) {
          const errItem: SyncErrorItem = {
            type: "insert",
            name: row.name,
            code,
            message: `Trùng mã [${code}] và không thể cập nhật`,
            detail: updErr.message,
          };
          errorLog.push(errItem);
          errors++;
          onProgress(processed, total, row.name, created, updated, errors, errItem);
        } else {
          updated++;
        }
      } else {
        // Normal INSERT
        const insertPayload: any = {
          system_code: system_code.slice(0, 48),
          code: code.slice(0, 48),
          name: row.name.trim(),
          ten_tieng_anh: row.ten_tieng_anh?.trim() || null,
          address: row.address?.trim() || null,
          ghi_chu: row.tax_code ? `MST: ${row.tax_code}` : null,
          tinh_trang: "Active",
        };

        const { error: insErr } = await admin.from("customers").insert([insertPayload]);

        if (insErr) {
          if (insErr.message.includes("too long") || insErr.message.includes("unique")) {
            insertPayload.code = system_code.slice(0, 48);
            const { error: retryErr } = await admin.from("customers").insert([insertPayload]);
            if (retryErr) {
              const errItem: SyncErrorItem = {
                type: "insert",
                name: row.name,
                code,
                message: `Lỗi thêm mới bản ghi vào database`,
                detail: retryErr.message,
              };
              errorLog.push(errItem);
              errors++;
              onProgress(processed, total, row.name, created, updated, errors, errItem);
            } else {
              created++;
            }
          } else {
            const errItem: SyncErrorItem = {
              type: "insert",
              name: row.name,
              code,
              message: `Lỗi thêm mới bản ghi vào database`,
              detail: insErr.message,
            };
            errorLog.push(errItem);
            errors++;
            onProgress(processed, total, row.name, created, updated, errors, errItem);
          }
        } else {
          created++;
        }
      }
    } catch (e: any) {
      const errItem: SyncErrorItem = {
        type: "insert",
        name: row.name,
        code: row.code,
        message: `Ngoại lệ khi thêm mới`,
        detail: e.message || String(e),
      };
      errorLog.push(errItem);
      errors++;
      onProgress(processed, total, row.name, created, updated, errors, errItem);
    }
    processed++;
  }

  // ── 2. UPDATE changed rows (USING DIRECT dbId) ─────────────────
  for (const row of toUpdate) {
    onProgress(processed, total, row.name, created, updated, errors);
    try {
      const targetId = row.dbId;
      const isAuto = row.code.toUpperCase().startsWith("AUTO-") || !row.code;

      const payload: any = {
        name: row.name.trim(),
        ten_tieng_anh: row.ten_tieng_anh?.trim() || null,
        address: row.address?.trim() || null,
        tinh_trang: "Active",
        updated_at: new Date().toISOString(),
      };
      if (row.tax_code) payload.ghi_chu = `MST: ${row.tax_code}`;
      if (!isAuto) {
        payload.code = sanitizeCustomerCode(row.code, `AUTO-${targetId.slice(0, 8)}`);
      }

      // Check if desired code is already held by ANOTHER customer
      if (payload.code) {
        const { data: codeHolder } = await admin.from("customers").select("id").eq("code", payload.code).maybeSingle();
        if (codeHolder && codeHolder.id !== targetId) {
          // Temporarily free the code from the other holder to avoid unique collision
          await admin.from("customers").update({ code: `TMP-${codeHolder.id.slice(0, 8)}` }).eq("id", codeHolder.id);
        }
      }

      const { error: updErr } = await admin.from("customers").update(payload).eq("id", targetId);

      if (updErr) {
        // Fallback retry without changing code if any conflict remains
        if (updErr.message.includes("unique") || updErr.message.includes("duplicate") || updErr.message.includes("too long")) {
          delete payload.code;
          const { error: retryErr } = await admin.from("customers").update(payload).eq("id", targetId);
          if (retryErr) {
            const errItem: SyncErrorItem = {
              type: "update",
              name: row.name,
              code: row.code,
              message: `Lỗi cập nhật bản ghi [ID: ${targetId}]`,
              detail: retryErr.message,
            };
            errorLog.push(errItem);
            errors++;
            onProgress(processed, total, row.name, created, updated, errors, errItem);
          } else {
            updated++;
          }
        } else {
          const errItem: SyncErrorItem = {
            type: "update",
            name: row.name,
            code: row.code,
            message: `Lỗi cập nhật dữ liệu khách hàng`,
            detail: updErr.message,
          };
          errorLog.push(errItem);
          errors++;
          onProgress(processed, total, row.name, created, updated, errors, errItem);
        }
      } else {
        updated++;
      }
    } catch (e: any) {
      const errItem: SyncErrorItem = {
        type: "update",
        name: row.name,
        code: row.code,
        message: `Ngoại lệ khi cập nhật`,
        detail: e.message || String(e),
      };
      errorLog.push(errItem);
      errors++;
      onProgress(processed, total, row.name, created, updated, errors, errItem);
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
        const { error: delErr } = await admin.from("customers").delete().in("id", ids);
        if (delErr) {
          const errItem: SyncErrorItem = {
            type: "remove",
            name: `${chunk.length} bản ghi dư thừa`,
            message: `Lỗi xóa bản ghi dư thừa khỏi database`,
            detail: delErr.message,
          };
          errorLog.push(errItem);
          errors += chunk.length;
          onProgress(processed, total, "[Lỗi xóa]", created, updated, errors, errItem);
        } else {
          removed += chunk.length;
        }
      } else {
        const { error: inactErr } = await admin.from("customers").update({ tinh_trang: "Inactive" }).in("id", ids);
        if (inactErr) {
          const errItem: SyncErrorItem = {
            type: "remove",
            name: `${chunk.length} bản ghi dư thừa`,
            message: `Lỗi đặt trạng thái Inactive cho bản ghi dư thừa`,
            detail: inactErr.message,
          };
          errorLog.push(errItem);
          errors += chunk.length;
          onProgress(processed, total, "[Lỗi Inactive]", created, updated, errors, errItem);
        } else {
          removed += chunk.length;
        }
      }
      processed += chunk.length;
    }
  }

  return { created, updated, removed, errors, errorLog };
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
          Boolean(hardDeleteOrphans),
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
          total,
          sheetTotal: sheetRows.length,
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
    console.error("sync-sheets error:", err);
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

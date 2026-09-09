import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { fetchGoogleSheetRows } from "@/lib/google-sheets-reader";

export const dynamic = "force-dynamic";

function getAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) || url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function cleanText(val: any): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

function sanitizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // Check Excel serial number (e.g., 32145)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const utcDays = serial - 25569;
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sheetUrl,
      sheetName = "NhanSu",
      mode = "sync_diff",
      stream = false,
      userAccessToken,
      userRefreshToken,
      userClientId,
      userClientSecret,
    } = body;

    if (!sheetUrl) {
      return NextResponse.json({ success: false, error: "Thiếu đường link Google Sheet." }, { status: 400 });
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return NextResponse.json({ success: false, error: "Link Google Sheet không hợp lệ." }, { status: 400 });
    }

    const fetchResult = await fetchGoogleSheetRows({
      spreadsheetId,
      sheetName,
      userAccessToken,
      userRefreshToken,
      userClientId,
      userClientSecret,
    });

    if (!fetchResult.success || !fetchResult.rows) {
      return NextResponse.json(
        { success: false, error: fetchResult.error || "Không thể đọc dữ liệu từ Google Sheet." },
        { status: fetchResult.statusCode || 400 }
      );
    }

    const rawRows: string[][] = fetchResult.rows;

    if (rawRows.length <= 1) {
      return NextResponse.json({ success: true, total: 0, created: 0, updated: 0, noChanges: true });
    }

    // Smart header row finder: scan first 10 rows
    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      const rowText = (rawRows[r] || []).map(c => cleanText(c).toLowerCase()).join(" ");
      if (
        rowText.includes("họ") ||
        rowText.includes("tên") ||
        rowText.includes("nhân sự") ||
        rowText.includes("mã nv") ||
        rowText.includes("mã") ||
        rowText.includes("bộ phận") ||
        rowText.includes("email")
      ) {
        headerRowIdx = r;
        break;
      }
    }

    const headers = (rawRows[headerRowIdx] || []).map(h => cleanText(h).toLowerCase());

    const findCol = (...keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idxCode = findCol("mã nhân sự", "mã nv", "ma_nhan_su", "manv", "code", "mã cb", "mã");
    const idxName = findCol("tên nhân sự", "họ và tên", "họ tên", "họ & tên", "ten_nhan_su", "nhân sự", "tên nhân viên", "tên cán bộ", "tên", "name", "full name", "staff name", "cán bộ", "nhân viên");
    const idxBoPhan = findCol("bộ phận", "phòng ban", "bo_phan", "department", "phòng");
    const idxChucVu = findCol("chức vụ", "chức danh", "chuc_vu", "position", "vị trí");
    const idxPhuTrach = findCol("phụ trách", "quản lý", "phu_trach", "manager", "leader");
    const idxNgaySinh = findCol("ngày sinh", "ngaysinh", "dob", "birthday", "birth");
    const idxCccd = findCol("cccd", "cmnd", "số cccd", "so_cccd", "identity", "số cmnd");
    const idxCapNgay = findCol("cấp ngày", "ngày cấp", "cap_ngay", "ngaycap");
    const idxEmail = findCol("email", "mail", "hòm thư");
    const idxPhone = findCol("số điện thoại", "điện thoại", "sđt", "so_dien_thoai", "phone", "mobile");
    const idxDiaChi = findCol("địa chỉ", "dia_chi", "address", "nơi ở", "hộ khẩu");

    const parsedRows: any[] = [];
    const seenCodes = new Set<string>();

    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.every(c => !c || cleanText(c) === "")) continue;

      const name = idxName >= 0 ? cleanText(row[idxName]) : "";
      let code = idxCode >= 0 ? cleanText(row[idxCode]) : "";

      if (!code && name) {
        code = `NS-${String(r).padStart(3, "0")}`;
      }

      if (!name && !code) continue;

      const dedupeKey = code.toUpperCase();
      if (seenCodes.has(dedupeKey)) continue;
      seenCodes.add(dedupeKey);

      parsedRows.push({
        ma_nhan_su: code,
        ten_nhan_su: name || code,
        bo_phan: idxBoPhan >= 0 ? cleanText(row[idxBoPhan]) : "",
        chuc_vu: idxChucVu >= 0 ? cleanText(row[idxChucVu]) : "",
        phu_trach: idxPhuTrach >= 0 ? cleanText(row[idxPhuTrach]) : "",
        ngay_sinh: idxNgaySinh >= 0 ? sanitizeDate(cleanText(row[idxNgaySinh])) : null,
        so_cccd: idxCccd >= 0 ? cleanText(row[idxCccd]) : "",
        cap_ngay: idxCapNgay >= 0 ? sanitizeDate(cleanText(row[idxCapNgay])) : null,
        email: idxEmail >= 0 ? cleanText(row[idxEmail]) : "",
        so_dien_thoai: idxPhone >= 0 ? cleanText(row[idxPhone]) : "",
        dia_chi: idxDiaChi >= 0 ? cleanText(row[idxDiaChi]) : "",
      });
    }

    const admin = getAdmin();
    const { data: dbRows, error: fetchDbErr } = await admin.from("nhan_su").select("*");
    if (fetchDbErr) {
      return NextResponse.json({ success: false, error: "Lỗi kết nối Supabase: " + fetchDbErr.message }, { status: 500 });
    }

    const dbMapByCode = new Map<string, any>();
    const dbMapByName = new Map<string, any>();
    (dbRows || []).forEach(r => {
      if (r.ma_nhan_su) dbMapByCode.set(r.ma_nhan_su.toUpperCase(), r);
      if (r.ten_nhan_su) dbMapByName.set(r.ten_nhan_su.trim().toLowerCase(), r);
    });

    const toAdd: any[] = [];
    const toUpdate: any[] = [];

    for (const item of parsedRows) {
      const key = item.ma_nhan_su.toUpperCase();
      const existing = dbMapByCode.get(key) || (item.ten_nhan_su ? dbMapByName.get(item.ten_nhan_su.trim().toLowerCase()) : null);

      if (!existing) {
        toAdd.push(item);
      } else {
        const isDiff =
          (item.ten_nhan_su && item.ten_nhan_su !== (existing.ten_nhan_su || "")) ||
          (item.bo_phan && item.bo_phan !== (existing.bo_phan || "")) ||
          (item.chuc_vu && item.chuc_vu !== (existing.chuc_vu || "")) ||
          (item.phu_trach && item.phu_trach !== (existing.phu_trach || "")) ||
          (item.email && item.email !== (existing.email || "")) ||
          (item.so_dien_thoai && item.so_dien_thoai !== (existing.so_dien_thoai || ""));

        if (isDiff) {
          toUpdate.push({
            ...item,
            id: existing.id,
            ten_nhan_su: item.ten_nhan_su || existing.ten_nhan_su || item.ma_nhan_su,
          });
        }
      }
    }

    if (mode === "preview") {
      return NextResponse.json({
        success: true,
        sheetTotal: parsedRows.length,
        dbTotal: (dbRows || []).length,
        diff: {
          add: { count: toAdd.length, rows: toAdd.slice(0, 10) },
          update: { count: toUpdate.length, rows: toUpdate.slice(0, 10) },
        },
        noChanges: toAdd.length === 0 && toUpdate.length === 0,
      });
    }

    // STREAM SSE MODE
    if (stream) {
      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      const sendEvent = async (data: any) => {
        await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      (async () => {
        try {
          const totalOps = toAdd.length + toUpdate.length;
          await sendEvent({ type: "start", total: totalOps, sheetTotal: parsedRows.length });

          let created = 0;
          let updated = 0;
          let errors = 0;
          const errorLog: any[] = [];

          // 1. ADD NEW
          for (let i = 0; i < toAdd.length; i++) {
            const item = toAdd[i];
            const { error: insErr } = await admin.from("nhan_su").insert([{
              ma_nhan_su: item.ma_nhan_su,
              ten_nhan_su: item.ten_nhan_su || item.ma_nhan_su,
              bo_phan: item.bo_phan || "",
              chuc_vu: item.chuc_vu || "",
              phu_trach: item.phu_trach || "",
              ngay_sinh: item.ngay_sinh,
              so_cccd: item.so_cccd || "",
              cap_ngay: item.cap_ngay,
              email: item.email || "",
              so_dien_thoai: item.so_dien_thoai || "",
              dia_chi: item.dia_chi || "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);

            if (insErr) {
              errors++;
              errorLog.push({ type: "insert", name: item.ten_nhan_su, code: item.ma_nhan_su, message: insErr.message });
            } else {
              created++;
            }

            await sendEvent({
              type: "progress",
              processed: i + 1,
              total: totalOps,
              created,
              updated,
              errors,
              name: item.ten_nhan_su,
            });
          }

          // 2. UPDATE
          for (let i = 0; i < toUpdate.length; i++) {
            const item = toUpdate[i];
            const payload: any = {
              bo_phan: item.bo_phan || "",
              chuc_vu: item.chuc_vu || "",
              phu_trach: item.phu_trach || "",
              ngay_sinh: item.ngay_sinh,
              so_cccd: item.so_cccd || "",
              cap_ngay: item.cap_ngay,
              email: item.email || "",
              so_dien_thoai: item.so_dien_thoai || "",
              dia_chi: item.dia_chi || "",
              updated_at: new Date().toISOString(),
            };

            if (item.ten_nhan_su) {
              payload.ten_nhan_su = item.ten_nhan_su;
            }

            const { error: upErr } = await admin
              .from("nhan_su")
              .update(payload)
              .eq("id", item.id);

            if (upErr) {
              errors++;
              errorLog.push({ type: "update", name: item.ten_nhan_su, code: item.ma_nhan_su, message: upErr.message });
            } else {
              updated++;
            }

            await sendEvent({
              type: "progress",
              processed: toAdd.length + i + 1,
              total: totalOps,
              created,
              updated,
              errors,
              name: item.ten_nhan_su,
            });
          }

          const syncTime = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
          await sendEvent({
            type: "done",
            total: totalOps,
            sheetTotal: parsedRows.length,
            created,
            updated,
            errors,
            errorLog,
            lastSyncedAt: syncTime,
          });
        } catch (streamErr: any) {
          await sendEvent({ type: "error", message: streamErr.message });
        } finally {
          await writer.close();
        }
      })();

      return new Response(responseStream.readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // NON-STREAM MODE
    let created = 0;
    let updated = 0;
    let errors = 0;
    const errorLog: any[] = [];

    for (const item of toAdd) {
      const { error: insErr } = await admin.from("nhan_su").insert([{
        ma_nhan_su: item.ma_nhan_su,
        ten_nhan_su: item.ten_nhan_su || item.ma_nhan_su,
        bo_phan: item.bo_phan || "",
        chuc_vu: item.chuc_vu || "",
        phu_trach: item.phu_trach || "",
        ngay_sinh: item.ngay_sinh,
        so_cccd: item.so_cccd || "",
        cap_ngay: item.cap_ngay,
        email: item.email || "",
        so_dien_thoai: item.so_dien_thoai || "",
        dia_chi: item.dia_chi || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      if (insErr) {
        errors++;
        errorLog.push({ type: "insert", name: item.ten_nhan_su, code: item.ma_nhan_su, message: insErr.message });
      } else {
        created++;
      }
    }

    for (const item of toUpdate) {
      const payload: any = {
        bo_phan: item.bo_phan || "",
        chuc_vu: item.chuc_vu || "",
        phu_trach: item.phu_trach || "",
        ngay_sinh: item.ngay_sinh,
        so_cccd: item.so_cccd || "",
        cap_ngay: item.cap_ngay,
        email: item.email || "",
        so_dien_thoai: item.so_dien_thoai || "",
        dia_chi: item.dia_chi || "",
        updated_at: new Date().toISOString(),
      };

      if (item.ten_nhan_su) {
        payload.ten_nhan_su = item.ten_nhan_su;
      }

      const { error: upErr } = await admin
        .from("nhan_su")
        .update(payload)
        .eq("id", item.id);

      if (upErr) {
        errors++;
        errorLog.push({ type: "update", name: item.ten_nhan_su, code: item.ma_nhan_su, message: upErr.message });
      } else {
        updated++;
      }
    }

    const syncTime = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
    return NextResponse.json({
      success: errors === 0,
      total: toAdd.length + toUpdate.length,
      sheetTotal: parsedRows.length,
      created,
      updated,
      errors,
      errorLog,
      lastSyncedAt: syncTime,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Lỗi xử lý đồng bộ Nhân sự." }, { status: 500 });
  }
}

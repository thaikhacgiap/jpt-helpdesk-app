import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchGoogleSheetRows } from "@/lib/google-sheets-reader";

export const dynamic = "force-dynamic";

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function cleanText(val: any): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
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

    const headers = rawRows[0].map(h => cleanText(h).toLowerCase());

    const findCol = (...keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idxCode = findCol("mã nhân sự", "ma_nhan_su", "mã nv", "manv", "code", "mã");
    const idxName = findCol("tên nhân sự", "họ và tên", "ten_nhan_su", "họ tên", "tên", "name", "nhân viên");
    const idxBoPhan = findCol("bộ phận", "phòng ban", "bo_phan", "department");
    const idxChucVu = findCol("chức vụ", "chức danh", "chuc_vu", "position", "vị trí");
    const idxPhuTrach = findCol("phụ trách", "quản lý", "phu_trach", "manager", "leader");
    const idxNgaySinh = findCol("ngày sinh", "ngaysinh", "dob", "birthday", "birth");
    const idxCccd = findCol("cccd", "cmnd", "số cccd", "so_cccd", "identity");
    const idxCapNgay = findCol("cấp ngày", "ngày cấp", "cap_ngay", "ngaycap");
    const idxEmail = findCol("email", "mail", "hòm thư");
    const idxPhone = findCol("số điện thoại", "điện thoại", "sđt", "so_dien_thoai", "phone", "mobile");
    const idxDiaChi = findCol("địa chỉ", "dia_chi", "address", "nơi ở");

    const parsedRows: any[] = [];
    const seenCodes = new Set<string>();

    for (let r = 1; r < rawRows.length; r++) {
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
        ten_nhan_su: name,
        bo_phan: idxBoPhan >= 0 ? cleanText(row[idxBoPhan]) : "",
        chuc_vu: idxChucVu >= 0 ? cleanText(row[idxChucVu]) : "",
        phu_trach: idxPhuTrach >= 0 ? cleanText(row[idxPhuTrach]) : "",
        ngay_sinh: idxNgaySinh >= 0 ? cleanText(row[idxNgaySinh]) : "",
        so_cccd: idxCccd >= 0 ? cleanText(row[idxCccd]) : "",
        cap_ngay: idxCapNgay >= 0 ? cleanText(row[idxCapNgay]) : "",
        email: idxEmail >= 0 ? cleanText(row[idxEmail]) : "",
        so_dien_thoai: idxPhone >= 0 ? cleanText(row[idxPhone]) : "",
        dia_chi: idxDiaChi >= 0 ? cleanText(row[idxDiaChi]) : "",
      });
    }

    const { data: dbRows } = await supabase.from("nhan_su").select("*");
    const dbMap = new Map<string, any>();
    (dbRows || []).forEach(r => {
      if (r.ma_nhan_su) dbMap.set(r.ma_nhan_su.toUpperCase(), r);
    });

    const toAdd: any[] = [];
    const toUpdate: any[] = [];

    for (const item of parsedRows) {
      const key = item.ma_nhan_su.toUpperCase();
      const existing = dbMap.get(key);

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
          toUpdate.push({ ...item, id: existing.id });
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
            const { error: insErr } = await supabase.from("nhan_su").insert([{
              ma_nhan_su: item.ma_nhan_su,
              ten_nhan_su: item.ten_nhan_su,
              bo_phan: item.bo_phan,
              chuc_vu: item.chuc_vu,
              phu_trach: item.phu_trach,
              ngay_sinh: item.ngay_sinh,
              so_cccd: item.so_cccd,
              cap_ngay: item.cap_ngay,
              email: item.email,
              so_dien_thoai: item.so_dien_thoai,
              dia_chi: item.dia_chi,
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
            const { error: upErr } = await supabase
              .from("nhan_su")
              .update({
                ten_nhan_su: item.ten_nhan_su,
                bo_phan: item.bo_phan,
                chuc_vu: item.chuc_vu,
                phu_trach: item.phu_trach,
                ngay_sinh: item.ngay_sinh,
                so_cccd: item.so_cccd,
                cap_ngay: item.cap_ngay,
                email: item.email,
                so_dien_thoai: item.so_dien_thoai,
                dia_chi: item.dia_chi,
                updated_at: new Date().toISOString(),
              })
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
      const { error: insErr } = await supabase.from("nhan_su").insert([{
        ma_nhan_su: item.ma_nhan_su,
        ten_nhan_su: item.ten_nhan_su,
        bo_phan: item.bo_phan,
        chuc_vu: item.chuc_vu,
        phu_trach: item.phu_trach,
        ngay_sinh: item.ngay_sinh,
        so_cccd: item.so_cccd,
        cap_ngay: item.cap_ngay,
        email: item.email,
        so_dien_thoai: item.so_dien_thoai,
        dia_chi: item.dia_chi,
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
      const { error: upErr } = await supabase
        .from("nhan_su")
        .update({
          ten_nhan_su: item.ten_nhan_su,
          bo_phan: item.bo_phan,
          chuc_vu: item.chuc_vu,
          phu_trach: item.phu_trach,
          ngay_sinh: item.ngay_sinh,
          so_cccd: item.so_cccd,
          cap_ngay: item.cap_ngay,
          email: item.email,
          so_dien_thoai: item.so_dien_thoai,
          dia_chi: item.dia_chi,
          updated_at: new Date().toISOString(),
        })
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

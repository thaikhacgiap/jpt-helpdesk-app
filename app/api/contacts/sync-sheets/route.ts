import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function cleanText(val: any): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sheetUrl,
      sheetName = "Contact",
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

    let token = userAccessToken?.trim() || "";

    if (!token && userRefreshToken?.trim()) {
      try {
        token = await refreshUserAccessToken(userRefreshToken.trim(), userClientId, userClientSecret);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 401 });
      }
    }

    const fetchSheetData = async (accessToken: string) => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z5000`;
      return fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    };

    let sheetsRes = await fetchSheetData(token);

    if (sheetsRes.status === 401 && userRefreshToken?.trim()) {
      try {
        token = await refreshUserAccessToken(userRefreshToken.trim(), userClientId, userClientSecret);
        sheetsRes = await fetchSheetData(token);
      } catch (err: any) {
        return NextResponse.json({ success: false, error: "Token hết hạn: " + err.message }, { status: 401 });
      }
    }

    if (!sheetsRes.ok) {
      let msg = `Không thể đọc sheet tab "${sheetName}".`;
      try {
        const errJson = await sheetsRes.json();
        if (errJson?.error?.message) msg += ` Chi tiết: ${errJson.error.message}`;
      } catch {}
      return NextResponse.json({ success: false, error: msg }, { status: sheetsRes.status });
    }

    const sheetData = await sheetsRes.json();
    const rawRows: string[][] = sheetData.values || [];

    if (rawRows.length <= 1) {
      return NextResponse.json({ success: true, total: 0, created: 0, updated: 0, noChanges: true });
    }

    const headers = rawRows[0].map(h => cleanText(h).toLowerCase());

    const findCol = (...keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const idxCode = findCol("mã liên hệ", "ma_lien_he", "code", "mã lh", "mã");
    const idxCustCode = findCol("mã khách hàng", "mã kh", "customer_code", "cust_code");
    const idxCustName = findCol("tên khách hàng", "tên kh", "customer_name", "khách hàng", "doanh nghiệp", "công ty");
    const idxHoTen = findCol("họ và tên", "họ tên", "tên liên hệ", "ho_ten", "tên", "người liên hệ", "name", "contact");
    const idxBoPhan = findCol("bộ phận", "phòng ban", "bo_phan", "department");
    const idxChucDanh = findCol("chức danh", "chức vụ", "chuc_danh", "chuc_vu", "position", "vị trí");
    const idxMayBan = findCol("số máy bàn", "máy bàn", "so_may_ban", "tel", "phone");
    const idxDiDong = findCol("số di động", "di động", "so_di_dong", "mobile", "sđt", "điện thoại");
    const idxEmail = findCol("email", "mail", "hòm thư");
    const idxDiaChi = findCol("địa chỉ", "dia_chi", "address");
    const idxGhiChu = findCol("ghi chú", "ghi_chu", "note", "description");

    const parsedRows: any[] = [];
    const seenCodes = new Set<string>();

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.every(c => !c || cleanText(c) === "")) continue;

      const hoTen = idxHoTen >= 0 ? cleanText(row[idxHoTen]) : "";
      let code = idxCode >= 0 ? cleanText(row[idxCode]) : "";

      if (!code && hoTen) {
        code = `CTC-${String(r).padStart(3, "0")}`;
      }

      if (!hoTen && !code) continue;

      const dedupeKey = code.toUpperCase();
      if (seenCodes.has(dedupeKey)) continue;
      seenCodes.add(dedupeKey);

      parsedRows.push({
        code,
        customer_code: idxCustCode >= 0 ? cleanText(row[idxCustCode]) : "",
        customer_name: idxCustName >= 0 ? cleanText(row[idxCustName]) : "",
        ho_ten: hoTen,
        bo_phan: idxBoPhan >= 0 ? cleanText(row[idxBoPhan]) : "",
        chuc_danh: idxChucDanh >= 0 ? cleanText(row[idxChucDanh]) : "",
        so_may_ban: idxMayBan >= 0 ? cleanText(row[idxMayBan]) : "",
        so_di_dong: idxDiDong >= 0 ? cleanText(row[idxDiDong]) : "",
        email: idxEmail >= 0 ? cleanText(row[idxEmail]) : "",
        dia_chi: idxDiaChi >= 0 ? cleanText(row[idxDiaChi]) : "",
        ghi_chu: idxGhiChu >= 0 ? cleanText(row[idxGhiChu]) : "",
      });
    }

    const { data: dbRows } = await supabase.from("contacts").select("*");
    const dbMap = new Map<string, any>();
    (dbRows || []).forEach(r => {
      if (r.code) dbMap.set(r.code.toUpperCase(), r);
    });

    const toAdd: any[] = [];
    const toUpdate: any[] = [];

    for (const item of parsedRows) {
      const key = item.code.toUpperCase();
      const existing = dbMap.get(key);

      if (!existing) {
        toAdd.push(item);
      } else {
        const isDiff =
          (item.ho_ten && item.ho_ten !== (existing.ho_ten || "")) ||
          (item.customer_name && item.customer_name !== (existing.customer_name || "")) ||
          (item.bo_phan && item.bo_phan !== (existing.bo_phan || "")) ||
          (item.chuc_danh && item.chuc_danh !== (existing.chuc_danh || "")) ||
          (item.email && item.email !== (existing.email || "")) ||
          (item.so_di_dong && item.so_di_dong !== (existing.so_di_dong || ""));

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
            const { error: insErr } = await supabase.from("contacts").insert([{
              code: item.code,
              customer_code: item.customer_code || null,
              customer_name: item.customer_name || null,
              ho_ten: item.ho_ten,
              bo_phan: item.bo_phan || null,
              chuc_danh: item.chuc_danh || null,
              so_may_ban: item.so_may_ban || null,
              so_di_dong: item.so_di_dong || null,
              email: item.email || null,
              dia_chi: item.dia_chi || null,
              ghi_chu: item.ghi_chu || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);

            if (insErr) {
              errors++;
              errorLog.push({ type: "insert", name: item.ho_ten, code: item.code, message: insErr.message });
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
              name: item.ho_ten,
            });
          }

          // 2. UPDATE
          for (let i = 0; i < toUpdate.length; i++) {
            const item = toUpdate[i];
            const { error: upErr } = await supabase
              .from("contacts")
              .update({
                customer_code: item.customer_code || null,
                customer_name: item.customer_name || null,
                ho_ten: item.ho_ten,
                bo_phan: item.bo_phan || null,
                chuc_danh: item.chuc_danh || null,
                so_may_ban: item.so_may_ban || null,
                so_di_dong: item.so_di_dong || null,
                email: item.email || null,
                dia_chi: item.dia_chi || null,
                ghi_chu: item.ghi_chu || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            if (upErr) {
              errors++;
              errorLog.push({ type: "update", name: item.ho_ten, code: item.code, message: upErr.message });
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
              name: item.ho_ten,
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
      const { error: insErr } = await supabase.from("contacts").insert([{
        code: item.code,
        customer_code: item.customer_code || null,
        customer_name: item.customer_name || null,
        ho_ten: item.ho_ten,
        bo_phan: item.bo_phan || null,
        chuc_danh: item.chuc_danh || null,
        so_may_ban: item.so_may_ban || null,
        so_di_dong: item.so_di_dong || null,
        email: item.email || null,
        dia_chi: item.dia_chi || null,
        ghi_chu: item.ghi_chu || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      if (insErr) {
        errors++;
        errorLog.push({ type: "insert", name: item.ho_ten, code: item.code, message: insErr.message });
      } else {
        created++;
      }
    }

    for (const item of toUpdate) {
      const { error: upErr } = await supabase
        .from("contacts")
        .update({
          customer_code: item.customer_code || null,
          customer_name: item.customer_name || null,
          ho_ten: item.ho_ten,
          bo_phan: item.bo_phan || null,
          chuc_danh: item.chuc_danh || null,
          so_may_ban: item.so_may_ban || null,
          so_di_dong: item.so_di_dong || null,
          email: item.email || null,
          dia_chi: item.dia_chi || null,
          ghi_chu: item.ghi_chu || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (upErr) {
        errors++;
        errorLog.push({ type: "update", name: item.ho_ten, code: item.code, message: upErr.message });
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
    return NextResponse.json({ success: false, error: err.message || "Lỗi xử lý đồng bộ Liên hệ." }, { status: 500 });
  }
}

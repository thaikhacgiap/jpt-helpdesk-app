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
      sheetName = "Contract",
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
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:AZ5000`;
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

    // Mapping exactly to the 14 columns requested
    const idxContractNo = findCol("contract no", "contract_no", "mã hợp đồng", "số hợp đồng", "so hop dong", "contract");
    const idxProjectId = findCol("project id", "project_id", "mã dự án", "project");
    const idxStatus = findCol("status", "trạng thái", "tình trạng");
    const idxSignedDate = findCol("signed date", "signed_date", "ngày ký", "ngay ky");
    const idxExpiryDate = findCol("expiry date", "expiry_date", "ngày hết hạn", "ngay het han", "end date");
    const idxService = findCol("service", "dịch vụ", "dich vu", "loại dịch vụ");
    const idxContractType = findCol("contract type", "contract_type", "loại hợp đồng", "loai hop dong", "type");
    const idxDescription = findCol("description", "mô tả", "nội dung", "ghi chú", "note");
    const idxSupplier = findCol("supplier", "nhà cung cấp", "nha cung cap", "vendor");
    const idxEndUser = findCol("end user", "end_user", "người dùng cuối", "user cuối");
    const idxCustomer = findCol("customer", "khách hàng", "khach hang", "doanh nghiệp", "tên công ty", "client");
    const idxAm = findCol("am", "account manager", "phụ trách", "phu trach", "sales", "nhân viên kinh doanh");
    const idxTeam = findCol("team", "nhóm", "bộ phận", "phòng ban", "ttkd");
    const idxFy = findCol("fy", "năm tài chính", "năm", "fiscal year");

    const parsedRows: any[] = [];
    const seenCodes = new Set<string>();

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.every(c => !c || cleanText(c) === "")) continue;

      let contractNo = idxContractNo >= 0 ? cleanText(row[idxContractNo]) : "";

      if (!contractNo) {
        contractNo = `HD-${String(r).padStart(3, "0")}`;
      }

      // Deduplicate by CONTRACT NO
      const dedupeKey = contractNo.toUpperCase();
      if (seenCodes.has(dedupeKey)) continue;
      seenCodes.add(dedupeKey);

      parsedRows.push({
        contract_no: contractNo,
        project_id: idxProjectId >= 0 ? cleanText(row[idxProjectId]) : "",
        status: idxStatus >= 0 ? cleanText(row[idxStatus]) || "Active" : "Active",
        signed_date: idxSignedDate >= 0 ? cleanText(row[idxSignedDate]) : "",
        expiry_date: idxExpiryDate >= 0 ? cleanText(row[idxExpiryDate]) : "",
        service: idxService >= 0 ? cleanText(row[idxService]) : "",
        contract_type: idxContractType >= 0 ? cleanText(row[idxContractType]) || "Hợp đồng dịch vụ" : "Hợp đồng dịch vụ",
        description: idxDescription >= 0 ? cleanText(row[idxDescription]) : "",
        supplier: idxSupplier >= 0 ? cleanText(row[idxSupplier]) : "",
        end_user: idxEndUser >= 0 ? cleanText(row[idxEndUser]) : "",
        customer: idxCustomer >= 0 ? cleanText(row[idxCustomer]) : "",
        am: idxAm >= 0 ? cleanText(row[idxAm]) : "",
        team: idxTeam >= 0 ? cleanText(row[idxTeam]) : "",
        fy: idxFy >= 0 ? cleanText(row[idxFy]) : "",
      });
    }

    const { data: dbRows } = await supabase.from("contracts").select("*");
    const dbMap = new Map<string, any>();
    (dbRows || []).forEach(r => {
      if (r.contract_no) dbMap.set(r.contract_no.toUpperCase(), r);
    });

    const toAdd: any[] = [];
    const toUpdate: any[] = [];

    for (const item of parsedRows) {
      const key = item.contract_no.toUpperCase();
      const existing = dbMap.get(key);

      if (!existing) {
        toAdd.push(item);
      } else {
        const isDiff =
          (item.project_id && item.project_id !== (existing.project_id || "")) ||
          (item.status && item.status !== (existing.status || "")) ||
          (item.signed_date && item.signed_date !== (existing.signed_date || "")) ||
          (item.expiry_date && item.expiry_date !== (existing.expiry_date || "")) ||
          (item.service && item.service !== (existing.service || "")) ||
          (item.contract_type && item.contract_type !== (existing.contract_type || "")) ||
          (item.customer && item.customer !== (existing.customer || "")) ||
          (item.end_user && item.end_user !== (existing.end_user || "")) ||
          (item.supplier && item.supplier !== (existing.supplier || "")) ||
          (item.am && item.am !== (existing.am || "")) ||
          (item.team && item.team !== (existing.team || "")) ||
          (item.fy && item.fy !== (existing.fy || ""));

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
            const { error: insErr } = await supabase.from("contracts").insert([{
              contract_no: item.contract_no,
              project_id: item.project_id || null,
              status: item.status || "Active",
              signed_date: item.signed_date || null,
              expiry_date: item.expiry_date || null,
              service: item.service || null,
              contract_type: item.contract_type || "Hợp đồng dịch vụ",
              description: item.description || null,
              supplier: item.supplier || null,
              end_user: item.end_user || null,
              customer: item.customer || null,
              am: item.am || null,
              team: item.team || null,
              fy: item.fy || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);

            if (insErr) {
              errors++;
              errorLog.push({ type: "insert", code: item.contract_no, message: insErr.message });
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
              name: item.contract_no,
            });
          }

          // 2. UPDATE
          for (let i = 0; i < toUpdate.length; i++) {
            const item = toUpdate[i];
            const { error: upErr } = await supabase
              .from("contracts")
              .update({
                project_id: item.project_id || null,
                status: item.status || "Active",
                signed_date: item.signed_date || null,
                expiry_date: item.expiry_date || null,
                service: item.service || null,
                contract_type: item.contract_type || "Hợp đồng dịch vụ",
                description: item.description || null,
                supplier: item.supplier || null,
                end_user: item.end_user || null,
                customer: item.customer || null,
                am: item.am || null,
                team: item.team || null,
                fy: item.fy || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            if (upErr) {
              errors++;
              errorLog.push({ type: "update", code: item.contract_no, message: upErr.message });
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
              name: item.contract_no,
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
      const { error: insErr } = await supabase.from("contracts").insert([{
        contract_no: item.contract_no,
        project_id: item.project_id || null,
        status: item.status || "Active",
        signed_date: item.signed_date || null,
        expiry_date: item.expiry_date || null,
        service: item.service || null,
        contract_type: item.contract_type || "Hợp đồng dịch vụ",
        description: item.description || null,
        supplier: item.supplier || null,
        end_user: item.end_user || null,
        customer: item.customer || null,
        am: item.am || null,
        team: item.team || null,
        fy: item.fy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      if (insErr) {
        errors++;
        errorLog.push({ type: "insert", code: item.contract_no, message: insErr.message });
      } else {
        created++;
      }
    }

    for (const item of toUpdate) {
      const { error: upErr } = await supabase
        .from("contracts")
        .update({
          project_id: item.project_id || null,
          status: item.status || "Active",
          signed_date: item.signed_date || null,
          expiry_date: item.expiry_date || null,
          service: item.service || null,
          contract_type: item.contract_type || "Hợp đồng dịch vụ",
          description: item.description || null,
          supplier: item.supplier || null,
          end_user: item.end_user || null,
          customer: item.customer || null,
          am: item.am || null,
          team: item.team || null,
          fy: item.fy || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (upErr) {
        errors++;
        errorLog.push({ type: "update", code: item.contract_no, message: upErr.message });
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
    return NextResponse.json({ success: false, error: err.message || "Lỗi xử lý đồng bộ Hợp đồng." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function extractGid(url: string): string | null {
  const match = url.match(/gid=(\d+)/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sheetUrl, sheetName, userAccessToken, userRefreshToken, userClientId, userClientSecret } = body;

    const spreadsheetId = extractSpreadsheetId(sheetUrl || "");
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Cannot parse spreadsheet ID" }, { status: 400 });
    }

    // Setup OAuth
    const oauth2Client = new google.auth.OAuth2(userClientId || undefined, userClientSecret || undefined);
    let rToken = (userRefreshToken || "").trim();
    let aToken = (userAccessToken || "").trim();
    if (aToken && (aToken.startsWith("1//") || aToken.startsWith("1/"))) { rToken = aToken; aToken = ""; }
    oauth2Client.setCredentials({ access_token: aToken || undefined, refresh_token: rToken || undefined });
    if (rToken && userClientId && userClientSecret) {
      try { const t = await oauth2Client.getAccessToken(); if (t?.token) oauth2Client.setCredentials({ access_token: t.token, refresh_token: rToken }); } catch {}
    }

    const sheets = google.sheets({ version: "v4", auth: oauth2Client });

    // List all sheets to find correct tab name
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const allSheets = spreadsheetInfo.data.sheets?.map(s => ({
      title: s.properties?.title,
      sheetId: s.properties?.sheetId,
    })) || [];

    // Fetch data from the specified tab
    const range = sheetName ? `${sheetName}!A1:Z10` : "A1:Z10"; // First 10 rows for debug
    let sheetData: any = null;
    let sheetError: string | null = null;
    try {
      const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      sheetData = resp.data.values || [];
    } catch (e: any) {
      sheetError = e.message;
    }

    // Fetch DB customers (first 10)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: dbRows, error: dbError } = await supabase
      .from("customers")
      .select("id, system_code, code, name, ten_tieng_anh, tinh_trang")
      .order("created_at", { ascending: true })
      .limit(10);

    return NextResponse.json({
      spreadsheetId,
      allSheets,
      sheetNameUsed: sheetName || "(default)",
      rangeUsed: range,
      sheetFirstRows: sheetData?.slice(0, 5),  // first 5 rows
      sheetError,
      dbFirstRows: dbRows?.slice(0, 10),
      dbError: dbError?.message,
      dbTotal: (await supabase.from("customers").select("*", { count: "exact", head: true })).count,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

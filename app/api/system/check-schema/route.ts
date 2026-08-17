import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, string> = {};

    // Check existing columns via a simple select
    const { data: sampleRow, error: sampleErr } = await client
      .from("customers")
      .select("*")
      .limit(1);

    if (sampleErr) {
      return NextResponse.json({ success: false, error: sampleErr.message }, { status: 400 });
    }

    const existingCols = sampleRow && sampleRow[0] ? Object.keys(sampleRow[0]) : [];
    results["existing_columns"] = existingCols.join(", ");

    // Run DDL via rpc if service role is available, otherwise report needed SQL
    // Since we only have anon key, we can't run DDL directly.
    // Instead, return the migration SQL for the user to run manually.
    const migrationSQL = `
-- Chạy trong Supabase Dashboard > SQL Editor

ALTER TABLE customers ADD COLUMN IF NOT EXISTS system_code   VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ten_tieng_anh TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ttkd          VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phu_trach     VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ghi_chu       TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tinh_trang    VARCHAR(20) DEFAULT 'Active';

DROP POLICY IF EXISTS "Enable delete for all users" ON customers;
CREATE POLICY "Enable delete for all users" ON customers FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_customers_system_code ON customers(system_code);
CREATE INDEX IF NOT EXISTS idx_customers_name        ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_code        ON customers(code);
    `.trim();

    return NextResponse.json({
      success: true,
      existing_columns: existingCols,
      has_system_code: existingCols.includes("system_code"),
      has_ten_tieng_anh: existingCols.includes("ten_tieng_anh"),
      has_ttkd: existingCols.includes("ttkd"),
      has_phu_trach: existingCols.includes("phu_trach"),
      has_tinh_trang: existingCols.includes("tinh_trang"),
      migration_needed: !existingCols.includes("system_code") || !existingCols.includes("ten_tieng_anh"),
      migration_sql: migrationSQL,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

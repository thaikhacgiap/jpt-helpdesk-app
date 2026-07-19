import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Try creating the table by doing a raw SQL via rpc or checking if it exists
  // First, check if table exists by querying it
  const { error: checkError } = await supabase
    .from('nhan_su')
    .select('id')
    .limit(1)

  if (!checkError) {
    return NextResponse.json({ status: 'exists', message: 'Bảng nhan_su đã tồn tại!' })
  }

  // Table doesn't exist - return the SQL for user to run manually
  const sql = `-- Chạy SQL này trong Supabase Dashboard > SQL Editor
-- https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/sql/new

CREATE TABLE IF NOT EXISTS nhan_su (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_nhan_su VARCHAR(20) UNIQUE NOT NULL,
  ten_nhan_su VARCHAR(255) NOT NULL,
  bo_phan VARCHAR(100),
  chuc_vu VARCHAR(100),
  phu_trach VARCHAR(255),
  ngay_sinh DATE,
  so_cccd VARCHAR(20),
  cap_ngay DATE,
  email VARCHAR(255),
  so_dien_thoai VARCHAR(20),
  dia_chi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for nhan_su" ON nhan_su
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_nhan_su_ma ON nhan_su(ma_nhan_su);`

  return NextResponse.json({
    status: 'missing',
    message: 'Bảng nhan_su chưa tồn tại. Hãy chạy SQL bên dưới trong Supabase Dashboard.',
    sql,
    supabase_url: 'https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/sql/new',
    error: checkError.message,
  })
}

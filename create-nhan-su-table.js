// Script tạo bảng nhan_su trong Supabase
// Chạy: node create-nhan-su-table.js

const SUPABASE_URL = 'https://bxxzmfchmbhwoaazvjxb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'

async function createTable() {
  // Try inserting a test record - if table doesn't exist, we get a specific error
  const res = await fetch(`${SUPABASE_URL}/rest/v1/nhan_su?limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  })
  
  if (res.ok) {
    console.log('✅ Bảng nhan_su đã tồn tại!')
    return
  }
  
  const err = await res.text()
  console.log('❌ Bảng chưa tồn tại:', err)
  console.log('')
  console.log('👉 Vào Supabase Dashboard > SQL Editor và chạy SQL sau:')
  console.log('='.repeat(60))
  console.log(`
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

CREATE INDEX IF NOT EXISTS idx_nhan_su_ma ON nhan_su(ma_nhan_su);
  `)
  console.log('='.repeat(60))
}

createTable()

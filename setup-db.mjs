// Tạo bảng nhan_su qua Supabase Management API
// Chạy: node setup-db.mjs

const PROJECT_REF = 'bxxzmfchmbhwoaazvjxb'

// SQL để tạo bảng
const SQL = `
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

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'nhan_su' 
    AND policyname = 'Enable all for nhan_su'
  ) THEN
    CREATE POLICY "Enable all for nhan_su" ON nhan_su
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nhan_su_ma ON nhan_su(ma_nhan_su);
CREATE INDEX IF NOT EXISTS idx_nhan_su_created ON nhan_su(created_at);

SELECT 'Tao bang nhan_su thanh cong!' as result;
`

// Thử dùng Supabase DB API với anon key qua pg-meta endpoint
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'

async function tryPgMeta() {
  console.log('⏳ Đang thử Supabase pg-meta API...')
  
  try {
    const res = await fetch(`https://${PROJECT_REF}.supabase.co/pg-meta/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ query: SQL })
    })
    
    const text = await res.text()
    
    if (res.ok) {
      console.log('✅ Thành công!', text)
      return true
    }
    
    console.log(`  pg-meta status: ${res.status} - ${text.substring(0, 200)}`)
    return false
  } catch (e) {
    console.log('  pg-meta error:', e.message)
    return false
  }
}

async function tryRpc() {
  console.log('⏳ Đang thử via RPC...')
  
  try {
    const res = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ sql: SQL })
    })
    
    const text = await res.text()
    
    if (res.ok) {
      console.log('✅ Thành công!', text)
      return true
    }
    
    console.log(`  rpc status: ${res.status} - ${text.substring(0, 200)}`)
    return false
  } catch (e) {
    console.log('  rpc error:', e.message)
    return false
  }
}

async function checkTableExists() {
  const res = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/nhan_su?limit=1`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    }
  })
  return res.ok
}

async function main() {
  console.log('🔍 Kiểm tra bảng nhan_su...')
  
  if (await checkTableExists()) {
    console.log('✅ Bảng nhan_su đã tồn tại! Không cần làm gì thêm.')
    return
  }
  
  console.log('❌ Bảng chưa tồn tại.\n')
  
  // Try methods
  const ok1 = await tryPgMeta()
  if (!ok1) {
    await tryRpc()
  }
  
  // Final check
  if (await checkTableExists()) {
    console.log('\n🎉 Bảng nhan_su đã được tạo thành công!')
  } else {
    console.log('\n⚠️  Không thể tạo bảng tự động.')
    console.log('')
    console.log('📋 Vui lòng thực hiện THỦ CÔNG:')
    console.log('1. Đăng nhập Supabase: https://supabase.com/dashboard')
    console.log('2. Chọn project: bxxzmfchmbhwoaazvjxb')
    console.log('3. Vào: SQL Editor (menu bên trái)')
    console.log('4. Copy và chạy SQL từ file: nhan_su_migration.sql')
    console.log('')
    console.log('File migration: ' + process.cwd() + '\\nhan_su_migration.sql')
  }
}

main()

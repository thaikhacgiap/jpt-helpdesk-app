// Script tạo bảng nhan_su trực tiếp qua Supabase Management API
// Cần SERVICE ROLE KEY (không phải anon key)
//
// Cách lấy Service Role Key:
//   Vào: https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/settings/api
//   Copy "service_role" key (secret) 
//
// Chạy: node run-migration.js <service_role_key>

const https = require('https')

const SERVICE_ROLE_KEY = process.argv[2]
const PROJECT_REF = 'bxxzmfchmbhwoaazvjxb'

if (!SERVICE_ROLE_KEY) {
  console.log('❌ Thiếu service role key!')
  console.log('')
  console.log('Cách dùng: node run-migration.js <service_role_key>')
  console.log('')
  console.log('Lấy key tại: https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/settings/api')
  console.log('→ Mục "Project API keys" → copy "service_role"')
  process.exit(1)
}

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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nhan_su' AND policyname = 'Enable all for nhan_su'
  ) THEN
    CREATE POLICY "Enable all for nhan_su" ON nhan_su
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nhan_su_ma ON nhan_su(ma_nhan_su);
CREATE INDEX IF NOT EXISTS idx_nhan_su_created ON nhan_su(created_at);
`

const body = JSON.stringify({ query: SQL })

const options = {
  hostname: `${PROJECT_REF}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  }
}

// Try via Management API
const mgmtBody = JSON.stringify({ query: SQL })
const mgmtOptions = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(mgmtBody),
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  }
}

console.log('⏳ Đang tạo bảng nhan_su...')

const req = https.request(mgmtOptions, (res) => {
  let data = ''
  res.on('data', (chunk) => data += chunk)
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Tạo bảng thành công!')
      console.log('→ Bảng nhan_su đã sẵn sàng sử dụng.')
    } else {
      console.log(`⚠️ Status: ${res.statusCode}`)
      console.log('Response:', data)
      console.log('')
      console.log('👉 Hãy chạy SQL thủ công tại:')
      console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`)
    }
  })
})

req.on('error', (e) => {
  console.error('❌ Lỗi kết nối:', e.message)
})

req.write(mgmtBody)
req.end()

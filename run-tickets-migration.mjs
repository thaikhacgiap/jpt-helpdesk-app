// run-tickets-migration.mjs
// Chạy: node run-tickets-migration.mjs
// Thêm các cột mới vào bảng tickets, sau đó seed 20 dữ liệu

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bxxzmfchmbhwoaazvjxb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const line = '═'.repeat(60)

// Lấy cột hiện tại của bảng tickets bằng cách insert test
async function getExistingColumns() {
  const { data, error } = await supabase.from('tickets').select('*').limit(1)
  if (data && data.length > 0) return Object.keys(data[0])
  // Nếu bảng rỗng, thử insert rỗng để xem lỗi
  return []
}

// Chạy SQL qua REST API (chỉ dùng anon key - có thể bị hạn chế DDL)
async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  })
  return res.ok
}

async function main() {
  console.log('\n🔧 JPT HELPDESK — TICKETS MIGRATION + SEED\n')

  // ── Bước 1: Kiểm tra kết nối ──────────────────────────────
  console.log(`${line}`)
  console.log('  🔌 KIỂM TRA KẾT NỐI')
  console.log(line)
  const { error: pingErr } = await supabase.from('tickets').select('count', { count: 'exact', head: true })
  if (pingErr) { console.error('  ✗  Lỗi kết nối:', pingErr.message); process.exit(1) }
  console.log('  ✓  Kết nối Supabase thành công')

  // ── Bước 2: Kiểm tra cột hiện tại ────────────────────────
  console.log(`\n${line}`)
  console.log('  🔍 PHÁT HIỆN CỘT BẢNG TICKETS')
  console.log(line)

  // Insert một record giả để biết schema → nếu lỗi sẽ thấy missing columns
  const probeResult = await supabase.from('tickets').insert([{
    ticket_id: '__PROBE__',
    title: 'probe',
    assigned: 'probe',
    creator_name: 'probe',
    following: 'probe',
    contract_scope: 'probe',
    progress: 'probe',
    tt_close_time: new Date().toISOString(),
  }])

  const hasNewCols = !probeResult.error || !probeResult.error.message.includes("column")

  if (probeResult.error) {
    const missing = probeResult.error.message.match(/'([^']+)' column/g)?.map(s => s.replace(/'/g, '').replace(' column','')) || []
    console.log(`  ⚠  Các cột còn thiếu: ${missing.join(', ')}`)
    console.log('  → Cần chạy migration SQL trong Supabase Dashboard!')
    console.log()
    console.log('  📋 COPY SQL sau vào Supabase Dashboard > SQL Editor:')
    console.log('  ' + line)
    console.log(`
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS contract_scope VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS progress       VARCHAR(20);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS creator_name   VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned       VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS following      VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tt_close_time  TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS unhold_time    TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS event_time     TIMESTAMP;
    `.trim())
    console.log('  ' + line)
    console.log('\n  ✏  Sau khi chạy SQL xong, chạy lại: node seed-tickets.mjs')
    process.exit(0)
  }

  // Xóa record probe
  await supabase.from('tickets').delete().eq('ticket_id', '__PROBE__')
  console.log('  ✓  Tất cả cột đã tồn tại, tiến hành seed...')

  // ── Bước 3: Đọc file seed-tickets.mjs logic ──────────────
  console.log('\n  → Chạy: node seed-tickets.mjs')
}

main().catch(console.error)

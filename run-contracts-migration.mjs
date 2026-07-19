// run-contracts-migration-v2.mjs
// Chạy: node run-contracts-migration-v2.mjs
// Script này insert dữ liệu test VÀ tự thêm cột mới qua Supabase REST API

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bxxzmfchmbhwoaazvjxb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'

// Cố gắng dùng service_role key nếu có, không thì dùng anon key
// ALTER TABLE cần service_role hoặc thực thi thủ công
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Thêm cột mới qua Supabase SQL (nếu có quyền) ───────────────────────────
async function addColumnsViaRPC() {
  const statements = [
    `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_no VARCHAR(100)`,
    `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50) DEFAULT 'Hợp đồng dịch vụ'`,
    `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_date DATE`,
    `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255)`,
  ]

  for (const sql of statements) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ sql }),
      })
      if (!res.ok) {
        const txt = await res.text()
        console.warn(`  SQL RPC failed (${res.status}): ${txt.substring(0, 200)}`)
        return false
      }
    } catch (e) {
      console.warn('  RPC unavailable:', e.message)
      return false
    }
  }
  return true
}

// ─── Kiểm tra cột đã có chưa ────────────────────────────────────────────────
async function checkIfColumnsExist() {
  const { data, error } = await supabase
    .from('contracts')
    .insert([{
      code: '_SCHEMA_TEST_' + Date.now(),
      name: '_test_',
      contract_no: 'test',
      contract_type: 'test',
      owner_name: 'test',
    }])
    .select()

  if (error) {
    if (error.message.includes('contract_no') || error.message.includes('column')) {
      return false // Cột chưa tồn tại
    }
  }

  // Xóa bản ghi test
  if (data && data[0]) {
    await supabase.from('contracts').delete().eq('id', data[0].id)
  }
  return true
}

// ─── 20 mẫu dữ liệu ─────────────────────────────────────────────────────────
const SAMPLE_CONTRACTS = [
  { code:'CTR-001', contract_no:'ACB-02-20045', name:'Hợp đồng dịch vụ CNTT 2024',             contract_type:'Hợp đồng dịch vụ',             owner_name:'Quang', start_date:'2024-01-15', end_date:'2025-01-14', signed_date:'2024-01-10', status:'Active',   description:'Triển khai và bảo trì hệ thống CNTT cho ngân hàng ACB' },
  { code:'CTR-002', contract_no:'VCB-01-20046', name:'Hợp đồng bảo trì hệ thống',              contract_type:'Hợp đồng bảo trì',             owner_name:'Minh',  start_date:'2024-02-01', end_date:'2025-01-31', signed_date:'2024-01-25', status:'Active',   description:'Bảo trì định kỳ hệ thống core banking Vietcombank' },
  { code:'CTR-003', contract_no:'TCB-03-20047', name:'Hợp đồng cung cấp phần mềm',             contract_type:'Hợp đồng mua bán',             owner_name:'Linh',  start_date:'2024-03-01', end_date:'2026-02-28', signed_date:'2024-02-20', status:'Active',   description:'Cung cấp license phần mềm quản lý cho Techcombank' },
  { code:'CTR-004', contract_no:'BID-02-20048', name:'Hợp đồng thuê cloud infrastructure',     contract_type:'Hợp đồng thuê dịch vụ',        owner_name:'Quang', start_date:'2024-01-01', end_date:'2024-12-31', signed_date:'2023-12-28', status:'Active',   description:'Thuê hạ tầng cloud AWS cho BIDV' },
  { code:'CTR-005', contract_no:'VPB-01-20049', name:'Hợp đồng tư vấn chuyển đổi số',         contract_type:'Hợp đồng tư vấn',              owner_name:'Hùng',  start_date:'2024-04-01', end_date:'2024-09-30', signed_date:'2024-03-15', status:'Expired',  description:'Tư vấn chiến lược chuyển đổi số VPBank' },
  { code:'CTR-006', contract_no:'MBB-02-20050', name:'Hợp đồng bảo mật thông tin',             contract_type:'Hợp đồng dịch vụ',             owner_name:'Minh',  start_date:'2024-05-01', end_date:'2025-04-30', signed_date:'2024-04-22', status:'Active',   description:'Bảo mật và giám sát an ninh mạng MB Bank' },
  { code:'CTR-007', contract_no:'STB-03-20051', name:'Hợp đồng hỗ trợ kỹ thuật 24/7',        contract_type:'Hợp đồng bảo trì',             owner_name:'Linh',  start_date:'2024-06-01', end_date:'2025-05-31', signed_date:'2024-05-28', status:'Active',   description:'Hỗ trợ kỹ thuật toàn thời gian cho Sacombank' },
  { code:'CTR-008', contract_no:'HDB-01-20052', name:'Hợp đồng cung cấp thiết bị',             contract_type:'Hợp đồng mua bán',             owner_name:'Quang', start_date:'2024-02-15', end_date:'2024-06-30', signed_date:'2024-02-10', status:'Expired',  description:'Cung cấp server và thiết bị mạng cho HDBank' },
  { code:'CTR-009', contract_no:'LPB-02-20053', name:'Hợp đồng phát triển phần mềm',           contract_type:'Hợp đồng phát triển phần mềm', owner_name:'Hùng',  start_date:'2024-07-01', end_date:'2025-06-30', signed_date:'2024-06-20', status:'Active',   description:'Phát triển ứng dụng mobile banking cho LienPetroBank' },
  { code:'CTR-010', contract_no:'OCB-03-20054', name:'Hợp đồng đào tạo nhân viên',             contract_type:'Hợp đồng dịch vụ',             owner_name:'Minh',  start_date:'2024-08-01', end_date:'2024-11-30', signed_date:'2024-07-25', status:'Inactive', description:'Chương trình đào tạo CNTT cho nhân viên OCB' },
  { code:'CTR-011', contract_no:'TPB-01-20055', name:'Hợp đồng tích hợp hệ thống',             contract_type:'Hợp đồng dịch vụ',             owner_name:'Linh',  start_date:'2024-09-01', end_date:'2025-08-31', signed_date:'2024-08-20', status:'Active',   description:'Tích hợp API thanh toán và core banking TPBank' },
  { code:'CTR-012', contract_no:'BAB-02-20056', name:'Hợp đồng kiểm thử phần mềm',             contract_type:'Hợp đồng dịch vụ',             owner_name:'Quang', start_date:'2024-03-15', end_date:'2024-08-14', signed_date:'2024-03-10', status:'Expired',  description:'Kiểm thử toàn diện hệ thống phần mềm BAC A BANK' },
  { code:'CTR-013', contract_no:'NAB-03-20057', name:'Hợp đồng bảo trì phần cứng',             contract_type:'Hợp đồng bảo trì',             owner_name:'Hùng',  start_date:'2024-10-01', end_date:'2025-09-30', signed_date:'2024-09-15', status:'Active',   description:'Bảo trì định kỳ máy chủ và thiết bị Nam A Bank' },
  { code:'CTR-014', contract_no:'KLB-01-20058', name:'Hợp đồng triển khai ERP',                contract_type:'Hợp đồng phát triển phần mềm', owner_name:'Minh',  start_date:'2024-11-01', end_date:'2025-10-31', signed_date:'2024-10-22', status:'Active',   description:'Triển khai hệ thống ERP cho Kienlongbank' },
  { code:'CTR-015', contract_no:'PVB-02-20059', name:'Hợp đồng nâng cấp hệ thống',             contract_type:'Hợp đồng dịch vụ',             owner_name:'Linh',  start_date:'2024-04-01', end_date:'2024-07-31', signed_date:'2024-03-28', status:'Expired',  description:'Nâng cấp hệ thống core banking PVComBank' },
  { code:'CTR-016', contract_no:'VAB-03-20060', name:'Hợp đồng dịch vụ cloud',                 contract_type:'Hợp đồng thuê dịch vụ',        owner_name:'Quang', start_date:'2024-12-01', end_date:'2025-11-30', signed_date:'2024-11-20', status:'Active',   description:'Dịch vụ điện toán đám mây cho VietA Bank' },
  { code:'CTR-017', contract_no:'IVB-01-20061', name:'Hợp đồng tư vấn giải pháp',              contract_type:'Hợp đồng tư vấn',              owner_name:'Hùng',  start_date:'2025-01-01', end_date:'2025-12-31', signed_date:'2024-12-15', status:'Active',   description:'Tư vấn giải pháp công nghệ toàn diện cho IndovinaBank' },
  { code:'CTR-018', contract_no:'WOO-02-20062', name:'Hợp đồng outsource IT',                  contract_type:'Hợp đồng dịch vụ',             owner_name:'Minh',  start_date:'2025-01-15', end_date:'2026-01-14', signed_date:'2025-01-10', status:'Active',   description:'Dịch vụ outsource CNTT cho Woori Bank Việt Nam' },
  { code:'CTR-019', contract_no:'SHB-03-20063', name:'Hợp đồng xây dựng data center',          contract_type:'Hợp đồng mua bán',             owner_name:'Linh',  start_date:'2025-02-01', end_date:'2025-12-31', signed_date:'2025-01-25', status:'Active',   description:'Xây dựng trung tâm dữ liệu dự phòng SHB' },
  { code:'CTR-020', contract_no:'ABB-01-20064', name:'Hợp đồng giám sát hệ thống',             contract_type:'Hợp đồng dịch vụ',             owner_name:'Quang', start_date:'2025-03-01', end_date:'2026-02-28', signed_date:'2025-02-20', status:'Active',   description:'Giám sát 24/7 và cảnh báo sự cố hệ thống ABBank' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Kiểm tra schema hiện tại...')
  const columnsExist = await checkIfColumnsExist()

  if (!columnsExist) {
    console.log('⚠  Các cột mới chưa tồn tại. Đang thử thêm cột qua RPC...')
    const rpcOk = await addColumnsViaRPC()
    if (!rpcOk) {
      console.log('\n' + '='.repeat(60))
      console.log('❌ Không thể tự động thêm cột. Cần chạy SQL thủ công:')
      console.log('='.repeat(60))
      console.log('\nTruy cập Supabase Dashboard → SQL Editor → Chạy SQL sau:\n')
      console.log('ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_no VARCHAR(100);')
      console.log("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50) DEFAULT 'Hợp đồng dịch vụ';")
      console.log('ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_date DATE;')
      console.log('ALTER TABLE contracts ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);')
      console.log('\n' + '='.repeat(60))
      console.log('\nSau khi chạy SQL, chạy lại script này.\n')
      process.exit(1)
    }
  }

  console.log('\n🚀 Đang insert 20 mẫu hợp đồng...\n')

  let inserted = 0, skipped = 0, failed = 0

  for (const contract of SAMPLE_CONTRACTS) {
    const { data: existing } = await supabase
      .from('contracts')
      .select('code')
      .eq('code', contract.code)
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭  ${contract.code} đã tồn tại - bỏ qua`)
      skipped++
      continue
    }

    const { error } = await supabase.from('contracts').insert([contract])

    if (error) {
      console.error(`  ✗  ${contract.code} - LỖI: ${error.message}`)
      failed++
    } else {
      console.log(`  ✓  ${contract.code} | ${contract.contract_no} | ${contract.name.substring(0, 45)}`)
      inserted++
    }
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✅ Hoàn thành! Đã thêm: ${inserted} | Đã tồn tại: ${skipped} | Lỗi: ${failed}`)
}

main().catch(console.error)

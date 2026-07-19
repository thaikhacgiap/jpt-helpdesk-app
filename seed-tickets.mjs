// seed-tickets.mjs
// Chạy: node seed-tickets.mjs
// Xóa dữ liệu ticket cũ, tạo 20 ticket mới liên kết với customers, contracts, staff

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bxxzmfchmbhwoaazvjxb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const line = '═'.repeat(60)

// ═══════════════════════════════════════════════════════
// STEP 0: KIỂM TRA KẾT NỐI DATABASE
// ═══════════════════════════════════════════════════════
async function checkConnection() {
  console.log(`\n${line}`)
  console.log('  🔌 KIỂM TRA KẾT NỐI SUPABASE')
  console.log(line)
  console.log(`  URL : ${SUPABASE_URL}`)

  const start = Date.now()
  const { data, error } = await supabase.from('tickets').select('count', { count: 'exact', head: true })
  const ms = Date.now() - start

  if (error) {
    console.error(`  ✗  Kết nối thất bại: ${error.message}`)
    process.exit(1)
  }

  console.log(`  ✓  Kết nối thành công (${ms}ms)`)

  // Kiểm tra tất cả các bảng cần thiết
  const tables = ['tickets', 'customers', 'contracts', 'staff', 'nhan_su', 'contacts']
  for (const t of tables) {
    const { count, error: e } = await supabase.from(t).select('*', { count: 'exact', head: true })
    if (e) {
      console.log(`  ⚠  Bảng [${t}]: ${e.message}`)
    } else {
      console.log(`  ✓  Bảng [${t.padEnd(10)}]: ${count} bản ghi`)
    }
  }
}

// ═══════════════════════════════════════════════════════
// STEP 1: XÓA DỮ LIỆU TICKET CŨ
// ═══════════════════════════════════════════════════════
async function clearOldTickets() {
  console.log(`\n${line}`)
  console.log('  🗑  XÓA DỮ LIỆU TICKET CŨ')
  console.log(line)

  // Xóa bảng phụ trước (foreign key)
  const { error: e1, count: c1 } = await supabase.from('ticket_updates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log(`  ✓  ticket_updates : đã xóa ${c1 ?? '?'} bản ghi ${e1 ? '— LỖI: ' + e1.message : ''}`)

  const { error: e2, count: c2 } = await supabase.from('ticket_assigned').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log(`  ✓  ticket_assigned: đã xóa ${c2 ?? '?'} bản ghi ${e2 ? '— LỖI: ' + e2.message : ''}`)

  const { error: e3, count: c3 } = await supabase.from('ticket_following').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log(`  ✓  ticket_following: đã xóa ${c3 ?? '?'} bản ghi ${e3 ? '— LỖI: ' + e3.message : ''}`)

  const { error: e4, count: c4 } = await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (e4) {
    console.error(`  ✗  tickets: LỖI xóa — ${e4.message}`)
    process.exit(1)
  }
  console.log(`  ✓  tickets        : đã xóa ${c4 ?? '?'} bản ghi`)
}

// ═══════════════════════════════════════════════════════
// STEP 2: LẤY IDs CÁC BẢNG LIÊN KẾT
// ═══════════════════════════════════════════════════════
async function fetchReferences() {
  console.log(`\n${line}`)
  console.log('  📋 LẤY THÔNG TIN CÁC BẢNG LIÊN KẾT')
  console.log(line)

  // Customers
  const { data: customers, error: ce } = await supabase.from('customers').select('id, code, name').limit(20)
  if (ce || !customers?.length) {
    console.error('  ✗  Không tìm thấy dữ liệu customers. Hãy chạy seed-all-data.mjs trước!')
    process.exit(1)
  }
  console.log(`  ✓  Customers  : ${customers.length} bản ghi`)

  // Contracts
  const { data: contracts, error: coe } = await supabase.from('contracts').select('id, code, name, customer_id').limit(20)
  if (coe) console.warn(`  ⚠  Contracts  : ${coe.message}`)
  else console.log(`  ✓  Contracts  : ${contracts?.length ?? 0} bản ghi`)

  // Staff (nhan_su hoặc staff)
  const { data: staff, error: se } = await supabase.from('nhan_su').select('id, ma_nhan_su, ten_nhan_su').limit(20)
  if (se) console.warn(`  ⚠  Nhan_su    : ${se.message}`)
  else console.log(`  ✓  Nhan_su    : ${staff?.length ?? 0} bản ghi`)

  const { data: staffTable, error: ste } = await supabase.from('staff').select('id, name').limit(20)
  if (ste) console.warn(`  ⚠  Staff      : ${ste.message}`)
  else console.log(`  ✓  Staff      : ${staffTable?.length ?? 0} bản ghi`)

  return { customers, contracts: contracts || [], staff: staff || [], staffTable: staffTable || [] }
}

// ═══════════════════════════════════════════════════════
// STEP 3: TẠO 20 TICKET MỚI
// ═══════════════════════════════════════════════════════
async function seedTickets({ customers, contracts, staff, staffTable }) {
  console.log(`\n${line}`)
  console.log('  🎫 TẠO 20 TICKET MỚI')
  console.log(line)

  // Hàm lấy ngẫu nhiên
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const pickId = (arr) => arr.length ? arr[Math.floor(Math.random() * arr.length)].id : null

  // Lấy contract của customer nếu có
  const getContractForCustomer = (customerId) => {
    const match = contracts.filter(c => c.customer_id === customerId)
    return match.length ? match[0] : contracts[0] || null
  }

  const now = new Date()
  const daysAgo = (d) => new Date(now - d * 86400000).toISOString()
  const hoursAgo = (h) => new Date(now - h * 3600000).toISOString()

  // Dữ liệu 20 ticket
  const TICKETS_DATA = [
    {
      ticket_id: 'TT-20260621-001',
      title: 'Lỗi đăng nhập Internet Banking',
      description: 'Khách hàng không thể đăng nhập vào hệ thống Internet Banking sau khi đổi mật khẩu',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L1(Critical)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '4h',
      progress: '40%',
      hold_reason: null,
      remark: 'Cần kiểm tra log hệ thống',
      customerIndex: 0,
      createdDaysAgo: 0, hoursAgo: 2,
    },
    {
      ticket_id: 'TT-20260621-002',
      title: 'Triển khai module báo cáo tự động',
      description: 'Yêu cầu triển khai module tự động sinh báo cáo EOD cho hệ thống core banking',
      tt_type: 'Implementation',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L2(Major)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '8h',
      progress: '65%',
      hold_reason: null,
      remark: 'Đang test UAT',
      customerIndex: 1,
      createdDaysAgo: 2, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-003',
      title: 'Health-Check hệ thống server core',
      description: 'Kiểm tra định kỳ toàn bộ cụm server core banking, đảm bảo hiệu năng ổn định',
      tt_type: 'Health-Check',
      contract_scope: 'In scope',
      category: 'Hardware',
      priority: 'L3(Minor)',
      tt_status: 'Completed',
      sla_status: 'Under SLA',
      sla_time: '2h',
      progress: '100%',
      hold_reason: null,
      remark: 'Hoàn thành không có lỗi',
      customerIndex: 2,
      createdDaysAgo: 5, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-004',
      title: 'Tư vấn giải pháp bảo mật mạng',
      description: 'Tư vấn triển khai giải pháp Zero Trust Network Access cho hệ thống ngân hàng',
      tt_type: 'Consultation',
      contract_scope: 'Presale',
      category: 'Security',
      priority: 'L2(Major)',
      tt_status: 'On Hold',
      sla_status: 'Going to breach SLA',
      sla_time: '16h',
      progress: '30%',
      hold_reason: 'Chờ phê duyệt ngân sách từ Ban Giám đốc khách hàng',
      remark: 'Đã gửi đề xuất kỹ thuật',
      customerIndex: 3,
      createdDaysAgo: 7, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-005',
      title: 'Lỗi đồng bộ dữ liệu giao dịch',
      description: 'Dữ liệu giao dịch không đồng bộ giữa core system và hệ thống báo cáo, gây sai lệch số dư',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L1(Critical)',
      tt_status: 'In progress',
      sla_status: 'Failure SLA',
      sla_time: '4h',
      progress: '70%',
      hold_reason: null,
      remark: 'Đã xác định nguyên nhân, đang hotfix',
      customerIndex: 4,
      createdDaysAgo: 1, hoursAgo: 5,
    },
    {
      ticket_id: 'TT-20260621-006',
      title: 'Nâng cấp phần mềm ATM network',
      description: 'Cập nhật firmware và phần mềm cho toàn bộ 120 máy ATM trong hệ thống',
      tt_type: 'Implementation',
      contract_scope: 'In scope',
      category: 'Hardware',
      priority: 'L2(Major)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '24h',
      progress: '50%',
      hold_reason: null,
      remark: 'Đang thực hiện theo lịch trình ban đêm',
      customerIndex: 5,
      createdDaysAgo: 3, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-007',
      title: 'Sự cố đường truyền WAN chi nhánh Hà Nội',
      description: 'Chi nhánh Hà Nội mất kết nối WAN, không thể giao dịch trực tuyến',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Network',
      priority: 'L1(Critical)',
      tt_status: 'Completed',
      sla_status: 'Under SLA',
      sla_time: '2h',
      progress: '100%',
      hold_reason: null,
      remark: 'Đã khôi phục đường truyền backup, đang chờ ISP sửa đường chính',
      customerIndex: 6,
      createdDaysAgo: 4, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-008',
      title: 'Triển khai hệ thống Mobile Banking 2.0',
      description: 'Triển khai phiên bản mới Mobile Banking với tính năng thanh toán QR và biometric',
      tt_type: 'Implementation',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L2(Major)',
      tt_status: 'Reporting',
      sla_status: 'Under SLA',
      sla_time: '48h',
      progress: '90%',
      hold_reason: null,
      remark: 'Đang lập báo cáo nghiệm thu',
      customerIndex: 7,
      createdDaysAgo: 10, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-009',
      title: 'Kiểm tra bảo mật định kỳ (Penetration Test)',
      description: 'Thực hiện pentest hàng quý cho hệ thống ngân hàng lõi và ứng dụng web',
      tt_type: 'Health-Check',
      contract_scope: 'In scope',
      category: 'Security',
      priority: 'L2(Major)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '40h',
      progress: '55%',
      hold_reason: null,
      remark: 'Phát hiện 2 lỗ hổng medium, đang xử lý',
      customerIndex: 8,
      createdDaysAgo: 6, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-010',
      title: 'Lỗi in sao kê giao dịch',
      description: 'Khách hàng không in được sao kê giao dịch tháng qua trên ứng dụng',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L3(Minor)',
      tt_status: 'Completed',
      sla_status: 'Under SLA',
      sla_time: '8h',
      progress: '100%',
      hold_reason: null,
      remark: 'Đã fix bug, release hotfix 2.3.1',
      customerIndex: 9,
      createdDaysAgo: 8, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-011',
      title: 'Tư vấn triển khai Cloud hybrid',
      description: 'Tư vấn chiến lược di chuyển workload lên cloud hybrid (On-premise + AWS)',
      tt_type: 'Consultation',
      contract_scope: 'Presale',
      category: 'Cloud',
      priority: 'L3(Minor)',
      tt_status: 'On Hold',
      sla_status: 'Going to breach SLA',
      sla_time: '24h',
      progress: '20%',
      hold_reason: 'Chờ quyết định kỹ thuật từ phía khách hàng',
      remark: 'Đã trình bày giải pháp lần 1',
      customerIndex: 10,
      createdDaysAgo: 12, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-012',
      title: 'Sự cố hệ thống thanh toán liên ngân hàng',
      description: 'Giao dịch NAPAS bị timeout, ảnh hưởng toàn bộ thanh toán liên ngân hàng',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Network',
      priority: 'L1(Critical)',
      tt_status: 'Completed',
      sla_status: 'Failure SLA',
      sla_time: '2h',
      progress: '100%',
      hold_reason: null,
      remark: 'Đã khắc phục, nguyên nhân do timeout config sai',
      customerIndex: 11,
      createdDaysAgo: 9, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-013',
      title: 'Bảo trì UPS và hệ thống điện dự phòng',
      description: 'Kiểm tra và bảo trì định kỳ toàn bộ UPS tại data center',
      tt_type: 'Health-Check',
      contract_scope: 'In scope',
      category: 'Hardware',
      priority: 'L3(Minor)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '16h',
      progress: '75%',
      hold_reason: null,
      remark: 'Đang thay pin UPS rack 3',
      customerIndex: 12,
      createdDaysAgo: 1, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-014',
      title: 'Lỗi xác thực OTP qua SMS',
      description: 'Tin nhắn OTP không gửi đến khách hàng khi thực hiện giao dịch chuyển khoản',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L1(Critical)',
      tt_status: 'In progress',
      sla_status: 'Going to breach SLA',
      sla_time: '4h',
      progress: '60%',
      hold_reason: null,
      remark: 'Phối hợp với nhà mạng Viettel xử lý',
      customerIndex: 13,
      createdDaysAgo: 0, hoursAgo: 3,
    },
    {
      ticket_id: 'TT-20260621-015',
      title: 'Triển khai tích hợp API Fintech',
      description: 'Tích hợp Open API banking với đối tác Fintech theo chuẩn PSD2',
      tt_type: 'Implementation',
      contract_scope: 'Out scope',
      category: 'Software',
      priority: 'L2(Major)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '72h',
      progress: '35%',
      hold_reason: null,
      remark: 'Đang tích hợp theo tài liệu API v3',
      customerIndex: 14,
      createdDaysAgo: 14, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-016',
      title: 'Lỗi tính toán lãi suất tiết kiệm',
      description: 'Hệ thống tính sai lãi suất tiết kiệm cho sản phẩm kỳ hạn 6 tháng',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L1(Critical)',
      tt_status: 'Cancel',
      sla_status: 'Failure SLA',
      sla_time: '4h',
      progress: '0%',
      hold_reason: null,
      remark: 'Khách hàng tự xử lý, đóng ticket',
      customerIndex: 15,
      createdDaysAgo: 15, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-017',
      title: 'Đào tạo kỹ năng vận hành hệ thống mới',
      description: 'Đào tạo 50 nhân viên nghiệp vụ vận hành hệ thống core banking phiên bản mới',
      tt_type: 'Consultation',
      contract_scope: 'In scope',
      category: 'Other',
      priority: 'L3(Minor)',
      tt_status: 'Completed',
      sla_status: 'Under SLA',
      sla_time: '40h',
      progress: '100%',
      hold_reason: null,
      remark: 'Hoàn thành 3 buổi đào tạo, 50/50 nhân viên',
      customerIndex: 16,
      createdDaysAgo: 20, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-018',
      title: 'Nâng cấp hệ thống tường lửa Firewall',
      description: 'Thay thế và cấu hình lại hệ thống Firewall Palo Alto thế hệ mới',
      tt_type: 'Implementation',
      contract_scope: 'In scope',
      category: 'Security',
      priority: 'L2(Major)',
      tt_status: 'Reporting',
      sla_status: 'Under SLA',
      sla_time: '24h',
      progress: '95%',
      hold_reason: null,
      remark: 'Đang lập biên bản nghiệm thu',
      customerIndex: 17,
      createdDaysAgo: 18, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-019',
      title: 'Sự cố mất kết nối Core Banking',
      description: 'Toàn bộ hệ thống core banking mất kết nối database, dừng hoạt động giao dịch',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L1(Critical)',
      tt_status: 'Completed',
      sla_status: 'Failure SLA',
      sla_time: '1h',
      progress: '100%',
      hold_reason: null,
      remark: 'Failover thành công, uptime 99.95%',
      customerIndex: 18,
      createdDaysAgo: 22, hoursAgo: 0,
    },
    {
      ticket_id: 'TT-20260621-020',
      title: 'Health-Check hệ thống Disaster Recovery',
      description: 'Kiểm tra và diễn tập DR toàn hệ thống theo kế hoạch BCP hàng năm',
      tt_type: 'Health-Check',
      contract_scope: 'In scope',
      category: 'Cloud',
      priority: 'L2(Major)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '32h',
      progress: '45%',
      hold_reason: null,
      remark: 'Đang diễn tập failover tại DR site Hà Nội',
      customerIndex: 19,
      createdDaysAgo: 0, hoursAgo: 6,
    },
  ]

  // Tên nhân sự nội bộ (dùng để lưu vào trường text)
  const CREATORS = ['Nguyễn Văn Quang', 'Phạm Văn Hùng', 'Lê Thị Linh', 'Đặng Minh Tuấn', 'Võ Thị Thu Hà']
  const ASSIGNED = ['Đặng Minh Tuấn', 'Hồ Văn Thành', 'Cao Thị Phương', 'Lê Thị Linh', 'Trương Quốc Bảo']
  const FOLLOWING = ['Trần Thị Minh', 'Nguyễn Văn Quang', 'Phạm Văn Hùng']

  let inserted = 0, failed = 0

  for (let i = 0; i < TICKETS_DATA.length; i++) {
    const td = TICKETS_DATA[i]
    const customer = customers[td.customerIndex % customers.length]
    const contract = getContractForCustomer(customer.id)

    // Tính thời gian
    const createdAt = daysAgo(td.createdDaysAgo)
    const startTime = td.hoursAgo > 0 ? hoursAgo(td.hoursAgo) : daysAgo(td.createdDaysAgo)
    const endTime = td.tt_status === 'Completed' || td.tt_status === 'Cancel'
      ? daysAgo(Math.max(0, td.createdDaysAgo - 1))
      : null
    const closeTime = td.tt_status === 'Completed'
      ? daysAgo(Math.max(0, td.createdDaysAgo - 1))
      : null
    const holdTime = td.tt_status === 'On Hold' ? '2h 30m' : null
    const unholdTime = null

    const payload = {
      ticket_id:      td.ticket_id,
      title:          td.title,
      description:    td.description,
      customer_id:    customer.id,
      contract_id:    contract?.id || null,
      tt_type:        td.tt_type,
      contract_scope: td.contract_scope,        // lưu vào cột mới (nếu chưa có sẽ bỏ qua)
      category:       td.category,
      priority:       td.priority,
      tt_status:      td.tt_status,
      sla_status:     td.sla_status,
      sla_time:       td.sla_time,
      progress:       td.progress,
      hold_time:      holdTime,
      hold_reason:    td.hold_reason,
      remark:         td.remark,
      start_time:     startTime,
      end_time:       endTime,
      close_time:     closeTime,
      created_at:     createdAt,
      // Lưu tên nhân sự vào dữ liệu JSON (các trường này không phải FK)
      creator_name:   CREATORS[i % CREATORS.length],
      assigned:       ASSIGNED[i % ASSIGNED.length],
      following:      FOLLOWING[i % FOLLOWING.length],
    }

    // Thử insert với contract_scope, nếu lỗi do cột chưa tồn tại thì bỏ trường đó
    let { error } = await supabase.from('tickets').insert([payload])

    if (error && error.message.includes('contract_scope')) {
      // Thử lại không có contract_scope
      const { contract_scope, creator_name, assigned, following, progress, ...fallback } = payload
      const r2 = await supabase.from('tickets').insert([fallback])
      error = r2.error
    }

    if (error) {
      console.error(`  ✗  ${td.ticket_id} | LỖI: ${error.message}`)
      failed++
    } else {
      const icon = td.priority.includes('L1') ? '🔴' : td.priority.includes('L2') ? '🟠' : td.priority.includes('L3') ? '🟡' : '🔵'
      console.log(`  ${icon}  ${td.ticket_id} | ${customer.name.substring(0, 25).padEnd(25)} | ${td.tt_type.padEnd(20)} | ${td.tt_status}`)
      inserted++
    }
  }

  console.log(`\n  → Đã thêm: ${inserted} | Lỗi: ${failed}`)
  return { inserted, failed }
}

// ═══════════════════════════════════════════════════════
// STEP 4: XÁC NHẬN KẾT QUẢ
// ═══════════════════════════════════════════════════════
async function verifyResult() {
  console.log(`\n${line}`)
  console.log('  ✅ XÁC NHẬN KẾT QUẢ')
  console.log(line)

  const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
  console.log(`  Tổng số ticket trong DB : ${count}`)

  // Thống kê theo trạng thái
  const { data: all } = await supabase.from('tickets').select('tt_status, priority, sla_status')
  if (all) {
    const byStatus = {}
    const byPriority = {}
    const bySLA = {}
    all.forEach(t => {
      byStatus[t.tt_status] = (byStatus[t.tt_status] || 0) + 1
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1
      bySLA[t.sla_status] = (bySLA[t.sla_status] || 0) + 1
    })
    console.log('\n  Theo TT Status:')
    Object.entries(byStatus).forEach(([k, v]) => console.log(`    ${String(k).padEnd(15)}: ${v}`))
    console.log('\n  Theo Priority:')
    Object.entries(byPriority).forEach(([k, v]) => console.log(`    ${String(k).padEnd(15)}: ${v}`))
    console.log('\n  Theo SLA Status:')
    Object.entries(bySLA).forEach(([k, v]) => console.log(`    ${String(k).padEnd(25)}: ${v}`))
  }
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
async function main() {
  console.log('\n🚀 JPT HELPDESK — SEED TICKETS')
  console.log('   Supabase Cloud Database\n')

  await checkConnection()
  await clearOldTickets()
  const refs = await fetchReferences()
  await seedTickets(refs)
  await verifyResult()

  console.log(`\n${line}`)
  console.log('🎉 HOÀN THÀNH! Truy cập /tickets để xem dữ liệu mới.')
  console.log(line + '\n')
}

main().catch(console.error)

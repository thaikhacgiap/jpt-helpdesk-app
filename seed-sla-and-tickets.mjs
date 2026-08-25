// seed-sla-and-tickets.mjs
// Script tạo 10 SLA mẫu và 10 Ticket mẫu liên kết với Khách hàng, Hợp đồng và Nhân sự thực tế trong database

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bxxzmfchmbhwoaazvjxb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const line = '═'.repeat(70)

async function main() {
  console.log(`\n${line}`)
  console.log('  🚀 BẮT ĐẦU TẠO 10 SLA VÀ 10 TICKET MẪU')
  console.log(line)

  // 1. Lấy dữ liệu tham chiếu
  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .select('id, code, name')
    .limit(30)

  if (custErr || !customers || customers.length === 0) {
    console.error('  ✗ Không thể lấy danh sách khách hàng:', custErr?.message)
    return
  }

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, contract_no, customer, end_user, description')
    .limit(50)

  const { data: staffList } = await supabase
    .from('nhan_su')
    .select('id, ma_nhan_su, ten_nhan_su, chuc_vu')
    .limit(20)

  const staffNames = (staffList && staffList.length > 0)
    ? staffList.map(s => s.ten_nhan_su)
    : ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Minh D', 'Hoàng Thị E']

  console.log(`  ✓ Đã tải ${customers.length} khách hàng, ${contracts?.length || 0} hợp đồng, ${staffNames.length} nhân sự`)

  // ══════════════════════════════════════════════════════════
  // 2. TẠO 10 SLA MẪU (sla_settings)
  // ══════════════════════════════════════════════════════════
  console.log(`\n${line}`)
  console.log('  🛡  1. TẠO 10 SLA MẪU (BẢNG: sla_settings)')
  console.log(line)

  // Kiểm tra số lượng SLA hiện có để sinh ID tiếp theo
  const { data: lastSla } = await supabase
    .from('sla_settings')
    .select('sla_id')
    .order('created_at', { ascending: false })
    .limit(1)

  let startSlaIndex = 1
  if (lastSla && lastSla.length > 0 && lastSla[0].sla_id) {
    const num = parseInt(lastSla[0].sla_id.replace(/\D/g, '') || '0')
    startSlaIndex = num + 1
  }

  const sampleSlaConfigs = [
    {
      custIdx: 0,
      priority: 'L1',
      response_time: 15,    // 15 phút
      resolve_time: 120,    // 2 giờ
      note: 'Dịch vụ khẩn cấp - Core Banking / Hạ tầng trọng yếu'
    },
    {
      custIdx: 0,
      priority: 'L2',
      response_time: 30,    // 30 phút
      resolve_time: 240,    // 4 giờ
      note: 'Dịch vụ quan trọng - Hệ thống giao dịch phân tán'
    },
    {
      custIdx: 1,
      priority: 'L1',
      response_time: 10,    // 10 phút
      resolve_time: 60,     // 1 giờ
      note: 'Cam kết mức cao cấp 24/7 Enterprise'
    },
    {
      custIdx: 1,
      priority: 'L2',
      response_time: 45,    // 45 phút
      resolve_time: 360,    // 6 giờ
      note: 'Hỗ trợ nghiệp vụ & cơ sở dữ liệu'
    },
    {
      custIdx: 2,
      priority: 'L3',
      response_time: 120,   // 2 giờ
      resolve_time: 1440,   // 24 giờ (1 ngày)
      note: 'Bảo trì định kỳ phần mềm & thiết bị'
    },
    {
      custIdx: 2,
      priority: 'L4',
      response_time: 240,   // 4 giờ
      resolve_time: 2880,   // 48 giờ (2 ngày)
      note: 'Yêu cầu tư vấn & cấu hình bổ sung'
    },
    {
      custIdx: 3,
      priority: 'L1',
      response_time: 15,    // 15 phút
      resolve_time: 180,    // 3 giờ
      note: 'Giám sát an ninh mạng SOC/SIEM khẩn cấp'
    },
    {
      custIdx: 3,
      priority: 'L2',
      response_time: 60,    // 1 giờ
      resolve_time: 480,    // 8 giờ
      note: 'Cảnh báo sự cố đường truyền WAN/VPN'
    },
    {
      custIdx: 4,
      priority: 'L2',
      response_time: 30,    // 30 phút
      resolve_time: 300,    // 5 giờ
      note: 'Dịch vụ hạ tầng điện toán đám mây Cloud'
    },
    {
      custIdx: 4,
      priority: 'L3',
      response_time: 180,   // 3 giờ
      resolve_time: 1440,   // 24 giờ
      note: 'Yêu cầu nâng cấp phân quyền và mở rộng tài nguyên'
    }
  ]

  const slaRecordsToInsert = sampleSlaConfigs.map((cfg, idx) => {
    const cust = customers[cfg.custIdx % customers.length]
    const contr = contracts && contracts.length > 0 ? contracts[idx % contracts.length] : null
    const slaIdNumber = String(startSlaIndex + idx).padStart(3, '0')

    return {
      sla_id: `SLA-${slaIdNumber}`,
      customer_id: cust.id,
      customer_name: cust.name,
      contract_id: contr ? contr.id : null,
      contract_no: contr ? contr.contract_no : null,
      priority: cfg.priority,
      response_time: cfg.response_time,
      resolve_time: cfg.resolve_time,
      created_at: new Date(Date.now() - (10 - idx) * 3600000 * 24).toISOString()
    }
  })

  const { data: insertedSLA, error: slaInsertErr } = await supabase
    .from('sla_settings')
    .insert(slaRecordsToInsert)
    .select()

  if (slaInsertErr) {
    console.error('  ✗ Lỗi chèn SLA:', slaInsertErr.message)
  } else {
    console.log(`  ✓ Đã chèn thành công ${insertedSLA.length} SLA mẫu:`)
    insertedSLA.forEach((sla, i) => {
      console.log(`    [${sla.sla_id}] ${sla.priority.padEnd(4)} | Phản hồi: ${sla.response_time}p | Giải quyết: ${sla.resolve_time}p | KH: ${sla.customer_name?.substring(0, 30)}... | HĐ: ${sla.contract_no || 'N/A'}`)
    })
  }

  // ══════════════════════════════════════════════════════════
  // 3. TẠO 10 TICKET MẪU (tickets)
  // ══════════════════════════════════════════════════════════
  console.log(`\n${line}`)
  console.log('  🎫  2. TẠO 10 TICKET MẪU (BẢNG: tickets)')
  console.log(line)

  const dateNow = new Date()
  const todayStr = dateNow.getFullYear().toString()
    + String(dateNow.getMonth() + 1).padStart(2, '0')
    + String(dateNow.getDate()).padStart(2, '0')

  // Tìm ticket ID lớn nhất hôm nay
  const { data: lastTicket } = await supabase
    .from('tickets')
    .select('ticket_id')
    .like('ticket_id', `TK-${todayStr}-%`)
    .order('ticket_id', { ascending: false })
    .limit(1)

  let startTicketIndex = 1
  if (lastTicket && lastTicket.length > 0 && lastTicket[0].ticket_id) {
    const seq = parseInt(lastTicket[0].ticket_id.split('-').pop() || '0', 10)
    startTicketIndex = seq + 1
  }

  const sampleTicketsData = [
    {
      title: 'Sự cố ngắt kết nối hệ thống Core Database',
      description: 'Hệ thống database chính tại DC xuất hiện hiện tượng high connection pool và không phản hồi truy vấn từ ứng dụng giao dịch.',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Database',
      priority: 'L1(Critical)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '2h',
      progress: '45%',
      hold_reason: null,
      remark: 'Đang giải phóng connection pool và kiểm tra slow query lock.',
      assigned: [staffNames[0], staffNames[2]],
      following: [staffNames[1]],
      creator_name: staffNames[0],
      custIdx: 0,
      hoursAgo: 1
    },
    {
      title: 'Triển khai cấu hình bảo mật Firewall Fortinet chi nhánh',
      description: 'Thiết lập policy bảo mật mới, kích hoạt IPS, Web Filtering và cấu hình VPN Site-to-Site kết nối về HO cho chi nhánh miền Nam.',
      tt_type: 'Implementation',
      contract_scope: 'In scope',
      category: 'Security',
      priority: 'L2(Major)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '6h',
      progress: '70%',
      hold_reason: null,
      remark: 'Đã hoàn thành cấu hình cơ bản, đang chờ khách hàng test thông luồng VPN.',
      assigned: [staffNames[2]],
      following: [staffNames[0], staffNames[3]],
      creator_name: staffNames[1],
      custIdx: 1,
      hoursAgo: 3
    },
    {
      title: 'Kiểm tra định kỳ và đánh giá hiệu năng Server HPE (Health-Check)',
      description: 'Thực hiện kiểm tra định kỳ phần cứng server rack HPE ProLiant Gen10, cập nhật iLO firmware, kiểm tra tình trạng RAID và ổ đĩa SSD.',
      tt_type: 'Health-Check',
      contract_scope: 'In scope',
      category: 'Hardware',
      priority: 'L3(Minor)',
      tt_status: 'Completed',
      sla_status: 'Under SLA',
      sla_time: '24h',
      progress: '100%',
      hold_reason: null,
      remark: 'Tất cả phần cứng hoạt động bình thường, đã bàn giao biên bản nghiệm thu bảo trì.',
      assigned: [staffNames[3]],
      following: [staffNames[2]],
      creator_name: staffNames[3],
      custIdx: 2,
      hoursAgo: 28
    },
    {
      title: 'Tư vấn giải pháp Zero Trust & Endpoint Protection EDR',
      description: 'Khảo sát hiện trạng hệ thống máy trạm và máy chủ, lập phương án kiến trúc triển khai giải pháp Microsoft Defender for Endpoint / CrowdStrike.',
      tt_type: 'Consultation',
      contract_scope: 'Presale',
      category: 'Security',
      priority: 'L3(Minor)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '48h',
      progress: '60%',
      hold_reason: null,
      remark: 'Đã hoàn thiện tài liệu PoC và gửi demo kế hoạch cho khách hàng.',
      assigned: [staffNames[1], staffNames[4]],
      following: [staffNames[0]],
      creator_name: staffNames[1],
      custIdx: 3,
      hoursAgo: 12
    },
    {
      title: 'Cảnh báo vi phạm SLA: Lỗi tích hợp Webhook thanh toán',
      description: 'Cổng thanh toán điện tử trả mã lỗi 504 Gateway Timeout khi đồng bộ trạng thái giao dịch với đối tác ngân hàng.',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Software',
      priority: 'L1(Critical)',
      tt_status: 'In progress',
      sla_status: 'Going to breach SLA',
      sla_time: '1h 30m',
      progress: '80%',
      hold_reason: null,
      remark: 'Đang phối hợp với đội DevOps đối tác kiểm tra API gateway & timeout policy.',
      assigned: [staffNames[2], staffNames[0]],
      following: [staffNames[1]],
      creator_name: staffNames[2],
      custIdx: 4,
      hoursAgo: 1.2
    },
    {
      title: 'Tạm dừng xử lý: Chờ khách hàng cung cấp chứng chỉ SSL mới',
      description: 'Gia hạn chứng chỉ SSL Wildcard cho hệ thống portal dịch vụ công trực tuyến.',
      tt_type: 'Implementation',
      contract_scope: 'In scope',
      category: 'Cloud',
      priority: 'L2(Major)',
      tt_status: 'On Hold',
      sla_status: 'Under SLA',
      sla_time: '8h',
      progress: '30%',
      hold_reason: 'Chờ khách hàng bàn giao file private key & CRT mới được cấp từ CA',
      remark: 'Đã gửi email nhắc nhở liên hệ phụ trách CNTT của khách hàng.',
      assigned: [staffNames[3]],
      following: [staffNames[0]],
      creator_name: staffNames[3],
      custIdx: 0,
      hoursAgo: 18
    },
    {
      title: 'Sự cố trễ SLA: Mất kết nối đường truyền cáp quang WAN quốc tế',
      description: 'Đường truyền kênh thuê riêng MPLS đi Singapore bị suy hao tín hiệu gây chập chờn dịch vụ đồng bộ đám mây.',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Network',
      priority: 'L1(Critical)',
      tt_status: 'In progress',
      sla_status: 'Failure SLA',
      sla_time: '4h',
      progress: '65%',
      hold_reason: null,
      remark: 'Sự cố đứt cáp quang biển của ISP, đã chuyển lưu lượng tạm thời sang tuyến backup.',
      assigned: [staffNames[0], staffNames[3]],
      following: [staffNames[1]],
      creator_name: staffNames[0],
      custIdx: 1,
      hoursAgo: 6
    },
    {
      title: 'Nâng cấp cụm Cluster Kubernetes và Service Mesh',
      description: 'Thực hiện rolling update cụm K8s production từ phiên bản v1.27 lên v1.29 kèm cấu hình Istio Ingress.',
      tt_type: 'Implementation',
      contract_scope: 'In scope',
      category: 'Cloud',
      priority: 'L2(Major)',
      tt_status: 'Reporting',
      sla_status: 'Under SLA',
      sla_time: '12h',
      progress: '90%',
      hold_reason: null,
      remark: 'Đã hoàn tất nâng cấp cluster thành công không gián đoạn, đang tổng hợp báo cáo UAT.',
      assigned: [staffNames[2]],
      following: [staffNames[0], staffNames[4]],
      creator_name: staffNames[2],
      custIdx: 2,
      hoursAgo: 8
    },
    {
      title: 'Cấu hình phân quyền Active Directory & File Server SMB',
      description: 'Tạo nhóm OU mới, thiết lập group policy GPO bảo mật mật khẩu và phân quyền truy cập thư mục tài liệu dự án.',
      tt_type: 'Technical support',
      contract_scope: 'In scope',
      category: 'Other',
      priority: 'L3(Minor)',
      tt_status: 'Completed',
      sla_status: 'Under SLA',
      sla_time: '8h',
      progress: '100%',
      hold_reason: null,
      remark: 'Đã bàn giao tài khoản và hướng dẫn nhân sự mới truy cập hệ thống.',
      assigned: [staffNames[4]],
      following: [staffNames[1]],
      creator_name: staffNames[4],
      custIdx: 3,
      hoursAgo: 36
    },
    {
      title: 'Khảo sát và lập phương án di chuyển hạ tầng lên AWS',
      description: 'Đánh giá ứng dụng legacy, kiến trúc cơ sở dữ liệu Oracle để xây dựng lộ trình Migrate to Cloud sang AWS Aurora & ECS.',
      tt_type: 'Consultation',
      contract_scope: 'Presale',
      category: 'Cloud',
      priority: 'L4(Warning)',
      tt_status: 'In progress',
      sla_status: 'Under SLA',
      sla_time: '72h',
      progress: '40%',
      hold_reason: null,
      remark: 'Đang phân tích sizing tài nguyên và chi phí TCO dự kiến cho 3 năm.',
      assigned: [staffNames[1], staffNames[0]],
      following: [staffNames[2]],
      creator_name: staffNames[1],
      custIdx: 4,
      hoursAgo: 14
    }
  ]

  const ticketRecordsToInsert = sampleTicketsData.map((t, idx) => {
    const cust = customers[t.custIdx % customers.length]
    const contr = contracts && contracts.length > 0 ? contracts[idx % contracts.length] : null
    const ticketSeq = String(startTicketIndex + idx).padStart(3, '0')
    const ticketId = `TK-${todayStr}-${ticketSeq}`
    const createdAt = new Date(Date.now() - t.hoursAgo * 3600000).toISOString()
    const startTime = new Date(Date.now() - (t.hoursAgo - 0.5) * 3600000).toISOString()
    const endTime = t.tt_status === 'Completed' ? new Date(Date.now() - 3600000).toISOString() : null

    return {
      ticket_id: ticketId,
      title: t.title,
      description: t.description,
      customer_id: cust.id,
      customer_name: cust.name,
      contract_id: contr ? contr.id : null,
      contract_no: contr ? contr.contract_no : null,
      tt_type: t.tt_type,
      contract_scope: t.contract_scope,
      category: t.category,
      priority: t.priority,
      creator_name: t.creator_name,
      assigned: t.assigned.join(', '),
      following: t.following.join(', '),
      tt_status: t.tt_status,
      sla_status: t.sla_status,
      sla_time: t.sla_time,
      progress: t.progress,
      hold_reason: t.hold_reason,
      remark: t.remark,
      start_time: startTime,
      end_time: endTime,
      tt_close_time: t.tt_status === 'Completed' ? endTime : null,
      created_at: createdAt,
      updated_at: new Date().toISOString()
    }
  })

  const { data: insertedTickets, error: ticketInsertErr } = await supabase
    .from('tickets')
    .insert(ticketRecordsToInsert)
    .select()

  if (ticketInsertErr) {
    console.error('  ✗ Lỗi chèn Tickets:', ticketInsertErr.message)
  } else {
    console.log(`  ✓ Đã chèn thành công ${insertedTickets.length} Ticket mẫu:`)
    insertedTickets.forEach((t, i) => {
      console.log(`    [${t.ticket_id}] [${t.priority}] [${t.tt_status}] ${t.title} (${t.customer_name?.substring(0, 25)}...)`)
    })
  }

  console.log(`\n${line}`)
  console.log('  🎉 HOÀN THÀNH TẠO 10 SLA VÀ 10 TICKET MẪU THÀNH CÔNG!')
  console.log(line)
}

main().catch(console.error)

// seed-contacts-only.mjs
// Chạy: node seed-contacts-only.mjs
// Insert 20 mẫu Liên hệ vào bảng contacts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://bxxzmfchmbhwoaazvjxb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'
)

// Kiểm tra cột hiện có của contacts
async function getContactsColumns() {
  const { data } = await supabase.from('contacts').select('*').limit(1)
  if (data && data.length > 0) return Object.keys(data[0])
  // Thử insert rỗng để xem lỗi
  return null
}

// Build record dựa theo cột thực tế
function buildRecord(r, cols) {
  const base = {
    code: r.code,
    customer_code: r.customer_code,
    customer_name: r.customer_name,
    email: r.email,
    dia_chi: r.dia_chi,
    ghi_chu: r.ghi_chu,
  }

  // name hoặc ho_ten
  if (cols.includes('ho_ten')) base.ho_ten = r.ho_ten
  if (cols.includes('name'))   base.name   = r.ho_ten  // contacts.name = họ tên

  // bo_phan
  if (cols.includes('bo_phan'))   base.bo_phan   = r.bo_phan
  if (cols.includes('position'))  base.position  = r.chuc_danh  // fallback

  // chuc_danh
  if (cols.includes('chuc_danh')) base.chuc_danh = r.chuc_danh

  // so_may_ban, so_di_dong, phone
  if (cols.includes('so_may_ban'))  base.so_may_ban  = r.so_may_ban
  if (cols.includes('so_di_dong'))  base.so_di_dong  = r.so_di_dong
  if (cols.includes('phone'))       base.phone       = r.so_di_dong  // fallback

  return base
}

const CONTACTS_DATA = [
  { code:'CTC-001', ho_ten:'Nguyễn Thị Bảo Châu',    customer_code:'BANK-ACB', customer_name:'Ngân hàng TMCP Á Châu (ACB)',                             bo_phan:'Phòng CNTT',         chuc_danh:'Trưởng phòng CNTT',    so_may_ban:'028-3824-3030 (305)', so_di_dong:'0901112233', email:'chau.ntb@acb.com.vn',    dia_chi:'442 Nguyễn Thị Minh Khai, Q.3, TP.HCM',    ghi_chu:'Đầu mối liên hệ kỹ thuật' },
  { code:'CTC-002', ho_ten:'Trần Văn Phúc',           customer_code:'BANK-ACB', customer_name:'Ngân hàng TMCP Á Châu (ACB)',                             bo_phan:'Phòng CNTT',         chuc_danh:'Kỹ sư CNTT',           so_may_ban:'028-3824-3030 (306)', so_di_dong:'0912223344', email:'phuc.tv@acb.com.vn',     dia_chi:'442 Nguyễn Thị Minh Khai, Q.3, TP.HCM',    ghi_chu:'Hỗ trợ kỹ thuật hệ thống' },
  { code:'CTC-003', ho_ten:'Lê Minh Hải',             customer_code:'BANK-VCB', customer_name:'Ngân hàng TMCP Ngoại Thương (Vietcombank)',              bo_phan:'Ban CNTT',           chuc_danh:'Phó trưởng ban CNTT',  so_may_ban:'024-3826-9486 (201)', so_di_dong:'0923334455', email:'hai.lm@vietcombank.com.vn', dia_chi:'198 Trần Quang Khải, Hoàn Kiếm, HN',        ghi_chu:'Liên hệ chính dự án' },
  { code:'CTC-004', ho_ten:'Phạm Thị Lan Anh',        customer_code:'BANK-VCB', customer_name:'Ngân hàng TMCP Ngoại Thương (Vietcombank)',              bo_phan:'Ban CNTT',           chuc_danh:'Chuyên viên CNTT',     so_may_ban:'024-3826-9486 (202)', so_di_dong:'0934445566', email:'lanh.pt@vietcombank.com.vn', dia_chi:'198 Trần Quang Khải, Hoàn Kiếm, HN',       ghi_chu:'Phụ trách hệ thống báo cáo' },
  { code:'CTC-005', ho_ten:'Võ Quang Trường',          customer_code:'BANK-TCB', customer_name:'Ngân hàng TMCP Kỹ Thương (Techcombank)',                bo_phan:'Trung tâm CNTT',     chuc_danh:'Giám đốc CNTT',        so_may_ban:'024-3944-6811 (101)', so_di_dong:'0945556677', email:'truong.vq@techcombank.com.vn', dia_chi:'191 Bà Triệu, Hai Bà Trưng, HN',           ghi_chu:'Decision maker' },
  { code:'CTC-006', ho_ten:'Đỗ Văn Thắng',            customer_code:'BANK-BID', customer_name:'Ngân hàng TMCP Đầu Tư & Phát Triển (BIDV)',             bo_phan:'Trung tâm CNTT',     chuc_danh:'Kỹ sư hệ thống',       so_may_ban:'024-2220-0588 (301)', so_di_dong:'0956667788', email:'thang.dv@bidv.com.vn',   dia_chi:'35 Hàng Vôi, Hoàn Kiếm, HN',               ghi_chu:'Phụ trách infrastructure' },
  { code:'CTC-007', ho_ten:'Nguyễn Hoàng Nam',        customer_code:'BANK-VPB', customer_name:'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',          bo_phan:'Khối CNTT',          chuc_danh:'Tech Lead',             so_may_ban:'024-3936-6688 (201)', so_di_dong:'0967778899', email:'nam.nh@vpbank.com.vn',   dia_chi:'89 Láng Hạ, Đống Đa, HN',                  ghi_chu:'Chuyển đổi số - đầu mối chính' },
  { code:'CTC-008', ho_ten:'Bùi Thị Thanh Tâm',       customer_code:'BANK-MBB', customer_name:'Ngân hàng TMCP Quân Đội (MB Bank)',                     bo_phan:'Phòng CNTT',         chuc_danh:'Trưởng nhóm bảo mật',  so_may_ban:'024-3826-8888 (401)', so_di_dong:'0978889900', email:'tam.btt@mbbank.com.vn',  dia_chi:'18 Lê Văn Lương, Cầu Giấy, HN',            ghi_chu:'Bảo mật thông tin' },
  { code:'CTC-009', ho_ten:'Phan Minh Khoa',          customer_code:'BANK-STB', customer_name:'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)',          bo_phan:'Phòng IT',           chuc_danh:'IT Manager',            so_may_ban:'028-3826-6011 (201)', so_di_dong:'0989990011', email:'khoa.pm@sacombank.com',  dia_chi:'266 Nam Kỳ Khởi Nghĩa, Q.3, TP.HCM',       ghi_chu:'Phụ trách 24/7 support' },
  { code:'CTC-010', ho_ten:'Trương Thị Mai',          customer_code:'BANK-HDB', customer_name:'Ngân hàng TMCP Phát Triển TP.HCM (HDBank)',              bo_phan:'IT Department',      chuc_danh:'IT Specialist',         so_may_ban:'028-3827-0270 (101)', so_di_dong:'0900001122', email:'mai.tt@hdbank.com.vn',   dia_chi:'25 Bis Nguyễn Thị Minh Khai, Q.1, TP.HCM', ghi_chu:'Thiết bị phần cứng' },
  { code:'CTC-011', ho_ten:'Lý Văn Thịnh',            customer_code:'BANK-LPB', customer_name:'Ngân hàng TMCP Bưu Điện Liên Việt (LienPetroBank)',      bo_phan:'Ban CNTT',           chuc_danh:'Kỹ sư mobile',         so_may_ban:'024-6295-6688 (301)', so_di_dong:'0911112233', email:'thinh.lv@lienvietpostbank.com.vn', dia_chi:'32 Nguyễn Công Trứ, HN', ghi_chu:'Mobile banking project' },
  { code:'CTC-012', ho_ten:'Hoàng Thị Phương Linh',   customer_code:'BANK-OCB', customer_name:'Ngân hàng TMCP Phương Đông (OCB)',                        bo_phan:'Phòng CNTT',         chuc_danh:'Training Coordinator',  so_may_ban:'028-3921-4398 (201)', so_di_dong:'0922223344', email:'linh.htp@ocb.com.vn',    dia_chi:'41 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM',   ghi_chu:'Đầu mối đào tạo' },
  { code:'CTC-013', ho_ten:'Dương Quang Vinh',        customer_code:'BANK-TPB', customer_name:'Ngân hàng TMCP Tiên Phong (TPBank)',                      bo_phan:'Trung tâm Công nghệ', chuc_danh:'Integration Architect', so_may_ban:'024-3737-8888 (301)', so_di_dong:'0933334455', email:'vinh.dq@tpb.com.vn',     dia_chi:'57 Lý Thường Kiệt, Hoàn Kiếm, HN',         ghi_chu:'Tích hợp API' },
  { code:'CTC-014', ho_ten:'Ngô Thị Hồng Nhung',      customer_code:'BANK-NAB', customer_name:'Ngân hàng TMCP Nam Á (Nam A Bank)',                      bo_phan:'Phòng CNTT',         chuc_danh:'Kỹ sư phần cứng',      so_may_ban:'028-3936-9016 (201)', so_di_dong:'0944445566', email:'nhung.nth@namabank.com.vn', dia_chi:'201 CMT8, Q.3, TP.HCM',                     ghi_chu:'Phần cứng và hạ tầng' },
  { code:'CTC-015', ho_ten:'Chu Văn Minh',             customer_code:'BANK-SHB', customer_name:'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)',                  bo_phan:'Ban CNTT',           chuc_danh:'Data Center Manager',   so_may_ban:'024-3773-6666 (401)', so_di_dong:'0955556677', email:'minh.cv@shb.com.vn',     dia_chi:'77 Trần Hưng Đạo, Hoàn Kiếm, HN',          ghi_chu:'Quản lý data center' },
  { code:'CTC-016', ho_ten:'Nguyễn Văn An',           customer_code:'CORP-FPT', customer_name:'Công ty CP FPT',                                          bo_phan:'FPT IS',             chuc_danh:'Business Development',  so_may_ban:'024-3737-3373 (501)', so_di_dong:'0966667788', email:'an.nv@fpt.com.vn',       dia_chi:'17 Duy Tân, Cầu Giấy, HN',                 ghi_chu:'Đối tác tích hợp giải pháp' },
  { code:'CTC-017', ho_ten:'Lê Thị Diệu Linh',        customer_code:'CORP-VNG', customer_name:'Công ty CP VNG',                                          bo_phan:'Cloud Division',     chuc_danh:'Cloud Architect',       so_may_ban:'028-3824-2222 (301)', so_di_dong:'0977778899', email:'linh.ltd@vng.com.vn',    dia_chi:'9A Số 10, Bình Thạnh, TP.HCM',              ghi_chu:'Cloud partnership' },
  { code:'CTC-018', ho_ten:'Phạm Quốc Toản',          customer_code:'CORP-VIB', customer_name:'Ngân hàng TMCP Quốc Tế Việt Nam (VIB)',                   bo_phan:'IT Department',      chuc_danh:'Digital Banking Lead',  so_may_ban:'028-3825-1547 (201)', so_di_dong:'0988889900', email:'toan.pq@vib.com.vn',     dia_chi:'8 Hoàng Minh Giám, Phú Nhuận, TP.HCM',     ghi_chu:'Ngân hàng số' },
  { code:'CTC-019', ho_ten:'Vương Thị Bích',           customer_code:'CORP-ABB', customer_name:'Ngân hàng TMCP An Bình (ABBank)',                         bo_phan:'IT Division',        chuc_danh:'System Administrator',  so_may_ban:'028-3930-9311 (101)', so_di_dong:'0900001123', email:'bich.vt@abbank.vn',      dia_chi:'1 Lê Thị Hồng Gấm, Q.1, TP.HCM',          ghi_chu:'Quản trị hệ thống' },
  { code:'CTC-020', ho_ten:'Kwon Ji Hyun',             customer_code:'CORP-WOO', customer_name:'Ngân hàng Woori Việt Nam',                                bo_phan:'IT Team',            chuc_danh:'IT Director',           so_may_ban:'024-3737-6060 (201)', so_di_dong:'0911112234', email:'jihyun.k@wooribank.com.vn', dia_chi:'63 Lý Thái Tổ, Hoàn Kiếm, HN',            ghi_chu:'Outsource IT - đầu mối chính' },
]

async function main() {
  console.log('\n📞 SEED LIÊN HỆ (contacts)\n')

  // Detect columns
  const cols = await getContactsColumns()
  if (cols) {
    console.log('Cột hiện có:', cols.join(', '))
  } else {
    console.log('Bảng rỗng, sẽ detect khi insert')
  }

  // Get schema by trying a minimal insert
  const { data: schemaCheck, error: schemaErr } = await supabase
    .from('contacts')
    .select('id, code, name, ho_ten, bo_phan, chuc_danh, so_may_ban, so_di_dong, customer_code, customer_name, dia_chi, ghi_chu')
    .limit(0)
  
  const hasHoTen = !schemaErr?.message?.includes('ho_ten')
  const hasBoPhan = !schemaErr?.message?.includes('bo_phan')
  console.log(`ho_ten: ${hasHoTen ? '✓' : '✗'} | bo_phan: ${hasBoPhan ? '✓' : '✗'}`)

  let inserted = 0, skipped = 0, failed = 0

  for (const r of CONTACTS_DATA) {
    const { data: existing } = await supabase
      .from('contacts')
      .select('code')
      .eq('code', r.code)
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭  ${r.code} - đã tồn tại`)
      skipped++
      continue
    }

    // Build record with proper field names
    const record = {
      code: r.code,
      name: r.ho_ten,            // required NOT NULL
      email: r.email,
      phone: r.so_di_dong,       // original 'phone' column
      customer_code: r.customer_code,
      customer_name: r.customer_name,
      dia_chi: r.dia_chi,
      ghi_chu: r.ghi_chu,
    }

    // Add extended fields only if they exist
    if (hasHoTen) record.ho_ten = r.ho_ten
    if (hasBoPhan) {
      record.bo_phan   = r.bo_phan
      record.chuc_danh = r.chuc_danh
      record.so_may_ban = r.so_may_ban
      record.so_di_dong = r.so_di_dong
    }

    const { error } = await supabase.from('contacts').insert([record])
    if (error) {
      console.error(`  ✗  ${r.code} | ${r.ho_ten} - LỖI: ${error.message}`)
      failed++
    } else {
      console.log(`  ✓  ${r.code} | ${r.ho_ten} | ${r.customer_name?.split(' ').slice(-2).join(' ')}`)
      inserted++
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅ Đã thêm: ${inserted} | Tồn tại: ${skipped} | Lỗi: ${failed}`)
}

main().catch(console.error)

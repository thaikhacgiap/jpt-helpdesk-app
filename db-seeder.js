const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envContent = fs.readFileSync(path.resolve(__dirname, './.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_GROUPS = [
  {
    id: "g-1",
    name: "Ban Giám Đốc",
    description: "Quyền quản lý toàn diện hệ thống IT Helpdesk",
    role: "Admin",
    permissions: ["/dashboard", "/requests", "/tickets", "/maintenance", "/projects", "/customers", "/contacts", "/nhan-su", "/contracts", "/sla", "/users", "/settings"]
  },
  {
    id: "g-2",
    name: "Quản lý Dự án (PM)",
    description: "Cấp độ quản lý phân phối dự án và theo dõi hợp đồng",
    role: "PM",
    permissions: ["/dashboard", "/requests", "/tickets", "/projects", "/customers", "/contracts"]
  },
  {
    id: "g-3",
    name: "Đội Kỹ thuật & Support",
    description: "Nhóm kỹ thuật tiếp nhận vé hỗ trợ và triển khai bảo trì",
    role: "Technical",
    permissions: ["/dashboard", "/requests", "/tickets", "/maintenance"]
  },
  {
    id: "g-4",
    name: "Khách hàng Doanh nghiệp",
    description: "Cổng thông tin tự phục vụ dành cho đối tác, khách hàng",
    role: "Customer",
    permissions: ["/portal"]
  }
];

const DEFAULT_USERS = [
  {
    id: "u-1",
    email: "admin@jpt.vn",
    name: "Nguyễn Văn Q.Trị",
    role: "Admin",
    role_label: "Quản trị viên",
    department: "Ban Giám Đốc",
    phone: "0901234567",
    active: true,
    password: "123",
    group_id: "g-1",
    created_at: new Date().toISOString()
  },
  {
    id: "u-2",
    email: "pm@jpt.vn",
    name: "Trần Thị Q.Lý",
    role: "PM",
    role_label: "Quản lý Dự án (PM)",
    department: "Phòng Quản lý dự án",
    phone: "0902345678",
    active: true,
    password: "123",
    group_id: "g-2",
    created_at: new Date().toISOString()
  },
  {
    id: "u-3",
    email: "technical@jpt.vn",
    name: "Lê Văn K.Thuật",
    role: "Technical",
    role_label: "Kỹ sư Kỹ thuật",
    department: "Phòng Kỹ thuật & Support",
    phone: "0903456789",
    active: true,
    password: "123",
    group_id: "g-3",
    created_at: new Date().toISOString()
  },
  {
    id: "u-4",
    email: "customer@jpt.vn",
    name: "Công ty TNHH J-TECH",
    role: "Customer",
    role_label: "Đại diện Khách hàng",
    department: "Khách hàng doanh nghiệp",
    phone: "0904567890",
    active: true,
    password: "123",
    group_id: "g-4",
    customer_id: "80c26b95-f7bd-4115-a07b-72748d483ab5",
    created_at: new Date().toISOString()
  },
  // Additional users to make 10 users total
  {
    id: "u-5",
    email: "nguyen.a@jpt.vn",
    name: "Nguyễn Văn A",
    role: "Technical",
    role_label: "Kỹ sư Kỹ thuật",
    department: "Phòng Kỹ thuật & Support",
    phone: "0901112221",
    active: true,
    password: "123",
    group_id: "g-3",
    created_at: new Date().toISOString()
  },
  {
    id: "u-6",
    email: "le.c@jpt.vn",
    name: "Lê Văn C",
    role: "Technical",
    role_label: "Kỹ sư Kỹ thuật",
    department: "Phòng Kỹ thuật & Support",
    phone: "0901112223",
    active: true,
    password: "123",
    group_id: "g-3",
    created_at: new Date().toISOString()
  },
  {
    id: "u-7",
    email: "pham.d@jpt.vn",
    name: "Phạm Minh D",
    role: "Technical",
    role_label: "Kỹ sư Kỹ thuật",
    department: "Phòng Kỹ thuật & Support",
    phone: "0901112224",
    active: true,
    password: "123",
    group_id: "g-3",
    created_at: new Date().toISOString()
  },
  {
    id: "u-8",
    email: "hoang.e@jpt.vn",
    name: "Hoàng Thị E",
    role: "Customer",
    role_label: "Chuyên viên Khách hàng",
    department: "Khách hàng doanh nghiệp",
    phone: "0901112225",
    active: true,
    password: "123",
    group_id: "g-4",
    customer_id: "c0000000-0000-0000-0000-000000000002",
    created_at: new Date().toISOString()
  },
  {
    id: "u-9",
    email: "ngo.i@jpt.vn",
    name: "Ngô Thị I",
    role: "Customer",
    role_label: "Chuyên viên Khách hàng",
    department: "Khách hàng doanh nghiệp",
    phone: "0901112229",
    active: true,
    password: "123",
    group_id: "g-4",
    customer_id: "c0000000-0000-0000-0000-000000000003",
    created_at: new Date().toISOString()
  },
  {
    id: "u-10",
    email: "client1@jpt.vn",
    name: "VPBank Admin",
    role: "Customer",
    role_label: "Đại diện Khách hàng",
    department: "Khách hàng doanh nghiệp",
    phone: "0987654321",
    active: true,
    password: "123",
    group_id: "g-4",
    customer_id: "c0000000-0000-0000-0000-000000000002",
    created_at: new Date().toISOString()
  }
];

const SEED_NHAN_SU = [
  { ma_nhan_su: "NS-001", ten_nhan_su: "Nguyễn Văn A", bo_phan: "Phòng Kỹ thuật", chuc_vu: "Trưởng phòng", phu_trach: "Mạng & Bảo mật", ngay_sinh: "1988-05-12", so_cccd: "001088012345", cap_ngay: "2021-08-15", email: "van.a@jpt.vn", so_dien_thoai: "0901112221", dia_chi: "Cầu Giấy, Hà Nội" },
  { ma_nhan_su: "NS-002", ten_nhan_su: "Trần Thị B", bo_phan: "Phòng Hành chính", chuc_vu: "Chuyên viên", phu_trach: "Hồ sơ & Nhân sự", ngay_sinh: "1992-09-20", so_cccd: "001092054321", cap_ngay: "2020-04-10", email: "thi.b@jpt.vn", so_dien_thoai: "0901112222", dia_chi: "Đống Đa, Hà Nội" },
  { ma_nhan_su: "NS-003", ten_nhan_su: "Lê Văn C", bo_phan: "Phòng Kỹ thuật", chuc_vu: "Kỹ sư", phu_trach: "Hệ thống Linux", ngay_sinh: "1994-03-15", so_cccd: "001094012456", cap_ngay: "2019-12-05", email: "van.c@jpt.vn", so_dien_thoai: "0901112223", dia_chi: "Thanh Xuân, Hà Nội" },
  { ma_nhan_su: "NS-004", ten_nhan_su: "Phạm Minh D", bo_phan: "Phòng Kỹ thuật", chuc_vu: "Kỹ sư", phu_trach: "Cơ sở dữ liệu Oracle", ngay_sinh: "1990-11-28", so_cccd: "001090078901", cap_ngay: "2020-07-22", email: "minh.d@jpt.vn", so_dien_thoai: "0901112224", dia_chi: "Hà Đông, Hà Nội" },
  { ma_nhan_su: "NS-005", ten_nhan_su: "Hoàng Thị E", bo_phan: "Phòng Chăm sóc khách hàng", chuc_vu: "Chuyên viên", phu_trach: "Tiếp nhận Yêu cầu", ngay_sinh: "1996-07-08", so_cccd: "001096098765", cap_ngay: "2021-03-10", email: "thi.e@jpt.vn", so_dien_thoai: "0901112225", dia_chi: "Ba Đình, Hà Nội" },
  { ma_nhan_su: "NS-006", ten_nhan_su: "Đỗ Văn F", bo_phan: "Phòng Kỹ thuật", chuc_vu: "Kỹ sư", phu_trach: "Phần cứng Server", ngay_sinh: "1993-01-25", so_cccd: "001093011223", cap_ngay: "2018-09-18", email: "van.f@jpt.vn", so_dien_thoai: "0901112226", dia_chi: "Nam Từ Liêm, Hà Nội" },
  { ma_nhan_su: "NS-007", ten_nhan_su: "Vũ Thị G", bo_phan: "Phòng Kinh doanh", chuc_vu: "Trưởng phòng", phu_trach: "Kinh doanh & Dự án", ngay_sinh: "1989-10-05", so_cccd: "001089045678", cap_ngay: "2022-01-15", email: "thi.g@jpt.vn", so_dien_thoai: "0901112227", dia_chi: "Tây Hồ, Hà Nội" },
  { ma_nhan_su: "NS-008", ten_nhan_su: "Bùi Văn H", bo_phan: "Phòng Kỹ thuật", chuc_vu: "Kỹ sư", phu_trach: "Network Cisco/HP", ngay_sinh: "1995-12-12", so_cccd: "001095033445", cap_ngay: "2021-11-20", email: "van.h@jpt.vn", so_dien_thoai: "0901112228", dia_chi: "Hoàng Mai, Hà Nội" },
  { ma_nhan_su: "NS-009", ten_nhan_su: "Ngô Thị I", bo_phan: "Phòng Chăm sóc khách hàng", chuc_vu: "Chuyên viên", phu_trach: "Báo cáo SLA", ngay_sinh: "1997-02-18", so_cccd: "001097066778", cap_ngay: "2022-05-12", email: "thi.i@jpt.vn", so_dien_thoai: "0901112229", dia_chi: "Long Biên, Hà Nội" },
  { ma_nhan_su: "NS-010", ten_nhan_su: "Lý Văn J", bo_phan: "Phòng Kỹ thuật", chuc_vu: "Kỹ sư", phu_trach: "Bảo mật & Firewall", ngay_sinh: "1991-08-30", so_cccd: "001091022334", cap_ngay: "2019-06-14", email: "van.j@jpt.vn", so_dien_thoai: "0901112230", dia_chi: "Hai Bà Trưng, Hà Nội" }
];

const SEED_STAFF = [
  { name: "Nguyễn Văn A", email: "van.a@jpt.vn", phone: "0901112221", position: "Trưởng phòng", department: "Phòng Kỹ thuật", active: true },
  { name: "Trần Thị B", email: "thi.b@jpt.vn", phone: "0901112222", position: "Chuyên viên", department: "Phòng Hành chính", active: true },
  { name: "Lê Văn C", email: "van.c@jpt.vn", phone: "0901112223", position: "Kỹ sư", department: "Phòng Kỹ thuật", active: true },
  { name: "Phạm Minh D", email: "minh.d@jpt.vn", phone: "0901112224", position: "Kỹ sư", department: "Phòng Kỹ thuật", active: true },
  { name: "Hoàng Thị E", email: "thi.e@jpt.vn", phone: "0901112225", position: "Chuyên viên", department: "Phòng Chăm sóc khách hàng", active: true },
  { name: "Đỗ Văn F", email: "van.f@jpt.vn", phone: "0901112226", position: "Kỹ sư", department: "Phòng Kỹ thuật", active: true },
  { name: "Vũ Thị G", email: "thi.g@jpt.vn", phone: "0901112227", position: "Trưởng phòng", department: "Phòng Kinh doanh", active: true },
  { name: "Bùi Văn H", email: "van.h@jpt.vn", phone: "0901112228", position: "Kỹ sư", department: "Phòng Kỹ thuật", active: true },
  { name: "Ngô Thị I", email: "thi.i@jpt.vn", phone: "0901112229", position: "Chuyên viên", department: "Phòng Chăm sóc khách hàng", active: true },
  { name: "Lý Văn J", email: "van.j@jpt.vn", phone: "0901112230", position: "Kỹ sư", department: "Phòng Kỹ thuật", active: true }
];

const SEED_CUSTOMERS = [
  { id: "80c26b95-f7bd-4115-a07b-72748d483ab5", code: "KH-001", name: "Công ty Cổ phần Công nghệ JPT", email: "info@jpt.vn", phone: "0241234567", address: "Tòa nhà JPT, Cầu Giấy, Hà Nội", contact_person: "Lê Hoàng Nam", contact_phone: "0912345678", type: "Doanh nghiệp" },
  { id: "c0000000-0000-0000-0000-000000000002", code: "KH-002", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)", email: "contact@vpbank.com.vn", phone: "1900545415", address: "89 Láng Hạ, Đống Đa, Hà Nội", contact_person: "Nguyễn Thị Mai", contact_phone: "0987654321", type: "Ngân hàng" },
  { id: "c0000000-0000-0000-0000-000000000003", code: "KH-003", name: "Tập đoàn Vingroup", email: "info@vingroup.net", phone: "02439749999", address: "Số 7 Đường Bằng Lăng 1, Vinhomes Riverside, Long Biên, Hà Nội", contact_person: "Phạm Quang Huy", contact_phone: "0909090909", type: "Doanh nghiệp" },
  { id: "c0000000-0000-0000-0000-000000000004", code: "KH-004", name: "Công ty TNHH Phần mềm FPT", email: "fsoft.contact@fpt.com.vn", phone: "02437689048", address: "Tòa nhà FPT, Khu công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội", contact_person: "Trần Đức Long", contact_phone: "0977665544", type: "Doanh nghiệp" },
  { id: "c0000000-0000-0000-0000-000000000005", code: "KH-005", name: "Tổng Công ty Viễn thông Viettel", email: "cskh@viettel.com.vn", phone: "18008098", address: "Số 1 Giang Văn Minh, Kim Mã, Ba Đình, Hà Nội", contact_person: "Hoàng Kim Oanh", contact_phone: "0988776655", type: "Doanh nghiệp" },
  { id: "c0000000-0000-0000-0000-000000000006", code: "KH-006", name: "Công ty Cổ phần Sữa Việt Nam (Vinamilk)", email: "vinamilk@vinamilk.com.vn", phone: "02854155555", address: "10 Tân Trào, Tân Phú, Quận 7, TP. Hồ Chí Minh", contact_person: "Đỗ Thanh Sơn", contact_phone: "0911223344", type: "Doanh nghiệp" },
  { id: "c0000000-0000-0000-0000-000000000007", code: "KH-007", name: "Tập đoàn Bưu chính Viễn thông Việt Nam (VNPT)", email: "cskh@vnpt.vn", phone: "18001166", address: "57 Huỳnh Thúc Kháng, Láng Hạ, Đống Đa, Hà Nội", contact_person: "Nguyễn Bích Ngọc", contact_phone: "0922334455", type: "Doanh nghiệp" },
  { id: "c0000000-0000-0000-0000-000000000008", code: "KH-008", name: "Ngân hàng Ngoại thương Việt Nam (Vietcombank)", email: "webmaster@vietcombank.com.vn", phone: "1900545413", address: "198 Trần Quang Khải, Hoàn Kiếm, Hà Nội", contact_person: "Vũ Đình Hải", contact_phone: "0933445566", type: "Ngân hàng" },
  { id: "c0000000-0000-0000-0000-000000000009", code: "KH-009", name: "Công ty Cổ phần Đầu tư Thế Giới Di Động", email: "mwg@thegioididong.com", phone: "02838125960", address: "Lô T2-1.2, Đường D1, Khu Công Nghệ Cao, Quận 9, TP. Hồ Chí Minh", contact_person: "Bùi Minh Tuấn", contact_phone: "0944556677", type: "Doanh nghiệp" },
  { id: "c0000000-0000-0000-0000-000000000010", code: "KH-010", name: "Tổng Công ty Hàng không Việt Nam (Vietnam Airlines)", email: "telesales@vietnamairlines.com", phone: "19001100", address: "200 Nguyễn Sơn, Bồ Đề, Long Biên, Hà Nội", contact_person: "Phan Thị Thảo", contact_phone: "0955667788", type: "Doanh nghiệp" }
];

const SEED_CONTACTS = [
  { id: "a0000000-0000-0000-0000-000000000001", code: "CT-001", customer_id: "80c26b95-f7bd-4115-a07b-72748d483ab5", name: "Lê Hoàng Nam", email: "nam.lh@jpt.vn", phone: "0912345678", position: "Trưởng phòng IT", address: "Hà Nội" },
  { id: "a0000000-0000-0000-0000-000000000002", code: "CT-002", customer_id: "c0000000-0000-0000-0000-000000000002", name: "Nguyễn Thị Mai", email: "mai.nt@vpbank.com.vn", phone: "0987654321", position: "Trưởng bộ phận Vận hành", address: "Hà Nội" },
  { id: "a0000000-0000-0000-0000-000000000003", code: "CT-003", customer_id: "c0000000-0000-0000-0000-000000000003", name: "Phạm Quang Huy", email: "huy.pq@vingroup.net", phone: "0909090909", position: "Giám đốc Công nghệ", address: "Hà Nội" },
  { id: "a0000000-0000-0000-0000-000000000004", code: "CT-004", customer_id: "c0000000-0000-0000-0000-000000000004", name: "Trần Đức Long", email: "long.td@fpt.com.vn", phone: "0977665544", position: "Quản lý dự án", address: "Hòa Lạc" },
  { id: "a0000000-0000-0000-0000-000000000005", code: "CT-005", customer_id: "c0000000-0000-0000-0000-000000000005", name: "Hoàng Kim Oanh", email: "oanh.hk@viettel.com.vn", phone: "0988776655", position: "Kỹ sư trưởng", address: "Hà Nội" },
  { id: "a0000000-0000-0000-0000-000000000006", code: "CT-006", customer_id: "c0000000-0000-0000-0000-000000000006", name: "Đỗ Thanh Sơn", email: "son.dt@vinamilk.com.vn", phone: "0911223344", position: "Trưởng phòng Hạ tầng", address: "TP.HCM" },
  { id: "a0000000-0000-0000-0000-000000000007", code: "CT-007", customer_id: "c0000000-0000-0000-0000-000000000007", name: "Nguyễn Bích Ngọc", email: "ngoc.nb@vnpt.vn", phone: "0922334455", position: "Quản trị hệ thống", address: "Hà Nội" },
  { id: "a0000000-0000-0000-0000-000000000008", code: "CT-008", customer_id: "c0000000-0000-0000-0000-000000000008", name: "Vũ Đình Hải", email: "hai.vd@vietcombank.com.vn", phone: "0933445566", position: "Trưởng phòng Kỹ thuật", address: "Hà Nội" },
  { id: "a0000000-0000-0000-0000-000000000009", code: "CT-009", customer_id: "c0000000-0000-0000-0000-000000000009", name: "Bùi Minh Tuấn", email: "tuan.bm@thegioididong.com", phone: "0944556677", position: "IT Director", address: "TP.HCM" },
  { id: "a0000000-0000-0000-0000-000000000010", code: "CT-010", customer_id: "c0000000-0000-0000-0000-000000000010", name: "Phan Thị Thảo", email: "thao.pt@vietnamairlines.com", phone: "0955667788", position: "Phó phòng CNTT", address: "Hà Nội" }
];

const SEED_CONTRACTS = [
  { id: "b0000000-0000-0000-0000-000000000001", code: "HD-2026-001", name: "Hợp đồng Bảo trì Hệ thống ERP", customer_id: "80c26b95-f7bd-4115-a07b-72748d483ab5", start_date: "2026-01-01", end_date: "2026-12-31", value: 120000000, status: "Hiệu lực", description: "Bảo trì hệ thống ERP định kỳ hàng tháng." },
  { id: "b0000000-0000-0000-0000-000000000002", code: "HD-2026-002", name: "Hợp đồng Hỗ trợ Kỹ thuật IT Helpdesk", customer_id: "c0000000-0000-0000-0000-000000000002", start_date: "2026-02-01", end_date: "2027-01-31", value: 240000000, status: "Hiệu lực", description: "Cung cấp dịch vụ helpdesk 24/7." },
  { id: "b0000000-0000-0000-0000-000000000003", code: "HD-2026-003", name: "Hợp đồng Cung cấp Thiết bị Mạng", customer_id: "c0000000-0000-0000-0000-000000000003", start_date: "2026-03-01", end_date: "2026-08-31", value: 500000000, status: "Hiệu lực", description: "Cung cấp thiết bị Cisco." },
  { id: "b0000000-0000-0000-0000-000000000004", code: "HD-2026-004", name: "Hợp đồng Bản quyền Phần mềm Security", customer_id: "c0000000-0000-0000-0000-000000000004", start_date: "2026-04-01", end_date: "2027-03-31", value: 180000000, status: "Hiệu lực", description: "Cấp license Kaspersky Endpoint Security." },
  { id: "b0000000-0000-0000-0000-000000000005", code: "HD-2026-005", name: "Hợp đồng Thuê máy chủ Cloud", customer_id: "c0000000-0000-0000-0000-000000000005", start_date: "2026-05-01", end_date: "2027-04-30", value: 360000000, status: "Hiệu lực", description: "Dịch vụ máy chủ ảo chất lượng cao." },
  { id: "b0000000-0000-0000-0000-000000000006", code: "HD-2026-006", name: "Hợp đồng Bảo trì Hạ tầng CNTT", customer_id: "c0000000-0000-0000-0000-000000000006", start_date: "2026-01-15", end_date: "2027-01-14", value: 150000000, status: "Hiệu lực", description: "Hỗ trợ hạ tầng mạng, máy chủ." },
  { id: "b0000000-0000-0000-0000-000000000007", code: "HD-2026-007", name: "Hợp đồng Nâng cấp Tổng đài IP", customer_id: "c0000000-0000-0000-0000-000000000007", start_date: "2026-06-01", end_date: "2026-11-30", value: 220000000, status: "Hiệu lực", description: "Nâng cấp tổng đài IP Grandstream." },
  { id: "b0000000-0000-0000-0000-000000000008", code: "HD-2026-008", name: "Hợp đồng Hỗ trợ Vận hành Kỹ thuật", customer_id: "c0000000-0000-0000-0000-000000000008", start_date: "2026-02-15", end_date: "2027-02-14", value: 400000000, status: "Hiệu lực", description: "Hỗ trợ vận hành các máy chủ ứng dụng ngân hàng." },
  { id: "b0000000-0000-0000-0000-000000000009", code: "HD-2026-009", name: "Hợp đồng Triển khai WiFi Marketing", customer_id: "c0000000-0000-0000-0000-000000000009", start_date: "2026-07-01", end_date: "2026-12-31", value: 130000000, status: "Hiệu lực", description: "Hệ thống wifi quảng cáo tại các cửa hàng." },
  { id: "b0000000-0000-0000-0000-000000000010", code: "HD-2026-010", name: "Hợp đồng Triển khai Hệ thống Giám sát SLA", customer_id: "c0000000-0000-0000-0000-000000000010", start_date: "2026-03-01", end_date: "2026-09-30", value: 280000000, status: "Hiệu lực", description: "Hệ thống Zabbix giám sát chất lượng SLA." }
];

const SEED_TICKETS = [
  { id: "d0000000-0000-0000-0000-000000000001", ticket_id: "TH-20260720-001", title: "Sự cố mất kết nối mạng nội bộ", customer_id: "c0000000-0000-0000-0000-000000000002", customer_name: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)", contract_no: "HD-2026-002", tt_type: "Technical support", contract_scope: "In scope", category: "Network", priority: "L1(Critical)", assigned: "Nguyễn Văn A", tt_status: "In progress", progress: "50%", created_at: "2026-07-20T08:00:00Z", sla_time: "4", sla_status: "Under SLA" },
  { id: "d0000000-0000-0000-0000-000000000002", ticket_id: "TH-20260719-001", title: "Lỗi không đăng nhập được phần mềm ERP", customer_id: "80c26b95-f7bd-4115-a07b-72748d483ab5", customer_name: "Công ty Cổ phần Công nghệ JPT", contract_no: "HD-2026-001", tt_type: "Technical support", contract_scope: "In scope", category: "Software", priority: "L2(Major)", assigned: "Lê Văn K.Thuật", tt_status: "New", progress: "0%", created_at: "2026-07-19T09:30:00Z", sla_time: "8", sla_status: "Under SLA" },
  { id: "d0000000-0000-0000-0000-000000000003", ticket_id: "TH-20260715-001", title: "Yêu cầu cấu hình thêm VPN Client", customer_id: "c0000000-0000-0000-0000-000000000004", customer_name: "Công ty TNHH Phần mềm FPT", contract_no: "HD-2026-004", tt_type: "Technical support", contract_scope: "In scope", category: "Security", priority: "L3(Minor)", assigned: "Lê Văn C", tt_status: "Completed", progress: "100%", created_at: "2026-07-15T14:00:00Z", sla_time: "24", sla_status: "Under SLA", end_time: "2026-07-16T10:00:00Z" },
  { id: "d0000000-0000-0000-0000-000000000004", ticket_id: "TH-20260710-001", title: "Bảo trì định kỳ Hệ thống Máy chủ - Kỳ 7/12", customer_id: "c0000000-0000-0000-0000-000000000006", customer_name: "Công ty Cổ phần Sữa Việt Nam (Vinamilk)", contract_no: "HD-2026-006", tt_type: "Maintenance", contract_scope: "In scope", category: "Hardware", priority: "L3(Minor)", assigned: "Phạm Minh D", tt_status: "In progress", progress: "58%", created_at: "2026-07-10T10:00:00Z", sla_time: "7", hold_time: "12", sla_status: "Under SLA" },
  { id: "d0000000-0000-0000-0000-000000000005", ticket_id: "TH-20260705-001", title: "Bảo trì định kỳ Hệ thống Firewall - Kỳ 7/12", customer_id: "c0000000-0000-0000-0000-000000000005", customer_name: "Tổng Công ty Viễn thông Viettel", contract_no: "HD-2026-005", tt_type: "Maintenance", contract_scope: "In scope", category: "Security", priority: "L3(Minor)", assigned: "Đỗ Văn F", tt_status: "On Hold", progress: "58%", created_at: "2026-07-05T09:00:00Z", sla_time: "7", hold_time: "12", sla_status: "Under SLA" },
  { id: "d0000000-0000-0000-0000-000000000006", ticket_id: "TH-20260628-001", title: "Yêu cầu phục hồi dữ liệu database", customer_id: "c0000000-0000-0000-0000-000000000008", customer_name: "Ngân hàng Ngoại thương Việt Nam (Vietcombank)", contract_no: "HD-2026-008", tt_type: "Technical support", contract_scope: "In scope", category: "Other", priority: "L1(Critical)", assigned: "Nguyễn Văn A", tt_status: "Completed", progress: "100%", created_at: "2026-06-28T16:00:00Z", sla_time: "4", sla_status: "Under SLA", end_time: "2026-06-28T18:00:00Z" },
  { id: "d0000000-0000-0000-0000-000000000007", ticket_id: "TH-20260622-001", title: "Lỗi hiển thị báo cáo sai số liệu", customer_id: "c0000000-0000-0000-0000-000000000009", customer_name: "Công ty Cổ phần Đầu tư Thế Giới Di Động", contract_no: "HD-2026-009", tt_type: "Technical support", contract_scope: "In scope", category: "Software", priority: "L2(Major)", assigned: "Bùi Văn H", tt_status: "On Hold", progress: "30%", created_at: "2026-06-22T11:00:00Z", sla_time: "8", sla_status: "Going to breach SLA" },
  { id: "d0000000-0000-0000-0000-000000000008", ticket_id: "TH-20260515-001", title: "Bảo trì định kỳ Switch Access - Kỳ 5/12", customer_id: "c0000000-0000-0000-0000-000000000003", customer_name: "Tập đoàn Vingroup", contract_no: "HD-2026-003", tt_type: "Maintenance", contract_scope: "In scope", category: "Network", priority: "L4(Warning)", assigned: "Lý Văn J", tt_status: "Completed", progress: "100%", created_at: "2026-05-15T09:00:00Z", sla_time: "5", hold_time: "12", sla_status: "Under SLA", end_time: "2026-05-15T15:00:00Z" },
  { id: "d0000000-0000-0000-0000-000000000009", ticket_id: "TH-20260410-001", title: "Yêu cầu cấp tài khoản Mail mới", customer_id: "c0000000-0000-0000-0000-000000000007", customer_name: "Tập đoàn Bưu chính Viễn thông Việt Nam (VNPT)", contract_no: "HD-2026-007", tt_type: "Technical support", contract_scope: "In scope", category: "Other", priority: "L4(Warning)", assigned: "Hoàng Thị E", tt_status: "Completed", progress: "100%", created_at: "2026-04-10T14:30:00Z", sla_time: "24", sla_status: "Under SLA", end_time: "2026-04-10T16:00:00Z" },
  { id: "d0000000-0000-0000-0000-000000000010", ticket_id: "TH-20260305-001", title: "Sự cố nghẽn băng thông đường truyền", customer_id: "c0000000-0000-0000-0000-000000000010", customer_name: "Tổng Công ty Hàng không Việt Nam (Vietnam Airlines)", contract_no: "HD-2026-010", tt_type: "Technical support", contract_scope: "In scope", category: "Network", priority: "L1(Critical)", assigned: "Nguyễn Văn A", tt_status: "Completed", progress: "100%", created_at: "2026-03-05T10:00:00Z", sla_time: "4", sla_status: "Failure SLA", end_time: "2026-03-05T18:00:00Z" }
];

async function seed() {
  console.log("Starting full database clear and seed...");
  try {
    // 1. CLEAR TABLES IN DEPENDENCY ORDER
    console.log("Cleaning tickets...");
    await supabase.from("tickets").delete().neq("ticket_id", "KEEP_NONE");
    
    console.log("Cleaning contracts...");
    await supabase.from("contracts").delete().neq("code", "KEEP_NONE");
    
    console.log("Cleaning contacts...");
    await supabase.from("contacts").delete().neq("code", "KEEP_NONE");
    
    console.log("Cleaning customers...");
    await supabase.from("customers").delete().neq("code", "KEEP_NONE");
    
    console.log("Cleaning nhan_su...");
    await supabase.from("nhan_su").delete().neq("ma_nhan_su", "KEEP_NONE");
    
    console.log("Cleaning staff...");
    await supabase.from("staff").delete().neq("email", "KEEP_NONE");
    
    console.log("Cleaning system_users...");
    await supabase.from("system_users").delete().neq("email", "KEEP_NONE");
    
    console.log("Cleaning user_groups...");
    await supabase.from("user_groups").delete().neq("id", "KEEP_NONE");

    console.log("Cleaning operation_logs...");
    await supabase.from("operation_logs").delete().neq("user_email", "KEEP_NONE");

    // 2. SEED TABLES
    console.log("Seeding user_groups...");
    const { error: gErr } = await supabase.from("user_groups").insert(DEFAULT_GROUPS);
    if (gErr) throw gErr;

    console.log("Seeding customers...");
    const { error: cErr } = await supabase.from("customers").insert(SEED_CUSTOMERS);
    if (cErr) throw cErr;

    console.log("Seeding system_users...");
    const { error: uErr } = await supabase.from("system_users").insert(DEFAULT_USERS);
    if (uErr) throw uErr;

    console.log("Seeding nhan_su...");
    const { error: nsErr } = await supabase.from("nhan_su").insert(SEED_NHAN_SU);
    if (nsErr) throw nsErr;

    console.log("Seeding staff...");
    const { error: stErr } = await supabase.from("staff").upsert(SEED_STAFF, { onConflict: 'email' });
    if (stErr) throw stErr;

    console.log("Seeding contacts...");
    const { error: cntErr } = await supabase.from("contacts").insert(SEED_CONTACTS);
    if (cntErr) throw cntErr;

    console.log("Seeding contracts...");
    const { error: ctrErr } = await supabase.from("contracts").insert(SEED_CONTRACTS);
    if (ctrErr) throw ctrErr;

    console.log("Seeding tickets...");
    const { error: tErr } = await supabase.from("tickets").insert(SEED_TICKETS);
    if (tErr) throw tErr;

    console.log("Seeding operation_logs...");
    await supabase.from("operation_logs").insert([
      { user_email: "system@jpt.vn", user_name: "Hệ thống", action: "RESET DATABASE", details: "Clear database và khởi tạo lại 10 bản dữ liệu mẫu thành công." }
    ]);

    console.log("Database reset and seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();

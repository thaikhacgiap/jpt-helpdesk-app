// seed-all-data.mjs
// Chạy: node seed-all-data.mjs
// Nhập 20 mẫu cho: Khách hàng, Nhân Sự, Liên hệ

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://bxxzmfchmbhwoaazvjxb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'
)

// ═══════════════════════════════════════════════════════
// 1. KHÁCH HÀNG (20 mẫu)
// ═══════════════════════════════════════════════════════
const CUSTOMERS = [
  { code:'BANK-ACB',   name:'Ngân hàng TMCP Á Châu (ACB)',            email:'it@acb.com.vn',       phone:'028-38243030', address:'442 Nguyễn Thị Minh Khai, Q.3, TP.HCM',    type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Nam', phu_trach:'Quang', ttkd:'TTKD-HCM', ghi_chu:'Khách hàng VIP - core banking' },
  { code:'BANK-VCB',   name:'Ngân hàng TMCP Ngoại Thương (Vietcombank)', email:'ict@vietcombank.com.vn', phone:'024-38269486', address:'198 Trần Quang Khải, Hoàn Kiếm, HN', type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Minh', ttkd:'TTKD-HN',  ghi_chu:'Khách hàng lâu năm' },
  { code:'BANK-TCB',   name:'Ngân hàng TMCP Kỹ Thương (Techcombank)', email:'support@techcombank.com.vn', phone:'1800-588-822', address:'191 Bà Triệu, Hai Bà Trưng, HN',   type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Linh', ttkd:'TTKD-HN',  ghi_chu:'Hợp đồng license phần mềm' },
  { code:'BANK-BID',   name:'Ngân hàng TMCP Đầu Tư & Phát Triển (BIDV)', email:'it@bidv.com.vn',    phone:'024-22200588', address:'35 Hàng Vôi, Hoàn Kiếm, HN',           type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Quang', ttkd:'TTKD-HN',  ghi_chu:'Khách hàng trọng yếu' },
  { code:'BANK-VPB',   name:'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', email:'tech@vpbank.com.vn', phone:'1900-545-415', address:'89 Láng Hạ, Đống Đa, HN',          type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Hùng', ttkd:'TTKD-HN',  ghi_chu:'Dự án chuyển đổi số' },
  { code:'BANK-MBB',   name:'Ngân hàng TMCP Quân Đội (MB Bank)',      email:'cntt@mbbank.com.vn',   phone:'1800-54-54-26', address:'18 Lê Văn Lương, Cầu Giấy, HN',       type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Minh', ttkd:'TTKD-HN',  ghi_chu:'Bảo mật thông tin' },
  { code:'BANK-STB',   name:'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)', email:'it@sacombank.com', phone:'028-38266011', address:'266-268 Nam Kỳ Khởi Nghĩa, Q.3, TP.HCM', type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Nam', phu_trach:'Linh', ttkd:'TTKD-HCM', ghi_chu:'Hỗ trợ kỹ thuật 24/7' },
  { code:'BANK-HDB',   name:'Ngân hàng TMCP Phát Triển TP.HCM (HDBank)', email:'it@hdbank.com.vn',  phone:'028-38270270', address:'25 Bis Nguyễn Thị Minh Khai, Q.1, TP.HCM', type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Nam', phu_trach:'Quang', ttkd:'TTKD-HCM', ghi_chu:'Thiết bị phần cứng' },
  { code:'BANK-LPB',   name:'Ngân hàng TMCP Bưu Điện Liên Việt (LienPetroBank)', email:'it@lienvietpostbank.com.vn', phone:'024-62956688', address:'32 Nguyễn Công Trứ, HN', type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Hùng', ttkd:'TTKD-HN',  ghi_chu:'Mobile banking' },
  { code:'BANK-OCB',   name:'Ngân hàng TMCP Phương Đông (OCB)',        email:'cntt@ocb.com.vn',     phone:'028-39214398', address:'41 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM',  type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Nam', phu_trach:'Minh', ttkd:'TTKD-HCM', ghi_chu:'Đào tạo nhân viên' },
  { code:'BANK-TPB',   name:'Ngân hàng TMCP Tiên Phong (TPBank)',      email:'it@tpb.com.vn',       phone:'1800-585-870', address:'57 Lý Thường Kiệt, Hoàn Kiếm, HN',      type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Linh', ttkd:'TTKD-HN',  ghi_chu:'Tích hợp hệ thống' },
  { code:'BANK-NAB',   name:'Ngân hàng TMCP Nam Á (Nam A Bank)',        email:'it@namabank.com.vn',  phone:'028-39369016', address:'201-203 Cách Mạng Tháng 8, Q.3, TP.HCM',  type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Nam', phu_trach:'Quang', ttkd:'TTKD-HCM', ghi_chu:'Bảo trì phần cứng' },
  { code:'BANK-SHB',   name:'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)',  email:'cntt@shb.com.vn',     phone:'024-37736666', address:'77 Trần Hưng Đạo, Hoàn Kiếm, HN',       type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Hùng', ttkd:'TTKD-HN',  ghi_chu:'Data center' },
  { code:'CORP-FPT',   name:'Công ty CP FPT',                           email:'partner@fpt.com.vn',  phone:'024-37373373', address:'Tòa nhà FPT, 17 Duy Tân, Cầu Giấy, HN',  type:'CORP', phan_loai:'Partner',  tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Minh', ttkd:'TTKD-HN',  ghi_chu:'Đối tác tích hợp' },
  { code:'CORP-VNG',   name:'Công ty CP VNG',                           email:'partner@vng.com.vn',  phone:'028-38242222', address:'9A Đường Số 10, Khu phố 6, Bình Thạnh, TP.HCM', type:'CORP', phan_loai:'Partner', tinh_trang:'Active', khu_vuc:'Nam', phu_trach:'Linh', ttkd:'TTKD-HCM', ghi_chu:'Đối tác cloud' },
  { code:'CORP-VNPT',  name:'Tập đoàn Bưu chính Viễn thông VN (VNPT)', email:'it@vnpt.com.vn',      phone:'024-37368686', address:'57 Huỳnh Thúc Kháng, Đống Đa, HN',     type:'CORP', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Quang', ttkd:'TTKD-HN',  ghi_chu:'Hạ tầng viễn thông' },
  { code:'CORP-VIB',   name:'Ngân hàng TMCP Quốc Tế Việt Nam (VIB)',   email:'it@vib.com.vn',       phone:'1800-8082',    address:'8 Hoàng Minh Giám, Phú Nhuận, TP.HCM',    type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Nam', phu_trach:'Hùng', ttkd:'TTKD-HCM', ghi_chu:'Giải pháp ngân hàng số' },
  { code:'CORP-MVB',   name:'Ngân hàng TMCP Hàng Hải VN (MSB)',        email:'cntt@msb.com.vn',     phone:'1800-6666',    address:'54 Liễu Giai, Ba Đình, HN',             type:'BANK', phan_loai:'End User', tinh_trang:'Inactive', khu_vuc:'Bắc', phu_trach:'Minh', ttkd:'TTKD-HN',  ghi_chu:'Đang tạm ngưng hợp tác' },
  { code:'CORP-ABB',   name:'Ngân hàng TMCP An Bình (ABBank)',          email:'it@abbank.vn',        phone:'028-39309311', address:'1 Lê Thị Hồng Gấm, Q.1, TP.HCM',         type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Nam', phu_trach:'Linh', ttkd:'TTKD-HCM', ghi_chu:'Giám sát hệ thống' },
  { code:'CORP-WOO',   name:'Ngân hàng Woori Việt Nam',                 email:'it@wooribank.com.vn', phone:'024-37376060', address:'63 Lý Thái Tổ, Hoàn Kiếm, HN',           type:'BANK', phan_loai:'End User', tinh_trang:'Active', khu_vuc:'Bắc', phu_trach:'Quang', ttkd:'TTKD-HN',  ghi_chu:'Outsource IT' },
]

// ═══════════════════════════════════════════════════════
// 2. NHÂN SỰ (20 mẫu)
// ═══════════════════════════════════════════════════════
const NHAN_SU = [
  { ma_nhan_su:'NS-001', ten_nhan_su:'Nguyễn Văn Quang',    bo_phan:'Kinh doanh',          chuc_vu:'Giám đốc kinh doanh',     phu_trach:'Ban Giám Đốc', ngay_sinh:'1985-03-15', so_cccd:'001085012345', cap_ngay:'2020-01-10', email:'quang.nv@jprotech.vn',    so_dien_thoai:'0901234567', dia_chi:'12 Nguyễn Huệ, Q.1, TP.HCM' },
  { ma_nhan_su:'NS-002', ten_nhan_su:'Trần Thị Minh',       bo_phan:'Kinh doanh',          chuc_vu:'Trưởng phòng kinh doanh', phu_trach:'Nguyễn Văn Quang', ngay_sinh:'1990-07-22', so_cccd:'001090056789', cap_ngay:'2020-05-15', email:'minh.tt@jprotech.vn',     so_dien_thoai:'0912345678', dia_chi:'45 Lê Lợi, Q.1, TP.HCM' },
  { ma_nhan_su:'NS-003', ten_nhan_su:'Lê Thị Linh',         bo_phan:'Kỹ thuật',            chuc_vu:'Kỹ sư phần mềm senior',  phu_trach:'Nguyễn Văn Hùng', ngay_sinh:'1992-11-08', so_cccd:'001092078901', cap_ngay:'2021-03-20', email:'linh.lt@jprotech.vn',     so_dien_thoai:'0923456789', dia_chi:'78 Trần Hưng Đạo, Q.5, TP.HCM' },
  { ma_nhan_su:'NS-004', ten_nhan_su:'Phạm Văn Hùng',       bo_phan:'Kỹ thuật',            chuc_vu:'Trưởng phòng kỹ thuật',  phu_trach:'Ban Giám Đốc', ngay_sinh:'1983-05-30', so_cccd:'001083034567', cap_ngay:'2019-08-25', email:'hung.pv@jprotech.vn',     so_dien_thoai:'0934567890', dia_chi:'56 Đinh Tiên Hoàng, Q.1, TP.HCM' },
  { ma_nhan_su:'NS-005', ten_nhan_su:'Võ Thị Thu Hà',       bo_phan:'Hỗ trợ kỹ thuật',    chuc_vu:'Kỹ sư hỗ trợ',          phu_trach:'Phạm Văn Hùng', ngay_sinh:'1995-02-14', so_cccd:'001095090123', cap_ngay:'2021-06-10', email:'ha.vtt@jprotech.vn',      so_dien_thoai:'0945678901', dia_chi:'234 Cộng Hòa, Tân Bình, TP.HCM' },
  { ma_nhan_su:'NS-006', ten_nhan_su:'Đặng Minh Tuấn',      bo_phan:'Hỗ trợ kỹ thuật',    chuc_vu:'Kỹ sư hỗ trợ',          phu_trach:'Phạm Văn Hùng', ngay_sinh:'1993-09-18', so_cccd:'001093067890', cap_ngay:'2020-11-30', email:'tuan.dm@jprotech.vn',     so_dien_thoai:'0956789012', dia_chi:'89 Lý Thường Kiệt, Q.10, TP.HCM' },
  { ma_nhan_su:'NS-007', ten_nhan_su:'Nguyễn Thị Bích Ngọc', bo_phan:'Kế toán',            chuc_vu:'Kế toán trưởng',         phu_trach:'Ban Giám Đốc', ngay_sinh:'1988-04-25', so_cccd:'001088045678', cap_ngay:'2020-02-18', email:'ngoc.ntb@jprotech.vn',    so_dien_thoai:'0967890123', dia_chi:'10 Nguyễn Oanh, Gò Vấp, TP.HCM' },
  { ma_nhan_su:'NS-008', ten_nhan_su:'Trương Quốc Bảo',      bo_phan:'Kỹ thuật',           chuc_vu:'Kỹ sư phần mềm',         phu_trach:'Phạm Văn Hùng', ngay_sinh:'1996-12-03', so_cccd:'001096101234', cap_ngay:'2022-01-05', email:'bao.tq@jprotech.vn',      so_dien_thoai:'0978901234', dia_chi:'67 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM' },
  { ma_nhan_su:'NS-009', ten_nhan_su:'Phan Thị Lan',         bo_phan:'Kinh doanh',          chuc_vu:'Nhân viên kinh doanh',   phu_trach:'Trần Thị Minh', ngay_sinh:'1997-06-20', so_cccd:'001097112345', cap_ngay:'2022-07-15', email:'lan.pt@jprotech.vn',      so_dien_thoai:'0989012345', dia_chi:'123 Phan Đăng Lưu, Phú Nhuận, TP.HCM' },
  { ma_nhan_su:'NS-010', ten_nhan_su:'Hồ Văn Thành',         bo_phan:'Hỗ trợ kỹ thuật',   chuc_vu:'Kỹ sư hỗ trợ cấp 2',    phu_trach:'Phạm Văn Hùng', ngay_sinh:'1994-08-11', so_cccd:'001094078901', cap_ngay:'2021-09-20', email:'thanh.hv@jprotech.vn',    so_dien_thoai:'0990123456', dia_chi:'45 Nguyễn Xí, Bình Thạnh, TP.HCM' },
  { ma_nhan_su:'NS-011', ten_nhan_su:'Bùi Thị Thảo',         bo_phan:'Nhân sự',            chuc_vu:'Trưởng phòng nhân sự',   phu_trach:'Ban Giám Đốc', ngay_sinh:'1987-01-16', so_cccd:'001087023456', cap_ngay:'2019-05-08', email:'thao.bt@jprotech.vn',     so_dien_thoai:'0901234568', dia_chi:'34 Hoàng Diệu, Q.4, TP.HCM' },
  { ma_nhan_su:'NS-012', ten_nhan_su:'Lâm Văn Dũng',         bo_phan:'Kỹ thuật',           chuc_vu:'Kỹ sư hệ thống',         phu_trach:'Phạm Văn Hùng', ngay_sinh:'1991-10-28', so_cccd:'001091056789', cap_ngay:'2021-12-01', email:'dung.lv@jprotech.vn',     so_dien_thoai:'0912345679', dia_chi:'12 Lạc Long Quân, Q.11, TP.HCM' },
  { ma_nhan_su:'NS-013', ten_nhan_su:'Đinh Thị Thu Trang',   bo_phan:'Kinh doanh',         chuc_vu:'Nhân viên kinh doanh',   phu_trach:'Trần Thị Minh', ngay_sinh:'1998-03-07', so_cccd:'001098123456', cap_ngay:'2023-04-10', email:'trang.dtt@jprotech.vn',   so_dien_thoai:'0923456780', dia_chi:'89 Bùi Thị Xuân, Q.1, TP.HCM' },
  { ma_nhan_su:'NS-014', ten_nhan_su:'Nguyễn Đức Anh',       bo_phan:'Kỹ thuật',           chuc_vu:'DevOps Engineer',         phu_trach:'Phạm Văn Hùng', ngay_sinh:'1993-07-14', so_cccd:'001093067891', cap_ngay:'2020-09-15', email:'anh.nd@jprotech.vn',      so_dien_thoai:'0934567891', dia_chi:'56 CMT8, Q.3, TP.HCM' },
  { ma_nhan_su:'NS-015', ten_nhan_su:'Cao Thị Phương',        bo_phan:'Hỗ trợ kỹ thuật',  chuc_vu:'Helpdesk specialist',     phu_trach:'Đặng Minh Tuấn', ngay_sinh:'1996-05-19', so_cccd:'001096090124', cap_ngay:'2022-06-20', email:'phuong.ct@jprotech.vn',   so_dien_thoai:'0945678902', dia_chi:'23 Nguyễn Kiệm, Gò Vấp, TP.HCM' },
  { ma_nhan_su:'NS-016', ten_nhan_su:'Vũ Mạnh Cường',         bo_phan:'Kinh doanh',        chuc_vu:'Key Account Manager',     phu_trach:'Nguyễn Văn Quang', ngay_sinh:'1986-12-22', so_cccd:'001086012346', cap_ngay:'2019-11-05', email:'cuong.vm@jprotech.vn',   so_dien_thoai:'0956789013', dia_chi:'78 Phan Văn Trị, Bình Thạnh, TP.HCM' },
  { ma_nhan_su:'NS-017', ten_nhan_su:'Trần Hoàng Khải',       bo_phan:'Kỹ thuật',          chuc_vu:'Kỹ sư phần mềm',         phu_trach:'Phạm Văn Hùng', ngay_sinh:'1995-09-30', so_cccd:'001095090125', cap_ngay:'2021-10-12', email:'khai.th@jprotech.vn',     so_dien_thoai:'0967890124', dia_chi:'45 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM' },
  { ma_nhan_su:'NS-018', ten_nhan_su:'Ngô Thị Kim Oanh',      bo_phan:'Kế toán',           chuc_vu:'Kế toán viên',            phu_trach:'Nguyễn Thị Bích Ngọc', ngay_sinh:'1994-02-08', so_cccd:'001094078902', cap_ngay:'2020-03-25', email:'oanh.ntk@jprotech.vn', so_dien_thoai:'0978901235', dia_chi:'34 Tô Hiến Thành, Q.10, TP.HCM' },
  { ma_nhan_su:'NS-019', ten_nhan_su:'Lý Thanh Tùng',         bo_phan:'Kỹ thuật',          chuc_vu:'QA Engineer',             phu_trach:'Phạm Văn Hùng', ngay_sinh:'1997-11-15', so_cccd:'001097112346', cap_ngay:'2023-01-18', email:'tung.lt@jprotech.vn',     so_dien_thoai:'0989012346', dia_chi:'12 Lê Văn Sỹ, Q.3, TP.HCM' },
  { ma_nhan_su:'NS-020', ten_nhan_su:'Phùng Thị Hương',       bo_phan:'Nhân sự',           chuc_vu:'Chuyên viên nhân sự',     phu_trach:'Bùi Thị Thảo', ngay_sinh:'1999-04-03', so_cccd:'001099134567', cap_ngay:'2023-08-01', email:'huong.pt@jprotech.vn',    so_dien_thoai:'0990123457', dia_chi:'67 Võ Thị Sáu, Q.3, TP.HCM' },
]

// ═══════════════════════════════════════════════════════
// 3. LIÊN HỆ (20 mẫu - gắn với khách hàng)
// ═══════════════════════════════════════════════════════
const CONTACTS = [
  { code:'CTC-001', customer_code:'BANK-ACB', customer_name:'Ngân hàng TMCP Á Châu (ACB)',      ho_ten:'Nguyễn Thị Bảo Châu',  bo_phan:'Phòng CNTT',         chuc_danh:'Trưởng phòng CNTT',    so_may_ban:'028-3824-3030 (305)', so_di_dong:'0901112233', email:'chau.ntb@acb.com.vn',    dia_chi:'442 Nguyễn Thị Minh Khai, Q.3, TP.HCM', ghi_chu:'Đầu mối liên hệ kỹ thuật' },
  { code:'CTC-002', customer_code:'BANK-ACB', customer_name:'Ngân hàng TMCP Á Châu (ACB)',      ho_ten:'Trần Văn Phúc',         bo_phan:'Phòng CNTT',         chuc_danh:'Kỹ sư CNTT',           so_may_ban:'028-3824-3030 (306)', so_di_dong:'0912223344', email:'phuc.tv@acb.com.vn',     dia_chi:'442 Nguyễn Thị Minh Khai, Q.3, TP.HCM', ghi_chu:'Hỗ trợ kỹ thuật hệ thống' },
  { code:'CTC-003', customer_code:'BANK-VCB', customer_name:'Ngân hàng TMCP Ngoại Thương (Vietcombank)', ho_ten:'Lê Minh Hải',  bo_phan:'Ban CNTT',           chuc_danh:'Phó trưởng ban CNTT',  so_may_ban:'024-3826-9486 (201)', so_di_dong:'0923334455', email:'hai.lm@vietcombank.com.vn', dia_chi:'198 Trần Quang Khải, Hoàn Kiếm, HN', ghi_chu:'Liên hệ chính dự án' },
  { code:'CTC-004', customer_code:'BANK-VCB', customer_name:'Ngân hàng TMCP Ngoại Thương (Vietcombank)', ho_ten:'Phạm Thị Lan Anh', bo_phan:'Ban CNTT',         chuc_danh:'Chuyên viên CNTT',     so_may_ban:'024-3826-9486 (202)', so_di_dong:'0934445566', email:'lanh.pt@vietcombank.com.vn', dia_chi:'198 Trần Quang Khải, Hoàn Kiếm, HN', ghi_chu:'Phụ trách hệ thống báo cáo' },
  { code:'CTC-005', customer_code:'BANK-TCB', customer_name:'Ngân hàng TMCP Kỹ Thương (Techcombank)', ho_ten:'Võ Quang Trường',  bo_phan:'Trung tâm CNTT',    chuc_danh:'Giám đốc CNTT',        so_may_ban:'024-3944-6811 (101)', so_di_dong:'0945556677', email:'truong.vq@techcombank.com.vn', dia_chi:'191 Bà Triệu, Hai Bà Trưng, HN', ghi_chu:'Decision maker' },
  { code:'CTC-006', customer_code:'BANK-BID', customer_name:'Ngân hàng TMCP Đầu Tư & Phát Triển (BIDV)', ho_ten:'Đỗ Văn Thắng', bo_phan:'Trung tâm CNTT',    chuc_danh:'Kỹ sư hệ thống',       so_may_ban:'024-2220-0588 (301)', so_di_dong:'0956667788', email:'thang.dv@bidv.com.vn',   dia_chi:'35 Hàng Vôi, Hoàn Kiếm, HN', ghi_chu:'Phụ trách infrastructure' },
  { code:'CTC-007', customer_code:'BANK-VPB', customer_name:'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', ho_ten:'Nguyễn Hoàng Nam', bo_phan:'Khối CNTT',      chuc_danh:'Tech Lead',             so_may_ban:'024-3936-6688 (201)', so_di_dong:'0967778899', email:'nam.nh@vpbank.com.vn',   dia_chi:'89 Láng Hạ, Đống Đa, HN', ghi_chu:'Chuyển đổi số - đầu mối chính' },
  { code:'CTC-008', customer_code:'BANK-MBB', customer_name:'Ngân hàng TMCP Quân Đội (MB Bank)',  ho_ten:'Bùi Thị Thanh Tâm',   bo_phan:'Phòng CNTT',         chuc_danh:'Trưởng nhóm bảo mật',  so_may_ban:'024-3826-8888 (401)', so_di_dong:'0978889900', email:'tam.btt@mbbank.com.vn',  dia_chi:'18 Lê Văn Lương, Cầu Giấy, HN', ghi_chu:'Bảo mật thông tin' },
  { code:'CTC-009', customer_code:'BANK-STB', customer_name:'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)', ho_ten:'Phan Minh Khoa', bo_phan:'Phòng IT',         chuc_danh:'IT Manager',            so_may_ban:'028-3826-6011 (201)', so_di_dong:'0989990011', email:'khoa.pm@sacombank.com', dia_chi:'266 Nam Kỳ Khởi Nghĩa, Q.3, TP.HCM', ghi_chu:'Phụ trách 24/7 support' },
  { code:'CTC-010', customer_code:'BANK-HDB', customer_name:'Ngân hàng TMCP Phát Triển TP.HCM (HDBank)', ho_ten:'Trương Thị Mai',  bo_phan:'IT Department',      chuc_danh:'IT Specialist',         so_may_ban:'028-3827-0270 (101)', so_di_dong:'0900001122', email:'mai.tt@hdbank.com.vn',   dia_chi:'25 Bis Nguyễn Thị Minh Khai, Q.1, TP.HCM', ghi_chu:'Thiết bị phần cứng' },
  { code:'CTC-011', customer_code:'BANK-LPB', customer_name:'Ngân hàng TMCP Bưu Điện Liên Việt (LienPetroBank)', ho_ten:'Lý Văn Thịnh', bo_phan:'Ban CNTT',      chuc_danh:'Kỹ sư mobile',         so_may_ban:'024-6295-6688 (301)', so_di_dong:'0911112233', email:'thinh.lv@lienvietpostbank.com.vn', dia_chi:'32 Nguyễn Công Trứ, HN', ghi_chu:'Mobile banking project' },
  { code:'CTC-012', customer_code:'BANK-OCB', customer_name:'Ngân hàng TMCP Phương Đông (OCB)',    ho_ten:'Hoàng Thị Phương Linh', bo_phan:'Phòng CNTT',        chuc_danh:'Training Coordinator',  so_may_ban:'028-3921-4398 (201)', so_di_dong:'0922223344', email:'linh.htp@ocb.com.vn',    dia_chi:'41 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM', ghi_chu:'Đầu mối đào tạo' },
  { code:'CTC-013', customer_code:'BANK-TPB', customer_name:'Ngân hàng TMCP Tiên Phong (TPBank)',   ho_ten:'Dương Quang Vinh',     bo_phan:'Trung tâm Công nghệ', chuc_danh:'Integration Architect', so_may_ban:'024-3737-8888 (301)', so_di_dong:'0933334455', email:'vinh.dq@tpb.com.vn',     dia_chi:'57 Lý Thường Kiệt, Hoàn Kiếm, HN', ghi_chu:'Tích hợp API' },
  { code:'CTC-014', customer_code:'BANK-NAB', customer_name:'Ngân hàng TMCP Nam Á (Nam A Bank)',    ho_ten:'Ngô Thị Hồng Nhung',   bo_phan:'Phòng CNTT',         chuc_danh:'Kỹ sư phần cứng',      so_may_ban:'028-3936-9016 (201)', so_di_dong:'0944445566', email:'nhung.nth@namabank.com.vn', dia_chi:'201 CMT8, Q.3, TP.HCM', ghi_chu:'Phần cứng và hạ tầng' },
  { code:'CTC-015', customer_code:'BANK-SHB', customer_name:'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)', ho_ten:'Chu Văn Minh',      bo_phan:'Ban CNTT',           chuc_danh:'Data Center Manager',   so_may_ban:'024-3773-6666 (401)', so_di_dong:'0955556677', email:'minh.cv@shb.com.vn',     dia_chi:'77 Trần Hưng Đạo, Hoàn Kiếm, HN', ghi_chu:'Quản lý data center' },
  { code:'CTC-016', customer_code:'CORP-FPT', customer_name:'Công ty CP FPT',                        ho_ten:'Nguyễn Văn An',        bo_phan:'FPT IS',             chuc_danh:'Business Development',  so_may_ban:'024-3737-3373 (501)', so_di_dong:'0966667788', email:'an.nv@fpt.com.vn',       dia_chi:'17 Duy Tân, Cầu Giấy, HN', ghi_chu:'Đối tác tích hợp giải pháp' },
  { code:'CTC-017', customer_code:'CORP-VNG', customer_name:'Công ty CP VNG',                        ho_ten:'Lê Thị Diệu Linh',     bo_phan:'Cloud Division',     chuc_danh:'Cloud Architect',       so_may_ban:'028-3824-2222 (301)', so_di_dong:'0977778899', email:'linh.ltd@vng.com.vn',    dia_chi:'9A Số 10, Bình Thạnh, TP.HCM', ghi_chu:'Cloud partnership' },
  { code:'CTC-018', customer_code:'CORP-VIB', customer_name:'Ngân hàng TMCP Quốc Tế Việt Nam (VIB)', ho_ten:'Phạm Quốc Toản',     bo_phan:'IT Department',      chuc_danh:'Digital Banking Lead',  so_may_ban:'028-3825-1547 (201)', so_di_dong:'0988889900', email:'toan.pq@vib.com.vn',     dia_chi:'8 Hoàng Minh Giám, Phú Nhuận, TP.HCM', ghi_chu:'Ngân hàng số' },
  { code:'CTC-019', customer_code:'CORP-ABB', customer_name:'Ngân hàng TMCP An Bình (ABBank)',        ho_ten:'Vương Thị Bích',       bo_phan:'IT Division',        chuc_danh:'System Administrator',  so_may_ban:'028-3930-9311 (101)', so_di_dong:'0900001123', email:'bich.vt@abbank.vn',      dia_chi:'1 Lê Thị Hồng Gấm, Q.1, TP.HCM', ghi_chu:'Quản trị hệ thống' },
  { code:'CTC-020', customer_code:'CORP-WOO', customer_name:'Ngân hàng Woori Việt Nam',               ho_ten:'Kwon Ji Hyun',         bo_phan:'IT Team',            chuc_danh:'IT Director',           so_may_ban:'024-3737-6060 (201)', so_di_dong:'0911112234', email:'jihyun.k@wooribank.com.vn', dia_chi:'63 Lý Thái Tổ, Hoàn Kiếm, HN', ghi_chu:'Outsource IT - đầu mối chính' },
]

// ═══════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════
async function seedTable(tableName, records, keyField, label) {
  console.log(`\n${'═'.repeat(55)}`)
  console.log(`  ${label} (${records.length} mẫu)`)
  console.log('═'.repeat(55))

  let inserted = 0, skipped = 0, failed = 0

  for (const record of records) {
    const { data: existing } = await supabase
      .from(tableName)
      .select(keyField)
      .eq(keyField, record[keyField])
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭  ${record[keyField]} - đã tồn tại`)
      skipped++
      continue
    }

    const { error } = await supabase.from(tableName).insert([record])
    if (error) {
      console.error(`  ✗  ${record[keyField]} - LỖI: ${error.message}`)
      failed++
    } else {
      const displayName = record.ten_nhan_su || record.name || record.ho_ten || record[keyField]
      console.log(`  ✓  ${record[keyField]} | ${displayName}`)
      inserted++
    }
  }

  console.log(`  → Đã thêm: ${inserted} | Tồn tại: ${skipped} | Lỗi: ${failed}`)
  return { inserted, skipped, failed }
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
async function main() {
  console.log('\n🚀 JPT HELPDESK - SEED DATA\n')

  const r1 = await seedTable('customers', CUSTOMERS, 'code',        '📁 KHÁCH HÀNG')
  const r2 = await seedTable('nhan_su',   NHAN_SU,   'ma_nhan_su',  '👥 NHÂN SỰ')
  const r3 = await seedTable('contacts',  CONTACTS,  'code',        '📞 LIÊN HỆ')

  const total = [r1,r2,r3].reduce((a,r) => ({
    inserted: a.inserted + r.inserted,
    skipped: a.skipped + r.skipped,
    failed: a.failed + r.failed
  }), { inserted:0, skipped:0, failed:0 })

  console.log(`\n${'═'.repeat(55)}`)
  console.log(`✅ HOÀN THÀNH TỔNG KẾT`)
  console.log(`   Đã thêm mới : ${total.inserted}`)
  console.log(`   Đã tồn tại  : ${total.skipped}`)
  console.log(`   Lỗi         : ${total.failed}`)
  console.log('═'.repeat(55) + '\n')
}

main().catch(console.error)

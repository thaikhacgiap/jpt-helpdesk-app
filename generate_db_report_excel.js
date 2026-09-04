const fs = require('fs');
const path = require('path');

async function createReport() {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'JPT Helpdesk Team';
  workbook.created = new Date();
  workbook.properties.date1904 = false;

  // Colors & Styles
  const primaryHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Deep Blue
  };
  const secondaryHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' } // Royal Blue
  };
  const categoryHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' } // Teal Dark
  };
  const subHeaderFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' } // Slate 100
  };

  const headerFont = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  const boldFont = {
    name: 'Segoe UI',
    size: 10,
    bold: true,
    color: { argb: 'FF0F172A' }
  };
  const regularFont = {
    name: 'Segoe UI',
    size: 10,
    color: { argb: 'FF334155' }
  };
  const codeFont = {
    name: 'Consolas',
    size: 9.5,
    color: { argb: 'FF0F172A' }
  };

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  // ==========================================
  // SHEET 1: TỔNG QUAN HỆ THỐNG & KIẾN TRÚC
  // ==========================================
  const wsOverview = workbook.addWorksheet('1. Tổng quan Kiến trúc', {
    views: [{ showGridLines: true }]
  });

  wsOverview.columns = [
    { width: 5 },
    { width: 25 },
    { width: 35 },
    { width: 50 },
    { width: 20 }
  ];

  // Title
  wsOverview.mergeCells('B2:E2');
  const titleCell = wsOverview.getCell('B2');
  titleCell.value = 'BÁO CÁO HIỆN TRẠNG & CẤU TRÚC CƠ SỞ DỮ LIỆU JPT HELPDESK';
  titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  wsOverview.getRow(2).height = 30;

  wsOverview.mergeCells('B3:E3');
  const subCell = wsOverview.getCell('B3');
  subCell.value = 'Phiên bản hệ thống: v4.0 | Ngày xuất báo cáo: ' + new Date().toLocaleDateString('vi-VN') + ' | Cơ chế: Hybrid (Supabase Cloud + Client LocalStorage)';
  subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF64748B' } };
  wsOverview.getRow(3).height = 20;

  // Overview Table
  const overviewHeaders = ['B5:E5', 'B8:E8', 'B15:E15'];
  
  // Section 1: Thông số tổng quát
  wsOverview.mergeCells('B5:E5');
  wsOverview.getCell('B5').value = 'I. THỐNG KÊ TỔNG QUAN ĐỐI TƯỢNG DỮ LIỆU';
  wsOverview.getCell('B5').font = headerFont;
  wsOverview.getCell('B5').fill = primaryHeaderFill;
  wsOverview.getRow(5).height = 24;

  const statsData = [
    ['1', 'Tổng số thực thể nghiệp vụ', '18 bảng/đối tượng', 'Gồm bảng Supabase, bảng pending migration và module local'],
    ['2', 'Đã hoạt động trên Supabase DB', '11 bảng', 'Đã tạo và chứa dữ liệu hoặc đã sẵn sàng RLS'],
    ['3', 'Chưa tạo bảng trên Supabase (Pending Migration)', '4 bảng', 'Đã có file .sql trong mã nguồn nhưng chưa chạy trên DB'],
    ['4', 'Module còn lưu ở LocalStorage', '3 phân hệ (Dự án, Yêu cầu, Thông báo)', 'Cần ưu tiên chuyển lên Supabase DB để tránh mất dữ liệu'],
    ['5', 'Tổng số bản ghi đang quản lý (Live DB)', '~1.702+ records', 'contracts: 1.162, customers: 492, tickets: 29, nhan_su: 10, users: 5...']
  ];

  let currRow = 6;
  statsData.forEach(row => {
    const r = wsOverview.getRow(currRow);
    r.getCell(2).value = row[0];
    r.getCell(2).alignment = { horizontal: 'center' };
    r.getCell(3).value = row[1];
    r.getCell(3).font = boldFont;
    r.getCell(4).value = row[2];
    r.getCell(4).font = boldFont;
    r.getCell(5).value = row[3];
    r.getCell(5).font = regularFont;
    [2, 3, 4, 5].forEach(col => {
      r.getCell(col).border = thinBorder;
      r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: currRow % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } };
    });
    r.height = 22;
    currRow++;
  });

  currRow += 1;
  // Section 2: Trọng tâm & Đánh giá nhanh
  wsOverview.mergeCells(`B${currRow}:E${currRow}`);
  wsOverview.getCell(`B${currRow}`).value = 'II. ĐÁNH GIÁ TRỌNG TÂM & MỨC ĐỘ RỦI RO';
  wsOverview.getCell(`B${currRow}`).font = headerFont;
  wsOverview.getCell(`B${currRow}`).fill = secondaryHeaderFill;
  wsOverview.getRow(currRow).height = 24;
  currRow++;

  const keyFindings = [
    ['RỦI RO CAO', 'Lưu trữ Dự án & Kế hoạch trên LocalStorage', 'Dữ liệu dự án v4.0 chỉ nằm trên máy người dùng, đổi máy hoặc xóa cache sẽ mất.', 'Chuyển đổi lưu trữ sang Supabase (tạo bảng projects, project_tasks).'],
    ['CẢNH BÁO', 'Chưa chạy 3 file migration quan trọng', 'Các bảng opportunities, operation_logs, system_settings chưa có trên DB.', 'Chạy ngay các file SQL migration trên Supabase Dashboard.'],
    ['CẢNH BÁO', 'Bảo mật tài khoản system_users', 'Mật khẩu đang lưu dạng văn bản thô (Plaintext: 123), RLS đang mở true.', 'Mã hóa mật khẩu bằng bcrypt và siết chặt chính sách RLS theo vai trò.'],
    ['TỐI ƯU HÓA', 'Dư thừa dữ liệu (Denormalization) ở tickets', 'Bảng tickets vừa lưu ID vừa lưu Tên của KH, Hợp đồng, Nhân sự.', 'Chuẩn hóa quan hệ Foreign Key hoặc tạo View tối ưu hiệu năng.']
  ];

  keyFindings.forEach(item => {
    const r = wsOverview.getRow(currRow);
    r.getCell(2).value = item[0];
    r.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: item[0] === 'RỦI RO CAO' ? 'FFDC2626' : (item[0] === 'CẢNH BÁO' ? 'FFD97706' : 'FF2563EB') } };
    r.getCell(2).alignment = { horizontal: 'center' };
    r.getCell(3).value = item[1];
    r.getCell(3).font = boldFont;
    r.getCell(4).value = item[2];
    r.getCell(4).font = regularFont;
    r.getCell(5).value = item[3];
    r.getCell(5).font = regularFont;
    [2, 3, 4, 5].forEach(col => {
      r.getCell(col).border = thinBorder;
      r.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: currRow % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } };
    });
    r.height = 26;
    currRow++;
  });


  // ==========================================
  // SHEET 2: DANH SÁCH BẢNG & TRẠNG THÁI
  // ==========================================
  const wsTables = workbook.addWorksheet('2. Danh sách Bảng', {
    views: [{ showGridLines: true }]
  });

  wsTables.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Tên Bảng / Đối tượng', key: 'table_name', width: 24 },
    { header: 'Phân hệ / Module', key: 'module', width: 22 },
    { header: 'Nơi lưu trữ', key: 'storage', width: 18 },
    { header: 'Trạng thái', key: 'status', width: 18 },
    { header: 'Số bản ghi (Live)', key: 'records', width: 16 },
    { header: 'Chức năng / Mô tả nghiệp vụ', key: 'description', width: 45 },
    { header: 'File mã nguồn / Migration liên quan', key: 'files', width: 35 }
  ];

  // Style Header
  const tableHeadRow = wsTables.getRow(1);
  tableHeadRow.height = 28;
  tableHeadRow.eachCell(cell => {
    cell.fill = primaryHeaderFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  const tablesList = [
    { stt: 1, name: 'customers', module: 'Khách hàng & Đối tác', storage: 'Supabase DB', status: 'Hoạt động', records: 492, desc: 'Danh bạ thông tin khách hàng, TTKD, người phụ trách, phân loại', files: 'customers_migration_v4.sql, customer-operations.ts' },
    { stt: 2, name: 'contracts', module: 'Hợp đồng & Dịch vụ', storage: 'Supabase DB', status: 'Hoạt động', records: 1162, desc: 'Quản lý hợp đồng bảo trì, dịch vụ, dự án, thời hạn và phụ trách AM', files: 'contracts_migration.sql, contract-operations.ts' },
    { stt: 3, name: 'tickets', module: 'Helpdesk & Ticket', storage: 'Supabase DB', status: 'Hoạt động', records: 29, desc: 'Phiếu hỗ trợ kỹ thuật, xử lý sự cố, theo dõi SLA và tiến độ', files: 'tickets_migration.sql, ticket-operations.ts' },
    { stt: 4, name: 'ticket_updates', module: 'Helpdesk & Ticket', storage: 'Supabase DB', status: 'Hoạt động', records: 4, desc: 'Nhật ký trao đổi và lịch sử thay đổi trạng thái ticket', files: 'supabase_schema.sql, ticket-operations.ts' },
    { stt: 5, name: 'nhan_su', module: 'Nhân sự', storage: 'Supabase DB', status: 'Hoạt động', records: 10, desc: 'Danh sách nhân viên, phòng ban, chức danh, kỹ thuật viên phụ trách', files: 'nhan_su_migration.sql, nhan-su-operations.ts' },
    { stt: 6, name: 'user_groups', module: 'Phân quyền (RBAC)', storage: 'Supabase DB', status: 'Hoạt động', records: 4, desc: 'Nhóm người dùng: Ban Giám Đốc, PM, Technical, Customer và quyền truy cập', files: 'system_users_and_groups_migration.sql' },
    { stt: 7, name: 'system_users', module: 'Tài khoản hệ thống', storage: 'Supabase DB', status: 'Hoạt động', records: 5, desc: 'Tài khoản đăng nhập nội bộ và tài khoản Portal khách hàng', files: 'system_users_and_groups_migration.sql, auth-operations.ts' },
    { stt: 8, name: 'sla_settings', module: 'Cấu hình SLA', storage: 'Supabase DB', status: 'Hoạt động (Trống)', records: 0, desc: 'Quy định thời gian phản hồi (Response) và khắc phục (Resolve) theo L1-L4', files: 'sla_migration.sql, sla-operations.ts' },
    { stt: 9, name: 'contacts', module: 'Danh bạ liên hệ', storage: 'Supabase DB', status: 'Hoạt động (Trống)', records: 0, desc: 'Danh sách người liên hệ chi tiết theo từng khách hàng', files: 'contacts_migration.sql, contact-operations.ts' },
    { stt: 10, name: 'ticket_assigned', module: 'Helpdesk & Ticket', storage: 'Supabase DB', status: 'Hoạt động (Trống)', records: 0, desc: 'Bảng phụ quan hệ n-n: Danh sách nhân viên được gán xử lý ticket', files: 'supabase_schema.sql' },
    { stt: 11, name: 'ticket_following', module: 'Helpdesk & Ticket', storage: 'Supabase DB', status: 'Hoạt động (Trống)', records: 0, desc: 'Bảng phụ quan hệ n-n: Danh sách nhân viên theo dõi ticket', files: 'supabase_schema.sql' },
    { stt: 12, name: 'opportunities', module: 'Cơ hội kinh doanh', storage: 'Supabase DB', status: 'Chưa chạy Migration', records: 0, desc: 'Quản lý cơ hội kinh doanh, dự kiến doanh thu và tỷ lệ thành công', files: 'opportunities_migration.sql, opportunity-operations.ts' },
    { stt: 13, name: 'operation_logs', module: 'Kiểm toán hệ thống', storage: 'Supabase DB', status: 'Chưa chạy Migration', records: 0, desc: 'Ghi vết hành động đăng nhập, tạo, sửa, xóa của người dùng', files: 'system_users_and_groups_migration.sql, logger.ts' },
    { stt: 14, name: 'system_settings', module: 'Cấu hình chung', storage: 'Supabase DB', status: 'Chưa chạy Migration', records: 0, desc: 'Cấu hình lưu trữ tệp đính kèm Google Drive / Supabase storage', files: 'storage_settings_migration.sql, storage-service.ts' },
    { stt: 15, name: 'staff (Bảng cũ)', module: 'Nhân sự cũ', storage: 'Supabase DB', status: 'Đã thay thế', records: 0, desc: 'Bảng nhân viên phiên bản sơ khai (đã được thay bằng nhan_su)', files: 'supabase_schema.sql' },
    { stt: 16, name: 'projects & tasks', module: 'Quản lý Dự án v4.0', storage: 'LocalStorage', status: 'Cần chuyển lên DB', records: 5, desc: 'Kế hoạch dự án, giai đoạn (Phase), task con, Gantt Chart, Milestone, Nhật ký', files: 'lib/project-operations.ts, app/projects/' },
    { stt: 17, name: 'service_requests', module: 'Yêu cầu nội bộ', storage: 'LocalStorage', status: 'Cần chuyển lên DB', records: 4, desc: 'Yêu cầu công việc, yêu cầu hỗ trợ kỹ thuật, yêu cầu triển khai nội bộ', files: 'lib/request-operations.ts, app/requests/' },
    { stt: 18, name: 'notifications', module: 'Trung tâm thông báo', storage: 'LocalStorage', status: 'Cần chuyển lên DB', records: 5, desc: 'Thông báo bảo trì khách hàng và thông báo điều hành nội bộ', files: 'lib/notification-operations.ts' }
  ];

  tablesList.forEach((tbl, idx) => {
    const row = wsTables.addRow({
      stt: tbl.stt,
      table_name: tbl.name,
      module: tbl.module,
      storage: tbl.storage,
      status: tbl.status,
      records: tbl.records,
      description: tbl.desc,
      files: tbl.files
    });
    row.height = 22;
    row.getCell('stt').alignment = { horizontal: 'center' };
    row.getCell('table_name').font = codeFont;
    row.getCell('storage').alignment = { horizontal: 'center' };
    row.getCell('records').alignment = { horizontal: 'right' };
    
    // Status formatting
    const statusCell = row.getCell('status');
    statusCell.alignment = { horizontal: 'center' };
    if (tbl.status === 'Hoạt động') {
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF16A34A' } }; // Green
    } else if (tbl.status.includes('Chưa chạy')) {
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFD97706' } }; // Orange
    } else if (tbl.status.includes('Cần chuyển')) {
      statusCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFDC2626' } }; // Red
    }

    row.eachCell(cell => {
      cell.border = thinBorder;
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });


  // ==========================================
  // SHEET 3: CẤU TRÚC CHI TIẾT CÁC BẢNG (DATA DICTIONARY)
  // ==========================================
  const wsSchema = workbook.addWorksheet('3. Chi tiết Cột & Kiểu dữ liệu', {
    views: [{ showGridLines: true }]
  });

  wsSchema.columns = [
    { header: 'Tên Bảng', key: 'table', width: 20 },
    { header: 'STT', key: 'col_stt', width: 6 },
    { header: 'Tên Cột (Column)', key: 'col_name', width: 22 },
    { header: 'Kiểu dữ liệu (Data Type)', key: 'data_type', width: 18 },
    { header: 'Ràng buộc (Constraints)', key: 'constraints', width: 22 },
    { header: 'Khóa ngoại / Tham chiếu (Foreign Key)', key: 'ref', width: 25 },
    { header: 'Diễn giải / Ý nghĩa nghiệp vụ', key: 'desc', width: 45 }
  ];

  const schemaHeadRow = wsSchema.getRow(1);
  schemaHeadRow.height = 28;
  schemaHeadRow.eachCell(cell => {
    cell.fill = primaryHeaderFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  const columnsData = [
    // CUSTOMERS
    { tbl: 'customers', stt: 1, col: 'id', type: 'UUID', con: 'PRIMARY KEY', ref: '', desc: 'Khóa chính định danh khách hàng (gen_random_uuid)' },
    { tbl: 'customers', stt: 2, col: 'code', type: 'TEXT', con: 'UNIQUE, NOT NULL', ref: '', desc: 'Mã khách hàng tùy chỉnh (VD: BANK-ACB, BANK-VCB)' },
    { tbl: 'customers', stt: 3, col: 'name', type: 'VARCHAR(255)', con: 'NOT NULL', ref: '', desc: 'Tên đầy đủ của đơn vị/khách hàng doanh nghiệp' },
    { tbl: 'customers', stt: 4, col: 'ten_tieng_anh', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Tên giao dịch quốc tế tiếng Anh của doanh nghiệp' },
    { tbl: 'customers', stt: 5, col: 'system_code', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Mã định danh hệ thống (mã ERP/kế toán nội bộ)' },
    { tbl: 'customers', stt: 6, col: 'email', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Email liên hệ chính của doanh nghiệp' },
    { tbl: 'customers', stt: 7, col: 'phone', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Số điện thoại tổng đài / hotline khách hàng' },
    { tbl: 'customers', stt: 8, col: 'address', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Địa chỉ trụ sở chính / chi nhánh' },
    { tbl: 'customers', stt: 9, col: 'contact_person', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Họ tên người liên hệ đại diện chính' },
    { tbl: 'customers', stt: 10, col: 'contact_phone', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Số điện thoại di động người đại diện' },
    { tbl: 'customers', stt: 11, col: 'type', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Loại hình doanh nghiệp: Corporate, SME, Individual' },
    { tbl: 'customers', stt: 12, col: 'phan_loai', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Phân loại đối tác: End User, Partner, Reseller' },
    { tbl: 'customers', stt: 13, col: 'khu_vuc', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Khu vực địa lý: Bắc, Trung, Nam' },
    { tbl: 'customers', stt: 14, col: 'ttkd', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Trung tâm kinh doanh phụ trách (TTKD1, TTKD2...)' },
    { tbl: 'customers', stt: 15, col: 'phu_trach', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Tên nhân sự kinh doanh / AM phụ trách khách hàng' },
    { tbl: 'customers', stt: 16, col: 'tinh_trang', type: 'TEXT', con: 'DEFAULT "Active"', ref: '', desc: 'Trạng thái hoạt động: Active, Inactive' },
    { tbl: 'customers', stt: 17, col: 'ghi_chu', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Ghi chú đặc thù về khách hàng' },
    { tbl: 'customers', stt: 18, col: 'created_at', type: 'TIMESTAMP', con: 'DEFAULT NOW()', ref: '', desc: 'Thời điểm tạo bản ghi khách hàng' },
    { tbl: 'customers', stt: 19, col: 'updated_at', type: 'TIMESTAMP', con: 'DEFAULT NOW()', ref: '', desc: 'Thời điểm cập nhật bản ghi gần nhất' },

    // CONTRACTS
    { tbl: 'contracts', stt: 1, col: 'id', type: 'UUID', con: 'PRIMARY KEY', ref: '', desc: 'Khóa chính định danh hợp đồng' },
    { tbl: 'contracts', stt: 2, col: 'contract_no', type: 'VARCHAR(100)', con: 'NULLABLE', ref: '', desc: 'Số hiệu hợp đồng thực tế (VD: ACB-02-20045)' },
    { tbl: 'contracts', stt: 3, col: 'project_id', type: 'VARCHAR(100)', con: 'NULLABLE', ref: '', desc: 'Mã dự án liên kết với hợp đồng' },
    { tbl: 'contracts', stt: 4, col: 'customer', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Tên khách hàng ký kết hợp đồng' },
    { tbl: 'contracts', stt: 5, col: 'end_user', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Đơn vị sử dụng cuối cùng (End-user)' },
    { tbl: 'contracts', stt: 6, col: 'supplier', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Nhà cung cấp / đối tác cung ứng' },
    { tbl: 'contracts', stt: 7, col: 'service', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Dịch vụ cung cấp theo hợp đồng' },
    { tbl: 'contracts', stt: 8, col: 'contract_type', type: 'VARCHAR(50)', con: 'DEFAULT "Hợp đồng dịch vụ"', ref: '', desc: 'Loại hợp đồng: Dịch vụ, Bảo trì, Mua bán' },
    { tbl: 'contracts', stt: 9, col: 'signed_date', type: 'DATE', con: 'NULLABLE', ref: '', desc: 'Ngày ký kết hợp đồng' },
    { tbl: 'contracts', stt: 10, col: 'expiry_date', type: 'DATE', con: 'NULLABLE', ref: '', desc: 'Ngày hết hạn hiệu lực hợp đồng' },
    { tbl: 'contracts', stt: 11, col: 'status', type: 'VARCHAR(50)', con: 'DEFAULT "Active"', ref: '', desc: 'Trạng thái hiệu lực: Active, Expired, Inactive' },
    { tbl: 'contracts', stt: 12, col: 'am', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Tên cán bộ phụ trách hợp đồng (Account Manager)' },
    { tbl: 'contracts', stt: 13, col: 'team', type: 'VARCHAR(100)', con: 'NULLABLE', ref: '', desc: 'Đội nhóm kinh doanh / phòng ban phụ trách' },
    { tbl: 'contracts', stt: 14, col: 'fy', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Năm tài chính (Financial Year: FY24, FY25...)' },
    { tbl: 'contracts', stt: 15, col: 'description', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Mô tả chi tiết nội dung và phạm vi hợp đồng' },
    { tbl: 'contracts', stt: 16, col: 'created_at', type: 'TIMESTAMP', con: 'DEFAULT NOW()', ref: '', desc: 'Thời điểm tạo bản ghi hợp đồng' },
    { tbl: 'contracts', stt: 17, col: 'updated_at', type: 'TIMESTAMP', con: 'DEFAULT NOW()', ref: '', desc: 'Thời điểm cập nhật hợp đồng gần nhất' },

    // TICKETS
    { tbl: 'tickets', stt: 1, col: 'id', type: 'UUID', con: 'PRIMARY KEY', ref: '', desc: 'Khóa chính định danh ticket' },
    { tbl: 'tickets', stt: 2, col: 'ticket_id', type: 'VARCHAR(50)', con: 'UNIQUE, NOT NULL', ref: '', desc: 'Mã số ticket theo chuẩn hiển thị (VD: TH-1021)' },
    { tbl: 'tickets', stt: 3, col: 'title', type: 'VARCHAR(255)', con: 'NOT NULL', ref: '', desc: 'Tiêu đề tóm tắt sự cố hoặc yêu cầu hỗ trợ' },
    { tbl: 'tickets', stt: 4, col: 'description', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Nội dung mô tả chi tiết vấn đề kỹ thuật' },
    { tbl: 'tickets', stt: 5, col: 'customer_id', type: 'UUID', con: 'NULLABLE', ref: 'customers(id)', desc: 'ID khách hàng gửi yêu cầu' },
    { tbl: 'tickets', stt: 6, col: 'customer_name', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Tên khách hàng (phi chuẩn hóa để hiển thị nhanh)' },
    { tbl: 'tickets', stt: 7, col: 'contract_id', type: 'UUID', con: 'NULLABLE', ref: 'contracts(id)', desc: 'ID hợp đồng dịch vụ liên quan' },
    { tbl: 'tickets', stt: 8, col: 'contract_no', type: 'VARCHAR(100)', con: 'NULLABLE', ref: '', desc: 'Số hợp đồng liên quan' },
    { tbl: 'tickets', stt: 9, col: 'contract_scope', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Phạm vi hợp đồng: Trong HĐ, Ngoài HĐ' },
    { tbl: 'tickets', stt: 10, col: 'tt_type', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Loại ticket: Bug, Request, Feature, Incident' },
    { tbl: 'tickets', stt: 11, col: 'category', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Phân loại lỗi: Technical, Payment, Network, Server' },
    { tbl: 'tickets', stt: 12, col: 'priority', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Mức độ ưu tiên: Low, Medium, High, Critical' },
    { tbl: 'tickets', stt: 13, col: 'tt_status', type: 'VARCHAR(50)', con: 'DEFAULT "New"', ref: '', desc: 'Trạng thái ticket: New, In Progress, On Hold, Resolved, Closed' },
    { tbl: 'tickets', stt: 14, col: 'progress', type: 'VARCHAR(20)', con: 'NULLABLE', ref: '', desc: 'Tiến độ hoàn thành xử lý (0-100%)' },
    { tbl: 'tickets', stt: 15, col: 'creator_id', type: 'UUID', con: 'NULLABLE', ref: 'nhan_su(id)', desc: 'ID người tạo ticket' },
    { tbl: 'tickets', stt: 16, col: 'creator_name', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Tên người tạo ticket' },
    { tbl: 'tickets', stt: 17, col: 'assigned', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Kỹ sư được phân công chính xử lý' },
    { tbl: 'tickets', stt: 18, col: 'following', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Danh sách nhân sự cùng theo dõi ticket' },
    { tbl: 'tickets', stt: 19, col: 'sla_time', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Thời hạn SLA cam kết (VD: 2h 30m)' },
    { tbl: 'tickets', stt: 20, col: 'sla_status', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Trạng thái SLA: Within (Đạt), Breached (Vi phạm)' },
    { tbl: 'tickets', stt: 21, col: 'start_time', type: 'TIMESTAMP', con: 'NULLABLE', ref: '', desc: 'Thời điểm bắt đầu tiếp nhận xử lý' },
    { tbl: 'tickets', stt: 22, col: 'end_time', type: 'TIMESTAMP', con: 'NULLABLE', ref: '', desc: 'Thời điểm kỹ thuật viên xử lý xong' },
    { tbl: 'tickets', stt: 23, col: 'close_time', type: 'TIMESTAMP', con: 'NULLABLE', ref: '', desc: 'Thời điểm đóng ticket hoàn tất' },
    { tbl: 'tickets', stt: 24, col: 'hold_time', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Tổng thời gian tạm dừng xử lý (tạm dừng tính SLA)' },
    { tbl: 'tickets', stt: 25, col: 'hold_reason', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Lý do tạm hoãn xử lý (chờ linh kiện/khách hàng)' },
    { tbl: 'tickets', stt: 26, col: 'onsite', type: 'VARCHAR(50)', con: 'NULLABLE', ref: '', desc: 'Xử lý Onsite hay Remote' },
    { tbl: 'tickets', stt: 27, col: 'runbook', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Quy trình / Hướng dẫn thao tác áp dụng' },
    { tbl: 'tickets', stt: 28, col: 'document_link', type: 'VARCHAR(500)', con: 'NULLABLE', ref: '', desc: 'Đường dẫn tệp đính kèm tài liệu, ảnh chụp lỗi' },
    { tbl: 'tickets', stt: 29, col: 'created_at', type: 'TIMESTAMP', con: 'DEFAULT NOW()', ref: '', desc: 'Thời điểm tạo ticket' },
    { tbl: 'tickets', stt: 30, col: 'updated_at', type: 'TIMESTAMP', con: 'DEFAULT NOW()', ref: '', desc: 'Thời điểm cập nhật ticket gần nhất' },

    // NHAN_SU
    { tbl: 'nhan_su', stt: 1, col: 'id', type: 'UUID', con: 'PRIMARY KEY', ref: '', desc: 'Khóa chính định danh nhân sự' },
    { tbl: 'nhan_su', stt: 2, col: 'ma_nhan_su', type: 'VARCHAR(20)', con: 'UNIQUE, NOT NULL', ref: '', desc: 'Mã số nhân viên (VD: NS-001, NS-002)' },
    { tbl: 'nhan_su', stt: 3, col: 'ten_nhan_su', type: 'VARCHAR(255)', con: 'NOT NULL', ref: '', desc: 'Họ và tên nhân viên' },
    { tbl: 'nhan_su', stt: 4, col: 'bo_phan', type: 'VARCHAR(100)', con: 'NULLABLE', ref: '', desc: 'Phòng ban: Kỹ thuật, Dự án, Kinh doanh, HC-NS' },
    { tbl: 'nhan_su', stt: 5, col: 'chuc_vu', type: 'VARCHAR(100)', con: 'NULLABLE', ref: '', desc: 'Chức danh: Nhân viên, Trưởng phòng, Kỹ sư' },
    { tbl: 'nhan_su', stt: 6, col: 'phu_trach', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Mảng chuyên môn phụ trách: Database, Network, Cloud' },
    { tbl: 'nhan_su', stt: 7, col: 'ngay_sinh', type: 'DATE', con: 'NULLABLE', ref: '', desc: 'Ngày tháng năm sinh' },
    { tbl: 'nhan_su', stt: 8, col: 'so_cccd', type: 'VARCHAR(20)', con: 'NULLABLE', ref: '', desc: 'Số Căn cước công dân' },
    { tbl: 'nhan_su', stt: 9, col: 'cap_ngay', type: 'DATE', con: 'NULLABLE', ref: '', desc: 'Ngày cấp thẻ CCCD' },
    { tbl: 'nhan_su', stt: 10, col: 'email', type: 'VARCHAR(255)', con: 'NULLABLE', ref: '', desc: 'Email công vụ nhân viên' },
    { tbl: 'nhan_su', stt: 11, col: 'so_dien_thoai', type: 'VARCHAR(20)', con: 'NULLABLE', ref: '', desc: 'Số điện thoại liên lạc' },
    { tbl: 'nhan_su', stt: 12, col: 'dia_chi', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Địa chỉ thường trú / tạm trú' },
    { tbl: 'nhan_su', stt: 13, col: 'created_at', type: 'TIMESTAMP', con: 'DEFAULT NOW()', ref: '', desc: 'Ngày tạo hồ sơ nhân sự' },
    { tbl: 'nhan_su', stt: 14, col: 'updated_at', type: 'TIMESTAMP', con: 'DEFAULT NOW()', ref: '', desc: 'Ngày cập nhật hồ sơ gần nhất' },

    // USER_GROUPS & SYSTEM_USERS
    { tbl: 'user_groups', stt: 1, col: 'id', type: 'VARCHAR(50)', con: 'PRIMARY KEY', ref: '', desc: 'Mã nhóm quyền (g-1, g-2, g-3, g-4)' },
    { tbl: 'user_groups', stt: 2, col: 'name', type: 'VARCHAR(255)', con: 'UNIQUE, NOT NULL', ref: '', desc: 'Tên nhóm: Ban Giám Đốc, Quản lý Dự án, Kỹ thuật...' },
    { tbl: 'user_groups', stt: 3, col: 'description', type: 'TEXT', con: 'NULLABLE', ref: '', desc: 'Mô tả phạm vi quyền hạn nhóm' },
    { tbl: 'user_groups', stt: 4, col: 'role', type: 'VARCHAR(50)', con: 'NOT NULL', ref: '', desc: 'Role cơ sở: Admin, PM, Technical, Customer' },
    { tbl: 'user_groups', stt: 5, col: 'permissions', type: 'TEXT[]', con: 'DEFAULT "{}"', ref: '', desc: 'Mảng danh sách các route đường dẫn được truy cập' },

    { tbl: 'system_users', stt: 1, col: 'id', type: 'VARCHAR(50)', con: 'PRIMARY KEY', ref: '', desc: 'Mã tài khoản (u-1, u-2...)' },
    { tbl: 'system_users', stt: 2, col: 'email', type: 'VARCHAR(255)', con: 'UNIQUE, NOT NULL', ref: '', desc: 'Email đăng nhập hệ thống' },
    { tbl: 'system_users', stt: 3, col: 'name', type: 'VARCHAR(255)', con: 'NOT NULL', ref: '', desc: 'Tên hiển thị người dùng' },
    { tbl: 'system_users', stt: 4, col: 'password', type: 'VARCHAR(255)', con: 'NOT NULL', ref: '', desc: 'Mật khẩu tài khoản (hiện lưu text)' },
    { tbl: 'system_users', stt: 5, col: 'role', type: 'VARCHAR(50)', con: 'NOT NULL', ref: '', desc: 'Vai trò: Admin, PM, Technical, Customer' },
    { tbl: 'system_users', stt: 6, col: 'group_id', type: 'VARCHAR(50)', con: 'NULLABLE', ref: 'user_groups(id)', desc: 'Nhóm quyền trực thuộc' },
    { tbl: 'system_users', stt: 7, col: 'customer_id', type: 'UUID', con: 'NULLABLE', ref: 'customers(id)', desc: 'ID khách hàng liên kết (nếu là tài khoản Portal)' },
    { tbl: 'system_users', stt: 8, col: 'active', type: 'BOOLEAN', con: 'DEFAULT true', ref: '', desc: 'Trạng thái hoạt động tài khoản' },
    { tbl: 'system_users', stt: 9, col: 'created_at', type: 'TIMESTAMPTZ', con: 'DEFAULT NOW()', ref: '', desc: 'Thời điểm tạo tài khoản' }
  ];

  let prevTbl = '';
  columnsData.forEach((col, idx) => {
    const row = wsSchema.addRow({
      table: col.tbl,
      col_stt: col.stt,
      col_name: col.col,
      data_type: col.type,
      constraints: col.con,
      ref: col.ref,
      desc: col.desc
    });
    row.height = 20;
    row.getCell('table').font = boldFont;
    row.getCell('col_stt').alignment = { horizontal: 'center' };
    row.getCell('col_name').font = codeFont;
    row.getCell('data_type').font = codeFont;
    row.getCell('constraints').font = codeFont;
    row.getCell('ref').font = codeFont;

    row.eachCell(cell => {
      cell.border = thinBorder;
      if (col.tbl !== prevTbl) {
        cell.border = { ...thinBorder, top: { style: 'medium', color: { argb: 'FF94A3B8' } } };
      }
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
    prevTbl = col.tbl;
  });


  // ==========================================
  // SHEET 4: ĐỀ XUẤT TỐI ƯU & LỘ TRÌNH (OPTIMIZATION)
  // ==========================================
  const wsOpt = workbook.addWorksheet('4. Đề xuất Tối ưu hóa', {
    views: [{ showGridLines: true }]
  });

  wsOpt.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Hạng mục', key: 'category', width: 18 },
    { header: 'Vấn đề hiện tại', key: 'problem', width: 32 },
    { header: 'Rủi ro / Tác động', key: 'risk', width: 35 },
    { header: 'Giải pháp đề xuất thực hiện', key: 'solution', width: 45 },
    { header: 'Mức độ ưu tiên', key: 'priority', width: 16 },
    { header: 'Thực thi kỹ thuật', key: 'action', width: 35 }
  ];

  const optHeadRow = wsOpt.getRow(1);
  optHeadRow.height = 28;
  optHeadRow.eachCell(cell => {
    cell.fill = primaryHeaderFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  const optimizations = [
    {
      stt: 1,
      cat: 'Cấu trúc dữ liệu',
      prob: 'Kế hoạch Dự án & Gantt Chart đang lưu ở LocalStorage',
      risk: 'Mất toàn bộ dữ liệu dự án khi xóa cache trình duyệt, không chia sẻ được dữ liệu giữa nhiều người dùng',
      sol: 'Tạo bảng `projects`, `project_tasks`, `project_milestones`, `project_documents` trên Supabase và đồng bộ 2 chiều',
      prio: 'Cao (High)',
      action: 'Tạo bảng SQL mới và refactor project-operations.ts'
    },
    {
      stt: 2,
      cat: 'Đồng bộ Schema',
      prob: '3 bảng opportunities, operation_logs, system_settings chưa được tạo trên Supabase',
      risk: 'Gây lỗi API khi hệ thống gọi đến các chức năng cơ hội kinh doanh, nhật ký thao tác và cấu hình lưu trữ Drive',
      sol: 'Thực thi 3 file migration SQL có sẵn trên Supabase Dashboard SQL Editor',
      prio: 'Cao (High)',
      action: 'Chạy opportunities_migration.sql, storage_settings_migration.sql'
    },
    {
      stt: 3,
      cat: 'Bảo mật',
      prob: 'Mật khẩu tài khoản system_users đang lưu dạng Plain Text (123)',
      risk: 'Lộ mật khẩu người dùng nếu database bị xem trái phép',
      sol: 'Mã hóa mật khẩu bằng bcrypt hoặc tích hợp Supabase Auth với session bảo mật',
      prio: 'Cao (High)',
      action: 'Nâng cấp auth-operations.ts với mã hóa hash'
    },
    {
      stt: 4,
      cat: 'Bảo mật RLS',
      prob: 'Chính sách Row Level Security (RLS) đang mở hoàn toàn (USING true)',
      risk: 'Người dùng nặc danh có thể đọc/ghi đè mọi bản ghi nếu có API URL & Anon Key',
      sol: 'Thiết lập policy RLS dựa trên Role của tài khoản (Admin toàn quyền, Technical/PM xem theo phạm vi, Customer chỉ xem dữ liệu của mình)',
      prio: 'Trung bình (Medium)',
      action: 'Cập nhật fix-rls-policies.sql'
    },
    {
      stt: 5,
      cat: 'Hiệu năng truy vấn',
      prob: 'Bảng contracts (1.162 dòng) và customers (492 dòng) thiếu Index tìm kiếm văn bản',
      risk: 'Tốc độ load và lọc bảng trên giao diện sẽ chậm dần khi dữ liệu tăng trưởng lên hàng chục nghìn dòng',
      sol: 'Bổ sung Composite Index trên (status, expiry_date) và GIN Trigram Index trên các trường mã và tên',
      prio: 'Trung bình (Medium)',
      action: 'Chạy lệnh CREATE INDEX pg_trgm trên Supabase'
    },
    {
      stt: 6,
      cat: 'Chuẩn hóa dữ liệu',
      prob: 'Bảng tickets lưu trùng lặp tên khách hàng, số HĐ và tên nhân viên',
      risk: 'Khi khách hàng đổi tên hoặc nhân viên đổi tên, dữ liệu cũ trong ticket không tự động đồng bộ',
      sol: 'Tạo PostgreSQL View kết hợp JOIN giữa tickets, customers, contracts và nhan_su để trả về đầy đủ thông tin chuẩn xác',
      prio: 'Thấp (Low)',
      action: 'Tạo View `v_tickets_full` trên Supabase'
    }
  ];

  optimizations.forEach((item, idx) => {
    const row = wsOpt.addRow({
      stt: item.stt,
      category: item.cat,
      problem: item.prob,
      risk: item.risk,
      solution: item.sol,
      priority: item.prio,
      action: item.action
    });
    row.height = 36;
    row.getCell('stt').alignment = { horizontal: 'center' };
    row.getCell('category').font = boldFont;
    row.getCell('priority').alignment = { horizontal: 'center' };
    
    if (item.prio.includes('Cao')) {
      row.getCell('priority').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFDC2626' } };
    } else if (item.prio.includes('Trung bình')) {
      row.getCell('priority').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFD97706' } };
    } else {
      row.getCell('priority').font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF2563EB' } };
    }

    row.eachCell(cell => {
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', wrapText: true };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });

  const outputPath = path.join(__dirname, 'Bao_Cao_Hien_Trang_Database_JPT.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log('EXCEL_SAVED_SUCCESSFULLY:', outputPath);
}

createReport().catch(console.error);

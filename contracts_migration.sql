-- ============================================================
-- Contracts Table Migration - Add missing columns
-- ============================================================

-- Add contract_no column (Số HĐ)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_no VARCHAR(100);

-- Add contract_type column (Loại HĐ)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50) DEFAULT 'Hợp đồng dịch vụ';

-- Add signed_date column (Ngày ký HĐ)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signed_date DATE;

-- Add owner_name column (Phụ trách HĐ - tên text thay vì FK)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);

-- ============================================================
-- Insert 20 Test Contract Records
-- (Requires customers to exist first - run customer migration before this)
-- ============================================================

-- Helper: We insert without customer_id FK for now (set NULL)
-- In production, replace NULL with actual customer UUID

INSERT INTO contracts (code, contract_no, name, contract_type, customer_id, owner_name, start_date, end_date, signed_date, status, description)
VALUES
  ('CTR-001', 'ACB-02-20045', 'Hợp đồng dịch vụ CNTT 2024', 'Hợp đồng dịch vụ', NULL, 'Quang', '2024-01-15', '2025-01-14', '2024-01-10', 'Active', 'Hợp đồng triển khai và bảo trì hệ thống CNTT cho ngân hàng ACB'),
  ('CTR-002', 'VCB-01-20046', 'Hợp đồng bảo trì hệ thống', 'Hợp đồng bảo trì', NULL, 'Minh', '2024-02-01', '2025-01-31', '2024-01-25', 'Active', 'Bảo trì định kỳ hệ thống core banking Vietcombank'),
  ('CTR-003', 'TCB-03-20047', 'Hợp đồng cung cấp phần mềm', 'Hợp đồng mua bán', NULL, 'Linh', '2024-03-01', '2026-02-28', '2024-02-20', 'Active', 'Cung cấp license phần mềm quản lý cho Techcombank'),
  ('CTR-004', 'BID-02-20048', 'Hợp đồng thuê cloud infrastructure', 'Hợp đồng dịch vụ', NULL, 'Quang', '2024-01-01', '2024-12-31', '2023-12-28', 'Active', 'Thuê hạ tầng cloud AWS cho BIDV'),
  ('CTR-005', 'VPB-01-20049', 'Hợp đồng tư vấn chuyển đổi số', 'Hợp đồng dịch vụ', NULL, 'Hùng', '2024-04-01', '2024-09-30', '2024-03-15', 'Expired', 'Tư vấn và triển khai chiến lược chuyển đổi số VPBank'),
  ('CTR-006', 'MBB-02-20050', 'Hợp đồng bảo mật thông tin', 'Hợp đồng dịch vụ', NULL, 'Minh', '2024-05-01', '2025-04-30', '2024-04-22', 'Active', 'Dịch vụ bảo mật và giám sát an ninh mạng MB Bank'),
  ('CTR-007', 'STB-03-20051', 'Hợp đồng hỗ trợ kỹ thuật 24/7', 'Hợp đồng bảo trì', NULL, 'Linh', '2024-06-01', '2025-05-31', '2024-05-28', 'Active', 'Hỗ trợ kỹ thuật toàn thời gian cho Sacombank'),
  ('CTR-008', 'HDB-01-20052', 'Hợp đồng cung cấp thiết bị', 'Hợp đồng mua bán', NULL, 'Quang', '2024-02-15', '2024-06-30', '2024-02-10', 'Expired', 'Cung cấp server và thiết bị mạng cho HDBank'),
  ('CTR-009', 'LPB-02-20053', 'Hợp đồng phát triển phần mềm', 'Hợp đồng dịch vụ', NULL, 'Hùng', '2024-07-01', '2025-06-30', '2024-06-20', 'Active', 'Phát triển ứng dụng mobile banking cho LienPetroBank'),
  ('CTR-010', 'OCB-03-20054', 'Hợp đồng đào tạo nhân viên', 'Hợp đồng dịch vụ', NULL, 'Minh', '2024-08-01', '2024-11-30', '2024-07-25', 'Inactive', 'Chương trình đào tạo CNTT cho nhân viên OCB'),
  ('CTR-011', 'TPB-01-20055', 'Hợp đồng tích hợp hệ thống', 'Hợp đồng dịch vụ', NULL, 'Linh', '2024-09-01', '2025-08-31', '2024-08-20', 'Active', 'Tích hợp API thanh toán và core banking TPBank'),
  ('CTR-012', 'BAB-02-20056', 'Hợp đồng kiểm thử phần mềm', 'Hợp đồng dịch vụ', NULL, 'Quang', '2024-03-15', '2024-08-14', '2024-03-10', 'Expired', 'Kiểm thử toàn diện hệ thống phần mềm BAC A BANK'),
  ('CTR-013', 'NAB-03-20057', 'Hợp đồng bảo trì phần cứng', 'Hợp đồng bảo trì', NULL, 'Hùng', '2024-10-01', '2025-09-30', '2024-09-15', 'Active', 'Bảo trì định kỳ hệ thống máy chủ và thiết bị Nam A Bank'),
  ('CTR-014', 'KLB-01-20058', 'Hợp đồng triển khai ERP', 'Hợp đồng dịch vụ', NULL, 'Minh', '2024-11-01', '2025-10-31', '2024-10-22', 'Active', 'Triển khai hệ thống ERP cho Kienlongbank'),
  ('CTR-015', 'PVB-02-20059', 'Hợp đồng nâng cấp hệ thống', 'Hợp đồng dịch vụ', NULL, 'Linh', '2024-04-01', '2024-07-31', '2024-03-28', 'Expired', 'Nâng cấp hệ thống core banking PVComBank'),
  ('CTR-016', 'VAB-03-20060', 'Hợp đồng dịch vụ cloud', 'Hợp đồng dịch vụ', NULL, 'Quang', '2024-12-01', '2025-11-30', '2024-11-20', 'Active', 'Cung cấp dịch vụ điện toán đám mây cho VietA Bank'),
  ('CTR-017', 'IVB-01-20061', 'Hợp đồng tư vấn giải pháp', 'Hợp đồng dịch vụ', NULL, 'Hùng', '2025-01-01', '2025-12-31', '2024-12-15', 'Active', 'Tư vấn giải pháp công nghệ toàn diện cho IndovinaBank'),
  ('CTR-018', 'WOO-02-20062', 'Hợp đồng outsource IT', 'Hợp đồng dịch vụ', NULL, 'Minh', '2025-01-15', '2026-01-14', '2025-01-10', 'Active', 'Dịch vụ outsource CNTT cho Woori Bank Việt Nam'),
  ('CTR-019', 'SHB-03-20063', 'Hợp đồng xây dựng data center', 'Hợp đồng mua bán', NULL, 'Linh', '2025-02-01', '2025-12-31', '2025-01-25', 'Active', 'Xây dựng và triển khai trung tâm dữ liệu dự phòng SHB'),
  ('CTR-020', 'ABB-01-20064', 'Hợp đồng giám sát hệ thống', 'Hợp đồng dịch vụ', NULL, 'Quang', '2025-03-01', '2026-02-28', '2025-02-20', 'Active', 'Giám sát 24/7 và cảnh báo sự cố hệ thống ABBank')
ON CONFLICT (code) DO NOTHING;

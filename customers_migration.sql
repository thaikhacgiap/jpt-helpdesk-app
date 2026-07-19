-- ============================================================
-- Cập nhật bảng customers: thêm các cột mới
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

-- Thêm cột tinh_trang (Active / Inactive)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tinh_trang VARCHAR(20) DEFAULT 'Active';

-- Thêm cột khu_vuc (Bắc / Trung / Nam)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS khu_vuc VARCHAR(50);

-- Thêm cột phu_trach (Tên người phụ trách - lấy từ nhan_su)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phu_trach VARCHAR(255);

-- Thêm cột ttkd (mã TTKD)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ttkd VARCHAR(50);

-- Thêm cột ghi_chu
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ghi_chu TEXT;

-- Thêm cột phan_loai (End User / Partner / Reseller / Internal)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phan_loai VARCHAR(50);


-- ============================================================
-- Đảm bảo cột code là UNIQUE (người dùng tự nhập, không được trùng)
-- ============================================================
-- Nếu chưa có unique constraint trên code, thêm vào:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'customers'::regclass
      AND contype = 'u'
      AND conname = 'customers_code_unique'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_code_unique UNIQUE (code);
  END IF;
END $$;

-- Cập nhật sample data (khớp với ảnh)
UPDATE customers SET
  tinh_trang = 'Active',
  khu_vuc = 'Bắc',
  phu_trach = 'Nguyễn Văn A',
  ttkd = 'TTKD1'
WHERE code = 'BANK-ACB';

-- Xác nhận cấu trúc bảng
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Xác nhận constraint UNIQUE
SELECT conname, contype FROM pg_constraint
WHERE conrelid = 'customers'::regclass;

-- ============================================================
-- SỬA FOREIGN KEY: cho phép xóa khách hàng khi còn ticket
-- Chọn 1 trong 2 cách bên dưới
-- ============================================================

-- CÁCH 1 (Khuyến nghị): Khi xóa customer → customer_id trong tickets = NULL
-- (ticket vẫn còn, chỉ mất liên kết với khách hàng)
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_customer_id_fkey;
ALTER TABLE tickets
  ADD CONSTRAINT tickets_customer_id_fkey
  FOREIGN KEY (customer_id)
  REFERENCES customers(id)
  ON DELETE SET NULL;

-- CÁCH 2 (Cẩn thận!): Khi xóa customer → xóa luôn tất cả ticket liên quan
-- ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_customer_id_fkey;
-- ALTER TABLE tickets
--   ADD CONSTRAINT tickets_customer_id_fkey
--   FOREIGN KEY (customer_id)
--   REFERENCES customers(id)
--   ON DELETE CASCADE;

-- Xác nhận FK sau khi sửa
SELECT conname, confupdtype, confdeltype
FROM pg_constraint
WHERE conrelid = 'tickets'::regclass AND contype = 'f';


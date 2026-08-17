-- ============================================================
-- Migration v2 cho bảng customers
-- Cập nhật cấu trúc bảng khách hàng theo quy chuẩn mới
-- ============================================================

-- 1. Thêm các cột chuẩn theo nghiệp vụ mới
ALTER TABLE customers ADD COLUMN IF NOT EXISTS system_code VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ten_tieng_anh TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ttkd VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phu_trach VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ghi_chu TEXT;

-- 2. Đảm bảo cột code là UNIQUE (mã khách hàng từ sheet import)
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

-- 3. Tạo index tìm kiếm nhanh theo system_code và code
CREATE INDEX IF NOT EXISTS idx_customers_system_code ON customers(system_code);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- 4. Đơn giản hóa: Cập nhật system_code KH-xxx cho các bản ghi chưa có
DO $$
DECLARE
  r RECORD;
  idx INT := 1;
BEGIN
  FOR r IN SELECT id FROM customers WHERE system_code IS NULL ORDER BY created_at ASC LOOP
    UPDATE customers SET system_code = 'KH-' || LPAD(idx::text, 3, '0') WHERE id = r.id;
    idx := idx + 1;
  END LOOP;
END $$;

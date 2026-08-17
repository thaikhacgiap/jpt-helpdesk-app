-- ============================================================
-- Migration v3 - Chuẩn hóa bảng customers cho Google Sheet Import
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

-- BƯỚC 1: Đảm bảo tất cả cột cần thiết đều tồn tại
ALTER TABLE customers ADD COLUMN IF NOT EXISTS system_code   VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ten_tieng_anh TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ttkd          VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phu_trach     VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ghi_chu       TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tinh_trang    VARCHAR(20) DEFAULT 'Active';

-- BƯỚC 2: Đảm bảo cột code là UNIQUE
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

-- BƯỚC 3: Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_customers_system_code ON customers(system_code);
CREATE INDEX IF NOT EXISTS idx_customers_name        ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_code        ON customers(code);

-- BƯỚC 4: Gán lại system_code KH-xxx cho bản ghi chưa có
DO $$
DECLARE
  r   RECORD;
  idx INT := 1;
BEGIN
  FOR r IN SELECT id FROM customers WHERE system_code IS NULL ORDER BY created_at ASC LOOP
    UPDATE customers
    SET system_code = 'KH-' || LPAD(idx::text, 3, '0')
    WHERE id = r.id;
    idx := idx + 1;
  END LOOP;
END $$;

-- BƯỚC 5: Thêm DELETE policy cho RLS (cần thiết để xóa từ API)
DROP POLICY IF EXISTS "Enable delete for all users" ON customers;
CREATE POLICY "Enable delete for all users"
ON customers FOR DELETE
USING (true);

-- BƯỚC 6: Xác nhận cấu trúc bảng sau migration
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

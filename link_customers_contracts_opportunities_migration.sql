-- ============================================================
-- LIÊN KẾT BẢNG CUSTOMERS VỚI CONTRACTS & OPPORTUNITIES QUA ID
-- Chạy script này trong Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/sql/new
-- ============================================================

-- 1. Đảm bảo bảng opportunities tồn tại đầy đủ các cột và khóa ngoại customer_id
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_code VARCHAR(50),
  code VARCHAR(100) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_code VARCHAR(100),
  customer_name TEXT,
  giai_doan VARCHAR(100) DEFAULT 'Tiềm năng',
  gia_tri TEXT,
  xac_suat VARCHAR(50),
  ngay_du_kien TEXT,
  ttkd VARCHAR(100),
  phu_trach VARCHAR(255),
  tinh_trang VARCHAR(50) DEFAULT 'Active',
  ghi_chu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS cho opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'Enable all for opportunities'
  ) THEN
    CREATE POLICY "Enable all for opportunities" ON opportunities
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;


-- 2. Thêm cột customer_id vào bảng contracts nếu chưa có
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;


-- 3. TỰ ĐỘNG MAP DỮ LIỆU HIỆN CÓ: Điền customer_id dựa trên so khớp tên hoặc mã khách hàng
-- So khớp chính xác hoặc tương đồng không phân biệt hoa thường và khoảng trắng thừa

-- A. Cập nhật cho bảng CONTRACTS
UPDATE contracts c
SET customer_id = cust.id
FROM customers cust
WHERE c.customer_id IS NULL
  AND (
    LOWER(TRIM(c.customer)) = LOWER(TRIM(cust.name))
    OR LOWER(TRIM(c.customer)) = LOWER(TRIM(cust.code))
    OR LOWER(TRIM(c.customer)) = LOWER(TRIM(cust.ten_tieng_anh))
    OR (cust.code != '' AND c.customer ILIKE '%' || cust.code || '%')
  );

-- B. Cập nhật cho bảng OPPORTUNITIES
UPDATE opportunities o
SET customer_id = cust.id
FROM customers cust
WHERE o.customer_id IS NULL
  AND (
    LOWER(TRIM(o.customer_name)) = LOWER(TRIM(cust.name))
    OR LOWER(TRIM(o.customer_code)) = LOWER(TRIM(cust.code))
    OR (cust.code != '' AND o.customer_name ILIKE '%' || cust.code || '%')
  );


-- 4. TẠO INDEX TỐI ƯU HIỆU NĂNG CHO KHÓA NGOẠI
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_id ON opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_code ON opportunities(code);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_code ON opportunities(customer_code);


-- 5. VIEW BÁO CÁO TỔNG QUAN KHÁCH HÀNG 360 ĐỘ (Optional - Xem toàn bộ Hợp đồng + Cơ hội + Ticket theo Khách hàng)
CREATE OR REPLACE VIEW v_customer_overview AS
SELECT 
  c.id AS customer_id,
  c.code AS customer_code,
  c.name AS customer_name,
  c.type AS customer_type,
  c.tinh_trang,
  c.phu_trach,
  (SELECT COUNT(*) FROM contracts ctr WHERE ctr.customer_id = c.id) AS total_contracts,
  (SELECT COUNT(*) FROM contracts ctr WHERE ctr.customer_id = c.id AND ctr.status = 'Active') AS active_contracts,
  (SELECT COUNT(*) FROM opportunities opp WHERE opp.customer_id = c.id) AS total_opportunities,
  (SELECT COUNT(*) FROM tickets t WHERE t.customer_id = c.id) AS total_tickets
FROM customers c;

-- Xác nhận kết quả liên kết
SELECT 
  COUNT(*) AS total_contracts,
  COUNT(customer_id) AS linked_contracts,
  COUNT(*) - COUNT(customer_id) AS unlinked_contracts
FROM contracts;

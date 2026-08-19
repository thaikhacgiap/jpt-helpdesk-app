-- ==============================================================================
-- TẠO LẠI BẢNG CONTRACTS (HỢP ĐỒNG) CHUẨN 14 TRƯỜNG ĐỒNG BỘ GOOGLE SHEETS
-- Khóa kiểm tra & lọc trùng: CONTRACT NO
-- ==============================================================================

-- 1. Xóa bảng cũ nếu tồn tại
DROP TABLE IF EXISTS contracts CASCADE;

-- 2. Tạo bảng mới với 14 trường chuẩn
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_no TEXT NOT NULL UNIQUE,                -- CONTRACT NO (Khóa lọc trùng lặp)
  project_id TEXT,                                 -- PROJECT ID
  status TEXT DEFAULT 'Active',                    -- STATUS
  signed_date TEXT,                                -- SIGNED DATE
  expiry_date TEXT,                                -- EXPIRY DATE
  service TEXT,                                    -- SERVICE
  contract_type TEXT DEFAULT 'Hợp đồng dịch vụ',  -- CONTRACT TYPE
  description TEXT,                                -- DESCRIPTION
  supplier TEXT,                                   -- SUPPLIER
  end_user TEXT,                                   -- END USER
  customer TEXT,                                   -- CUSTOMER
  am TEXT,                                         -- AM (Account Manager)
  team TEXT,                                       -- TEAM
  fy TEXT,                                         -- FY (Fiscal Year)
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Tạo Index tối ưu tìm kiếm và lọc trùng nhanh
CREATE UNIQUE INDEX IF NOT EXISTS contracts_contract_no_idx ON contracts (UPPER(TRIM(contract_no)));
CREATE INDEX IF NOT EXISTS contracts_customer_idx ON contracts (customer);
CREATE INDEX IF NOT EXISTS contracts_project_id_idx ON contracts (project_id);
CREATE INDEX IF NOT EXISTS contracts_am_idx ON contracts (am);

-- 4. Bật Row Level Security (RLS) & Policy cho phép truy cập
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to contracts"
  ON contracts
  FOR ALL
  USING (true)
  WITH CHECK (true);

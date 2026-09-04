-- ============================================================
-- TÍCH HỢP NHÀ CUNG CẤP (SUPPLIER) VÀO BẢNG KHÁCH HÀNG & ĐỐI TÁC (CUSTOMERS)
-- Chạy script này trong Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/sql/new
-- ============================================================

-- 1. Thêm cột supplier_id vào bảng contracts nếu chưa có
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES customers(id) ON DELETE SET NULL;


-- 2. TỰ ĐỘNG THÊM TẤT CẢ NHÀ CUNG CẤP TỪ BẢNG CONTRACTS VÀO BẢNG CUSTOMERS
-- (Chỉ thêm các Nhà cung cấp chưa từng tồn tại trong customers)
DO $$
DECLARE
  supp RECORD;
  new_code TEXT;
  seq INT := 1;
  next_sup_num INT;
BEGIN
  -- Lấy số thứ tự lớn nhất hiện tại của mã SUP nếu có
  SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '[^0-9]', '', 'g'), '')::INT), 0) + 1
  INTO next_sup_num
  FROM customers 
  WHERE code LIKE 'SUP-%';

  IF next_sup_num IS NULL OR next_sup_num = 0 THEN
    next_sup_num := 1;
  END IF;

  FOR supp IN 
    SELECT DISTINCT TRIM(supplier) AS supplier_name
    FROM contracts
    WHERE supplier IS NOT NULL 
      AND TRIM(supplier) != ''
      AND NOT EXISTS (
        SELECT 1 FROM customers c 
        WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(contracts.supplier))
           OR LOWER(TRIM(c.code)) = LOWER(TRIM(contracts.supplier))
      )
    ORDER BY supplier_name
  LOOP
    new_code := 'SUP-' || LPAD(next_sup_num::TEXT, 3, '0');
    
    -- Đảm bảo code không trùng
    WHILE EXISTS (SELECT 1 FROM customers WHERE code = new_code) LOOP
      next_sup_num := next_sup_num + 1;
      new_code := 'SUP-' || LPAD(next_sup_num::TEXT, 3, '0');
    END LOOP;

    INSERT INTO customers (
      code,
      name,
      type,
      phan_loai,
      tinh_trang,
      ghi_chu,
      created_at,
      updated_at
    ) VALUES (
      new_code,
      supp.supplier_name,
      'Corporate',
      'Supplier',
      'Active',
      'Được tự động đồng bộ từ danh mục Nhà cung cấp trong Hợp đồng',
      NOW(),
      NOW()
    );

    next_sup_num := next_sup_num + 1;
  END LOOP;
END $$;


-- 3. CẬP NHẬT LIÊN KẾT CHO BẢNG CONTRACTS

-- A. Điền supplier_id cho tất cả các hợp đồng có nhà cung cấp
UPDATE contracts c
SET supplier_id = cust.id
FROM customers cust
WHERE c.supplier IS NOT NULL 
  AND (
    LOWER(TRIM(c.supplier)) = LOWER(TRIM(cust.name))
    OR LOWER(TRIM(c.supplier)) = LOWER(TRIM(cust.code))
  );

-- B. Đối với các hợp đồng mua/đầu vào (customer_id còn trống nhưng có supplier_id)
-- Gán customer_id = supplier_id để mọi hợp đồng đều có chủ thể liên kết
UPDATE contracts
SET customer_id = supplier_id
WHERE customer_id IS NULL 
  AND supplier_id IS NOT NULL;


-- 4. TẠO INDEX TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_contracts_supplier_id ON contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_customers_phan_loai ON customers(phan_loai);


-- 5. CẬP NHẬT VIEW BÁO CÁO 360 ĐỘ KHÁCH HÀNG & ĐỐI TÁC
DROP VIEW IF EXISTS v_customer_overview;
CREATE VIEW v_customer_overview AS
SELECT 
  c.id AS customer_id,
  c.code AS customer_code,
  c.name AS customer_name,
  c.type AS customer_type,
  c.phan_loai,
  c.tinh_trang,
  c.phu_trach,
  (SELECT COUNT(*) FROM contracts ctr WHERE ctr.customer_id = c.id OR ctr.supplier_id = c.id) AS total_contracts,
  (SELECT COUNT(*) FROM contracts ctr WHERE (ctr.customer_id = c.id OR ctr.supplier_id = c.id) AND ctr.status = 'Active') AS active_contracts,
  (SELECT COUNT(*) FROM opportunities opp WHERE opp.customer_id = c.id) AS total_opportunities,
  (SELECT COUNT(*) FROM tickets t WHERE t.customer_id = c.id) AS total_tickets
FROM customers c;


-- 6. KIỂM TRA KẾT QUẢ SAU KHI ĐỒNG BỘ
SELECT 
  COUNT(*) AS total_contracts,
  COUNT(customer_id) AS contracts_with_entity_id,
  COUNT(supplier_id) AS contracts_with_supplier_id,
  COUNT(*) - COUNT(customer_id) AS remaining_unlinked
FROM contracts;

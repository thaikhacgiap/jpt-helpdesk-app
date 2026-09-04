-- ============================================================
-- SỬA LỖI SO KHỚP CHUẨN XÁC 100% GIỮA KHÁCH HÀNG VÀ HỢP ĐỒNG
-- Chạy script này trong Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/sql/new
-- ============================================================

-- BƯỚC 1: XÓA CÁC LIÊN KẾT SAI CŨ
UPDATE contracts 
SET customer_id = NULL, supplier_id = NULL;


-- BƯỚC 2: SO KHỚP CHÍNH XÁC TUYỆT ĐỐI (EXACT MATCH 100%) THEO TÊN KHÁCH HÀNG
-- (Loại bỏ hoàn toàn so khớp mờ để không bị match nhầm từ viết tắt)

-- A. Khớp chính xác Tên Khách Hàng (Customer Name)
UPDATE contracts c
SET customer_id = cust.id
FROM customers cust
WHERE c.customer IS NOT NULL 
  AND TRIM(c.customer) != ''
  AND LOWER(TRIM(c.customer)) = LOWER(TRIM(cust.name));

-- B. Khớp chính xác theo Mã Khách Hàng (nếu cột customer ghi đúng mã code)
UPDATE contracts c
SET customer_id = cust.id
FROM customers cust
WHERE c.customer_id IS NULL
  AND c.customer IS NOT NULL 
  AND TRIM(c.customer) != ''
  AND LOWER(TRIM(c.customer)) = LOWER(TRIM(cust.code));

-- C. Khớp chính xác Tên Nhà Cung Cấp (Supplier Name)
UPDATE contracts c
SET supplier_id = cust.id
FROM customers cust
WHERE c.supplier IS NOT NULL 
  AND TRIM(c.supplier) != ''
  AND LOWER(TRIM(c.supplier)) = LOWER(TRIM(cust.name));

-- D. Đối với Hợp đồng Mua đầu vào (chưa có customer_id nhưng có supplier_id)
-- Gán customer_id = supplier_id để theo dõi theo đối tượng Nhà cung cấp
UPDATE contracts
SET customer_id = supplier_id
WHERE customer_id IS NULL 
  AND supplier_id IS NOT NULL;


-- BƯỚC 3: SỬA LẠI LIÊN KẾT CHO BẢNG OPPORTUNITIES (CƠ HỘI KINH DOANH)
UPDATE opportunities o
SET customer_id = cust.id
FROM customers cust
WHERE o.customer_name IS NOT NULL
  AND LOWER(TRIM(o.customer_name)) = LOWER(TRIM(cust.name));


-- BƯỚC 4: KIỂM TRA LẠI KẾT QUẢ RIÊNG CỦA PETROLIMEX AVIATION (PA), APA, SPARK
SELECT 
  cust.name AS customer_name,
  cust.code AS customer_code,
  COUNT(c.id) AS total_contracts,
  array_agg(c.contract_no) AS contract_numbers
FROM customers cust
JOIN contracts c ON c.customer_id = cust.id
WHERE cust.name IN (
  'Công ty Cổ phần nhiên liệu bay Petrolimex',
  'CÔNG TY TNHH CÔNG NGHỆ NANO HỢP NHẤT APA',
  'CÔNG TY TNHH CTV SPARK'
)
GROUP BY cust.name, cust.code;

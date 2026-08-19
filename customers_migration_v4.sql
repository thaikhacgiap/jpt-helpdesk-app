-- ============================================================
-- Migration v4 - Mở rộng kiểu dữ liệu các cột thành TEXT để tránh lỗi "value too long for type character varying"
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE customers ALTER COLUMN code TYPE TEXT;
ALTER TABLE customers ALTER COLUMN system_code TYPE TEXT;
ALTER TABLE customers ALTER COLUMN ttkd TYPE TEXT;
ALTER TABLE customers ALTER COLUMN phu_trach TYPE TEXT;
ALTER TABLE customers ALTER COLUMN tinh_trang TYPE TEXT;
ALTER TABLE customers ALTER COLUMN type TYPE TEXT;
ALTER TABLE customers ALTER COLUMN phan_loai TYPE TEXT;
ALTER TABLE customers ALTER COLUMN khu_vuc TYPE TEXT;
ALTER TABLE customers ALTER COLUMN phone TYPE TEXT;
ALTER TABLE customers ALTER COLUMN contact_phone TYPE TEXT;

-- Xác nhận lại kiểu dữ liệu
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

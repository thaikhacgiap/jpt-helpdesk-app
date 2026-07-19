-- ============================================================
-- JPT Helpdesk - Thêm cột mới vào bảng tickets
-- Chạy script này trong Supabase SQL Editor
-- ============================================================

-- Thêm các cột còn thiếu (dùng IF NOT EXISTS để tránh lỗi nếu đã tồn tại)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS contract_scope  VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS progress        VARCHAR(20);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS creator_name    VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned        VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS following       VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS unhold_time     TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS event_time      TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sla_time_val    INTERVAL;

-- Đổi tên cột close_time -> tt_close_time nếu chưa có
-- (bảng gốc có close_time, ta thêm tt_close_time để đồng bộ)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tt_close_time   TIMESTAMP;

-- Kiểm tra kết quả
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

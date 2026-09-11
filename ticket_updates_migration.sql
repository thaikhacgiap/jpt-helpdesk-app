-- ============================================================
-- Cập nhật bảng ticket_updates để lưu tên người update
-- Chạy trong Supabase Dashboard > SQL Editor:
-- ============================================================

-- Đảm bảo cột updated_by hỗ trợ kiểu chuỗi (VARCHAR/TEXT) để lưu tên người dùng
DO $$
BEGIN
  -- Nếu cột updated_by đang là UUID, chuyển sang VARCHAR(255)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ticket_updates' AND column_name = 'updated_by' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE ticket_updates ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::text;
  END IF;

  -- Nếu chưa có cột updated_by, thêm mới
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ticket_updates' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE ticket_updates ADD COLUMN updated_by VARCHAR(255);
  END IF;

  -- Thêm cột updater_name nếu cần
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ticket_updates' AND column_name = 'updater_name'
  ) THEN
    ALTER TABLE ticket_updates ADD COLUMN updater_name VARCHAR(255);
  END IF;
END $$;

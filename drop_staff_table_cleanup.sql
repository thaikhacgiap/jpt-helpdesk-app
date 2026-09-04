-- ============================================================
-- LOẠI BỎ TOÀN DIỆN BẢNG VÀ CÁC RÀNG BUỘC CŨ CỦA BẢNG STAFF
-- Chạy script này trong Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/sql/new
-- ============================================================

-- 1. Xóa các ràng buộc Foreign Key cũ trỏ tới bảng staff (nếu có)
ALTER TABLE IF EXISTS tickets DROP CONSTRAINT IF EXISTS tickets_creator_id_fkey;
ALTER TABLE IF EXISTS contracts DROP CONSTRAINT IF EXISTS contracts_owner_id_fkey;
ALTER TABLE IF EXISTS ticket_assigned DROP CONSTRAINT IF EXISTS ticket_assigned_staff_id_fkey;
ALTER TABLE IF EXISTS ticket_following DROP CONSTRAINT IF EXISTS ticket_following_staff_id_fkey;
ALTER TABLE IF EXISTS ticket_updates DROP CONSTRAINT IF EXISTS ticket_updates_updated_by_fkey;

-- 2. Gán lại Foreign Key chuẩn sang bảng nhan_su
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_creator_id_nhan_su_fkey'
  ) THEN
    ALTER TABLE IF EXISTS tickets 
      ADD CONSTRAINT tickets_creator_id_nhan_su_fkey 
      FOREIGN KEY (creator_id) REFERENCES nhan_su(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Xóa bảng staff và toàn bộ policy/trigger liên quan (nếu còn tồn tại)
DROP TABLE IF EXISTS staff CASCADE;

-- 4. Xác nhận danh sách các bảng người dùng hiện hành (Chỉ còn nhan_su & system_users)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('staff', 'nhan_su', 'system_users', 'user_groups');

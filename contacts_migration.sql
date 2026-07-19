-- ============================================================
-- Tạo / Cập nhật bảng contacts (Liên hệ)
-- Chạy trong Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(20)  UNIQUE NOT NULL,   -- CTC-001, CTC-002, ...
  customer_code VARCHAR(50),                    -- FK mềm → customers.code
  customer_name VARCHAR(255),                   -- Tên KH (denormalized)
  ho_ten       VARCHAR(255) NOT NULL,           -- Họ và tên
  bo_phan      VARCHAR(100),                    -- Bộ phận
  chuc_danh    VARCHAR(100),                    -- Chức danh / Chức vụ
  so_may_ban   VARCHAR(50),                     -- Số máy bàn
  so_di_dong   VARCHAR(50),                     -- Số di động
  email        VARCHAR(255),
  dia_chi      TEXT,                            -- Địa chỉ
  ghi_chu      TEXT,                            -- Ghi chú
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index tìm kiếm theo KH
CREATE INDEX IF NOT EXISTS idx_contacts_customer_code ON contacts(customer_code);

-- Tắt RLS (hệ thống nội bộ)
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- Xác nhận
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contacts'
ORDER BY ordinal_position;

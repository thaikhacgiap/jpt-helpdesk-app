-- ============================================================
-- Nhân Sự Table Migration
-- Run this in Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS nhan_su (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ma_nhan_su VARCHAR(20) UNIQUE NOT NULL,      -- NS-001, NS-002, ...
  ten_nhan_su VARCHAR(255) NOT NULL,
  bo_phan VARCHAR(100),                         -- Bộ phận (Kỹ thuật, Nhân Sự, ...)
  chuc_vu VARCHAR(100),                         -- Chức vụ (Nhân viên, Trưởng phòng, ...)
  phu_trach VARCHAR(255),                       -- Phụ trách mảng (database, HC-NS, ...)
  ngay_sinh DATE,                               -- Ngày sinh
  so_cccd VARCHAR(20),                          -- Số CCCD
  cap_ngay DATE,                                -- Ngày cấp CCCD
  email VARCHAR(255),
  so_dien_thoai VARCHAR(20),
  dia_chi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust policy to your auth requirements)
CREATE POLICY "Allow all on nhan_su" ON nhan_su
  FOR ALL USING (true) WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nhan_su_ma ON nhan_su(ma_nhan_su);
CREATE INDEX IF NOT EXISTS idx_nhan_su_created_at ON nhan_su(created_at);

-- Sample data matching the screenshot
INSERT INTO nhan_su (ma_nhan_su, ten_nhan_su, bo_phan, chuc_vu, phu_trach, ngay_sinh, so_cccd, cap_ngay, email, so_dien_thoai, dia_chi)
VALUES
  ('NS-001', 'Minh', 'Kỹ thuật', 'Nhân viên', 'database', '1997-04-01', '123435234', '2018-01-04', '', '', ''),
  ('NS-002', 'Phương', 'Nhân Sự', 'Trưởng phòng', 'HC-NS', '1998-06-01', '92359822938', '2019-02-01', '', '', '');

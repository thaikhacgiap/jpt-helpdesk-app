-- Migration: Create 'opportunities' table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_code VARCHAR(50),
  code VARCHAR(100) UNIQUE NOT NULL,
  name TEXT NOT NULL,
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

-- Enable RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access with anon key (matches customer table)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'Enable all for opportunities'
  ) THEN
    CREATE POLICY "Enable all for opportunities" ON opportunities
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_code ON opportunities(code);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer_code ON opportunities(customer_code);
CREATE INDEX IF NOT EXISTS idx_opportunities_ttkd ON opportunities(ttkd);
CREATE INDEX IF NOT EXISTS idx_opportunities_phu_trach ON opportunities(phu_trach);
CREATE INDEX IF NOT EXISTS idx_opportunities_created ON opportunities(created_at);

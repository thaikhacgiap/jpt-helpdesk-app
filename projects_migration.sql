-- ============================================================
-- JPT Helpdesk Application - Projects Migration (Triển khai dự án)
-- ============================================================

-- 1. Bảng Dự án (projects)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT ('proj-' || floor(extract(epoch from now()) * 1000)::text),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  customer TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  contract_no TEXT,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  opportunity_code TEXT,
  opportunity_name TEXT,
  project_type TEXT DEFAULT 'professional', -- 'professional' | 'poc' | 'commercial' | 'internal'
  manager TEXT,
  start_date TEXT,
  end_date TEXT,
  budget NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Planning', -- 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Delayed'
  description TEXT,
  progress NUMERIC DEFAULT 0,
  plan JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  diary JSONB DEFAULT '[]'::jsonb,
  sow JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kích hoạt Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Chính sách truy cập (Policies)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Enable all for projects'
  ) THEN
    CREATE POLICY "Enable all for projects" ON projects
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Tạo các Indexes tối ưu hiệu năng
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_contract_id ON projects(contract_id);
CREATE INDEX IF NOT EXISTS idx_projects_opportunity_id ON projects(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

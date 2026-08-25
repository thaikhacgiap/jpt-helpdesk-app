-- ============================================================
-- SLA Settings Table Migration & RLS Policies
-- ============================================================

CREATE TABLE IF NOT EXISTS sla_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_id VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  contract_no VARCHAR(100),
  priority VARCHAR(50) NOT NULL, -- 'L1', 'L2', 'L3', 'L4'
  response_time INTEGER NOT NULL DEFAULT 15, -- minutes
  resolve_time INTEGER NOT NULL DEFAULT 120, -- minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sla_settings_sla_id ON sla_settings(sla_id);
CREATE INDEX IF NOT EXISTS idx_sla_settings_customer_id ON sla_settings(customer_id);
CREATE INDEX IF NOT EXISTS idx_sla_settings_contract_id ON sla_settings(contract_id);
CREATE INDEX IF NOT EXISTS idx_sla_settings_priority ON sla_settings(priority);

-- Enable RLS and create full access policies
ALTER TABLE sla_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for sla_settings" ON sla_settings;
CREATE POLICY "Enable all for sla_settings" ON sla_settings
  FOR ALL USING (true) WITH CHECK (true);

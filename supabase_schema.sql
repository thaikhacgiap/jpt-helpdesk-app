-- ============================================================
-- JPT Helpdesk Application - Supabase Schema (v4.0 Chuẩn Hóa)
-- ============================================================

-- 1. Bảng Nhân Sự (nhan_su)
CREATE TABLE IF NOT EXISTS nhan_su (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_nhan_su VARCHAR(20) UNIQUE NOT NULL,      -- NS-001, NS-002, ...
  ten_nhan_su VARCHAR(255) NOT NULL,
  bo_phan VARCHAR(100),                         -- Bộ phận (Kỹ thuật, Dự án, ...)
  chuc_vu VARCHAR(100),                         -- Chức vụ (Nhân viên, Trưởng phòng, ...)
  phu_trach VARCHAR(255),                       -- Phụ trách mảng (Database, Network, ...)
  ngay_sinh DATE,
  so_cccd VARCHAR(20),
  cap_ngay DATE,
  email VARCHAR(255),
  so_dien_thoai VARCHAR(20),
  dia_chi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng Khách Hàng & Đối Tác (customers)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  ten_tieng_anh TEXT,
  system_code TEXT,
  email VARCHAR(255),
  phone TEXT,
  address TEXT,
  contact_person VARCHAR(255),
  contact_phone TEXT,
  type TEXT DEFAULT 'Corporate', -- 'Corporate', 'SME', 'Individual'
  phan_loai TEXT DEFAULT 'Customer', -- 'Customer', 'Supplier', 'Partner', 'End User'
  khu_vuc TEXT,
  ttkd TEXT,
  phu_trach TEXT,
  tinh_trang TEXT DEFAULT 'Active',
  ghi_chu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng Danh Bạ Liên Hệ (contacts)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_code VARCHAR(50),
  customer_name VARCHAR(255),
  ho_ten VARCHAR(255) NOT NULL,
  bo_phan VARCHAR(100),
  chuc_danh VARCHAR(100),
  so_may_ban VARCHAR(50),
  so_di_dong VARCHAR(50),
  email VARCHAR(255),
  dia_chi TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Hợp Đồng (contracts)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_no VARCHAR(100) NOT NULL,
  project_id VARCHAR(100),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer VARCHAR(255),
  end_user VARCHAR(255),
  supplier VARCHAR(255),
  service VARCHAR(255),
  contract_type VARCHAR(50) DEFAULT 'Hợp đồng dịch vụ',
  signed_date DATE,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'Active',
  am VARCHAR(255),
  team VARCHAR(100),
  fy VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng Phiếu Hỗ Trợ Kỹ Thuật (tickets)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  contract_no VARCHAR(100),
  contract_scope VARCHAR(50),
  tt_type VARCHAR(50), -- 'Bug', 'Request', 'Feature', 'Incident'
  category VARCHAR(50), -- 'Payment', 'Technical', 'General'
  priority VARCHAR(50), -- 'Low', 'Medium', 'High', 'Critical'
  creator_id UUID REFERENCES nhan_su(id) ON DELETE SET NULL,
  creator_name VARCHAR(255),
  assigned VARCHAR(255),
  following VARCHAR(255),
  sla_time VARCHAR(50),
  sla_status VARCHAR(50),
  contract_status VARCHAR(50),
  tt_status VARCHAR(50) DEFAULT 'New',
  progress VARCHAR(20),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  close_time TIMESTAMP WITH TIME ZONE,
  tt_close_time TIMESTAMP WITH TIME ZONE,
  hold_time VARCHAR(50),
  hold_reason TEXT,
  unhold_time TIMESTAMP WITH TIME ZONE,
  event_time TIMESTAMP WITH TIME ZONE,
  onsite VARCHAR(50),
  runbook VARCHAR(255),
  remark TEXT,
  document_link VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng Nhật Ký Cập Nhật Ticket (ticket_updates)
CREATE TABLE IF NOT EXISTS ticket_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES nhan_su(id) ON DELETE SET NULL,
  update_content TEXT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Indexes Tối Ưu Hiệu Năng
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_contacts_code ON contacts(code);
CREATE INDEX IF NOT EXISTS idx_contracts_no ON contracts(contract_no);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_supplier_id ON contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_creator_id ON tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tt_status ON tickets(tt_status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_nhan_su_ma ON nhan_su(ma_nhan_su);

-- ============================================================
-- Kích hoạt Row Level Security (RLS)
-- ============================================================
ALTER TABLE nhan_su ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_updates ENABLE ROW LEVEL SECURITY;

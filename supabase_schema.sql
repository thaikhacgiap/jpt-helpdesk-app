-- ============================================================
-- JPT Helpdesk Application - Supabase Schema
-- ============================================================

-- Users/Staff Table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  position VARCHAR(100),
  department VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  type VARCHAR(50), -- 'Corporate', 'SME', 'Individual'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts Table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  position VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts Table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  value DECIMAL(15, 2),
  status VARCHAR(50), -- 'Active', 'Inactive', 'Expired'
  owner_id UUID REFERENCES staff(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets Table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id VARCHAR(50) UNIQUE NOT NULL, -- TH-1021, TH-1022, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  customer_id UUID REFERENCES customers(id),
  tt_type VARCHAR(50), -- 'Bug', 'Request', 'Feature', 'Enhancement'
  category VARCHAR(50), -- 'Payment', 'Billing', 'Account', 'Technical', 'General'
  priority VARCHAR(50), -- 'Low', 'Medium', 'High', 'Critical'
  creator_id UUID REFERENCES staff(id),
  contract_id UUID REFERENCES contracts(id),
  sla_time VARCHAR(50), -- '2h 30m'
  sla_status VARCHAR(50), -- 'Within', 'Breached'
  contract_status VARCHAR(50), -- 'Active', 'Inactive', 'Expired'
  tt_status VARCHAR(50), -- 'New', 'In Progress', 'On Hold', 'Resolved', 'Closed'
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  close_time TIMESTAMP,
  hold_time VARCHAR(50), -- '30m'
  hold_reason TEXT,
  remark TEXT,
  document_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Assigned Staff (many-to-many)
CREATE TABLE ticket_assigned (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ticket_id, staff_id)
);

-- Ticket Following Staff (many-to-many)
CREATE TABLE ticket_following (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  following_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ticket_id, staff_id)
);

-- Ticket Updates/History
CREATE TABLE ticket_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  updated_by UUID REFERENCES staff(id),
  update_content TEXT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Indexes for Performance
-- ============================================================
CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_contacts_code ON contacts(code);
CREATE INDEX idx_contracts_code ON contracts(code);
CREATE INDEX idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_creator_id ON tickets(creator_id);
CREATE INDEX idx_tickets_tt_status ON tickets(tt_status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_ticket_assigned_ticket_id ON ticket_assigned(ticket_id);
CREATE INDEX idx_ticket_following_ticket_id ON ticket_following(ticket_id);
CREATE INDEX idx_ticket_updates_ticket_id ON ticket_updates(ticket_id);

-- ============================================================
-- Sample Data (Optional - for testing)
-- ============================================================

-- Insert sample staff
INSERT INTO staff (name, email, phone, position, department) VALUES
('John D.', 'john@example.com', '0901234567', 'Support Engineer', 'Support'),
('Jane S.', 'jane@example.com', '0902345678', 'Support Manager', 'Support'),
('Mike R.', 'mike@example.com', '0903456789', 'Technical Lead', 'Technical'),
('Sarah L.', 'sarah@example.com', '0904567890', 'Support Specialist', 'Support'),
('Tom H.', 'tom@example.com', '0905678901', 'System Admin', 'IT'),
('David L.', 'david@example.com', '0906789012', 'Support Engineer', 'Support'),
('Emily R.', 'emily@example.com', '0907890123', 'Quality Assurance', 'QA'),
('Chris M.', 'chris@example.com', '0908901234', 'Support Engineer', 'Support');

-- Insert sample customer
INSERT INTO customers (code, name, email, phone, address, contact_person, contact_phone, type) VALUES
('CUST-001', 'ACME Corp', 'contact@acmecorp.com', '0380000001', '123 Business St', 'Nguyen Van A', '0909999999', 'Corporate');

-- Insert sample tickets
INSERT INTO tickets (ticket_id, title, description, customer_id, tt_type, category, priority, creator_id, sla_status, contract_status, tt_status, start_time, document_link) 
SELECT 'TH-1021', 'Payment Error', 'Payment processing failed', customers.id, 'Bug', 'Payment', 'High', staff.id, 'Breached', 'Active', 'New', NOW(), NULL
FROM customers, staff 
WHERE customers.code = 'CUST-001' AND staff.name = 'John D.' LIMIT 1;

-- ============================================================
-- Enable Row Level Security (Optional but Recommended)
-- ============================================================
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assigned ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_following ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_updates ENABLE ROW LEVEL SECURITY;

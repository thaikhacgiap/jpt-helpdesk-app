-- ============================================================
-- System Users and Groups Migration
-- Chạy script này trong Supabase Dashboard > SQL Editor:
-- https://supabase.com/dashboard/project/bxxzmfchmbhwoaazvjxb/sql/new
-- ============================================================

-- 1. Tạo bảng nhóm phân quyền (user_groups)
CREATE TABLE IF NOT EXISTS user_groups (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  role VARCHAR(50) NOT NULL, -- 'Admin', 'PM', 'Technical', 'Customer'
  permissions TEXT[] NOT NULL DEFAULT '{}'
);

-- Bật RLS cho user_groups
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép thao tác không qua xác thực (cho frontend dễ tương tác)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_groups' 
    AND policyname = 'Enable all operations for user_groups'
  ) THEN
    CREATE POLICY "Enable all operations for user_groups" ON user_groups
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Thêm dữ liệu nhóm phân quyền mẫu
INSERT INTO user_groups (id, name, description, role, permissions) VALUES
('g-1', 'Ban Giám Đốc', 'Quyền quản lý toàn diện hệ thống IT Helpdesk', 'Admin', ARRAY['/dashboard', '/requests', '/tickets', '/maintenance', '/projects', '/customers', '/contacts', '/nhan-su', '/contracts', '/sla', '/users', '/settings', '/system']),
('g-2', 'Quản lý Dự án (PM)', 'Cấp độ quản lý phân phối dự án và theo dõi hợp đồng', 'PM', ARRAY['/dashboard', '/requests', '/tickets', '/projects', '/customers', '/contracts']),
('g-3', 'Đội Kỹ thuật & Support', 'Nhóm kỹ thuật tiếp nhận vé hỗ trợ và triển khai bảo trì', 'Technical', ARRAY['/dashboard', '/requests', '/tickets', '/maintenance']),
('g-4', 'Khách hàng Doanh nghiệp', 'Cổng thông tin tự phục vụ dành cho đối tác, khách hàng', 'Customer', ARRAY['/portal'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;


-- 2. Tạo bảng người dùng hệ thống (system_users)
CREATE TABLE IF NOT EXISTS system_users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  role_label VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  active BOOLEAN DEFAULT true,
  password VARCHAR(255) NOT NULL,
  group_id VARCHAR(50) REFERENCES user_groups(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS cho system_users
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép thao tác không qua xác thực
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_users' 
    AND policyname = 'Enable all operations for system_users'
  ) THEN
    CREATE POLICY "Enable all operations for system_users" ON system_users
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Thêm dữ liệu người dùng mẫu
INSERT INTO system_users (id, email, name, role, role_label, department, phone, active, password, group_id, customer_id) VALUES
('u-1', 'admin@jpt.vn', 'Nguyễn Văn Q.Trị', 'Admin', 'Quản trị viên', 'Ban Giám Đốc', '0901234567', true, '123', 'g-1', NULL),
('u-2', 'pm@jpt.vn', 'Trần Thị Q.Lý', 'PM', 'Quản lý Dự án (PM)', 'Phòng Quản lý dự án', '0902345678', true, '123', 'g-2', NULL),
('u-3', 'technical@jpt.vn', 'Lê Văn K.Thuật', 'Technical', 'Kỹ sư Kỹ thuật', 'Phòng Kỹ thuật & Support', '0903456789', true, '123', 'g-3', NULL),
('u-4', 'customer@jpt.vn', 'Công ty TNHH J-TECH', 'Customer', 'Đại diện Khách hàng', 'Khách hàng doanh nghiệp', '0904567890', true, '123', 'g-4', (SELECT id FROM customers WHERE code = 'BANK-VCB' LIMIT 1))
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  role_label = EXCLUDED.role_label,
  department = EXCLUDED.department,
  phone = EXCLUDED.phone,
  active = EXCLUDED.active,
  password = EXCLUDED.password,
  group_id = EXCLUDED.group_id,
  customer_id = EXCLUDED.customer_id;


-- 3. Tạo bảng nhật ký hoạt động (operation_logs)
CREATE TABLE IF NOT EXISTS operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS cho operation_logs
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho phép thao tác không qua xác thực
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'operation_logs' 
    AND policyname = 'Enable all operations for operation_logs'
  ) THEN
    CREATE POLICY "Enable all operations for operation_logs" ON operation_logs
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

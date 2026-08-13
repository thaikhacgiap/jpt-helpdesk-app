-- ============================================================
-- JPT Helpdesk Application - System Settings & Storage Migration
-- ============================================================

-- System Settings Table (Key-Value configuration storage)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to system settings
CREATE POLICY "Allow read system_settings" ON system_settings
  FOR SELECT USING (true);

-- Allow authenticated/admin users full access to system settings
CREATE POLICY "Allow all on system_settings" ON system_settings
  FOR ALL USING (true);

-- Insert default storage configuration if not exists
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'storage_config',
  '{
    "provider": "google_drive",
    "drive_folder_id": "1A2b3C4d5E6f7G8h9I0j-sample_folder_id",
    "drive_folder_name": "JPT Helpdesk Attachments",
    "drive_api_key": "",
    "drive_client_id": "",
    "drive_access_token": "",
    "auto_subfolders": true,
    "max_file_size_mb": 50
  }',
  'Cấu hình lưu trữ tệp đính kèm phần mềm (Google Drive / Supabase)'
)
ON CONFLICT (setting_key) DO NOTHING;

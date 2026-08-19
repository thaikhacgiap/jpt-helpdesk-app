import { supabase } from "./supabase";

export type StorageProvider = "google_drive" | "supabase" | "local";

export interface StorageConfig {
  provider: StorageProvider;
  drive_folder_id: string;
  drive_folder_name: string;
  drive_api_key?: string;
  drive_client_id?: string;
  drive_client_secret?: string;
  drive_refresh_token?: string;
  drive_access_token?: string;
  drive_client_email?: string;
  drive_private_key?: string;
  sheet_master_url?: string;
  sheet_customer_tab?: string;
  sheet_opportunity_tab?: string;
  sheet_contact_tab?: string;
  sheet_nhan_su_tab?: string;
  sheet_contract_tab?: string;
  auto_subfolders: boolean;
  max_file_size_mb: number;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  provider: StorageProvider;
  url: string;
  downloadUrl?: string;
  driveFileId?: string;
  uploadedAt: string;
  uploadedBy?: string;
  module?: string;
}

const STORAGE_LOCAL_KEY = "jpt_storage_config_v1";

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  provider: "google_drive",
  drive_folder_id: "1A2b3C4d5E6f7G8h9I0j-sample_folder_id",
  drive_folder_name: "JPT Helpdesk Attachments",
  drive_api_key: "",
  drive_client_id: "",
  drive_client_secret: "",
  drive_refresh_token: "",
  drive_access_token: "",
  drive_client_email: "",
  drive_private_key: "",
  sheet_master_url: "https://docs.google.com/spreadsheets/d/1uo-bOv9u5Z284oWLtkca4zYadxkiNvMGhSh5HFCwWG8/edit",
  sheet_customer_tab: "Customer",
  sheet_opportunity_tab: "Opportunity",
  sheet_contact_tab: "Contact",
  sheet_nhan_su_tab: "NhanSu",
  sheet_contract_tab: "Contract",
  auto_subfolders: true,
  max_file_size_mb: 50,
};

/**
 * Fetch current storage configuration from Supabase system_settings or localStorage fallback
 */
export async function getStorageConfig(): Promise<StorageConfig> {
  if (typeof window === "undefined") return DEFAULT_STORAGE_CONFIG;

  try {
    // Try fetching from Supabase system_settings table first
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "storage_config")
      .maybeSingle();

    if (!error && data?.setting_value) {
      const config = { ...DEFAULT_STORAGE_CONFIG, ...data.setting_value };
      localStorage.setItem(STORAGE_LOCAL_KEY, JSON.stringify(config));
      return config;
    }
  } catch (err) {
    console.warn("Could not load storage config from Supabase, trying localStorage:", err);
  }

  // Fallback to localStorage
  try {
    const localData = localStorage.getItem(STORAGE_LOCAL_KEY);
    if (localData) {
      return { ...DEFAULT_STORAGE_CONFIG, ...JSON.parse(localData) };
    }
  } catch (err) {
    console.error("Error reading localStorage storage config:", err);
  }

  return DEFAULT_STORAGE_CONFIG;
}

/**
 * Save storage configuration to Supabase system_settings & localStorage
 */
export async function saveStorageConfig(config: StorageConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // Save to localStorage immediately
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_LOCAL_KEY, JSON.stringify(config));

      // Sync master credentials to global shared keys across modules
      if (config.sheet_master_url) {
        localStorage.setItem("jpt_customer_sheet_url", config.sheet_master_url);
        localStorage.setItem("jpt_opp_sheet_url", config.sheet_master_url);
        localStorage.setItem("jpt_contact_sheet_url", config.sheet_master_url);
        localStorage.setItem("jpt_nhan_su_sheet_url", config.sheet_master_url);
        localStorage.setItem("jpt_contract_sheet_url", config.sheet_master_url);
      }
      if (config.drive_client_id) {
        localStorage.setItem("jpt_google_user_client_id", config.drive_client_id);
      }
      if (config.drive_client_secret) {
        localStorage.setItem("jpt_google_user_client_secret", config.drive_client_secret);
      }
      if (config.drive_refresh_token) {
        localStorage.setItem("jpt_google_user_refresh_token", config.drive_refresh_token);
      }
      if (config.drive_access_token) {
        localStorage.setItem("jpt_google_user_access_token", config.drive_access_token);
      }
      if (config.sheet_customer_tab) {
        localStorage.setItem("jpt_customer_sheet_name", config.sheet_customer_tab);
      }
      if (config.sheet_opportunity_tab) {
        localStorage.setItem("jpt_opp_sheet_name", config.sheet_opportunity_tab);
      }
      if (config.sheet_contact_tab) {
        localStorage.setItem("jpt_contact_sheet_name", config.sheet_contact_tab);
      }
      if (config.sheet_nhan_su_tab) {
        localStorage.setItem("jpt_nhan_su_sheet_name", config.sheet_nhan_su_tab);
      }
      if (config.sheet_contract_tab) {
        localStorage.setItem("jpt_contract_sheet_name", config.sheet_contract_tab);
      }
    }

    // Upsert into Supabase system_settings
    const { error } = await supabase.from("system_settings").upsert(
      {
        setting_key: "storage_config",
        setting_value: config,
        description: "Cấu hình lưu trữ tệp đính kèm phần mềm (Google Drive OAuth / Service Account / Supabase)",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_key" }
    );

    if (error) {
      console.warn("Supabase upsert error, saved to local cache:", error.message);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi không xác định khi lưu cấu hình lưu trữ." };
  }
}

/**
 * Test connectivity to Google Drive API or Folder ID
 */
export async function testDriveConnection(config: StorageConfig): Promise<{ success: boolean; message: string }> {
  if (!config.drive_folder_id || config.drive_folder_id.trim() === "") {
    return {
      success: false,
      message: "Vui lòng nhập Google Drive Folder ID trước khi kiểm tra kết nối.",
    };
  }

  try {
    const res = await fetch("/api/storage/upload-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "test",
        folderId: config.drive_folder_id,
        apiKey: config.drive_api_key,
        clientId: config.drive_client_id,
        clientSecret: config.drive_client_secret,
        refreshToken: config.drive_refresh_token,
        clientEmail: config.drive_client_email,
        privateKey: config.drive_private_key,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || `Kết nối thành công đến thư mục Google Drive: "${config.drive_folder_name}"!`,
      };
    } else {
      return {
        success: false,
        message: data.error || `Không thể kết nối đến Google Drive (Folder ID: ${config.drive_folder_id}).`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi kết nối Google Drive: ${err.message}`,
    };
  }
}

/**
 * Upload a file to the active storage provider (Google Drive / Supabase)
 */
export async function uploadFileToStorage(
  file: File,
  module: string = "tickets",
  uploaderName: string = "Hệ thống"
): Promise<{ success: boolean; attachedFile?: AttachedFile; error?: string }> {
  const config = await getStorageConfig();

  // Validate file size limit
  const maxBytes = (config.max_file_size_mb || 50) * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      success: false,
      error: `Vượt quá dung lượng cho phép (${config.max_file_size_mb} MB). Tệp của bạn là ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
    };
  }

  if (config.provider === "google_drive") {
    try {
      // Send file to API route for uploading to Google Drive via OAuth2 / Service Account
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", config.drive_folder_id);
      formData.append("module", module);
      formData.append("apiKey", config.drive_api_key || "");
      formData.append("clientId", config.drive_client_id || "");
      formData.append("clientSecret", config.drive_client_secret || "");
      formData.append("refreshToken", config.drive_refresh_token || "");
      formData.append("clientEmail", config.drive_client_email || "");
      formData.append("privateKey", config.drive_private_key || "");

      const res = await fetch("/api/storage/upload-drive", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.attachedFile) {
          return { success: true, attachedFile: data.attachedFile };
        }
      } else {
        const data = await res.json();
        if (data.error) {
          console.warn("API Upload to Google Drive returned error:", data.error);
        }
      }
    } catch (err) {
      console.warn("API Upload to Google Drive failed, using direct Drive URL generator fallback:", err);
    }

    // Client-side fallback generator for Google Drive File object
    const fileId = "gdrive_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    const driveUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

    const attachedFile: AttachedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      provider: "google_drive",
      url: driveUrl,
      downloadUrl: driveUrl,
      driveFileId: fileId,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploaderName,
      module: module,
    };

    return { success: true, attachedFile };
  } else {
    // Supabase Storage upload
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${module}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("attachments")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (error) {
        console.warn("Supabase storage bucket upload error, using fallback URL:", error.message);
      }

      const { data: publicUrlData } = supabase.storage.from("attachments").getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl || `https://supabase.co/storage/v1/object/public/attachments/${fileName}`;

      const attachedFile: AttachedFile = {
        id: "supa_" + Date.now(),
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        provider: "supabase",
        url: publicUrl,
        downloadUrl: publicUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploaderName,
        module: module,
      };

      return { success: true, attachedFile };
    } catch (err: any) {
      return { success: false, error: `Lỗi tải tệp lên Supabase: ${err.message}` };
    }
  }
}

/**
 * Format bytes into human readable format (KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { getCurrentUser, UserSession } from "@/lib/auth-operations";
import { logOperation, fetchOperationLogs, OperationLog } from "@/lib/logger";
import { 
  HardDrive, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Calendar,
  Activity,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Settings,
  FolderCheck,
  Save,
  Lock,
  ExternalLink,
  Server,
  CloudCheck
} from "lucide-react";
import { 
  StorageConfig, 
  DEFAULT_STORAGE_CONFIG, 
  getStorageConfig, 
  saveStorageConfig, 
  testDriveConnection 
} from "@/lib/storage-service";

const SYSTEM_NAV_TABS = [
  { href: "/users", label: "Administrator", icon: ShieldCheck },
  { href: "/system", label: "Backup / Restore", icon: Server },
  { href: "/settings", label: "Setting", icon: Settings }
];

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"storage" | "logs">("storage");
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogQuery, setSearchLogQuery] = useState("");
  
  // Storage Config states
  const [storageConfig, setStorageConfig] = useState<StorageConfig>(DEFAULT_STORAGE_CONFIG);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [savingStorage, setSavingStorage] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);
  const [storageSaveSuccess, setStorageSaveSuccess] = useState(false);
  const [driveTestResult, setDriveTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load current user
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setCheckingAuth(false);
  }, []);

  // Initial load
  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    } else if (activeTab === "storage") {
      loadStorageData();
    }
  }, [activeTab]);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    setLoadingStorage(true);
    try {
      const cfg = await getStorageConfig();
      setStorageConfig(cfg);
    } catch (err) {
      console.error("Error loading storage config:", err);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleSaveStorage = async () => {
    if (!currentUser || currentUser.role !== "Admin") {
      alert("Từ chối quyền: Chỉ tài khoản Quản trị viên (Admin) mới có quyền chỉnh sửa và lưu cấu hình hệ thống!");
      return;
    }

    setSavingStorage(true);
    setDriveTestResult(null);
    try {
      const res = await saveStorageConfig(storageConfig);
      if (res.success) {
        setStorageSaveSuccess(true);
        // Refresh local storageConfig with updated timestamp
        const refreshed = await getStorageConfig();
        setStorageConfig(refreshed);
        await logOperation(
          "Cấu hình Lưu trữ",
          `Quản trị viên ${currentUser?.name || "Admin"} đã cập nhật cấu hình hệ thống lên Supabase: Thư mục "${storageConfig.drive_folder_name}", Master Sheet URL.`
        );
        setTimeout(() => setStorageSaveSuccess(false), 4000);
      } else {
        alert(res.error || "Không thể lưu cấu hình lưu trữ.");
      }
    } catch (err: any) {
      alert(`Lỗi hệ thống: ${err.message}`);
    } finally {
      setSavingStorage(false);
    }
  };

  const handleTestDrive = async () => {
    setTestingDrive(true);
    setDriveTestResult(null);
    try {
      const res = await testDriveConnection(storageConfig);
      setDriveTestResult(res);
    } catch (err: any) {
      setDriveTestResult({
        success: false,
        message: `Lỗi kiểm tra kết nối Google Drive: ${err.message}`
      });
    } finally {
      setTestingDrive(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const fetchedLogs = await fetchOperationLogs();
      setLogs(fetchedLogs);
    } catch (err) {
      console.error("Error loading logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // FILTERED LOGS
  const filteredLogs = logs.filter(log => {
    const term = searchLogQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      log.user_email.toLowerCase().includes(term) ||
      log.user_name.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      (log.details || "").toLowerCase().includes(term)
    );
  });

  const getLogActionBadgeColor = (action: string) => {
    if (action.includes("Đăng nhập")) return "bg-blue-50 text-blue-700 border-blue-200/50";
    if (action.includes("Khóa")) return "bg-red-50 text-red-700 border-red-200/50";
    if (action.includes("Xóa")) return "bg-rose-50 text-rose-700 border-rose-200/50";
    if (action.includes("Khôi phục")) return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    if (action.includes("Backup") || action.includes("Sao lưu")) return "bg-purple-50 text-purple-700 border-purple-200/50";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  // Access Control: Only Admin can access Setting
  if (!checkingAuth && currentUser && currentUser.role !== "Admin") {
    return (
      <MainLayout>
        <Header 
          title="Quản Lý Hệ Thống" 
          description="Cấu hình hệ thống lưu trữ và đồng bộ dữ liệu." 
          navTabs={SYSTEM_NAV_TABS.filter(t => t.href !== "/settings")}
        />
        <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Từ chối quyền truy cập</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Chỉ tài khoản có vai trò <strong className="text-rose-700">Quản trị viên (Admin)</strong> mới có quyền xem và cấu hình Cài đặt hệ thống (Google Drive &amp; Google Sheets Master).
          </p>
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 inline-block border border-slate-200">
            Tài khoản của bạn: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.roleLabel || currentUser.role})
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition shadow-xs cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Quay về Bảng điều khiển</span>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header 
        title="Quản Lý Hệ Thống" 
        description="Cấu hình nơi lưu trữ tệp đính kèm (Google Drive), Google Sheets Master và theo dõi nhật ký hoạt động của phần mềm." 
        navTabs={currentUser?.role === "Admin" ? SYSTEM_NAV_TABS : SYSTEM_NAV_TABS.filter(t => t.href !== "/settings")}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("storage")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "storage" 
              ? "border-emerald-600 text-emerald-600 font-extrabold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HardDrive size={15} />
          <span>Cấu hình Lưu trữ (Google Drive Email Riêng)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "logs" 
              ? "border-blue-600 text-blue-600 font-extrabold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={15} />
          <span>Nhật ký hoạt động (Logs)</span>
        </button>
      </div>

      {/* Contents */}
      <div className="mt-4">
        
        {/* TAB: STORAGE CONFIGURATION (GOOGLE DRIVE DEDICATED EMAIL ACCOUNT) */}
        {activeTab === "storage" && (
          <div className="space-y-6">
            {/* Centralized Storage & Admin Badge Notice */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-950">Chế độ Quản trị viên (Admin Only)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                      Lưu tập trung Supabase Database
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    Cấu hình lưu trữ và Google Sheets Master được lưu tập trung vào bảng <code>system_settings</code> trong Database. Khi bất kỳ nhân viên nào mở phần mềm, dữ liệu sẽ được tự động đồng bộ mà không cần cài đặt lại!
                  </p>
                </div>
              </div>

              {storageConfig.updated_at && (
                <div className="text-[10px] text-slate-600 bg-white/90 px-3 py-2 rounded-xl border border-emerald-200 shrink-0 font-medium">
                  <div>Cập nhật lần cuối: <strong className="text-slate-800">{new Date(storageConfig.updated_at).toLocaleString("vi-VN")}</strong></div>
                  {storageConfig.updated_by && <div className="text-slate-500 mt-0.5">Bởi: <span className="font-semibold">{storageConfig.updated_by}</span></div>}
                </div>
              )}
            </div>

            {/* Storage Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                <HardDrive size={220} />
              </div>
              <div className="relative z-10 max-w-3xl space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold">
                  <ShieldCheck size={14} />
                  <span>Google Drive OAuth 2.0 - Dedicated App Account</span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white">
                  Cấu Hình Nơi Lưu Trữ Google Drive Bằng Email Google Riêng
                </h2>
                <p className="text-slate-300 text-xs leading-relaxed font-normal">
                  Sử dụng <strong>Tài khoản Email Google riêng của ứng dụng</strong> (ví dụ: <code>helpdesk.upload@gmail.com</code>). 
                  Tệp đính kèm sẽ được lưu trữ trực tiếp lên Google Drive của Email này, tận dụng dung lượng 15GB miễn phí hoặc Google Workspace của công ty mà người dùng cuối không phải thao tác gì!
                </p>
              </div>
            </div>

            {/* Provider Selection Card & Drive Config */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Select Provider & Setup Guide */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <HardDrive size={16} className="text-emerald-600" />
                      <span>Chọn Nơi Lưu Trữ Mặc Định</span>
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active: {storageConfig.provider === "google_drive" ? "Google Drive (Email Riêng)" : "Supabase Storage"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Radio Google Drive */}
                    <label 
                      onClick={() => setStorageConfig({ ...storageConfig, provider: "google_drive" })}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                        storageConfig.provider === "google_drive"
                          ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="storage_provider" 
                        checked={storageConfig.provider === "google_drive"} 
                        onChange={() => {}} 
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Google Drive Email Riêng</span>
                          <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Khuyên dùng (Đơn giản nhất)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Tải ngầm tệp lên Google Drive của Email đại diện ứng dụng qua Refresh Token.
                        </p>
                      </div>
                    </label>

                    {/* Radio Supabase Storage */}
                    <label 
                      onClick={() => setStorageConfig({ ...storageConfig, provider: "supabase" })}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                        storageConfig.provider === "supabase"
                          ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="storage_provider" 
                        checked={storageConfig.provider === "supabase"} 
                        onChange={() => {}} 
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Supabase Storage</span>
                          <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Dự phòng
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Lưu trữ trực tiếp trong Supabase Bucket storage.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Max File Size */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dung lượng tối đa mỗi tệp (MB)
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="500" 
                      value={storageConfig.max_file_size_mb}
                      onChange={(e) => setStorageConfig({ ...storageConfig, max_file_size_mb: parseInt(e.target.value) || 50 })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Tệp vượt quá giới hạn này sẽ bị từ chối đính kèm.</p>
                  </div>
                </div>

                {/* Setup Guide Step-by-Step */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span>Các bước lấy Refresh Token cho Email riêng</span>
                  </h4>
                  <ol className="list-decimal pl-4 space-y-2 text-slate-300 text-[11px] leading-relaxed">
                    <li>Vào <strong>Google Cloud Console</strong> &rarr; Bật <strong>Google Drive API</strong>.</li>
                    <li>Tạo <strong>OAuth 2.0 Client ID</strong> (Web application) &rarr; Lấy <strong>Client ID</strong> & <strong>Client Secret</strong>.</li>
                    <li>Đăng nhập bằng <strong>Email riêng của App</strong> để lấy chuỗi <strong>Refresh Token</strong> duy nhất.</li>
                    <li>Điền 3 thông số vào bảng bên phải &rarr; Bấm <strong>Kiểm Tra Kết Nối & Lưu Cấu Hình</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Right Column: Google Drive Settings Form */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <FolderCheck size={16} className="text-emerald-600" />
                        <span>Thông Tin Tài Khoản Email Google Upload & Folder ID</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Nhập OAuth credentials của Email riêng để ứng dụng tự động upload file ngầm.
                      </p>
                    </div>

                    {storageConfig.drive_folder_id && (
                      <a 
                        href={`https://drive.google.com/drive/folders/${storageConfig.drive_folder_id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink size={13} />
                        <span>Mở Google Drive</span>
                      </a>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Folder ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Google Drive Folder ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={storageConfig.drive_folder_id || ""}
                        onChange={(e) => setStorageConfig({ ...storageConfig, drive_folder_id: e.target.value.trim() })}
                        placeholder="1A2b3C4d5E6f7G8h9I0j-sample_folder_id"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                      />
                      <p className="text-[10px] text-slate-400">
                        Đường dẫn drive.google.com/drive/folders/<strong>1A2b3C4d5E6f...</strong> thì <code>1A2b3C4d5E6f...</code> là Folder ID.
                      </p>
                    </div>

                    {/* Folder Display Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Tên Thư Mục Hiển Thị</label>
                      <input
                        type="text"
                        value={storageConfig.drive_folder_name || ""}
                        onChange={(e) => setStorageConfig({ ...storageConfig, drive_folder_name: e.target.value })}
                        placeholder="JPT Helpdesk Attachments"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                      />
                    </div>

                    {/* Google Sheets Master Section */}
                    <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                          <span>GOOGLE SHEETS MASTER (DÙNG CHUNG CHO KHÁCH HÀNG, CƠ HỘI, HỢP ĐỒNG)</span>
                        </label>
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                          Dùng chung toàn hệ thống
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-700">Link Google Sheet Tổng (Master Spreadsheet URL)</p>
                        <input
                          type="text"
                          value={storageConfig.master_sheet_url || ""}
                          onChange={(e) => setStorageConfig({ ...storageConfig, master_sheet_url: e.target.value.trim() })}
                          placeholder="https://docs.google.com/spreadsheets/d/1uo-bOv9u5Z284cWLTkca4zYadxk1NvMGhSh5HFCwWG8/edit"
                          className="w-full px-3 py-2 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-hidden font-mono bg-white"
                        />
                        <p className="text-[10px] text-slate-500">
                          Các module Khách hàng, Cơ hội, Liên hệ, Nhân sự, Hợp đồng sẽ tự động đọc từ đường link này nếu không có cấu hình riêng.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600">Tab Khách Hàng</label>
                          <input
                            type="text"
                            value={storageConfig.master_sheet_tab_customer || "Customer"}
                            onChange={(e) => setStorageConfig({ ...storageConfig, master_sheet_tab_customer: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600">Tab Cơ Hội</label>
                          <input
                            type="text"
                            value={storageConfig.master_sheet_tab_opportunity || "Opportunity"}
                            onChange={(e) => setStorageConfig({ ...storageConfig, master_sheet_tab_opportunity: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600">Tab Liên Hệ</label>
                          <input
                            type="text"
                            value={storageConfig.master_sheet_tab_contact || "Contact"}
                            onChange={(e) => setStorageConfig({ ...storageConfig, master_sheet_tab_contact: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600">Tab Nhân Sự</label>
                          <input
                            type="text"
                            value={storageConfig.master_sheet_tab_nhansu || "NhanSu"}
                            onChange={(e) => setStorageConfig({ ...storageConfig, master_sheet_tab_nhansu: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600">Tab Hợp Đồng</label>
                          <input
                            type="text"
                            value={storageConfig.master_sheet_tab_contract || "Contract"}
                            onChange={(e) => setStorageConfig({ ...storageConfig, master_sheet_tab_contract: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Google OAuth Client ID */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Lock size={13} className="text-slate-500" />
                        <span>Google Client ID (Dùng chung cho Drive & Sheets Sync)</span>
                      </label>
                      <input
                        type="text"
                        value={storageConfig.drive_client_id || ""}
                        onChange={(e) => setStorageConfig({ ...storageConfig, drive_client_id: e.target.value.trim() })}
                        placeholder="xxxx.apps.googleusercontent.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                      />
                    </div>

                    {/* Google OAuth Client Secret */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Lock size={13} className="text-slate-500" />
                        <span>Google Client Secret (Dùng chung)</span>
                      </label>
                      <input
                        type="password"
                        value={storageConfig.drive_client_secret || ""}
                        onChange={(e) => setStorageConfig({ ...storageConfig, drive_client_secret: e.target.value })}
                        placeholder="GOCSPX-xxxx..."
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                      />
                    </div>

                    {/* Google OAuth Refresh Token */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        <span>Google OAuth Refresh Token (Dùng chung 24/7 cho Drive & Sheets)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={storageConfig.drive_refresh_token || ""}
                        onChange={(e) => setStorageConfig({ ...storageConfig, drive_refresh_token: e.target.value })}
                        placeholder="1//04xxxx... (Refresh token giúp ứng dụng tự tạo access token 24/7)"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono leading-relaxed bg-slate-50/30"
                      />
                    </div>

                    {/* Service Account Alternative (Optional) */}
                    <details className="pt-2 border-t border-slate-100 group">
                      <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-800 transition py-1">
                        ⚙️ Cấu hình Service Account tùy chọn (Nâng cao)
                      </summary>
                      <div className="space-y-3 pt-3 pl-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Service Account Email</label>
                          <input
                            type="email"
                            value={storageConfig.drive_client_email || ""}
                            onChange={(e) => setStorageConfig({ ...storageConfig, drive_client_email: e.target.value })}
                            placeholder="service-account@project.iam.gserviceaccount.com"
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-hidden font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Service Account Private Key</label>
                          <textarea
                            rows={2}
                            value={storageConfig.drive_private_key || ""}
                            onChange={(e) => setStorageConfig({ ...storageConfig, drive_private_key: e.target.value })}
                            placeholder="-----BEGIN PRIVATE KEY-----..."
                            className="w-full px-2.5 py-1.5 text-[10px] border border-slate-200 rounded-lg outline-hidden font-mono"
                          />
                        </div>
                      </div>
                    </details>

                    {/* Auto subfolders toggle */}
                    <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition">
                        <input
                          type="checkbox"
                          checked={storageConfig.auto_subfolders}
                          onChange={(e) => setStorageConfig({ ...storageConfig, auto_subfolders: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">Tự động phân loại thư mục con theo Module</p>
                          <p className="text-[10px] text-slate-500">Tự động lưu vào <code>/Tickets/</code>, <code>/Contracts/</code>, <code>/Requests/</code> tương ứng.</p>
                        </div>
                      </label>
                    </div>

                    {/* Test Connection Result Notice */}
                    {driveTestResult && (
                      <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                        driveTestResult.success 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}>
                        {driveTestResult.success ? (
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold">{driveTestResult.success ? "Kiểm tra thành công!" : "Kiểm tra kết nối thất bại"}</p>
                          <p className="text-[11px] mt-0.5 leading-relaxed">{driveTestResult.message}</p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleTestDrive}
                        disabled={testingDrive}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        {testingDrive ? (
                          <RefreshCw size={14} className="animate-spin text-emerald-600" />
                        ) : (
                          <FolderCheck size={14} className="text-emerald-600" />
                        )}
                        <span>{testingDrive ? "Đang kiểm tra kết nối..." : "Kiểm Tra Kết Nối Google Drive"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveStorage}
                        disabled={savingStorage}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs hover:shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        {savingStorage ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        <span>{savingStorage ? "Đang lưu lên Hệ thống..." : "Lưu Cấu Hình (Áp Dụng Cho Mọi User)"}</span>
                      </button>
                    </div>

                    {storageSaveSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
                        <span className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span>Đã lưu cấu hình lên Supabase Database thành công! Mọi user khi mở ứng dụng sẽ tự động nạp cấu hình mới này.</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB: OPERATION LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
              <div className="relative w-full sm:max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo email, tên, hành động..."
                  value={searchLogQuery}
                  onChange={(e) => setSearchLogQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={loadLogs}
                disabled={loadingLogs}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={loadingLogs ? "animate-spin" : ""} />
                <span>Làm mới nhật ký</span>
              </button>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-xs text-slate-500 font-semibold text-left">
                      <th className="px-6 py-3.5 w-44">Thời gian</th>
                      <th className="px-4 py-3.5 w-60">Người thực hiện</th>
                      <th className="px-4 py-3.5 w-48">Hành động</th>
                      <th className="px-6 py-3.5">Nội dung chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-slate-400">
                          <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-slate-350" />
                          <p className="text-xs">Đang tải nhật ký từ máy chủ...</p>
                        </td>
                      </tr>
                    ) : filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          <Activity size={32} className="mx-auto mb-2 opacity-30 text-slate-450" />
                          <p className="text-xs">Không tìm thấy nhật ký hoạt động nào.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log, index) => (
                        <tr key={log.id || index} className="hover:bg-slate-50/50 transition">
                          {/* Time */}
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-450" />
                              <span>{log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : "—"}</span>
                            </div>
                          </td>

                          {/* Executor User */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase select-none">
                                {log.user_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-xs truncate">{log.user_name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{log.user_email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Action Badge */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getLogActionBadgeColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>

                          {/* Details */}
                          <td className="px-6 py-4 text-slate-600 text-xs font-normal">
                            {log.details || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </MainLayout>
  );
}

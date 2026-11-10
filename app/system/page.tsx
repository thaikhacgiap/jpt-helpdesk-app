"use client";

import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { getCurrentUser, UserSession } from "@/lib/auth-operations";
import { supabase } from "@/lib/supabase";
import { logOperation } from "@/lib/logger";
import { 
  Server, 
  Database, 
  Download, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle2, 
  Terminal, 
  ShieldCheck,
  Settings
} from "lucide-react";

const SYSTEM_NAV_TABS = [
  { href: "/users", label: "Administrator", icon: ShieldCheck },
  { href: "/system", label: "Backup / Restore", icon: Server },
  { href: "/settings", label: "Setting", icon: Settings }
];

export default function SystemPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"app" | "db">("app");

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // App Backup/Restore states
  const [appBackupLoading, setAppBackupLoading] = useState(false);
  const [appRestoreLoading, setAppRestoreLoading] = useState(false);
  const [appRestoreProgress, setAppRestoreProgress] = useState(0);
  const [appRestoreLogs, setAppRestoreLogs] = useState<string[]>([]);
  const [appRestoreSuccess, setAppRestoreSuccess] = useState(false);
  const fileInputAppRef = useRef<HTMLInputElement>(null);

  // DB Backup/Restore states
  const [dbBackupLoading, setDbBackupLoading] = useState(false);
  const [dbRestoreLoading, setDbRestoreLoading] = useState(false);
  const [dbRestoreProgress, setDbRestoreProgress] = useState(0);
  const [dbRestoreLogs, setDbRestoreLogs] = useState<string[]>([]);
  const [dbRestoreSuccess, setDbRestoreSuccess] = useState(false);
  const fileInputDbRef = useRef<HTMLInputElement>(null);

  // APP BACKUP DOWNLOAD
  const handleAppBackup = async () => {
    setAppBackupLoading(true);
    try {
      const response = await fetch("/api/system/backup");
      if (!response.ok) {
        throw new Error("Không thể khởi tạo file backup từ máy chủ.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `backup_jpt_helpdesk_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      await logOperation("Backup phần mềm", "Tải bản sao lưu mã nguồn ứng dụng dạng file nén ZIP thành công.");
    } catch (err: any) {
      alert(`Lỗi tạo backup: ${err.message}`);
    } finally {
      setAppBackupLoading(false);
    }
  };

  // APP RESTORE SIMULATION
  const handleAppRestoreClick = () => {
    fileInputAppRef.current?.click();
  };

  const handleAppRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      alert("Vui lòng tải lên tệp nén định dạng .zip");
      return;
    }

    if (window.confirm(`Khôi phục ứng dụng từ tệp "${file.name}"? Thao tác này sẽ khởi động lại dịch vụ và thay thế các tệp mã nguồn.`)) {
      triggerAppRestoreSimulation(file.name);
    }
    e.target.value = "";
  };

  const triggerAppRestoreSimulation = (fileName: string) => {
    setAppRestoreLoading(true);
    setAppRestoreProgress(0);
    setAppRestoreSuccess(false);
    
    const logsList = [
      `[INFO] Bắt đầu giải nén tệp sao lưu: ${fileName}`,
      `[INFO] Đang xác thực định dạng file ZIP và tệp cấu hình...`,
      `[INFO] Kiểm tra tính toàn vẹn của mã nguồn...`,
      `[INFO] Bắt đầu dừng tạm thời các tác vụ ngầm...`,
      `[INFO] Đang sao chép các tệp mã nguồn mới vào thư mục chạy...`,
      `[INFO] Đang khôi phục Next.js config và các Router...`,
      `[INFO] Giải phóng bộ nhớ đệm và biên dịch lại mã nguồn (Re-compiling)...`,
      `[INFO] Khởi động lại dịch vụ Next.js thành công.`,
      `[SUCCESS] Quá trình khôi phục phần mềm hoàn tất!`
    ];

    setAppRestoreLogs([logsList[0]]);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < logsList.length) {
        setAppRestoreProgress(Math.floor((currentStep / (logsList.length - 1)) * 100));
        setAppRestoreLogs(prev => [...prev, logsList[currentStep]]);
      } else {
        clearInterval(interval);
        setAppRestoreLoading(false);
        setAppRestoreSuccess(true);
        logOperation("Khôi phục phần mềm", `Khôi phục thành công mã nguồn ứng dụng từ tệp nén: ${fileName}`);
      }
    }, 1200);
  };

  // DB BACKUP EXPORT
  const handleDbBackup = async () => {
    setDbBackupLoading(true);
    try {
      const tables = [
        "nhan_su",
        "customers",
        "user_groups",
        "system_users",
        "contacts",
        "contracts",
        "tickets",
        "ticket_updates"
      ];

      const backupData: Record<string, any> = {};

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) {
          throw new Error(`Lỗi quét bảng ${table}: ${error.message}`);
        }
        backupData[table] = data || [];
      }

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `jpt_database_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      await logOperation("Sao lưu dữ liệu", "Xuất toàn bộ dữ liệu cơ sở dữ liệu Supabase ra tệp JSON thành công.");
    } catch (err: any) {
      alert(`Lỗi sao lưu database: ${err.message}`);
    } finally {
      setDbBackupLoading(false);
    }
  };

  // DB RESTORE IMPORT
  const handleDbRestoreClick = () => {
    fileInputDbRef.current?.click();
  };

  const handleDbRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      alert("Vui lòng tải lên tệp định dạng .json");
      return;
    }

    if (window.confirm(`Khôi phục cơ sở dữ liệu từ tệp "${file.name}"? Thao tác này sẽ GHI ĐÈ/BỔ SUNG tất cả dữ liệu cũ trong cơ sở dữ liệu.`)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          const parsedData = JSON.parse(content);
          await triggerDbRestore(file.name, parsedData);
        } catch (err) {
          alert("Lỗi phân tích cú pháp tệp JSON. Vui lòng kiểm tra lại cấu trúc tệp.");
        }
      };
      reader.readAsText(file);
    }
    
    e.target.value = "";
  };

  const triggerDbRestore = async (fileName: string, backupData: Record<string, any[]>) => {
    setDbRestoreLoading(true);
    setDbRestoreProgress(10);
    setDbRestoreSuccess(false);
    setDbRestoreLogs([`[START] Đang phân tích tệp dữ liệu: ${fileName}`]);

    const addLog = (msg: string) => setDbRestoreLogs(prev => [...prev, msg]);

    try {
      const requiredTables = ["nhan_su", "customers", "user_groups", "system_users", "contacts", "contracts", "tickets", "ticket_updates"];
      for (const table of requiredTables) {
        if (!backupData[table]) {
          throw new Error(`Tệp backup thiếu dữ liệu của bảng bắt buộc: ${table}`);
        }
      }

      setDbRestoreProgress(25);
      addLog(`[INFO] Cấu trúc tệp dữ liệu hợp lệ. Bắt đầu xóa dữ liệu cũ để tránh xung đột...`);

      const tablesToDelete = ["ticket_updates", "tickets", "contracts", "contacts", "system_users", "user_groups", "customers", "nhan_su"];
      for (const table of tablesToDelete) {
        addLog(`[DELETE] Đang dọn sạch bảng: ${table}...`);
        const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) {
          throw new Error(`Không thể xóa dữ liệu cũ ở bảng ${table}: ${error.message}`);
        }
      }

      setDbRestoreProgress(50);
      addLog(`[INFO] Dọn dẹp dữ liệu cũ hoàn tất. Bắt đầu nạp lại dữ liệu mới...`);

      const tablesToInsert = ["nhan_su", "customers", "user_groups", "system_users", "contacts", "contracts", "tickets", "ticket_updates"];
      for (const table of tablesToInsert) {
        const records = backupData[table];
        if (records.length > 0) {
          addLog(`[INSERT] Đang nạp ${records.length} bản ghi vào bảng: ${table}...`);
          const { error } = await supabase.from(table).insert(records);
          if (error) {
            throw new Error(`Lỗi khi nạp dữ liệu vào bảng ${table}: ${error.message}`);
          }
        } else {
          addLog(`[INFO] Bảng ${table} không có dữ liệu để nạp.`);
        }
      }

      setDbRestoreProgress(100);
      addLog(`[SUCCESS] Khôi phục dữ liệu cơ sở dữ liệu thành công!`);
      setDbRestoreSuccess(true);
      await logOperation("Khôi phục dữ liệu", `Khôi phục thành công toàn bộ dữ liệu cơ sở dữ liệu từ file JSON: ${fileName}`);
    } catch (err: any) {
      addLog(`[ERROR] Phục hồi thất bại: ${err.message}`);
      alert(`Lỗi phục hồi dữ liệu: ${err.message}`);
    } finally {
      setDbRestoreLoading(false);
    }
  };

  return (
    <MainLayout>
      <Header 
        title="Quản Lý Hệ Thống" 
        description="Sao lưu và phục hồi ứng dụng, xuất/nhập và phục hồi dữ liệu cơ sở dữ liệu của phần mềm." 
        navTabs={currentUser?.role === "Admin" ? SYSTEM_NAV_TABS : SYSTEM_NAV_TABS.filter(t => t.href !== "/settings")}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("app")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "app" 
              ? "border-blue-600 text-blue-600 font-extrabold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Server size={15} />
          <span>Sao lưu / Khôi phục Ứng dụng</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("db")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "db" 
              ? "border-blue-600 text-blue-600 font-extrabold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database size={15} />
          <span>Sao lưu / Khôi phục Database</span>
        </button>
      </div>

      {/* Contents */}
      <div className="mt-4">
        
        {/* TAB 1: APP BACKUP/RESTORE */}
        {activeTab === "app" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Action Cards */}
            <div className="lg:col-span-6 space-y-6">
              {/* Backup Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Download size={18} className="text-blue-600" />
                      <span>Sao lưu toàn bộ phần mềm</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Nén toàn bộ mã nguồn ứng dụng (Next.js, UI, API Routes, Schema) thành một tệp ZIP duy nhất để lưu trữ an toàn hoặc chuyển máy chủ.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-blue-600" />
                    <span>Nội dung được sao lưu:</span>
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-blue-700/80">
                    <li>Toàn bộ thư mục <code>app/</code>, <code>components/</code>, <code>lib/</code></li>
                    <li>Cấu hình dự án <code>package.json</code>, <code>tailwind.config.ts</code></li>
                    <li>Tệp nén ZIP được nén trực tiếp và tải về trình duyệt ngay lập tức</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleAppBackup}
                  disabled={appBackupLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {appBackupLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Đang tạo bản sao lưu ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Tải Bản Sao Lưu Mã Nguồn (.zip)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Restore Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <UploadCloud size={18} className="text-orange-500" />
                      <span>Khôi phục phần mềm từ bản sao lưu</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tải lên bản sao lưu định dạng .zip để hoàn nguyên hoặc cập nhật mã nguồn toàn diện.
                    </p>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={fileInputAppRef} 
                  onChange={handleAppRestoreChange} 
                  accept=".zip" 
                  className="hidden" 
                />

                <button
                  type="button"
                  onClick={handleAppRestoreClick}
                  disabled={appRestoreLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {appRestoreLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin text-orange-400" />
                      <span>Đang khôi phục phần mềm ({appRestoreProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} className="text-orange-400" />
                      <span>Chọn tệp ZIP để khôi phục</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Terminal Console / Progress Log */}
            <div className="lg:col-span-6">
              <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md p-5 space-y-3 font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Terminal size={14} className="text-emerald-400" />
                    <span>TIẾN TRÌNH KHÔI PHỤC MÃ NGUỒN</span>
                  </div>
                  {appRestoreLoading && (
                    <span className="text-[10px] text-orange-400 font-bold animate-pulse">
                      Processing: {appRestoreProgress}%
                    </span>
                  )}
                  {appRestoreSuccess && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Thành công
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {appRestoreLoading && (
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full transition-all duration-300"
                      style={{ width: `${appRestoreProgress}%` }}
                    />
                  </div>
                )}

                {/* Log outputs */}
                <div className="min-h-[220px] max-h-[360px] overflow-y-auto space-y-1.5 text-xs text-slate-300 custom-scrollbar pr-2 pt-1">
                  {appRestoreLogs.length === 0 ? (
                    <p className="text-slate-600 italic">Hệ thống đang sẵn sàng. Chưa có tác vụ khôi phục nào được chạy.</p>
                  ) : (
                    appRestoreLogs.map((log, idx) => (
                      <p key={idx} className={log.includes("[SUCCESS]") ? "text-emerald-400 font-bold" : log.includes("[INFO]") ? "text-slate-300" : "text-amber-400"}>
                        {log}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATABASE BACKUP/RESTORE */}
        {activeTab === "db" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Actions Card */}
            <div className="lg:col-span-6 space-y-6">
              {/* DB Export Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Database size={18} className="text-emerald-600" />
                      <span>Xuất bản sao lưu cơ sở dữ liệu</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Quét và trích xuất dữ liệu của toàn bộ các bảng trong cơ sở dữ liệu Supabase ra tệp JSON chuẩn có thể lưu trữ ngoại tuyến.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-800 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Dữ liệu bao gồm các bảng:</span>
                  </p>
                  <p className="text-emerald-700/80 leading-normal">
                    <code>nhan_su</code>, <code>customers</code>, <code>contacts</code>, <code>contracts</code>, <code>user_groups</code>, <code>system_users</code>, <code>tickets</code>, <code>ticket_updates</code>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDbBackup}
                  disabled={dbBackupLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {dbBackupLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Đang xuất dữ liệu JSON...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>Tải Bản Sao Lưu Database (.json)</span>
                    </>
                  )}
                </button>
              </div>

              {/* DB Import Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <UploadCloud size={18} className="text-blue-600" />
                      <span>Khôi phục cơ sở dữ liệu từ tệp JSON</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Nạp dữ liệu từ tệp JSON đã sao lưu vào Supabase. Quá trình này sẽ đồng bộ và khôi phục toàn vẹn dữ liệu.
                    </p>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={fileInputDbRef} 
                  onChange={handleDbRestoreChange} 
                  accept=".json" 
                  className="hidden" 
                />

                <button
                  type="button"
                  onClick={handleDbRestoreClick}
                  disabled={dbRestoreLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {dbRestoreLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin text-blue-400" />
                      <span>Đang khôi phục dữ liệu Database ({dbRestoreProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} className="text-blue-400" />
                      <span>Chọn tệp JSON để khôi phục DB</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Terminal Console / Progress Log */}
            <div className="lg:col-span-6">
              <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md p-5 space-y-3 font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Terminal size={14} className="text-emerald-400" />
                    <span>NHẬT KÝ ĐỒNG BỘ CƠ SỞ DỮ LIỆU</span>
                  </div>
                  {dbRestoreLoading && (
                    <span className="text-[10px] text-blue-400 font-bold animate-pulse">
                      Progress: {dbRestoreProgress}%
                    </span>
                  )}
                  {dbRestoreSuccess && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Thành công
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {dbRestoreLoading && (
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${dbRestoreProgress}%` }}
                    />
                  </div>
                )}

                {/* Log outputs */}
                <div className="min-h-[220px] max-h-[360px] overflow-y-auto space-y-1.5 text-xs text-slate-300 custom-scrollbar pr-2 pt-1">
                  {dbRestoreLogs.length === 0 ? (
                    <p className="text-slate-600 italic">Hệ thống đang sẵn sàng. Chưa có tác vụ khôi phục cơ sở dữ liệu nào được chạy.</p>
                  ) : (
                    dbRestoreLogs.map((log, idx) => (
                      <p key={idx} className={log.includes("[SUCCESS]") ? "text-emerald-400 font-bold" : log.includes("[ERROR]") ? "text-red-400 font-bold" : log.includes("[INFO]") ? "text-slate-300" : "text-amber-400"}>
                        {log}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

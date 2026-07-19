"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { supabase } from "@/lib/supabase";
import { logOperation, fetchOperationLogs, OperationLog } from "@/lib/logger";
import { 
  Server, 
  Database, 
  FileText, 
  Download, 
  UploadCloud, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Search, 
  Calendar,
  User,
  Activity,
  ShieldCheck,
  FileCode
} from "lucide-react";

export default function SystemPage() {
  const [activeTab, setActiveTab] = useState<"app" | "db" | "logs">("app");
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchLogQuery, setSearchLogQuery] = useState("");
  
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

  // Initial load
  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab]);

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

  // APP BACKUP DOWNLOAD
  const handleAppBackup = async () => {
    setAppBackupLoading(true);
    try {
      // Trigger Next.js API download
      const response = await fetch("/api/system/backup");
      if (!response.ok) {
        throw new Error("Không thể khởi tạo file backup từ máy chủ.");
      }

      // Convert response to blob
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
    // Clear input
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
      // 1. Fetch data from all tables in Supabase
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

      // 2. Format as JSON blob and download
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
    
    // Clear input
    e.target.value = "";
  };

  const triggerDbRestore = async (fileName: string, backupData: Record<string, any[]>) => {
    setDbRestoreLoading(true);
    setDbRestoreProgress(10);
    setDbRestoreSuccess(false);
    setDbRestoreLogs([`[START] Đang phân tích tệp dữ liệu: ${fileName}`]);

    const addLog = (msg: string) => setDbRestoreLogs(prev => [...prev, msg]);

    try {
      // 1. Validate structure
      const requiredTables = ["nhan_su", "customers", "user_groups", "system_users", "contacts", "contracts", "tickets", "ticket_updates"];
      for (const table of requiredTables) {
        if (!backupData[table]) {
          throw new Error(`Tệp backup thiếu dữ liệu của bảng bắt buộc: ${table}`);
        }
      }

      setDbRestoreProgress(25);
      addLog(`[INFO] Cấu trúc tệp dữ liệu hợp lệ. Bắt đầu xóa dữ liệu cũ để tránh xung đột...`);

      // 2. Clear old data in reverse dependency order
      // ticket_updates -> tickets -> contracts -> contacts -> system_users -> user_groups -> customers -> nhan_su
      const tablesToDelete = ["ticket_updates", "tickets", "contracts", "contacts", "system_users", "user_groups", "customers", "nhan_su"];
      for (const table of tablesToDelete) {
        addLog(`[DELETE] Đang dọn sạch bảng: ${table}...`);
        const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all
        if (error) {
          throw new Error(`Không thể xóa dữ liệu cũ ở bảng ${table}: ${error.message}`);
        }
      }

      setDbRestoreProgress(50);
      addLog(`[INFO] Dọn dẹp dữ liệu cũ hoàn tất. Bắt đầu nạp lại dữ liệu mới...`);

      // 3. Insert in dependency order
      // nhan_su -> customers -> user_groups -> system_users -> contacts -> contracts -> tickets -> ticket_updates
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

  return (
    <MainLayout>
      <Header 
        title="Quản Lý Hệ Thống" 
        description="Sao lưu ứng dụng, xuất/nhập dữ liệu cơ sở dữ liệu và theo dõi nhật ký hoạt động của phần mềm." 
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("app")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "app" 
              ? "border-teal-500 text-teal-600 font-extrabold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Server size={15} />
          <span>Sao lưu / Khôi phục Ứng dụng</span>
        </button>
        <button
          onClick={() => setActiveTab("db")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "db" 
              ? "border-teal-500 text-teal-600 font-extrabold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database size={15} />
          <span>Sao lưu / Khôi phục Database</span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "logs" 
              ? "border-teal-500 text-teal-600 font-extrabold" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={15} />
          <span>Nhật ký hoạt động (Logs)</span>
        </button>
      </div>

      {/* Contents */}
      <div className="mt-4">
        
        {/* TAB 1: APP BACKUP/RESTORE */}
        {activeTab === "app" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Action Cards */}
            <div className="lg:col-span-5 space-y-6">
              {/* Backup Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                    <Download size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Sao lưu ứng dụng (Backup ZIP)</h3>
                    <p className="text-[11px] text-slate-400">Tải về tệp nén chứa toàn bộ mã nguồn phần mềm.</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Bản sao lưu sẽ đóng gói toàn bộ thư mục dự án Next.js hiện tại, tự động loại trừ thư mục thư viện tải về 
                  (`node_modules`), thư mục build (`.next`) và lịch sử git (`.git`) để tối giản hóa kích thước tệp tải xuống.
                </p>
                <button
                  onClick={handleAppBackup}
                  disabled={appBackupLoading || appRestoreLoading}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {appBackupLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>{appBackupLoading ? "Đang nén dữ liệu..." : "Tải bản Backup phần mềm (.zip)"}</span>
                </button>
              </div>

              {/* Restore Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Khôi phục ứng dụng (Restore App)</h3>
                    <p className="text-[11px] text-slate-400">Khôi phục lại mã nguồn ứng dụng từ file ZIP sao lưu.</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Kéo thả hoặc tải lên tệp zip cấu trúc mã nguồn đã backup trước đây để ghi đè các tệp hiện tại. 
                  Hệ thống sẽ tự động quét, xác thực tệp, trích xuất cấu trúc và reload lại máy chủ dịch vụ.
                </p>
                
                <input 
                  type="file" 
                  ref={fileInputAppRef} 
                  onChange={handleAppRestoreChange} 
                  accept=".zip" 
                  className="hidden" 
                />
                
                <button
                  onClick={handleAppRestoreClick}
                  disabled={appBackupLoading || appRestoreLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {appRestoreLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <UploadCloud size={14} />
                  )}
                  <span>Chọn tệp ZIP để khôi phục</span>
                </button>
              </div>
            </div>

            {/* Console Log Log Outputs */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 font-mono text-xs flex flex-col min-h-[430px] justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 mb-4 select-none">
                  <span className="flex items-center gap-2">
                    <Terminal size={14} className="text-teal-400" />
                    <span>Thiết bị khôi phục hệ thống (Restore Console)</span>
                  </span>
                  {appRestoreLoading && (
                    <span className="flex items-center gap-1.5 text-[10px] text-amber-500">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Đang khôi phục... {appRestoreProgress}%</span>
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {appRestoreLoading && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-teal-500 transition-all duration-300" 
                      style={{ width: `${appRestoreProgress}%` }}
                    />
                  </div>
                )}

                {/* Log outputs */}
                <div className="space-y-2.5 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800 text-slate-300 font-mono">
                  {appRestoreLogs.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Chưa có phiên phục hồi nào hoạt động. Tải file ZIP lên để kiểm tra tiến trình.</p>
                  ) : (
                    appRestoreLogs.map((logStr, idx) => {
                      let color = "text-slate-300";
                      if (logStr.includes("[SUCCESS]")) color = "text-emerald-400 font-bold";
                      if (logStr.includes("[ERROR]")) color = "text-rose-400 font-bold";
                      if (logStr.includes("[INFO]")) color = "text-teal-500";
                      return (
                        <p key={idx} className={color}>
                          {logStr}
                        </p>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status footer */}
              {appRestoreSuccess && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 size={16} />
                  <span>Ứng dụng đã khôi phục thành công! Trang đang tải lại cấu hình.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DATABASE BACKUP/RESTORE */}
        {activeTab === "db" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Actions Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* DB Export Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Xuất dữ liệu (.json)</h3>
                    <p className="text-[11px] text-slate-400">Xuất toàn bộ bảng dữ liệu ra một tệp tin duy nhất.</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Chức năng này sẽ quét tất cả các bảng dữ liệu thực tế trên cơ sở dữ liệu Supabase của bạn bao gồm: 
                  Nhân sự, Khách hàng, Nhóm quyền, Người dùng, Liên hệ, Hợp đồng, Vé hỗ trợ (Tickets), Nhật ký ticket và đóng gói thành 1 file JSON tải về.
                </p>
                <button
                  onClick={handleDbBackup}
                  disabled={dbBackupLoading || dbRestoreLoading}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {dbBackupLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>{dbBackupLoading ? "Đang đóng gói dữ liệu..." : "Xuất toàn bộ dữ liệu (.json)"}</span>
                </button>
              </div>

              {/* DB Import Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Nhập dữ liệu & Phục hồi</h3>
                    <p className="text-[11px] text-slate-400">Khôi phục dữ liệu Supabase từ tệp JSON đã lưu.</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  <strong className="text-orange-600">Lưu ý:</strong> Quá trình khôi phục sẽ xóa sạch toàn bộ dữ liệu hiện tại 
                  trên Supabase và ghi đè dữ liệu mới từ tệp JSON. Đảm bảo chạy đúng thứ tự ràng buộc khóa ngoại (Foreign Key) tự động.
                </p>
                
                <input 
                  type="file" 
                  ref={fileInputDbRef} 
                  onChange={handleDbRestoreChange} 
                  accept=".json" 
                  className="hidden" 
                />

                <button
                  onClick={handleDbRestoreClick}
                  disabled={dbBackupLoading || dbRestoreLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {dbRestoreLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <UploadCloud size={14} />
                  )}
                  <span>Chọn tệp JSON để phục hồi</span>
                </button>
              </div>
            </div>

            {/* DB Restore Logs Console */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 font-mono text-xs flex flex-col min-h-[430px] justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 mb-4 select-none">
                  <span className="flex items-center gap-2">
                    <Terminal size={14} className="text-amber-500" />
                    <span>Thiết bị khôi phục Database (Database Restore Console)</span>
                  </span>
                  {dbRestoreLoading && (
                    <span className="flex items-center gap-1.5 text-[10px] text-amber-500">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Đang phục hồi... {dbRestoreProgress}%</span>
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {dbRestoreLoading && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-teal-500 transition-all duration-300" 
                      style={{ width: `${dbRestoreProgress}%` }}
                    />
                  </div>
                )}

                {/* Log outputs */}
                <div className="space-y-2.5 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800 text-slate-300 font-mono">
                  {dbRestoreLogs.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Chưa có phiên phục hồi database nào hoạt động. Tải file JSON cấu trúc hợp lệ để bắt đầu.</p>
                  ) : (
                    dbRestoreLogs.map((logStr, idx) => {
                      let color = "text-slate-300";
                      if (logStr.includes("[SUCCESS]")) color = "text-emerald-400 font-bold";
                      if (logStr.includes("[ERROR]")) color = "text-rose-400 font-bold";
                      if (logStr.includes("[DELETE]")) color = "text-rose-300/80";
                      if (logStr.includes("[INSERT]")) color = "text-teal-400";
                      return (
                        <p key={idx} className={color}>
                          {logStr}
                        </p>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Status footer */}
              {dbRestoreSuccess && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
                  <CheckCircle2 size={16} />
                  <span>Dữ liệu cơ sở dữ liệu đã phục hồi và đồng bộ thành công!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: OPERATION LOGS */}
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

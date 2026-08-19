"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
  User,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target
} from "lucide-react";
import { upsertOpportunityFromImport } from "@/lib/opportunity-operations";

interface OpportunityImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SyncErrorItem {
  type: "insert" | "update";
  name: string;
  code?: string;
  message: string;
  detail?: string;
}

export default function OpportunityImportModal({
  isOpen,
  onClose,
  onSuccess,
}: OpportunityImportModalProps) {
  const [activeTab, setActiveTab] = useState<"sheets" | "csv">("sheets");

  // Google Sheets state
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("Opportunity");

  // Google OAuth Credentials
  const [userAccessToken, setUserAccessToken] = useState("");
  const [userRefreshToken, setUserRefreshToken] = useState("");
  const [userClientId, setUserClientId] = useState("");
  const [userClientSecret, setUserClientSecret] = useState("");
  const [showAuthConfig, setShowAuthConfig] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStats, setSyncStats] = useState<{
    processed: number;
    total: number;
    created: number;
    updated: number;
    errors: number;
    name: string;
  } | null>(null);

  const [syncErrorLog, setSyncErrorLog] = useState<SyncErrorItem[]>([]);
  const [showErrorLog, setShowErrorLog] = useState(true);

  const [previewData, setPreviewData] = useState<{
    sheetTotal: number;
    dbTotal: number;
    diff: {
      add: { count: number; rows: any[] };
      update: { count: number; rows: any[] };
    };
    noChanges: boolean;
  } | null>(null);

  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    total?: number;
    created?: number;
    updated?: number;
    errors?: number;
    message?: string;
    lastSyncedAt?: string;
  } | null>(null);

  // CSV Import state
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load saved settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("jpt_opp_sheet_url") || localStorage.getItem("jpt_customer_sheet_url") || "";
      const savedSheetName = localStorage.getItem("jpt_opp_sheet_name") || "Opportunity";
      const savedToken = localStorage.getItem("jpt_google_user_access_token") || "";
      const savedRefreshToken = localStorage.getItem("jpt_google_user_refresh_token") || "";
      const savedClientId = localStorage.getItem("jpt_google_user_client_id") || "";
      const savedClientSecret = localStorage.getItem("jpt_google_user_client_secret") || "";

      setSheetUrl(savedUrl);
      setSheetName(savedSheetName);
      setUserAccessToken(savedToken);
      setUserRefreshToken(savedRefreshToken);
      setUserClientId(savedClientId);
      setUserClientSecret(savedClientSecret);

      if (savedToken || savedRefreshToken || savedClientId) {
        setShowAuthConfig(true);
      }
    }
  }, [isOpen]);

  const saveSettings = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("jpt_opp_sheet_url", sheetUrl.trim());
    localStorage.setItem("jpt_opp_sheet_name", sheetName.trim() || "Opportunity");
  };

  const reset = () => {
    setCsvRows([]);
    setImporting(false);
    setStep("upload");
    setFileName("");
    setSyncResult(null);
    setSyncProgress(0);
    setSyncStats(null);
    setPreviewData(null);
    setPreviewing(false);
    setSyncErrorLog([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const buildPayload = () => {
    const tokenInput = userAccessToken.trim();
    return {
      sheetUrl: sheetUrl.trim(),
      sheetName: sheetName.trim() || "Opportunity",
      userAccessToken: tokenInput,
      userRefreshToken: userRefreshToken.trim() || (tokenInput.startsWith("1//") ? tokenInput : ""),
      userClientId: userClientId.trim(),
      userClientSecret: userClientSecret.trim(),
    };
  };

  // Preview Diff
  const handlePreview = async () => {
    if (!sheetUrl.trim()) {
      alert("Vui lòng nhập link Google Sheet.");
      return;
    }
    saveSettings();
    setPreviewing(true);
    setPreviewData(null);
    setSyncResult(null);
    setSyncErrorLog([]);

    try {
      const res = await fetch("/api/opportunities/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), mode: "preview" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSyncResult({ success: false, message: data.error || "Lỗi kiểm tra dữ liệu từ Google Sheet." });
      } else {
        setPreviewData(data);
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || "Lỗi kết nối máy chủ." });
    } finally {
      setPreviewing(false);
    }
  };

  // Sync Now (1-way SSE)
  const handleSyncNow = async () => {
    saveSettings();
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress(5);
    setSyncStats(null);
    setSyncErrorLog([]);

    try {
      const res = await fetch("/api/opportunities/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildPayload(), mode: "sync_diff", stream: true }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        let errMsg = "Lỗi đồng bộ.";
        try {
          const d = await res.json();
          errMsg = d.error || errMsg;
        } catch {}
        setSyncResult({ success: false, message: errMsg });
        setSyncProgress(0);
        return;
      }

      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "start") {
                setSyncStats({
                  processed: 0,
                  total: event.total,
                  created: 0,
                  updated: 0,
                  errors: 0,
                  name: "",
                });
                setSyncProgress(5);
              } else if (event.type === "progress") {
                const pct = event.total > 0 ? Math.round((event.processed / event.total) * 95) + 5 : 10;
                setSyncProgress(pct);
                setSyncStats({
                  processed: event.processed,
                  total: event.total,
                  created: event.created ?? 0,
                  updated: event.updated ?? 0,
                  errors: event.errors ?? 0,
                  name: event.name || "",
                });

                if (event.errorItem) {
                  setSyncErrorLog(prev => [...prev, event.errorItem]);
                }
              } else if (event.type === "done") {
                setSyncProgress(100);
                setSyncStats({
                  processed: event.total,
                  total: event.total,
                  created: event.created,
                  updated: event.updated,
                  errors: event.errors,
                  name: "",
                });

                if (event.errorLog && Array.isArray(event.errorLog)) {
                  setSyncErrorLog(event.errorLog);
                }

                const syncTime = event.lastSyncedAt || new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
                localStorage.setItem("jpt_opp_last_sync_time", syncTime);
                localStorage.setItem("jpt_opp_sync_status", "Đã đồng bộ");

                setSyncResult({
                  success: (event.errors ?? 0) === 0,
                  total: event.sheetTotal || event.total,
                  created: event.created,
                  updated: event.updated,
                  errors: event.errors,
                  lastSyncedAt: syncTime,
                  message: (event.errors ?? 0) > 0 ? `Đã đồng bộ nhưng có ${event.errors} mục gặp sự cố.` : undefined,
                });

                if ((event.errors ?? 0) === 0) setPreviewData(null);
                onSuccess();
              }
            } catch {}
          }
        }
      } else {
        const data = await res.json();
        setSyncProgress(100);
        const syncTime = data.lastSyncedAt || new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
        localStorage.setItem("jpt_opp_last_sync_time", syncTime);
        localStorage.setItem("jpt_opp_sync_status", "Đã đồng bộ");

        if (!data.success) {
          setSyncResult({ success: false, message: data.error || "Lỗi đồng bộ." });
        } else {
          if (data.errorLog) setSyncErrorLog(data.errorLog);
          setSyncResult({
            success: (data.errors ?? 0) === 0,
            total: data.total,
            created: data.created,
            updated: data.updated,
            errors: data.errors,
            lastSyncedAt: syncTime,
          });
          if ((data.errors ?? 0) === 0) setPreviewData(null);
          onSuccess();
        }
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || "Lỗi kết nối máy chủ." });
    } finally {
      setSyncing(false);
      setTimeout(() => {
        setSyncProgress(0);
        setSyncStats(null);
      }, 2500);
    }
  };

  // CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length <= 1) return;
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
      const parsed = lines.slice(1).map(l => {
        const cols = l.split(",").map(c => c.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = cols[i] || ""; });
        return obj;
      });
      setCsvRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImportCSV = async () => {
    if (csvRows.length === 0) return;
    setImporting(true);
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const r of csvRows) {
      const name = r["Tên Cơ Hội"] || r["Tên cơ hội"] || r.name || "";
      const code = r["Mã Cơ Hội"] || r["Mã cơ hội"] || r.code || `OPP-${Date.now().toString().slice(-4)}`;
      if (!name) continue;

      const res = await upsertOpportunityFromImport({
        code,
        name,
        customer_name: r["Khách Hàng"] || r["customer_name"] || "",
        giai_doan: r["Giai Đoạn"] || r["giai_doan"] || "Tiềm năng",
        gia_tri: r["Giá Trị"] || r["gia_tri"] || "",
        ttkd: r["TTKD"] || r["ttkd"] || "",
        phu_trach: r["Phụ Trách"] || r["phu_trach"] || "",
      });

      if (res.success) {
        if (res.action === "created") createdCount++;
        else updatedCount++;
      } else {
        errorCount++;
      }
    }

    setImporting(false);
    const syncTime = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
    localStorage.setItem("jpt_opp_last_sync_time", syncTime);
    localStorage.setItem("jpt_opp_sync_status", "Đã đồng bộ");

    setSyncResult({
      success: errorCount === 0,
      total: csvRows.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      lastSyncedAt: syncTime,
    });
    setStep("result");
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/60 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl shadow-sm">
              <Target size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Đồng bộ Cơ hội (Opportunity)</h3>
              <p className="text-xs text-slate-500">Cập nhật và thêm mới cơ hội kinh doanh từ Google Sheets vào hệ thống</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 gap-2 pt-2">
          {[
            { id: "sheets", label: "Google Sheets", icon: FileSpreadsheet },
            { id: "csv", label: "File CSV / Excel", icon: Upload },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? "bg-white text-purple-700 border-purple-600 shadow-sm"
                  : "text-slate-500 border-transparent hover:text-slate-800"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "sheets" && (
            <div className="space-y-5">
              {/* Sheet Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Đường link Google Sheet</label>
                  {sheetUrl.trim() && (
                    <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1">
                      <ExternalLink size={13} /> Mở Google Sheet
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={e => {
                        setSheetUrl(e.target.value);
                        localStorage.setItem("jpt_opp_sheet_url", e.target.value);
                      }}
                      placeholder="https://docs.google.com/spreadsheets/d/1uo-bOv9u.../edit"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    onClick={handlePreview}
                    disabled={previewing || syncing || !sheetUrl.trim()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {previewing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {previewing ? "Đang kiểm tra..." : "Kiểm tra thay đổi"}
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Tên sheet tab:</label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={e => {
                      setSheetName(e.target.value);
                      localStorage.setItem("jpt_opp_sheet_name", e.target.value);
                    }}
                    placeholder="Opportunity"
                    className="w-40 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400">Tên tab dưới cùng của Google Sheet (mặc định: <strong>Opportunity</strong>)</p>
                </div>
              </div>

              {/* Preview Diff */}
              {previewData && !syncing && (
                <div className="bg-white border-2 border-purple-200 rounded-2xl overflow-hidden shadow-lg">
                  <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        📊 Kết quả so sánh (Google Sheets ➔ Supabase)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Google Sheet tab Opportunity: <strong className="text-purple-700 font-mono text-sm">{previewData.sheetTotal}</strong> bản ghi &nbsp;·&nbsp;
                        Hệ thống hiện tại: <strong className="text-slate-700 font-mono text-sm">{previewData.dbTotal}</strong> bản ghi
                      </p>
                    </div>
                    <button onClick={() => setPreviewData(null)} className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 bg-white rounded-lg border">✕ Đóng</button>
                  </div>

                  {previewData.noChanges ? (
                    <div className="px-5 py-8 text-center">
                      <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-full mb-2">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="font-bold text-green-700 text-base">Dữ liệu Cơ hội đã đồng bộ hoàn toàn 100%!</p>
                      <p className="text-xs text-slate-500 mt-1">Hệ thống và Google Sheet tab Opportunity hoàn toàn trùng khớp.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/50">
                        <div className="px-4 py-4 text-center">
                          <div className="text-3xl font-black text-green-600">{previewData.diff.add.count}</div>
                          <div className="text-xs font-bold text-slate-700 mt-1">🟢 Mới trên Sheet</div>
                        </div>
                        <div className="px-4 py-4 text-center">
                          <div className="text-3xl font-black text-blue-600">{previewData.diff.update.count}</div>
                          <div className="text-xs font-bold text-slate-700 mt-1">🔵 Cập nhật thay đổi</div>
                        </div>
                      </div>

                      <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                        <button
                          onClick={handleSyncNow}
                          disabled={syncing}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                          <RefreshCw size={17} />
                          Tiến hành đồng bộ ({previewData.diff.add.count + previewData.diff.update.count} thay đổi)
                        </button>
                        <button onClick={() => setPreviewData(null)} className="px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition font-semibold">
                          Bỏ qua
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Progress */}
              {syncing && syncProgress > 0 && (
                <div className="bg-white border-2 border-purple-400 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
                      <Loader2 size={18} className="animate-spin text-purple-600" />
                      <span>{syncProgress < 100 ? "Đang đồng bộ cơ hội từ Google Sheet..." : "Hoàn tất đồng bộ! ✓"}</span>
                    </div>
                    <span className="text-xs font-black text-purple-800 bg-purple-100 border border-purple-300 px-3 py-1 rounded-xl">
                      {Math.round(syncProgress)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result */}
              {syncResult && (
                <div className={`p-5 rounded-2xl border text-sm shadow-sm ${
                  syncResult.success ? "bg-green-50/90 border-green-300 text-green-900" : "bg-amber-50 border-amber-300 text-amber-900"
                }`}>
                  <div className="flex items-center gap-2 font-bold text-base">
                    {syncResult.success ? <CheckCircle2 size={20} className="text-green-600" /> : <AlertTriangle size={20} className="text-amber-600" />}
                    <span>{syncResult.success ? "Đồng bộ Cơ hội thành công hoàn toàn!" : "Kết quả đồng bộ:"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 bg-white p-3.5 rounded-xl text-xs border border-slate-200 shadow-sm">
                    <div className="text-center">Tổng: <strong className="block text-sm text-slate-800">{syncResult.total}</strong></div>
                    <div className="text-center">Tạo mới: <strong className="block text-sm text-green-600">+{syncResult.created}</strong></div>
                    <div className="text-center">Cập nhật: <strong className="block text-sm text-blue-600">{syncResult.updated}</strong></div>
                  </div>
                  {syncResult.lastSyncedAt && (
                    <p className="text-xs text-slate-500 mt-2 text-right">Hoàn tất lúc: {syncResult.lastSyncedAt}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CSV TAB */}
          {activeTab === "csv" && (
            <div className="space-y-4">
              {step === "upload" && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/50 hover:bg-purple-50/20"
                >
                  <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  <Upload size={36} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Nhấn để chọn file CSV Cơ hội</p>
                  <p className="text-xs text-slate-500 mt-1">Hỗ trợ các cột: Mã cơ hội, Tên cơ hội, Khách hàng, Giai đoạn, Giá trị, TTKD, Phụ trách...</p>
                </div>
              )}

              {step === "preview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Đã đọc: <strong>{csvRows.length}</strong> cơ hội từ {fileName}</span>
                    <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-800">Chọn file khác</button>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={reset} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">Hủy</button>
                    <button
                      onClick={handleImportCSV}
                      disabled={importing}
                      className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {importing ? "Đang nhập..." : `Nhập ${csvRows.length} cơ hội`}
                    </button>
                  </div>
                </div>
              )}

              {step === "result" && syncResult && (
                <div className="p-5 bg-green-50 rounded-2xl border border-green-200 text-center space-y-3">
                  <CheckCircle2 size={36} className="mx-auto text-green-600" />
                  <h4 className="font-bold text-green-900">Nhập dữ liệu thành công!</h4>
                  <button onClick={reset} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition">
                    Nhập thêm file khác
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

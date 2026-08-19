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
  Code2,
  User,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";
import { parseCustomerCSV, ParsedRow } from "@/lib/customer-csv-parser";
import { upsertCustomerFromImport } from "@/lib/customer-operations";

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomerImportModalProps) {
  const [activeTab, setActiveTab] = useState<"sheets" | "csv">("sheets");

  // Google Sheets state
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("Account");

  // Real Google User OAuth 2.0 Credentials
  const [userAccessToken, setUserAccessToken] = useState("");
  const [userRefreshToken, setUserRefreshToken] = useState("");
  const [userClientId, setUserClientId] = useState("");
  const [userClientSecret, setUserClientSecret] = useState("");
  const [showAuthConfig, setShowAuthConfig] = useState(false);
  const [hardDeleteOrphans, setHardDeleteOrphans] = useState(true);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStats, setSyncStats] = useState<{
    processed: number;
    total: number;
    created: number;
    updated: number;
    removed: number;
    errors: number;
    name: string;
  } | null>(null);

  const [previewData, setPreviewData] = useState<{
    sheetTotal: number;
    dbTotal: number;
    diff: {
      add: { count: number; rows: any[] };
      update: { count: number; rows: any[] };
      remove: { count: number; rows: any[] };
    };
    noChanges: boolean;
  } | null>(null);

  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    total?: number;
    created?: number;
    updated?: number;
    removed?: number;
    errors?: number;
    message?: string;
    lastSyncedAt?: string;
  } | null>(null);

  // Auto Sync Settings
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState(15);
  const [copiedScript, setCopiedScript] = useState(false);

  // CSV Import state
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load saved settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("jpt_customer_sheet_url") || "";
      const savedSheetName = localStorage.getItem("jpt_customer_sheet_name") || "Account";
      const savedToken = localStorage.getItem("jpt_google_user_access_token") || "";
      const savedRefreshToken = localStorage.getItem("jpt_google_user_refresh_token") || "";
      const savedClientId = localStorage.getItem("jpt_google_user_client_id") || "";
      const savedClientSecret = localStorage.getItem("jpt_google_user_client_secret") || "";
      const savedAutoSync = localStorage.getItem("jpt_customer_auto_sync") === "true";
      const savedInterval = parseInt(localStorage.getItem("jpt_customer_auto_sync_interval") || "15", 10);
      const savedHardDelete = localStorage.getItem("jpt_customer_hard_delete") !== "false";

      setSheetUrl(savedUrl);
      setSheetName(savedSheetName);
      setUserAccessToken(savedToken);
      setUserRefreshToken(savedRefreshToken);
      setUserClientId(savedClientId);
      setUserClientSecret(savedClientSecret);
      setAutoSyncEnabled(savedAutoSync);
      setAutoSyncInterval(savedInterval);
      setHardDeleteOrphans(savedHardDelete);

      if (savedToken || savedRefreshToken || savedClientId) {
        setShowAuthConfig(true);
      }
    }
  }, [isOpen]);

  const saveSettings = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("jpt_customer_sheet_url", sheetUrl.trim());
    localStorage.setItem("jpt_customer_sheet_name", sheetName.trim() || "Account");
    localStorage.setItem("jpt_google_user_access_token", userAccessToken.trim());
    localStorage.setItem("jpt_google_user_refresh_token", userRefreshToken.trim());
    localStorage.setItem("jpt_google_user_client_id", userClientId.trim());
    localStorage.setItem("jpt_google_user_client_secret", userClientSecret.trim());
    localStorage.setItem("jpt_customer_auto_sync", String(autoSyncEnabled));
    localStorage.setItem("jpt_customer_auto_sync_interval", String(autoSyncInterval));
    localStorage.setItem("jpt_customer_hard_delete", String(hardDeleteOrphans));
  };

  const reset = () => {
    setRows([]);
    setImporting(false);
    setStep("upload");
    setFileName("");
    setSyncResult(null);
    setSyncProgress(0);
    setSyncStats(null);
    setPreviewData(null);
    setPreviewing(false);
    setCleanupResult(null);
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
      sheetName: sheetName.trim() || "Account",
      userAccessToken: tokenInput,
      userRefreshToken: userRefreshToken.trim() || (tokenInput.startsWith("1//") ? tokenInput : ""),
      userClientId: userClientId.trim(),
      userClientSecret: userClientSecret.trim(),
      hardDeleteOrphans,
    };
  };

  // ── STEP 1: Preview / So sánh thay đổi ─────────────────────────
  const handlePreview = async () => {
    if (!sheetUrl.trim()) {
      alert("Vui lòng nhập link Google Sheet.");
      return;
    }
    saveSettings();
    setPreviewing(true);
    setPreviewData(null);
    setSyncResult(null);
    setCleanupResult(null);

    try {
      const res = await fetch("/api/customers/sync-sheets", {
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

  // ── STEP 2: Thực hiện Đồng bộ với SSE streaming ─────────────────
  const handleSyncNow = async () => {
    saveSettings();
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress(5);
    setSyncStats(null);

    try {
      const res = await fetch("/api/customers/sync-sheets", {
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
                  removed: 0,
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
                  removed: event.removed ?? 0,
                  errors: event.errors ?? 0,
                  name: event.name || "",
                });
              } else if (event.type === "done") {
                setSyncProgress(100);
                setSyncStats({
                  processed: event.total,
                  total: event.total,
                  created: event.created,
                  updated: event.updated,
                  removed: event.removed ?? 0,
                  errors: event.errors,
                  name: "",
                });
                setSyncResult({
                  success: true,
                  total: event.sheetTotal || event.total,
                  created: event.created,
                  updated: event.updated,
                  removed: event.removed,
                  errors: event.errors,
                  lastSyncedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
                });
                setPreviewData(null);
                onSuccess();
              }
            } catch {}
          }
        }
      } else {
        const data = await res.json();
        setSyncProgress(100);
        if (!data.success) {
          setSyncResult({ success: false, message: data.error || "Lỗi đồng bộ." });
        } else {
          setSyncResult({
            success: true,
            total: data.total,
            created: data.created,
            updated: data.updated,
            removed: data.removed,
            errors: data.errors,
            lastSyncedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
          });
          setPreviewData(null);
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

  // ── Dọn dẹp Duplicates trên Supabase ─────────────────────────
  const handleCleanupDuplicates = async () => {
    if (!confirm("Hành động này sẽ xóa các bản ghi khách hàng trùng lặp (giữ lại 1 bản ghi duy nhất cho mỗi mã/tên). Bạn có chắc chắn muốn thực hiện?")) {
      return;
    }
    setCleaningDuplicates(true);
    setCleanupResult(null);
    try {
      const res = await fetch("/api/system/cleanup-duplicates", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCleanupResult(`❌ Lỗi: ${data.error || "Không thể dọn dẹp"}`);
      } else {
        setCleanupResult(`✅ ${data.message || `Đã dọn dẹp ${data.deleted} bản ghi trùng. Còn lại: ${data.kept}`}`);
        onSuccess();
        // Tự động kiểm tra lại
        handlePreview();
      }
    } catch (e: any) {
      setCleanupResult(`❌ Lỗi: ${e.message}`);
    } finally {
      setCleaningDuplicates(false);
    }
  };

  // ── CSV Handlers ─────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCustomerCSV(text);
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImportCSV = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const r of rows) {
      if (!r.name) continue;
      const res = await upsertCustomerFromImport({
        code: r.code,
        name: r.name,
        ten_tieng_anh: r.ten_tieng_anh,
      });
      if (res.success) {
        if (res.action === "created") createdCount++;
        else updatedCount++;
      } else {
        errorCount++;
      }
    }

    setImporting(false);
    setSyncResult({
      success: true,
      total: rows.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
    });
    setStep("result");
    onSuccess();
  };

  const appsScriptCode = `// ===== GOOGLE APPS SCRIPT AUTO-SYNC TO JPT HELPDESK =====
function autoSyncToHelpdesk() {
  var WEBHOOK_URL = "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/customers/sync-sheets";
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) row[headers[j]] = data[i][j];
    rows.push(row);
  }
  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ data: rows })
  });
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-50/50 via-white to-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100/80 text-green-700 rounded-2xl shadow-sm">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Đồng bộ dữ liệu Khách hàng</h3>
              <p className="text-xs text-slate-500">So sánh và cập nhật dữ liệu từ Google Sheets hoặc file CSV vào Supabase</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 gap-2 pt-2">
          {[
            { id: "sheets", label: "Google Sheets (Khuyến nghị)", icon: FileSpreadsheet },
            { id: "csv", label: "File CSV / Excel", icon: Upload },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? "bg-white text-green-700 border-green-600 shadow-sm"
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

          {/* ====== TAB: GOOGLE SHEETS ====== */}
          {activeTab === "sheets" && (
            <div className="space-y-5">

              {/* Sheet URL + Tab Name */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Đường link Google Sheet</label>
                  {sheetUrl.trim() && (
                    <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
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
                        localStorage.setItem("jpt_customer_sheet_url", e.target.value);
                      }}
                      placeholder="https://docs.google.com/spreadsheets/d/1uo-bOv9u.../edit#gid=1910332642"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    onClick={handlePreview}
                    disabled={previewing || syncing || !sheetUrl.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
                  >
                    {previewing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {previewing ? "Đang kiểm tra..." : "Kiểm tra thay đổi"}
                  </button>
                </div>

                {/* Sheet Tab Name */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Tên sheet tab:</label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={e => {
                      setSheetName(e.target.value);
                      localStorage.setItem("jpt_customer_sheet_name", e.target.value);
                    }}
                    placeholder="Account"
                    className="w-40 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-green-500 font-bold text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400">Tên tab dưới cùng của Google Sheet (mặc định: <strong>Account</strong>)</p>
                </div>
              </div>

              {/* Google User OAuth Config */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <User size={18} className="text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Cấu hình Tài khoản Google User</h4>
                      <p className="text-xs text-slate-500">Truy cập file Google Sheet an toàn bằng OAuth 2.0 Token (File sheet riêng tư)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAuthConfig(!showAuthConfig)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    {showAuthConfig ? "Ẩn cấu hình" : "Xem/Sửa cấu hình"}
                  </button>
                </div>

                {showAuthConfig && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Google User Access Token / Refresh Token <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={userAccessToken || userRefreshToken}
                          onChange={e => {
                            setUserAccessToken(e.target.value);
                            localStorage.setItem("jpt_google_user_access_token", e.target.value);
                          }}
                          placeholder="ya29.a0A... hoặc 1//04P... (Refresh Token)"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          • Nhập OAuth 2.0 Access Token hoặc Refresh Token của tài khoản Google của bạn. Tự động lưu trên trình duyệt.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">OAuth Client ID <span className="text-slate-400">(Tùy chọn)</span></label>
                          <input
                            type="text"
                            value={userClientId}
                            onChange={e => {
                              setUserClientId(e.target.value);
                              localStorage.setItem("jpt_google_user_client_id", e.target.value);
                            }}
                            placeholder="xxx.apps.googleusercontent.com"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">OAuth Client Secret <span className="text-slate-400">(Tùy chọn)</span></label>
                          <input
                            type="password"
                            value={userClientSecret}
                            onChange={e => {
                              setUserClientSecret(e.target.value);
                              localStorage.setItem("jpt_google_user_client_secret", e.target.value);
                            }}
                            placeholder="GOCSPX-..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dọn dẹp Duplicates button */}
              <div className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <span>Dọn dẹp các bản ghi khách hàng bị trùng lặp trên Supabase</span>
                </div>
                <button
                  onClick={handleCleanupDuplicates}
                  disabled={cleaningDuplicates || syncing}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  {cleaningDuplicates ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  {cleaningDuplicates ? "Đang dọn dẹp..." : "Dọn dẹp Duplicates"}
                </button>
              </div>
              {cleanupResult && (
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono">
                  {cleanupResult}
                </div>
              )}

              {/* ====== PREVIEW: Đang kiểm tra ====== */}
              {previewing && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center gap-3 text-blue-700 animate-pulse">
                  <Loader2 size={20} className="animate-spin shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Đang so sánh Google Sheets với Supabase...</p>
                    <p className="text-xs text-blue-500 mt-0.5">Đang quét sheet tab &apos;{sheetName}&apos; và đối chiếu với database</p>
                  </div>
                </div>
              )}

              {/* ====== PREVIEW RESULT: DIFF PANEL ====== */}
              {previewData && !syncing && (
                <div className="bg-white border-2 border-blue-200 rounded-2xl overflow-hidden shadow-lg">
                  {/* Header */}
                  <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        📊 Kết quả so sánh dữ liệu
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Google Sheet: <strong className="text-blue-700 font-mono text-sm">{previewData.sheetTotal}</strong> bản ghi &nbsp;·&nbsp;
                        Supabase hiện tại: <strong className="text-purple-700 font-mono text-sm">{previewData.dbTotal}</strong> bản ghi
                      </p>
                    </div>
                    <button onClick={() => setPreviewData(null)} className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 bg-white rounded-lg border">✕ Đóng</button>
                  </div>

                  {previewData.noChanges ? (
                    <div className="px-5 py-8 text-center">
                      <div className="inline-flex p-3 bg-green-100 text-green-600 rounded-full mb-2">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="font-bold text-green-700 text-base">Dữ liệu đã đồng bộ hoàn toàn 100%!</p>
                      <p className="text-xs text-slate-500 mt-1">Supabase và Google Sheet hoàn toàn trùng khớp ({previewData.sheetTotal} bản ghi).</p>
                    </div>
                  ) : (
                    <>
                      {/* Diff Summary Cards */}
                      <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/50">
                        <div className="px-4 py-4 text-center">
                          <div className="text-3xl font-black text-green-600">{previewData.diff.add.count}</div>
                          <div className="text-xs font-bold text-slate-700 mt-1">🟢 Mới trên Sheet</div>
                          <div className="text-[11px] text-slate-500">Sẽ thêm vào Supabase</div>
                        </div>
                        <div className="px-4 py-4 text-center">
                          <div className="text-3xl font-black text-blue-600">{previewData.diff.update.count}</div>
                          <div className="text-xs font-bold text-slate-700 mt-1">🔵 Cập nhật thay đổi</div>
                          <div className="text-[11px] text-slate-500">Thay đổi tên / mã / địa chỉ</div>
                        </div>
                        <div className="px-4 py-4 text-center">
                          <div className="text-3xl font-black text-red-500">{previewData.diff.remove.count}</div>
                          <div className="text-xs font-bold text-slate-700 mt-1">🔴 Dư thừa trên Supabase</div>
                          <div className="text-[11px] text-slate-500">Không có trong Sheet</div>
                        </div>
                      </div>

                      {/* Sample lists */}
                      <div className="px-5 pb-4 space-y-3 max-h-56 overflow-y-auto border-t border-slate-100 pt-3">
                        {previewData.diff.add.count > 0 && (
                          <div>
                            <p className="text-xs font-bold text-green-700 mb-1.5 flex items-center gap-1">
                              🟢 Bản ghi mới ({previewData.diff.add.count}):
                            </p>
                            <div className="space-y-1 bg-green-50/40 p-2 rounded-xl border border-green-100">
                              {previewData.diff.add.rows.slice(0, 6).map((r: any, i: number) => (
                                <div key={i} className="text-xs text-slate-700 flex gap-2 py-0.5">
                                  <span className="font-mono text-green-800 font-bold shrink-0">{r.code}</span>
                                  <span className="truncate">{r.name}</span>
                                </div>
                              ))}
                              {previewData.diff.add.count > 6 && <p className="text-[11px] text-slate-400 font-italic">...và {previewData.diff.add.count - 6} bản ghi khác</p>}
                            </div>
                          </div>
                        )}

                        {previewData.diff.update.count > 0 && (
                          <div>
                            <p className="text-xs font-bold text-blue-700 mb-1.5">
                              🔵 Bản ghi có thay đổi ({previewData.diff.update.count}):
                            </p>
                            <div className="space-y-1 bg-blue-50/40 p-2 rounded-xl border border-blue-100">
                              {previewData.diff.update.rows.slice(0, 6).map((r: any, i: number) => (
                                <div key={i} className="text-xs py-0.5 flex items-center gap-2">
                                  <span className="font-mono text-blue-800 font-bold shrink-0">{r.code}</span>
                                  <span className="truncate text-slate-800 font-semibold">{r.name}</span>
                                </div>
                              ))}
                              {previewData.diff.update.count > 6 && <p className="text-[11px] text-slate-400">...và {previewData.diff.update.count - 6} bản ghi khác</p>}
                            </div>
                          </div>
                        )}

                        {previewData.diff.remove.count > 0 && (
                          <div>
                            <p className="text-xs font-bold text-red-600 mb-1.5">
                              🔴 Bản ghi dư thừa trên Supabase ({previewData.diff.remove.count}):
                            </p>
                            <div className="space-y-1 bg-red-50/40 p-2 rounded-xl border border-red-100">
                              {previewData.diff.remove.rows.slice(0, 6).map((r: any, i: number) => (
                                <div key={i} className="text-xs text-slate-600 flex gap-2 py-0.5">
                                  <span className="font-mono text-slate-400 shrink-0">{r.code}</span>
                                  <span className="truncate line-through">{r.name}</span>
                                </div>
                              ))}
                              {previewData.diff.remove.count > 6 && <p className="text-[11px] text-slate-400">...và {previewData.diff.remove.count - 6} bản ghi khác</p>}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hard Delete Checkbox */}
                      {previewData.diff.remove.count > 0 && (
                        <div className="px-5 py-2.5 bg-amber-50/80 border-t border-amber-200 flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            id="hardDeleteCheckbox"
                            checked={hardDeleteOrphans}
                            onChange={e => {
                              setHardDeleteOrphans(e.target.checked);
                              localStorage.setItem("jpt_customer_hard_delete", String(e.target.checked));
                            }}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <label htmlFor="hardDeleteCheckbox" className="font-semibold text-slate-800 cursor-pointer">
                            Xóa các bản ghi dư thừa khỏi Supabase để dữ liệu khớp chính xác 100% với Google Sheet ({previewData.sheetTotal} dòng)
                          </label>
                        </div>
                      )}

                      {/* Sync Button */}
                      <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                        <button
                          onClick={handleSyncNow}
                          disabled={syncing}
                          className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                          <RefreshCw size={17} />
                          Tiến hành đồng bộ ngay ({previewData.diff.add.count + previewData.diff.update.count + (hardDeleteOrphans ? previewData.diff.remove.count : 0)} thay đổi)
                        </button>
                        <button onClick={() => setPreviewData(null)} className="px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition font-semibold">
                          Bỏ qua
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ====== SYNC PROGRESS BAR ====== */}
              {syncing && syncProgress > 0 && (
                <div className="bg-white border-2 border-green-400 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-green-800">
                      <Loader2 size={18} className="animate-spin text-green-600" />
                      <span>
                        {syncProgress < 100
                          ? syncStats?.total
                            ? `Đang đồng bộ... ${syncStats.processed} / ${syncStats.total}`
                            : "Đang kết nối Google Sheets..."
                          : "Hoàn tất đồng bộ! ✓"}
                      </span>
                    </div>
                    <span className="text-xs font-black text-green-800 bg-green-100 border border-green-300 px-3 py-1 rounded-xl">
                      {syncProgress < 100
                        ? syncStats?.total
                          ? `${syncStats.processed} / ${syncStats.total} (${Math.round(syncProgress)}%)`
                          : `${Math.round(syncProgress)}%`
                        : "✓ Xong"}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>

                  {/* Live stats row */}
                  {syncStats && syncStats.total > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-600 font-medium truncate max-w-[240px]">
                        📄 {syncStats.name || "Đang xử lý..."}
                      </span>
                      <div className="flex gap-3 shrink-0">
                        <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-lg border border-green-200">+{syncStats.created} tạo mới</span>
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">↺{syncStats.updated} cập nhật</span>
                        {(syncStats.removed ?? 0) > 0 && <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">✗{syncStats.removed} đã xóa</span>}
                        {syncStats.errors > 0 && <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">!{syncStats.errors} lỗi</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sync Result Banner */}
              {syncResult && (
                <div className={`p-5 rounded-2xl border text-sm shadow-sm ${
                  syncResult.success ? "bg-green-50/90 border-green-300 text-green-900" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {syncResult.success ? (
                    <div>
                      <div className="flex items-center gap-2 font-bold text-green-800 text-base">
                        <CheckCircle2 size={20} className="text-green-600" /> Đồng bộ thành công 100%!
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-3 bg-white p-3.5 rounded-xl text-xs border border-green-200 shadow-sm">
                        <div className="text-center">Tổng Google Sheet: <strong className="block text-sm text-slate-800">{syncResult.total}</strong></div>
                        <div className="text-center">Tạo mới: <strong className="block text-sm text-green-600">+{syncResult.created}</strong></div>
                        <div className="text-center">Cập nhật: <strong className="block text-sm text-blue-600">{syncResult.updated}</strong></div>
                        <div className="text-center">Đã dọn dẹp/xóa: <strong className="block text-sm text-red-500">{syncResult.removed ?? 0}</strong></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-right">Đồng bộ lúc: {syncResult.lastSyncedAt}</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                      <div>
                        <p className="font-bold">Lỗi đồng bộ:</p>
                        <p className="mt-1 leading-relaxed">{syncResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auto Sync Schedule */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Tự động đồng bộ định kỳ</h4>
                      <p className="text-xs text-slate-500">Tự động đồng bộ từ Google Sheet theo chu kỳ định sẵn</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={e => {
                        setAutoSyncEnabled(e.target.checked);
                        localStorage.setItem("jpt_customer_auto_sync", String(e.target.checked));
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                {autoSyncEnabled && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <span>Tần suất:</span>
                    <select
                      value={autoSyncInterval}
                      onChange={e => {
                        const v = parseInt(e.target.value, 10);
                        setAutoSyncInterval(v);
                        localStorage.setItem("jpt_customer_auto_sync_interval", String(v));
                      }}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none"
                    >
                      <option value={5}>Mỗi 5 phút</option>
                      <option value={15}>Mỗi 15 phút</option>
                      <option value={30}>Mỗi 30 phút</option>
                      <option value={60}>Mỗi 60 phút</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Apps Script Webhook */}
              <div className="bg-slate-900 rounded-2xl p-4 text-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 size={16} className="text-green-400" />
                    <span className="text-xs font-bold text-slate-200">Google Apps Script Webhook (Thời gian thực)</span>
                  </div>
                  <button
                    onClick={copyAppsScript}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-green-400 rounded-lg text-xs font-semibold transition"
                  >
                    {copiedScript ? <Check size={13} /> : null}
                    {copiedScript ? "Đã copy!" : "Copy script"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tự động đẩy dữ liệu sang JPT Helpdesk ngay khi chỉnh sửa file Google Sheet (Extensions &gt; Apps Script).
                </p>
              </div>

            </div>
          )}

          {/* ====== TAB: CSV / EXCEL ====== */}
          {activeTab === "csv" && (
            <div className="space-y-4">
              {step === "upload" && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-green-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/50 hover:bg-green-50/20"
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload size={36} className="mx-auto text-slate-400 mb-3" />
                  <p className="text-sm font-bold text-slate-700">Nhấn để chọn file CSV</p>
                  <p className="text-xs text-slate-500 mt-1">Hỗ trợ các cột: Mã khách hàng, Tên khách hàng, Tên hiển thị, Địa chỉ, Mã số thuế...</p>
                </div>
              )}

              {step === "preview" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Đã đọc: <strong>{rows.length}</strong> dòng từ {fileName}</span>
                    <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-800">Chọn file khác</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Mã KH</th>
                          <th className="p-2">Tên KH</th>
                          <th className="p-2">Tên TA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.slice(0, 50).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400">{i + 1}</td>
                            <td className="p-2 font-mono font-bold text-slate-700">{r.code || "—"}</td>
                            <td className="p-2 font-medium text-slate-800">{r.name}</td>
                            <td className="p-2 text-slate-500">{r.ten_tieng_anh || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={reset} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">Hủy</button>
                    <button
                      onClick={handleImportCSV}
                      disabled={importing}
                      className="px-5 py-2 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {importing ? "Đang nhập..." : `Nhập ${rows.length} khách hàng`}
                    </button>
                  </div>
                </div>
              )}

              {step === "result" && syncResult && (
                <div className="p-5 bg-green-50 rounded-2xl border border-green-200 text-center space-y-3">
                  <CheckCircle2 size={36} className="mx-auto text-green-600" />
                  <h4 className="font-bold text-green-900">Nhập dữ liệu thành công!</h4>
                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl text-xs border border-green-200">
                    <div>Tổng: <strong>{syncResult.total}</strong></div>
                    <div>Tạo mới: <strong className="text-green-600">+{syncResult.created}</strong></div>
                    <div>Cập nhật: <strong className="text-blue-600">{syncResult.updated}</strong></div>
                  </div>
                  <button onClick={reset} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition">
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

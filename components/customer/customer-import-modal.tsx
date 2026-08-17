"use client";

import { useState, useRef, useEffect } from "react";
import {
  X, Upload, AlertCircle, CheckCircle2, Loader2, Download, RefreshCw,
  Link as LinkIcon, Clock, Copy, Check, FileSpreadsheet, ExternalLink,
  User, ChevronRight
} from "lucide-react";
import { upsertCustomerFromImport } from "@/lib/customer-operations";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RowStatus = "pending" | "importing" | "success" | "error";

interface ParsedRow {
  code: string;
  name: string;
  ten_tieng_anh: string;
  status: RowStatus;
  message?: string;
}

interface SyncProgress {
  total: number;
  processed: number;
  created: number;
  updated: number;
  errors: number;
  currentName: string;
  done: boolean;
}

const SAMPLE_CSV = `"Mã Khách Hàng","Tên Hiển Thị","Tên Tiếng Anh"
"BANK-ACB","Ngân hàng ACB","Asia Commercial Joint Stock Bank"
"CORP-FPT","Công ty FPT","FPT Corporation"
"GOV-VNPOST","Tổng Công ty Bưu điện Việt Nam","Vietnam Post Corporation"`;

export default function CustomerImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<"sheets" | "csv">("sheets");

  // Google Sheets state
  const [sheetUrl, setSheetUrl] = useState("");

  // Real Google User OAuth 2.0 Credentials
  const [userAccessToken, setUserAccessToken] = useState("");
  const [userRefreshToken, setUserRefreshToken] = useState("");
  const [userClientId, setUserClientId] = useState("");
  const [userClientSecret, setUserClientSecret] = useState("");
  const [showAuthConfig, setShowAuthConfig] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    total?: number;
    created?: number;
    updated?: number;
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
      setSheetUrl(localStorage.getItem("jpt_customer_sheet_url") || "");
      setUserAccessToken(localStorage.getItem("jpt_google_user_access_token") || "");
      setUserRefreshToken(localStorage.getItem("jpt_google_user_refresh_token") || "");
      setUserClientId(localStorage.getItem("jpt_google_user_client_id") || "");
      setUserClientSecret(localStorage.getItem("jpt_google_user_client_secret") || "");
      setAutoSyncEnabled(localStorage.getItem("jpt_customer_auto_sync") === "true");
      setAutoSyncInterval(parseInt(localStorage.getItem("jpt_customer_auto_sync_interval") || "15", 10));

      const hasToken = localStorage.getItem("jpt_google_user_access_token");
      if (hasToken) setShowAuthConfig(true);
    }
  }, []);

  const reset = () => {
    setRows([]);
    setImporting(false);
    setStep("upload");
    setFileName("");
    setSyncResult(null);
    setSyncProgress(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Sync Google Sheets — with streaming progress using Server-Sent Events simulation
  const handleSyncSheetsNow = async () => {
    if (!sheetUrl.trim()) {
      alert("Vui lòng nhập link Google Sheet.");
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    setSyncProgress(null);

    // Save settings
    localStorage.setItem("jpt_customer_sheet_url", sheetUrl.trim());
    localStorage.setItem("jpt_google_user_access_token", userAccessToken.trim());
    localStorage.setItem("jpt_google_user_refresh_token", userRefreshToken.trim());
    localStorage.setItem("jpt_google_user_client_id", userClientId.trim());
    localStorage.setItem("jpt_google_user_client_secret", userClientSecret.trim());
    localStorage.setItem("jpt_customer_auto_sync", String(autoSyncEnabled));
    localStorage.setItem("jpt_customer_auto_sync_interval", String(autoSyncInterval));

    try {
      const tokenInput = userAccessToken.trim();
      const payload = {
        sheetUrl: sheetUrl.trim(),
        userAccessToken: tokenInput,
        userRefreshToken: userRefreshToken.trim() || (tokenInput.startsWith("1//") ? tokenInput : ""),
        userClientId: userClientId.trim(),
        userClientSecret: userClientSecret.trim(),
      };

      // Step 1: Fetch the rows first
      setSyncProgress({ total: 0, processed: 0, created: 0, updated: 0, errors: 0, currentName: "Đang kết nối Google Sheets...", done: false });

      const res = await fetch("/api/customers/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, progressMode: true }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSyncResult({ success: false, message: data.error || "Lỗi đồng bộ dữ liệu từ Google Sheet." });
        setSyncProgress(null);
      } else if (data.rows && Array.isArray(data.rows)) {
        // Step 2: Process rows client-side with progress visualization
        const allRows = data.rows as Array<{ code: string; name: string; ten_tieng_anh?: string }>;
        let created = 0, updated = 0, errors = 0;

        setSyncProgress({ total: allRows.length, processed: 0, created: 0, updated: 0, errors: 0, currentName: "", done: false });

        for (let i = 0; i < allRows.length; i++) {
          const row = allRows[i];
          setSyncProgress(p => ({ ...p!, processed: i, currentName: row.name, done: false }));

          const result = await upsertCustomerFromImport(row);
          if (result.success) {
            if (result.action === "created") created++;
            else updated++;
          } else {
            errors++;
          }

          // Small delay to make progress visible
          await new Promise(r => setTimeout(r, 20));
        }

        setSyncProgress({ total: allRows.length, processed: allRows.length, created, updated, errors, currentName: "", done: true });

        setSyncResult({
          success: true,
          total: allRows.length,
          created,
          updated,
          errors,
          lastSyncedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
        });
        onSuccess();
      } else {
        // Old-style response (no rows array)
        setSyncProgress(null);
        setSyncResult({
          success: true,
          total: data.total,
          created: data.created,
          updated: data.updated,
          errors: data.errors,
          lastSyncedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
        });
        onSuccess();
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || "Lỗi kết nối máy chủ." });
      setSyncProgress(null);
    } finally {
      setSyncing(false);
    }
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

  // CSV Parsing
  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^"|"$/g, ""));
    const codeIdx = headers.findIndex(h => h.includes("mã") || h.includes("code"));
    const nameIdx = headers.findIndex(h => h.includes("tên hiển thị") || h.includes("tên kh") || h.includes("name"));
    const engIdx = headers.findIndex(h => h.includes("tiếng anh") || h.includes("tieng anh") || h.includes("english"));

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const code = codeIdx >= 0 ? values[codeIdx] : "";
      const name = nameIdx >= 0 ? values[nameIdx] : "";
      const ten_tieng_anh = engIdx >= 0 ? values[engIdx] : "";
      const row: ParsedRow = { code, name, ten_tieng_anh, status: "pending" };
      if (!name) { row.status = "error"; row.message = "Thiếu Tên Hiển Thị"; }
      return row;
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      setRows(parseCSV(ev.target?.result as string));
      setStep("preview");
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImportCSV = async () => {
    setImporting(true);
    const updated = [...rows];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === "error") continue;
      updated[i] = { ...updated[i], status: "importing" };
      setRows([...updated]);
      const result = await upsertCustomerFromImport(updated[i]);
      updated[i] = {
        ...updated[i],
        status: result.success ? "success" : "error",
        message: result.success ? (result.action === "created" ? "Đã tạo mới" : "Đã cập nhật") : result.error,
      };
      setRows([...updated]);
    }
    setImporting(false);
    setStep("result");
    onSuccess();
  };

  const downloadSample = () => {
    const blob = new Blob(["\uFEFF" + SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customers_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const progressPct = syncProgress && syncProgress.total > 0
    ? Math.round((syncProgress.processed / syncProgress.total) * 100)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FileSpreadsheet size={22} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import & Đồng bộ Khách hàng</h2>
              <p className="text-xs text-slate-500">Đồng bộ 1 chiều qua Google User OAuth 2.0 hoặc File CSV</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          {(["sheets", "csv"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === tab
                  ? tab === "sheets" ? "border-green-600 text-green-700 bg-white" : "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "sheets" ? (
                <><RefreshCw size={16} className={syncing ? "animate-spin text-green-600" : ""} /> Đồng bộ Google Sheet</>
              ) : (
                <><Upload size={16} /> Import File CSV thủ công</>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ====== TAB: GOOGLE SHEETS ====== */}
          {activeTab === "sheets" && (
            <div className="space-y-5">

              {/* Sheet URL */}
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
                      onChange={e => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1ABC.../edit?usp=sharing"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    onClick={handleSyncSheetsNow}
                    disabled={syncing || !sheetUrl.trim()}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
                  </button>
                </div>
              </div>

              {/* Google User OAuth Config */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <User size={18} className="text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Cấu hình Tài khoản Google User</h4>
                      <p className="text-xs text-slate-500">Truy cập file Google Sheet bằng OAuth 2.0 Access Token / Refresh Token</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAuthConfig(!showAuthConfig)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    {showAuthConfig ? "Ẩn cấu hình" : "Cấu hình"}
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
                          • Nhập OAuth 2.0 Access Token hoặc Refresh Token của tài khoản Google User thực. File Sheet không cần Share công khai.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">OAuth Client ID <span className="text-slate-400">(Tùy chọn)</span></label>
                          <input
                            type="text"
                            value={userClientId}
                            onChange={e => { setUserClientId(e.target.value); localStorage.setItem("jpt_google_user_client_id", e.target.value); }}
                            placeholder="xxx.apps.googleusercontent.com"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">OAuth Client Secret <span className="text-slate-400">(Tùy chọn)</span></label>
                          <input
                            type="password"
                            value={userClientSecret}
                            onChange={e => { setUserClientSecret(e.target.value); localStorage.setItem("jpt_google_user_client_secret", e.target.value); }}
                            placeholder="GOCSPX-..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                      <p className="font-bold flex items-center gap-1 text-blue-800">👤 Quyền truy cập bằng Google User thực:</p>
                      <p className="text-slate-700 mt-1">Ứng dụng dùng thông tin xác thực Google User của bạn để kết nối trực tiếp đến Google Sheets API v4. File Google Sheet được bảo vệ riêng tư 100%.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ====== SYNC PROGRESS BAR ====== */}
              {syncing && syncProgress && !syncProgress.done && (
                <div className="bg-white border border-green-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang đồng bộ dữ liệu khách hàng...</span>
                  </div>

                  {syncProgress.total > 0 && (
                    <>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-medium truncate max-w-xs">
                          <ChevronRight size={13} className="inline text-green-500" /> {syncProgress.currentName}
                        </span>
                        <span className="font-bold text-green-700 shrink-0 ml-2">
                          {syncProgress.processed} / {syncProgress.total} ({progressPct}%)
                        </span>
                      </div>

                      {/* Mini stats */}
                      <div className="flex gap-4 text-[11px]">
                        <span className="text-green-600">✓ Tạo mới: <strong>{syncProgress.created}</strong></span>
                        <span className="text-blue-600">↺ Cập nhật: <strong>{syncProgress.updated}</strong></span>
                        {syncProgress.errors > 0 && <span className="text-red-500">✗ Lỗi: <strong>{syncProgress.errors}</strong></span>}
                      </div>
                    </>
                  )}

                  {syncProgress.total === 0 && (
                    <p className="text-xs text-slate-500">Đang tải dữ liệu từ Google Sheets...</p>
                  )}
                </div>
              )}

              {/* Sync Result Banner */}
              {syncResult && (
                <div className={`p-4 rounded-xl border text-sm ${
                  syncResult.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {syncResult.success ? (
                    <div>
                      <div className="flex items-center gap-2 font-bold text-green-700">
                        <CheckCircle2 size={18} /> Đồng bộ thành công!
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 bg-white/70 p-3 rounded-lg text-xs">
                        <div>Tổng: <strong>{syncResult.total}</strong></div>
                        <div>Tạo mới: <strong className="text-green-600">+{syncResult.created}</strong></div>
                        <div>Cập nhật: <strong className="text-blue-600">{syncResult.updated}</strong></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Đồng bộ lúc: {syncResult.lastSyncedAt}</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                      <div>
                        <p className="font-bold">Lỗi đồng bộ:</p>
                        <p className="mt-1 leading-relaxed">{syncResult.message}</p>
                        {syncResult.message?.includes("console.developers.google.com") && (
                          <div className="mt-3 pt-2.5 border-t border-red-200/80">
                            <p className="text-xs font-semibold text-slate-800 mb-1.5">👉 Bật Google Sheets API cho dự án của bạn:</p>
                            <a
                              href="https://console.developers.google.com/apis/api/sheets.googleapis.com/overview"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition"
                            >
                              <ExternalLink size={14} /> Bật Google Sheets API
                            </a>
                          </div>
                        )}
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
                      <p className="text-xs text-slate-500">Ứng dụng tự động tải lại dữ liệu từ Google Sheet theo chu kỳ đã cấu hình</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={autoSyncEnabled}
                      onChange={e => { setAutoSyncEnabled(e.target.checked); localStorage.setItem("jpt_customer_auto_sync", String(e.target.checked)); }}
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
                      onChange={e => { const v = parseInt(e.target.value, 10); setAutoSyncInterval(v); localStorage.setItem("jpt_customer_auto_sync_interval", String(v)); }}
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

              {/* Apps Script */}
              <div className="bg-slate-900 rounded-2xl p-4 text-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚡ Tự động đẩy từ Google Sheet (Tức thì)</span>
                  <button onClick={copyAppsScript}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition">
                    {copiedScript ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copiedScript ? "Đã copy!" : "Copy Script"}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Mở Google Sheet → <strong>Tiện ích mở rộng</strong> → <strong>Apps Script</strong> → Dán mã này để đồng bộ tức thì mỗi khi chỉnh sửa Sheet:</p>
                <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-green-400 overflow-x-auto max-h-36">{appsScriptCode}</pre>
              </div>
            </div>
          )}

          {/* ====== TAB: CSV IMPORT ====== */}
          {activeTab === "csv" && (
            <div className="space-y-4">
              {step === "upload" && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Upload size={26} className="text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-700">Kéo thả hoặc bấm để tải file CSV</p>
                      <p className="text-xs text-slate-400 mt-1">Định dạng file .csv UTF-8</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Tải file CSV mẫu chuẩn</p>
                      <p className="text-xs text-slate-400 mt-0.5">3 cột: Mã Khách Hàng, Tên Hiển Thị, Tên Tiếng Anh</p>
                    </div>
                    <button onClick={downloadSample}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                      <Download size={15} /> Tải mẫu
                    </button>
                  </div>
                </div>
              )}

              {step === "preview" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>File: <strong>{fileName}</strong> ({rows.length} dòng)</span>
                    <button onClick={reset} className="text-blue-600 hover:underline">Chọn file khác</button>
                  </div>
                  <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0 border-b">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Mã KH</th>
                          <th className="p-2.5">Tên Hiển Thị</th>
                          <th className="p-2.5">Tên Tiếng Anh</th>
                          <th className="p-2.5">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((r, i) => (
                          <tr key={i} className={r.status === "error" ? "bg-red-50" : ""}>
                            <td className="p-2.5 text-slate-400">{i + 1}</td>
                            <td className="p-2.5 font-bold">{r.code || "—"}</td>
                            <td className="p-2.5">{r.name || "—"}</td>
                            <td className="p-2.5 text-slate-500">{r.ten_tieng_anh || "—"}</td>
                            <td className="p-2.5">
                              {r.status === "importing" ? <Loader2 size={12} className="animate-spin text-blue-500" /> :
                               r.status === "success" ? <span className="text-green-600 font-semibold">{r.message}</span> :
                               r.status === "error" ? <span className="text-red-500 font-semibold">{r.message}</span> :
                               <span className="text-green-600 font-semibold">✓ Hợp lệ</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {step === "result" && (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 size={18} /> Đã hoàn tất import!
                  </div>
                  <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0 border-b">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Mã KH</th>
                          <th className="p-2.5">Tên</th>
                          <th className="p-2.5">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2.5 text-slate-400">{i + 1}</td>
                            <td className="p-2.5 font-mono">{r.code}</td>
                            <td className="p-2.5">{r.name}</td>
                            <td className={`p-2.5 font-semibold ${r.status === "success" ? "text-green-600" : "text-red-500"}`}>{r.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
          <button onClick={handleClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition text-sm">
            Đóng
          </button>
          {activeTab === "csv" && step === "preview" && (
            <button onClick={handleImportCSV}
              disabled={importing || rows.every(r => r.status === "error")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition text-sm flex items-center gap-2 disabled:opacity-50">
              {importing && <Loader2 size={14} className="animate-spin" />}
              {importing ? "Đang import..." : `Import ${rows.filter(r => r.status !== "error").length} dòng`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

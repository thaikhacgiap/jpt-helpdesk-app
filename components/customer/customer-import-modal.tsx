"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, AlertCircle, CheckCircle2, Loader2, Download, RefreshCw, Link as LinkIcon, Clock, Copy, Check, FileSpreadsheet, ExternalLink } from "lucide-react";
import { upsertCustomerFromImport } from "@/lib/customer-operations";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RowStatus = "pending" | "importing" | "success" | "error" | "duplicate";

interface ParsedRow {
  code: string;
  name: string;
  ten_tieng_anh: string;
  status: RowStatus;
  message?: string;
}

const SAMPLE_CSV = `"Mã Khách Hàng","Tên Hiển Thị","Tên Tiếng Anh"
"BANK-ACB","Ngân hàng ACB","Asia Commercial Joint Stock Bank"
"CORP-FPT","Công ty FPT","FPT Corporation"
"GOV-VNPOST","Tổng Công ty Bưu điện Việt Nam","Vietnam Post Corporation"`;

export default function CustomerImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<"sheets" | "csv">("sheets");

  // Google Sheets state
  const [sheetUrl, setSheetUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
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
  const [autoSyncInterval, setAutoSyncInterval] = useState(15); // minutes
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
      const savedAutoSync = localStorage.getItem("jpt_customer_auto_sync") === "true";
      const savedInterval = parseInt(localStorage.getItem("jpt_customer_auto_sync_interval") || "15", 10);
      setSheetUrl(savedUrl);
      setAutoSyncEnabled(savedAutoSync);
      setAutoSyncInterval(savedInterval);
    }
  }, []);

  const reset = () => {
    setRows([]);
    setImporting(false);
    setStep("upload");
    setFileName("");
    setSyncResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ─────────────────────────────────────────────────────────────
  // 1. Google Sheets Sync Logic
  // ─────────────────────────────────────────────────────────────
  const handleSyncSheetsNow = async () => {
    if (!sheetUrl.trim()) {
      alert("Vui lòng nhập link Google Sheet.");
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    // Save URL and AutoSync preferences
    localStorage.setItem("jpt_customer_sheet_url", sheetUrl.trim());
    localStorage.setItem("jpt_customer_auto_sync", String(autoSyncEnabled));
    localStorage.setItem("jpt_customer_auto_sync_interval", String(autoSyncInterval));

    try {
      const res = await fetch("/api/customers/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSyncResult({
          success: false,
          message: data.error || "Lỗi đồng bộ dữ liệu từ Google Sheet.",
        });
      } else {
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
      setSyncResult({
        success: false,
        message: err.message || "Lỗi kết nối máy chủ.",
      });
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
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ data: rows })
  };
  
  UrlFetchApp.fetch(WEBHOOK_URL, options);
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // ─────────────────────────────────────────────────────────────
  // 2. CSV Parsing & Import Logic
  // ─────────────────────────────────────────────────────────────
  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^"|"$/g, ""));
    const codeIdx = headers.findIndex(h => h.includes("mã") || h.includes("code"));
    const nameIdx = headers.findIndex(h => h.includes("tên hiển thị") || h.includes("ten hien thi") || h.includes("tên kh") || h.includes("name"));
    const engIdx = headers.findIndex(h => h.includes("tiếng anh") || h.includes("tieng anh") || h.includes("english"));

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const code = codeIdx >= 0 ? values[codeIdx] : "";
      const name = nameIdx >= 0 ? values[nameIdx] : "";
      const ten_tieng_anh = engIdx >= 0 ? values[engIdx] : "";

      const row: ParsedRow = {
        code,
        name,
        ten_tieng_anh,
        status: "pending",
      };

      if (!code) { row.status = "error"; row.message = "Thiếu Mã Khách Hàng"; }
      else if (!name) { row.status = "error"; row.message = "Thiếu Tên Hiển Thị"; }

      return row;
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setStep("preview");
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImportCSV = async () => {
    setImporting(true);
    const updated = [...rows];
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (row.status === "error") continue;
      updated[i] = { ...row, status: "importing" };
      setRows([...updated]);

      const result = await upsertCustomerFromImport(row);
      updated[i] = {
        ...row,
        status: result.success ? "success" : "error",
        message: result.success ? (result.action === "created" ? "Tạo mới KH-001" : "Đã cập nhật") : result.error,
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
              <p className="text-xs text-slate-500">Tự động đồng bộ từ Google Sheet hoặc file CSV</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("sheets")}
            className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
              activeTab === "sheets"
                ? "border-green-600 text-green-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <RefreshCw size={16} className={syncing ? "animate-spin text-green-600" : ""} />
            Đồng bộ Google Sheet (Tự động 1 chiều)
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`py-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
              activeTab === "csv"
                ? "border-blue-600 text-blue-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Upload size={16} />
            Import File CSV thủ công
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* TAB 1: GOOGLE SHEETS SYNC */}
          {activeTab === "sheets" && (
            <div className="space-y-5">
              {/* Sheet Link Input Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Đường link Google Sheet (Link Chia Sẻ)
                  </label>
                  {sheetUrl.trim() && (
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                    >
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

                {/* Guide Box for Sharing Permission */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5 mt-2">
                  <p className="font-bold flex items-center gap-1.5 text-blue-800">
                    🔒 Cấu hình phân quyền trên Google Sheet để ứng dụng truy cập:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pl-1">
                    <li>Mở file Google Sheet của bạn $\rightarrow$ Bấm nút <strong>Chia sẻ (Share)</strong> ở góc trên cùng bên phải.</li>
                    <li>Mục <em>Quyền truy cập chung (General access)</em>: Đổi từ <u>Hạn chế</u> sang <strong>Bất kỳ ai có đường liên kết (Anyone with the link)</strong>.</li>
                    <li>Đặt quyền là <strong>Người xem (Viewer)</strong> $\rightarrow$ Bấm <strong>Sao chép đường liên kết (Copy link)</strong> và dán vào ô trên.</li>
                  </ol>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-blue-200/60 mt-1">
                    • Bảng bắt buộc gồm 3 tên cột: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-slate-800">Mã Khách Hàng</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-slate-800">Tên Hiển Thị</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-slate-800">Tên Tiếng Anh</code>.
                  </p>
                </div>
              </div>

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
                        <div>Tổng số dòng: <strong>{syncResult.total}</strong></div>
                        <div>Tạo mới KH-00x: <strong className="text-green-600">+{syncResult.created}</strong></div>
                        <div>Cập nhật: <strong className="text-blue-600">{syncResult.updated}</strong></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Đồng bộ gần nhất: {syncResult.lastSyncedAt}</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                      <div>
                        <p className="font-bold">Lỗi đồng bộ:</p>
                        <p className="mt-1">{syncResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auto Sync Schedule Config */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Tự động đồng bộ định kỳ trong App</h4>
                      <p className="text-xs text-slate-500">Ứng dụng sẽ tự động tải lại dữ liệu từ Google Sheet theo chu kỳ</p>
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                {autoSyncEnabled && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <span>Tần suất đồng bộ:</span>
                    <select
                      value={autoSyncInterval}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setAutoSyncInterval(val);
                        localStorage.setItem("jpt_customer_auto_sync_interval", String(val));
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

              {/* Apps Script Webhook Snippet */}
              <div className="bg-slate-900 rounded-2xl p-4 text-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    ⚡ Tự động đẩy dữ liệu từ Google Sheets (Tức thì)
                  </span>
                  <button
                    onClick={copyAppsScript}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
                  >
                    {copiedScript ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copiedScript ? "Đã copy!" : "Copy Mã Script"}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Mở Google Sheet $\rightarrow$ <strong>Tiện ích mở rộng (Extensions)</strong> $\rightarrow$ <strong>Apps Script</strong> $\rightarrow$ Dán mã dưới đây để đồng bộ ngay mỗi khi chỉnh sửa Sheet:
                </p>
                <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-green-400 overflow-x-auto max-h-36">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL CSV IMPORT */}
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
                      <p className="text-xs text-slate-400 mt-0.5">Gồm 3 cột: Mã Khách Hàng, Tên Hiển Thị, Tên Tiếng Anh</p>
                    </div>
                    <button
                      onClick={downloadSample}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
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
                          <th className="p-2.5">Mã Khách Hàng</th>
                          <th className="p-2.5">Tên Hiển Thị</th>
                          <th className="p-2.5">Tên Tiếng Anh</th>
                          <th className="p-2.5">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((r, i) => (
                          <tr key={i} className={r.status === "error" ? "bg-red-50" : ""}>
                            <td className="p-2.5 text-slate-400">{i + 1}</td>
                            <td className="p-2.5 font-bold text-slate-800">{r.code || "—"}</td>
                            <td className="p-2.5">{r.name || "—"}</td>
                            <td className="p-2.5 text-slate-500">{r.ten_tieng_anh || "—"}</td>
                            <td className="p-2.5">
                              {r.status === "error" ? (
                                <span className="text-red-500 font-semibold">{r.message}</span>
                              ) : (
                                <span className="text-green-600 font-semibold">✓ Hợp lệ</span>
                              )}
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
                    <CheckCircle2 size={18} /> Đã hoàn tất import dữ liệu!
                  </div>
                  <div className="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 sticky top-0 border-b">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Mã KH</th>
                          <th className="p-2.5">Tên Hiển Thị</th>
                          <th className="p-2.5">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td className="p-2.5 text-slate-400">{i + 1}</td>
                            <td className="p-2.5 font-mono">{r.code}</td>
                            <td className="p-2.5">{r.name}</td>
                            <td className="p-2.5 font-semibold text-green-600">{r.message || "Đã lưu"}</td>
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
          <button
            onClick={handleClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition text-sm"
          >
            Đóng
          </button>
          {activeTab === "csv" && step === "preview" && (
            <button
              onClick={handleImportCSV}
              disabled={importing || rows.every(r => r.status === "error")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {importing && <Loader2 size={14} className="animate-spin" />}
              {importing ? "Đang import..." : `Import ${rows.filter(r => r.status !== "error").length} dòng`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

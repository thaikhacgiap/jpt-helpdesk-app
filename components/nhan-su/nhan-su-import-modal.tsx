"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  Download,
  FileText,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { upsertNhanSuFromImport } from "@/lib/nhan-su-operations";

interface NhanSuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Client-side CSV/TSV parser supporting quotes and delimiters (, ; \t)
function parseDelimitedText(text: string): { headers: string[]; rows: any[] } {
  if (!text || !text.trim()) return { headers: [], rows: [] };

  const firstLine = text.split(/\r?\n/)[0] || "";
  let delimiter = ",";
  if (firstLine.includes("\t")) delimiter = "\t";
  else if (firstLine.includes(";") && !firstLine.includes(",")) delimiter = ";";

  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let cur = "";

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      row.push(cur.trim());
      cur = "";
    } else if ((ch === "\r" || ch === "\n") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
        lines.push(row);
      }
      row = [];
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur || row.length > 0) {
    row.push(cur.trim());
    lines.push(row);
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].map((h) => h.trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const r = lines[i];
    if (r.every((cell) => !cell || cell.trim() === "")) continue;
    const obj: any = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? r[idx].trim() : "";
    });
    rows.push(obj);
  }

  return { headers, rows };
}

export default function NhanSuImportModal({
  isOpen,
  onClose,
  onSuccess,
}: NhanSuImportModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");

  // File Import state
  const [fileRows, setFileRows] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileSheets, setFileSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Paste Text state
  const [pasteText, setPasteText] = useState("");

  // Process state
  const [step, setStep] = useState<"input" | "preview" | "result">("input");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{ created: number; updated: number; errors: number; total: number } | null>(null);

  const reset = () => {
    setFileRows([]);
    setFileHeaders([]);
    setFileSheets([]);
    setSelectedSheet("");
    setRawFile(null);
    setParsingFile(false);
    setFileName("");
    setPasteText("");
    setStep("input");
    setImporting(false);
    setProgress(0);
    setStats(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Upload file handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawFile(file);
    setFileName(file.name);
    await parseFileOnServer(file);
  };

  const parseFileOnServer = async (file: File, sheet?: string) => {
    setParsingFile(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (sheet) fd.append("sheetName", sheet);

      const res = await fetch("/api/system/parse-file", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Không thể đọc file. Vui lòng kiểm tra lại định dạng.");
        return;
      }

      if (!data.rows || data.rows.length === 0) {
        alert("File không có dữ liệu hoặc không nhận diện được các cột dữ liệu.");
        return;
      }

      setFileRows(data.rows);
      setFileHeaders(data.headers || []);
      setFileSheets(data.sheets || []);
      setSelectedSheet(data.activeSheet || "");
      setStep("preview");
    } catch (err: any) {
      alert("Lỗi khi tải file: " + (err.message || String(err)));
    } finally {
      setParsingFile(false);
    }
  };

  const handleSheetChange = async (newSheet: string) => {
    if (!rawFile || newSheet === selectedSheet) return;
    setSelectedSheet(newSheet);
    await parseFileOnServer(rawFile, newSheet);
  };

  // Handle parse pasted text
  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      alert("Vui lòng dán nội dung bảng hoặc CSV vào ô nhập liệu.");
      return;
    }
    const { headers, rows } = parseDelimitedText(pasteText);
    if (rows.length === 0) {
      alert("Không tìm thấy dòng dữ liệu nào hợp lệ.");
      return;
    }
    setFileHeaders(headers);
    setFileRows(rows);
    setFileName("Dữ liệu dán trực tiếp");
    setStep("preview");
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    const headers = [
      "Mã Nhân Sự",
      "Họ và Tên",
      "Bộ Phận",
      "Chức Vụ",
      "Phụ Trách",
      "Ngày Sinh",
      "Số CCCD",
      "Cấp Ngày",
      "Email",
      "Số Điện Thoại",
      "Địa Chỉ",
    ];
    const sampleRows = [
      ["NS-001", "Nguyễn Văn A", "Phòng Kỹ thuật", "Trưởng phòng", "Mạng & Bảo mật", "1988-05-12", "001088012345", "2021-08-15", "van.a@jpt.vn", "0901112221", "Cầu Giấy, Hà Nội"],
      ["NS-002", "Trần Thị B", "Phòng Hành chính", "Chuyên viên", "Hồ sơ & Nhân sự", "1992-09-20", "001092054321", "2020-04-10", "thi.b@jpt.vn", "0901112222", "Đống Đa, Hà Nội"],
      ["NS-003", "Lê Văn C", "Phòng Kỹ thuật", "Kỹ sư", "Hệ thống Linux", "1994-03-15", "001094012456", "2019-12-05", "van.c@jpt.vn", "0901112223", "Thanh Xuân, Hà Nội"],
    ];

    const escape = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
    const csvContent =
      "\uFEFF" +
      [
        headers.map(escape).join(","),
        ...sampleRows.map((r) => r.map(escape).join(",")),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_danh_sach_nhan_su.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getField = (row: any, ...keys: string[]): string => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
        return String(row[k]).trim();
      }
    }
    const rowKeys = Object.keys(row);
    for (const k of keys) {
      const target = k.toLowerCase().replace(/[\s_\-]/g, "");
      const found = rowKeys.find((rk) => rk.toLowerCase().replace(/[\s_\-]/g, "") === target);
      if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== "") {
        return String(row[found]).trim();
      }
    }
    return "";
  };

  // Perform Import Execution
  const handleExecuteImport = async () => {
    if (fileRows.length === 0) return;
    setImporting(true);
    setProgress(0);
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < fileRows.length; i++) {
      const r = fileRows[i];
      const name = getField(
        r,
        "Tên Nhân Sự", "Tên nhân sự", "Họ và Tên", "Họ và tên", "Họ tên", "Họ Tên",
        "Tên", "Nhân sự", "Tên nhân viên", "Tên cán bộ", "ten_nhan_su", "name",
        "FullName", "Full Name", "Staff Name", "Employee Name"
      );
      let code = getField(
        r,
        "Mã Nhân Sự", "Mã nhân sự", "Mã NV", "Mã nv", "Mã", "manv", "ma_nhan_su", "code", "Code"
      );

      if (!code && name) {
        code = `NS-${String(i + 1).padStart(3, "0")}`;
      }

      if (!name && !code) continue;

      const res = await upsertNhanSuFromImport({
        ma_nhan_su: code,
        ten_nhan_su: name || code,
        bo_phan: getField(r, "Bộ Phận", "Bộ phận", "Phòng ban", "bo_phan", "department", "Department", "Khối"),
        chuc_vu: getField(r, "Chức Vụ", "Chức vụ", "Chức danh", "chuc_vu", "position", "Position"),
        phu_trach: getField(r, "Phụ Trách", "Phụ trách", "Quản lý", "phu_trach", "manager", "Trung tâm"),
        ngay_sinh: getField(r, "Ngày Sinh", "Ngày sinh", "ngay_sinh", "dob", "birthday", "Birthday"),
        so_cccd: getField(r, "Số CCCD", "Số cccd", "CCCD", "CMND", "Số CMND", "so_cccd"),
        cap_ngay: getField(r, "Cấp Ngày", "Cấp ngày", "Ngày cấp", "cap_ngay"),
        email: getField(r, "Email", "email", "Mail", "hòm thư"),
        so_dien_thoai: getField(r, "Số Điện Thoại", "Số điện thoại", "Điện thoại", "SĐT", "sđt", "so_dien_thoai", "phone", "Phone", "mobile"),
        dia_chi: getField(r, "Địa Chỉ", "Địa chỉ", "dia_chi", "address", "Address"),
      });

      if (res.success) {
        if (res.action === "created") createdCount++;
        else updatedCount++;
      } else {
        errorCount++;
      }

      setProgress(Math.round(((i + 1) / fileRows.length) * 100));
    }

    setImporting(false);
    setStats({
      total: fileRows.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
    });
    setStep("result");
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-sm">
              <UserCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Nhập Danh Sách Nhân Sự</h3>
              <p className="text-xs text-slate-500">Hỗ trợ file Excel (.xlsx, .xls), CSV hoặc Dán trực tiếp</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher (Only shown when on input step) */}
        {step === "input" && (
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 gap-2 pt-2">
            {[
              { id: "file", label: "Tải file Excel / CSV", icon: Upload },
              { id: "paste", label: "Dán dữ liệu trực tiếp", icon: ClipboardList },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 ${
                    isActive
                      ? "border-emerald-600 text-emerald-700 bg-white shadow-xs"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: INPUT */}
          {step === "input" && activeTab === "file" && (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                  {parsingFile ? <Loader2 size={26} className="animate-spin" /> : <Upload size={26} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {parsingFile ? "Đang đọc nội dung file..." : "Nhấp để chọn file hoặc kéo thả vào đây"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Định dạng hỗ trợ: .xlsx, .xls, .csv, .tsv (Tối đa 10MB)</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <FileText size={16} className="text-emerald-600" />
                  <span>Chưa có file mẫu chuẩn?</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-400 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
                >
                  <Download size={13} />
                  Tải file mẫu CSV
                </button>
              </div>
            </div>
          )}

          {step === "input" && activeTab === "paste" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dán nội dung bảng Excel hoặc CSV vào đây:
                </label>
                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Mã Nhân Sự,Họ và Tên,Bộ Phận,Chức Vụ,Phụ Trách,Ngày Sinh,Số CCCD,Cấp Ngày,Email,Số Điện Thoại,Địa Chỉ\nNS-001,Nguyễn Văn A,Phòng Kỹ thuật,Trưởng phòng,Mạng & Bảo mật,12/05/1988,001088012345,15/08/2021,van.a@jpt.vn,0901112221,Hà Nội\nNS-002,Trần Thị B,Phòng Hành chính,Chuyên viên,Hồ sơ,20/09/1992,001092054321,10/04/2020,thi.b@jpt.vn,0901112222,Hà Nội`}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline font-medium"
                >
                  <Download size={13} />
                  Tải file mẫu CSV
                </button>
                <button
                  type="button"
                  onClick={handleParsePaste}
                  disabled={!pasteText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Xem trước dữ liệu
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    {fileName || "Dữ liệu đã nạp"}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Đã nhận diện: <strong className="font-semibold">{fileRows.length}</strong> dòng dữ liệu nhân sự
                  </p>
                </div>

                {fileSheets.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-600 font-medium">Sheet:</span>
                    <select
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                      className="text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none"
                    >
                      {fileSheets.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Data table preview (first 5 rows) */}
              <div>
                <p className="text-xs font-bold text-slate-600 mb-2">
                  Xem trước dữ liệu ({Math.min(fileRows.length, 5)} / {fileRows.length} dòng):
                </p>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="max-h-56 overflow-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold">
                        <tr>
                          <th className="p-2 border-b border-slate-200">#</th>
                          <th className="p-2 border-b border-slate-200">Mã NV</th>
                          <th className="p-2 border-b border-slate-200">Họ và Tên</th>
                          <th className="p-2 border-b border-slate-200">Bộ Phận</th>
                          <th className="p-2 border-b border-slate-200">Chức Vụ</th>
                          <th className="p-2 border-b border-slate-200">Điện Thoại</th>
                          <th className="p-2 border-b border-slate-200">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fileRows.slice(0, 5).map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-2 font-mono font-medium text-slate-700">
                              {getField(r, "Mã Nhân Sự", "Mã NV", "Mã", "ma_nhan_su") || `NS-${String(idx + 1).padStart(3, "0")}`}
                            </td>
                            <td className="p-2 font-semibold text-slate-900">
                              {getField(r, "Họ và Tên", "Họ tên", "Tên", "ten_nhan_su") || "—"}
                            </td>
                            <td className="p-2 text-slate-600">
                              {getField(r, "Bộ Phận", "Phòng ban", "bo_phan", "Khối") || "—"}
                            </td>
                            <td className="p-2 text-slate-600">
                              {getField(r, "Chức Vụ", "chuc_vu") || "—"}
                            </td>
                            <td className="p-2 font-mono text-slate-600">
                              {getField(r, "Số Điện Thoại", "Điện thoại", "SĐT", "so_dien_thoai") || "—"}
                            </td>
                            <td className="p-2 text-slate-500 font-mono">
                              {getField(r, "Email", "email") || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {importing && (
                <div className="space-y-2 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <div className="flex justify-between text-xs font-semibold text-emerald-800">
                    <span>Đang nạp dữ liệu vào hệ thống...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === "result" && stats && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">Nhập Dữ Liệu Thành Công!</h4>
                <p className="text-xs text-slate-500 mt-1">Dữ liệu nhân sự đã được cập nhật trực tiếp vào cơ sở dữ liệu.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-[11px] text-slate-500">Tổng dòng</p>
                  <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.total}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <p className="text-[11px] text-emerald-700">Tạo mới</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">+{stats.created}</p>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl">
                  <p className="text-[11px] text-teal-700">Cập nhật</p>
                  <p className="text-lg font-bold text-teal-700 mt-0.5">{stats.updated}</p>
                </div>
              </div>

              {stats.errors > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-center gap-2">
                  <AlertCircle size={15} />
                  <span>Có {stats.errors} dòng dữ liệu không hợp lệ đã bị bỏ qua.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          {step === "input" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <div />
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => setStep("input")}
                disabled={importing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 disabled:opacity-50 transition"
              >
                ← Chọn file khác
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importing}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Đang nhập {progress}%...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Bắt đầu nhập dữ liệu ({fileRows.length} dòng)
                  </>
                )}
              </button>
            </>
          )}

          {step === "result" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { X, Upload, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
import { createCustomer, checkCustomerCodeExists } from "@/lib/customer-operations";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RowStatus = "pending" | "importing" | "success" | "error" | "duplicate";

interface ParsedRow {
  code: string;
  name: string;
  type: string;
  tinh_trang: string;
  khu_vuc: string;
  address: string;
  phu_trach: string;
  ttkd: string;
  ghi_chu: string;
  email: string;
  phone: string;
  status: RowStatus;
  message?: string;
}

const HEADERS = ["code","name","type","tinh_trang","khu_vuc","address","phu_trach","ttkd","ghi_chu","email","phone"];
const HEADER_LABELS: Record<string,string> = {
  code: "Mã KH", name: "Tên KH", type: "Loại DN", tinh_trang: "Tình trạng",
  khu_vuc: "Khu vực", address: "Địa chỉ", phu_trach: "Người phụ trách",
  ttkd: "TTKD", ghi_chu: "Ghi chú", email: "Email", phone: "Điện thoại",
};

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g,""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g,""));
    const row: any = { status: "pending" };
    HEADERS.forEach(h => {
      const idx = headers.indexOf(h);
      row[h] = idx >= 0 ? (values[idx] || "") : "";
    });
    if (!row.code) row.status = "error", row.message = "Thiếu mã KH";
    if (!row.name) row.status = "error", row.message = (row.message ? row.message + ", " : "") + "Thiếu tên KH";
    return row as ParsedRow;
  });
}

const SAMPLE_CSV = `code,name,type,tinh_trang,khu_vuc,address,phu_trach,ttkd,ghi_chu,email,phone
BANK-ACB,Ngân hàng ACB,BANK,Active,Bắc,Hà Nội,Nguyễn Văn A,TTKD1,,contact@acb.com,0901234567
CORP-FPT,Công ty FPT,CORP,Active,Nam,TP. Hồ Chí Minh,Trần Thị B,TTKD2,,info@fpt.com,0912345678`;

export default function CustomerImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState<"upload"|"preview"|"result">("upload");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]); setImporting(false); setDone(false);
    setStep("upload"); setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };
  const handleClose = () => { reset(); onClose(); };

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

  const handleImport = async () => {
    setImporting(true);
    const updated = [...rows];
    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (row.status === "error") continue;
      updated[i] = { ...row, status: "importing" };
      setRows([...updated]);

      // Check duplicate
      const exists = await checkCustomerCodeExists(row.code);
      if (exists) {
        updated[i] = { ...row, status: "duplicate", message: "Mã đã tồn tại, bỏ qua." };
        setRows([...updated]);
        continue;
      }

      const result = await createCustomer(row);
      updated[i] = {
        ...row,
        status: result.success ? "success" : "error",
        message: result.success ? undefined : result.error,
      };
      setRows([...updated]);
    }
    setImporting(false);
    setDone(true);
    setStep("result");
    onSuccess();
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = "customers_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total: rows.length,
    ok: rows.filter(r => r.status === "success").length,
    dup: rows.filter(r => r.status === "duplicate").length,
    err: rows.filter(r => r.status === "error").length,
    valid: rows.filter(r => r.status === "pending").length,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Upload size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import khách hàng</h2>
              <p className="text-xs text-slate-500">Nhập danh sách từ file CSV</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {["upload","preview","result"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? "bg-blue-600 text-white" :
                (["upload","preview","result"].indexOf(step) > i) ? "bg-green-500 text-white" :
                "bg-slate-100 text-slate-400"
              }`}>{i+1}</div>
              <span className={`text-xs font-medium ${step === s ? "text-slate-800" : "text-slate-400"}`}>
                {["Chọn file","Xem trước","Kết quả"][i]}
              </span>
              {i < 2 && <div className="w-8 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Upload size={26} className="text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-700">Kéo thả hoặc nhấn để chọn file</p>
                  <p className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng .csv (UTF-8)</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              </div>

              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Tải file mẫu CSV</p>
                  <p className="text-xs text-slate-400 mt-0.5">Gồm đầy đủ cột theo đúng định dạng</p>
                </div>
                <button
                  onClick={downloadSample}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <Download size={15} /> Tải mẫu
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 space-y-1">
                <p className="font-semibold">Lưu ý định dạng CSV:</p>
                <p>• Hàng đầu tiên là tên cột: <code className="bg-amber-100 px-1 rounded">code, name, type, tinh_trang, khu_vuc, ...</code></p>
                <p>• Cột <strong>code</strong> và <strong>name</strong> là bắt buộc.</p>
                <p>• Mã trùng sẽ bị bỏ qua, không ghi đè.</p>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">
                  File: <span className="font-mono text-slate-500">{fileName}</span> —{" "}
                  <span className="text-blue-600">{rows.length} dòng</span>
                  {counts.err > 0 && <span className="text-red-500 ml-2">({counts.err} lỗi)</span>}
                </p>
                <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 underline">Đổi file</button>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        {HEADERS.slice(0,6).map(h => (
                          <th key={h} className="px-3 py-2 text-left whitespace-nowrap text-slate-500">{HEADER_LABELS[h]}</th>
                        ))}
                        <th className="px-3 py-2 text-left text-slate-500">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className={`border-b border-slate-100 ${row.status==="error" ? "bg-red-50" : ""}`}>
                          <td className="px-3 py-2 text-slate-400">{i+1}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-slate-700">{row.code || "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{row.name || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{row.type || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{row.tinh_trang || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{row.khu_vuc || "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{row.address || "—"}</td>
                          <td className="px-3 py-2">
                            {row.status === "error"
                              ? <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/>{row.message}</span>
                              : <span className="text-green-600">✓ Hợp lệ</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === "result" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{counts.ok}</p>
                  <p className="text-xs text-green-700 mt-1">Thêm thành công</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">{counts.dup}</p>
                  <p className="text-xs text-amber-700 mt-1">Mã trùng, bỏ qua</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-500">{counts.err}</p>
                  <p className="text-xs text-red-600 mt-1">Lỗi</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Mã KH</th>
                        <th className="px-3 py-2 text-left">Tên KH</th>
                        <th className="px-3 py-2 text-left">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="px-3 py-2 text-slate-400">{i+1}</td>
                          <td className="px-3 py-2 font-mono">{row.code}</td>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">
                            {row.status === "success" && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/>Thành công</span>}
                            {row.status === "duplicate" && <span className="text-amber-600 flex items-center gap-1"><AlertCircle size={12}/>Trùng mã</span>}
                            {row.status === "error" && <span className="text-red-500 flex items-center gap-1"><AlertCircle size={12}/>{row.message}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <button onClick={handleClose} className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition text-sm">
            {step === "result" ? "Đóng" : "Hủy"}
          </button>
          <div className="flex gap-3">
            {step === "preview" && (
              <button
                onClick={handleImport}
                disabled={importing || counts.valid === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {importing && <Loader2 size={14} className="animate-spin" />}
                {importing ? "Đang import..." : `Import ${counts.valid} dòng hợp lệ`}
              </button>
            )}
            {step === "result" && counts.ok > 0 && (
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition text-sm flex items-center gap-2"
              >
                <CheckCircle2 size={14}/> Hoàn tất
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, FileText, ChevronDown } from "lucide-react";
import { createContract, updateContract, type Contract } from "@/lib/contract-operations";
import { fetchCustomers } from "@/lib/customer-operations";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Nếu có initialData → chế độ Edit, ngược lại → chế độ Tạo mới */
  initialData?: Contract | null;
}

const CONTRACT_TYPES = [
  "Hợp đồng dịch vụ",
  "Hợp đồng bảo trì",
  "Hợp đồng mua bán",
  "Hợp đồng thuê dịch vụ",
  "Hợp đồng tư vấn",
  "Hợp đồng phát triển phần mềm",
];

const STATUS_OPTIONS = [
  { value: "Active",   label: "Đang hiệu lực" },
  { value: "Inactive", label: "Tạm ngưng" },
  { value: "Expired",  label: "Hết hiệu lực" },
];

const EMPTY_FORM = {
  contractNo:   "",
  name:         "",
  contractType: "Hợp đồng dịch vụ",
  customerCode: "",
  ownerName:    "",
  startDate:    "",
  endDate:      "",
  signedDate:   "",
  status:       "Active",
  description:  "",
};

export default function ContractModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ContractModalProps) {
  const isEdit = !!initialData;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [customers, setCustomers] = useState<{ code: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Khi mở modal → load customers và prefill form nếu edit
  useEffect(() => {
    if (!isOpen) return;

    fetchCustomers().then((data) =>
      setCustomers(data.map((c) => ({ code: c.code, name: c.name })))
    );

    if (initialData) {
      setFormData({
        contractNo:   initialData.contract_no   ?? "",
        name:         initialData.name          ?? "",
        contractType: initialData.contract_type ?? "Hợp đồng dịch vụ",
        customerCode: initialData.customer_code ?? "",
        ownerName:    initialData.owner_name    ?? "",
        startDate:    initialData.start_date    ?? "",
        endDate:      initialData.end_date      ?? "",
        signedDate:   initialData.signed_date   ?? "",
        status:       initialData.status        ?? "Active",
        description:  initialData.description   ?? "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setError("");
    setSuccess("");
  }, [isOpen, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(isEdit && initialData ? {
      contractNo:   initialData.contract_no   ?? "",
      name:         initialData.name          ?? "",
      contractType: initialData.contract_type ?? "Hợp đồng dịch vụ",
      customerCode: initialData.customer_code ?? "",
      ownerName:    initialData.owner_name    ?? "",
      startDate:    initialData.start_date    ?? "",
      endDate:      initialData.end_date      ?? "",
      signedDate:   initialData.signed_date   ?? "",
      status:       initialData.status        ?? "Active",
      description:  initialData.description   ?? "",
    } : EMPTY_FORM);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên hợp đồng.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      let result: { success: boolean; error?: string; contractId?: string };

      if (isEdit && initialData) {
        // ── UPDATE ──
        result = await updateContract(initialData.code, {
          contractNo:   formData.contractNo,
          name:         formData.name,
          contractType: formData.contractType,
          customerCode: formData.customerCode,
          ownerName:    formData.ownerName,
          startDate:    formData.startDate   || null,
          endDate:      formData.endDate     || null,
          signedDate:   formData.signedDate  || null,
          status:       formData.status,
          description:  formData.description,
        });
        if (result.success) {
          setSuccess(`Đã cập nhật hợp đồng ${initialData.code} thành công!`);
        }
      } else {
        // ── CREATE ──
        result = await createContract({
          contractNo:   formData.contractNo,
          name:         formData.name,
          contractType: formData.contractType,
          customerCode: formData.customerCode,
          ownerName:    formData.ownerName,
          startDate:    formData.startDate   || null,
          endDate:      formData.endDate     || null,
          signedDate:   formData.signedDate  || null,
          status:       formData.status,
          description:  formData.description,
        });
        if (result.success) {
          setSuccess(`Đã tạo hợp đồng mới (${result.contractId}) thành công!`);
        }
      }

      if (result.success) {
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      } else {
        setError(result.error || "Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-hidden flex flex-col">

        {/* ── Header ─────────────────────────────────────── */}
        <div className={`flex items-center justify-between px-7 py-5 rounded-t-2xl ${
          isEdit
            ? "bg-gradient-to-r from-amber-500 to-orange-500"
            : "bg-gradient-to-r from-blue-600 to-blue-700"
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? `Chỉnh Sửa Hợp Đồng` : "Tạo Hợp Đồng Mới"}
              </h2>
              <p className="text-white/80 text-xs">
                {isEdit ? `Mã: ${initialData?.code} · ${initialData?.contract_no ?? ""}` : "Điền đầy đủ thông tin hợp đồng"}
              </p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); }}
            className="p-2 hover:bg-white/20 rounded-xl transition text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Form Body ───────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <span className="text-red-500 text-base">⚠</span> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              <span className="text-green-500 text-base">✓</span> {success}
            </div>
          )}

          {/* Số HĐ + Loại HĐ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Số Hợp Đồng
              </label>
              <input
                type="text" name="contractNo" value={formData.contractNo}
                onChange={handleChange} placeholder="VD: ACB-02-20045"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Loại Hợp Đồng <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="contractType" value={formData.contractType} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition appearance-none cursor-pointer"
                >
                  {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Tên HĐ */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Tên Hợp Đồng <span className="text-red-500">*</span>
            </label>
            <input
              type="text" name="name" value={formData.name}
              onChange={handleChange} placeholder="VD: Hợp đồng dịch vụ CNTT 2024"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition"
            />
          </div>

          {/* Khách hàng + Phụ trách + Tình trạng */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Tên Khách Hàng
              </label>
              <div className="relative">
                <select
                  name="customerCode" value={formData.customerCode} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition appearance-none cursor-pointer"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Phụ Trách HĐ
              </label>
              <input
                type="text" name="ownerName" value={formData.ownerName}
                onChange={handleChange} placeholder="VD: Quang"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Tình Trạng
              </label>
              <div className="relative">
                <select
                  name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition appearance-none cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Ngày bắt đầu + Ngày kết thúc + Ngày ký */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Ngày Bắt Đầu HĐ
              </label>
              <input
                type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Ngày Kết Thúc HĐ
              </label>
              <input
                type="date" name="endDate" value={formData.endDate} onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Ngày Ký HĐ
              </label>
              <input
                type="date" name="signedDate" value={formData.signedDate} onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Ghi Chú
            </label>
            <textarea
              name="description" value={formData.description} onChange={handleChange}
              placeholder="Ghi chú thêm về hợp đồng..." rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition resize-none"
            />
          </div>
        </form>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            type="button" onClick={handleReset}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium transition"
          >
            Khôi phục
          </button>
          <div className="flex gap-3">
            <button
              type="button" onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 text-sm font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit" onClick={handleSubmit} disabled={isLoading}
              className={`px-6 py-2.5 rounded-xl text-white text-sm font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                isEdit
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : isEdit ? "Cập Nhật" : "Lưu Hợp Đồng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

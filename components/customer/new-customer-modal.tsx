"use client";

import { useState, useEffect, useRef } from "react";
import { X, Building2, Loader2, Search, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { createCustomer, updateCustomer, checkCustomerCodeExists, Customer } from "@/lib/customer-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: Customer | null;
}

const LOAI_DN = ["BANK", "GOV", "CORP", "SME", "Corporate", "Individual", "Khác"];
const KHU_VUC = ["Bắc", "Trung", "Nam"];
const TINH_TRANG = ["Active", "Inactive"];
const PHAN_LOAI_OPTIONS = [
  { value: "End User", label: "End User", color: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100" },
  { value: "Partner", label: "Partner", color: "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100" },
  { value: "Reseller", label: "Reseller", color: "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100" },
  { value: "Internal", label: "Internal", color: "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100" },
];

const emptyForm = {
  code: "",
  name: "",
  type: "",
  phan_loai: "",
  tinh_trang: "Active",
  khu_vuc: "",
  address: "",
  phu_trach: "",
  ttkd: "",
  ghi_chu: "",
  email: "",
  phone: "",
};

// Searchable dropdown for staff
function StaffDropdown({
  value,
  onChange,
  staffList,
}: {
  value: string;
  onChange: (v: string) => void;
  staffList: NhanSu[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = staffList.filter((s) =>
    !query || s.ten_nhan_su.toLowerCase().includes(query.toLowerCase()) ||
    s.bo_phan?.toLowerCase().includes(query.toLowerCase())
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarColors = ["bg-teal-500","bg-blue-500","bg-purple-500","bg-orange-500","bg-pink-500"];
  const getColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(""); }}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        {value ? (
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getColor(value)}`}>
              {getInitials(value)}
            </div>
            <span className="text-slate-800">{value}</span>
          </div>
        ) : (
          <span className="text-slate-400">-- Chọn người phụ trách --</span>
        )}
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm nhân sự..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-44 overflow-y-auto">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-50 transition"
            >
              -- Không chọn --
            </button>

            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">Không tìm thấy nhân sự</div>
            ) : (
              filtered.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => { onChange(s.ten_nhan_su); setOpen(false); setQuery(""); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-blue-50 transition ${
                    value === s.ten_nhan_su ? "bg-blue-50" : ""
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getColor(s.ten_nhan_su)}`}>
                    {getInitials(s.ten_nhan_su)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.ten_nhan_su}</p>
                    {(s.chuc_vu || s.bo_phan) && (
                      <p className="text-xs text-slate-400">{s.chuc_vu}{s.chuc_vu && s.bo_phan ? " · " : ""}{s.bo_phan}</p>
                    )}
                  </div>
                  {value === s.ten_nhan_su && (
                    <span className="ml-auto text-blue-500 text-xs">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerModal({ isOpen, onClose, onSuccess, editData }: CustomerModalProps) {
  const isEditMode = !!editData;
  const [formData, setFormData] = useState(emptyForm);
  const [staffList, setStaffList] = useState<NhanSu[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeOk, setCodeOk] = useState(false);
  const codeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load staff list
  useEffect(() => {
    if (isOpen) {
      fetchNhanSu().then(setStaffList).catch(console.error);
    }
  }, [isOpen]);

  // Fill form when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        code: editData.code || "",
        name: editData.name || "",
        type: editData.type || "",
        phan_loai: editData.phan_loai || "",
        tinh_trang: editData.tinh_trang || "Active",
        khu_vuc: editData.khu_vuc || "",
        address: editData.address || "",
        phu_trach: editData.phu_trach || editData.contact_person || "",
        ttkd: editData.ttkd || "",
        ghi_chu: editData.ghi_chu || "",
        email: editData.email || "",
        phone: editData.phone || "",
      });
    } else {
      setFormData(emptyForm);
    }
    setError("");
    setCodeError("");
    setCodeOk(false);
  }, [editData, isOpen]);

  // Debounce code check (only in create mode)
  useEffect(() => {
    if (isEditMode) return;
    const code = formData.code.trim().toUpperCase();
    setCodeOk(false);
    setCodeError("");
    if (!code) return;
    if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    setCodeChecking(true);
    codeTimerRef.current = setTimeout(async () => {
      const exists = await checkCustomerCodeExists(code);
      setCodeChecking(false);
      if (exists) {
        setCodeError(`Mã "${code}" đã tồn tại.`);
        setCodeOk(false);
      } else {
        setCodeOk(true);
      }
    }, 500);
    return () => { if (codeTimerRef.current) clearTimeout(codeTimerRef.current); };
  }, [formData.code, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode && !formData.code.trim()) { setError("Vui lòng nhập mã khách hàng."); return; }
    if (!isEditMode && codeError) { setError(codeError); return; }
    if (!formData.name.trim()) { setError("Vui lòng nhập tên khách hàng."); return; }
    setIsLoading(true);
    setError("");

    try {
      let result: { success: boolean; error?: string };
      if (isEditMode && editData) {
        result = await updateCustomer(editData.code, formData);
      } else {
        result = await createCustomer(formData);
      }

      if (!result.success) { setError(result.error || "Đã xảy ra lỗi."); return; }
      onSuccess?.();
      onClose();
      setFormData(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditMode ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditMode ? `Đang sửa: ${editData?.code}` : "Nhập mã khách hàng"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          {/* Mã KH + Tên KH */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mã KH */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Mã khách hàng <span className="text-red-500">*</span>
              </label>
              {isEditMode ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 font-mono">
                    {formData.code}
                  </span>
                  <span className="text-xs text-slate-400">(không thể đổi)</span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="VD: BANK-ACB, CORP-FPT..."
                    required
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:ring-2 text-sm font-mono transition pr-9 ${
                      codeError
                        ? "border-red-400 focus:ring-red-400"
                        : codeOk
                        ? "border-green-400 focus:ring-green-400"
                        : "border-slate-200 focus:ring-blue-500"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {codeChecking && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    {!codeChecking && codeOk && <CheckCircle2 size={14} className="text-green-500" />}
                    {!codeChecking && codeError && <AlertCircle size={14} className="text-red-500" />}
                  </div>
                </div>
              )}
              {codeError && !isEditMode && (
                <p className="mt-1 text-xs text-red-500">{codeError}</p>
              )}
              {codeOk && !isEditMode && (
                <p className="mt-1 text-xs text-green-600">✓ Mã hợp lệ, có thể sử dụng.</p>
              )}
            </div>

            {/* Tên KH */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Tên khách hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ngân hàng ACB, Công ty FPT..."
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
              />
            </div>
          </div>

          {/* Phân loại — button group */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Phân loại khách hàng
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PHAN_LOAI_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, phan_loai: prev.phan_loai === opt.value ? "" : opt.value }))}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold transition ${
                    formData.phan_loai === opt.value
                      ? opt.color + " ring-2 ring-offset-1 " + opt.color.split(" ").find(c => c.startsWith("border-"))
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {formData.phan_loai && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, phan_loai: "" }))}
                  className="text-xs text-slate-400 hover:text-slate-600 underline ml-1"
                >
                  Xóa chọn
                </button>
              )}
            </div>
          </div>

          {/* Row: Loại DN + Tình trạng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Loại doanh nghiệp
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
              >
                <option value="">-- Chọn loại DN --</option>
                {LOAI_DN.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Tình trạng
              </label>
              <select
                name="tinh_trang"
                value={formData.tinh_trang}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
              >
                {TINH_TRANG.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Row: Khu vực + TTKD */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Khu vực
              </label>
              <select
                name="khu_vuc"
                value={formData.khu_vuc}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
              >
                <option value="">-- Chọn khu vực --</option>
                {KHU_VUC.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                TTKD
              </label>
              <input
                type="text"
                name="ttkd"
                value={formData.ttkd}
                onChange={handleChange}
                placeholder="TTKD1, TTKD2..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Địa chỉ
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Hà Nội, Đà Nẵng, TP. Hồ Chí Minh..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
            />
          </div>

          {/* Người phụ trách — searchable dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Người phụ trách
              <span className="ml-2 text-slate-400 normal-case font-normal">(chọn từ danh sách nhân sự)</span>
            </label>
            <StaffDropdown
              value={formData.phu_trach}
              onChange={(v) => setFormData((prev) => ({ ...prev, phu_trach: v }))}
              staffList={staffList}
            />
          </div>

          {/* Row: Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@company.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0901234567"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Ghi chú
            </label>
            <textarea
              name="ghi_chu"
              value={formData.ghi_chu}
              onChange={handleChange}
              placeholder="Ghi chú thêm..."
              rows={2}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition disabled:opacity-50 text-sm flex items-center gap-2"
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isLoading ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Thêm khách hàng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

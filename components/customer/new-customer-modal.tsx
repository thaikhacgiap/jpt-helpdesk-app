"use client";

import { useState, useEffect, useRef } from "react";
import { X, Building2, Loader2, Search, ChevronDown, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { createCustomer, updateCustomer, checkCustomerCodeExists, Customer } from "@/lib/customer-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: Customer | null;
}

const emptyForm = {
  system_code: "",
  code: "",
  name: "",
  ten_tieng_anh: "",
  phu_trach: "",
  ttkd: "",
  ghi_chu: "",
};

// Searchable dropdown for staff (Nhân sự)
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
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarColors = ["bg-teal-500","bg-blue-500","bg-purple-500","bg-orange-500","bg-pink-500"];
  const getColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div ref={ref} className="relative">
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
            <span className="text-slate-800 font-medium">{value}</span>
          </div>
        ) : (
          <span className="text-slate-400">-- Chọn người phụ trách --</span>
        )}
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm tên nhân sự..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
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

  useEffect(() => {
    if (isOpen) {
      fetchNhanSu().then(setStaffList).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (editData) {
      setFormData({
        system_code: editData.system_code || "KH-001",
        code: editData.code || "",
        name: editData.name || "",
        ten_tieng_anh: editData.ten_tieng_anh || "",
        phu_trach: editData.phu_trach || "",
        ttkd: editData.ttkd || "",
        ghi_chu: editData.ghi_chu || "",
      });
    } else {
      setFormData(emptyForm);
    }
    setError("");
    setCodeError("");
    setCodeOk(false);
  }, [editData, isOpen]);

  // Code check for new customers
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        result = await updateCustomer(editData.code, {
          ten_tieng_anh: formData.ten_tieng_anh,
          phu_trach: formData.phu_trach,
          ttkd: formData.ttkd,
          ghi_chu: formData.ghi_chu,
        });
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
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {isEditMode ? "Thông tin khách hàng" : "Thêm khách hàng thủ công"}
                </h2>
                {formData.system_code && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                    {formData.system_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isEditMode ? "Thông tin import từ Sheet được khóa bảo vệ. Có thể chỉnh sửa TTKD và Người phụ trách." : "Tự động gán mã hệ thống KH-00x"}
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

          {/* Section: Thông tin từ Sheet (Read-Only nếu là Edit Mode) */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={12} className="text-slate-400" /> Thông tin từ Sheet Import (Cố định)
              </span>
              {isEditMode && <span className="text-[11px] text-amber-600 font-medium">Read-Only</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Mã KH */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mã Khách Hàng <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 font-bold">
                    <Lock size={14} className="text-slate-400" />
                    {formData.code}
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
                      className={`w-full px-3 py-2 border rounded-xl outline-none text-sm font-mono transition ${
                        codeError ? "border-red-400" : codeOk ? "border-green-400" : "border-slate-200"
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {codeChecking && <Loader2 size={14} className="animate-spin text-slate-400" />}
                      {!codeChecking && codeOk && <CheckCircle2 size={14} className="text-green-500" />}
                      {!codeChecking && codeError && <AlertCircle size={14} className="text-red-500" />}
                    </div>
                  </div>
                )}
              </div>

              {/* Tên KH / Tên Hiển Thị */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tên Khách Hàng (Tên Hiển Thị) <span className="text-red-500">*</span>
                </label>
                {isEditMode ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium truncate">
                    <Lock size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{formData.name}</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ngân hàng ACB, Công ty FPT..."
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-sm"
                  />
                )}
              </div>
            </div>

            {/* Tên Tiếng Anh */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên Tiếng Anh
              </label>
              {isEditMode ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium truncate">
                  <Lock size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate">{formData.ten_tieng_anh || "—"}</span>
                </div>
              ) : (
                <input
                  type="text"
                  name="ten_tieng_anh"
                  value={formData.ten_tieng_anh}
                  onChange={handleChange}
                  placeholder="Asia Commercial Joint Stock Bank..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-sm"
                />
              )}
            </div>
          </div>

          {/* Section: Thông tin Quản lý Nội bộ (Được phép Edit) */}
          <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs space-y-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              ✏️ Thông tin Quản lý Nội bộ (Được chỉnh sửa)
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* TTKD */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  TTKD (Trung tâm kinh doanh)
                </label>
                <input
                  type="text"
                  name="ttkd"
                  value={formData.ttkd}
                  onChange={handleChange}
                  placeholder="TTKD1, TTKD2..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Người phụ trách (Dropdown Nhân sự) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Người phụ trách <span className="text-slate-400 font-normal">(bảng nhân sự)</span>
                </label>
                <StaffDropdown
                  value={formData.phu_trach}
                  onChange={(v) => setFormData((prev) => ({ ...prev, phu_trach: v }))}
                  staffList={staffList}
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ghi chú bổ sung
              </label>
              <textarea
                name="ghi_chu"
                value={formData.ghi_chu}
                onChange={handleChange}
                placeholder="Nhập ghi chú..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition disabled:opacity-50 text-sm flex items-center gap-2 shadow-sm"
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isLoading ? "Đang lưu..." : isEditMode ? "Cập nhật thông tin" : "Tạo khách hàng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

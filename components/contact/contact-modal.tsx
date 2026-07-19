"use client";

import { useState, useEffect, useRef } from "react";
import { X, UserPlus, Loader2, Search, ChevronDown } from "lucide-react";
import { createContact, updateContact, Contact } from "@/lib/contact-operations";
import { fetchCustomers, Customer } from "@/lib/customer-operations";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: Contact | null;
}

const emptyForm = {
  customer_code: "",
  customer_name: "",
  ho_ten: "",
  bo_phan: "",
  chuc_danh: "",
  so_may_ban: "",
  so_di_dong: "",
  email: "",
  dia_chi: "",
  ghi_chu: "",
};

// Searchable customer dropdown
function CustomerDropdown({
  value, onChange, customers,
}: { value: string; onChange: (code: string, name: string) => void; customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = customers.filter(c =>
    !query || c.code.toLowerCase().includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(""); }}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        {value ? (
          <span className="font-mono text-slate-800 text-sm font-semibold">{value}</span>
        ) : (
          <span className="text-slate-400">-- Chọn khách hàng --</span>
        )}
        <ChevronDown size={15} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm mã hoặc tên KH..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button type="button" onClick={() => { onChange("", ""); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-50">
              -- Không chọn --
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">Không tìm thấy</div>
            ) : filtered.map(c => (
              <button type="button" key={c.id}
                onClick={() => { onChange(c.code, c.name); setOpen(false); setQuery(""); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition ${value === c.code ? "bg-blue-50" : ""}`}
              >
                <div>
                  <p className="text-xs font-mono font-semibold text-slate-700">{c.code}</p>
                  <p className="text-xs text-slate-500">{c.name}</p>
                </div>
                {value === c.code && <span className="ml-auto text-blue-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactModal({ isOpen, onClose, onSuccess, editData }: ContactModalProps) {
  const isEditMode = !!editData;
  const [formData, setFormData] = useState(emptyForm);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) fetchCustomers().then(setCustomers).catch(console.error);
  }, [isOpen]);

  useEffect(() => {
    if (editData) {
      setFormData({
        customer_code: editData.customer_code || "",
        customer_name: editData.customer_name || "",
        ho_ten: editData.ho_ten || "",
        bo_phan: editData.bo_phan || "",
        chuc_danh: editData.chuc_danh || "",
        so_may_ban: editData.so_may_ban || "",
        so_di_dong: editData.so_di_dong || "",
        email: editData.email || "",
        dia_chi: editData.dia_chi || "",
        ghi_chu: editData.ghi_chu || "",
      });
    } else {
      setFormData(emptyForm);
    }
    setError("");
  }, [editData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ho_ten.trim()) { setError("Vui lòng nhập họ và tên."); return; }
    setIsLoading(true);
    setError("");
    try {
      const result = isEditMode && editData
        ? await updateContact(editData.id, formData)
        : await createContact(formData);
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
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
              <UserPlus size={18} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditMode ? "Chỉnh sửa liên hệ" : "Thêm liên hệ mới"}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditMode ? `Mã: ${editData?.code}` : "Mã sẽ tự động tạo (CTC-xxx)"}
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

          {/* Khách hàng */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Khách hàng
            </label>
            <CustomerDropdown
              value={formData.customer_code}
              onChange={(code, name) => setFormData(prev => ({ ...prev, customer_code: code, customer_name: name }))}
              customers={customers}
            />
          </div>

          {/* Họ và tên */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ho_ten"
              value={formData.ho_ten}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
            />
          </div>

          {/* Bộ phận + Chức danh */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Bộ phận
              </label>
              <input
                type="text"
                name="bo_phan"
                value={formData.bo_phan}
                onChange={handleChange}
                placeholder="IT, CUSTOMER, INTERNAL..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Chức danh
              </label>
              <input
                type="text"
                name="chuc_danh"
                value={formData.chuc_danh}
                onChange={handleChange}
                placeholder="Manager, Leader, Staff..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
              />
            </div>
          </div>

          {/* Số máy bàn + Số di động */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Số máy bàn
              </label>
              <input
                type="tel"
                name="so_may_ban"
                value={formData.so_may_ban}
                onChange={handleChange}
                placeholder="028 1234 5678"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Số di động
              </label>
              <input
                type="tel"
                name="so_di_dong"
                value={formData.so_di_dong}
                onChange={handleChange}
                placeholder="0901 234 567"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Địa chỉ
            </label>
            <input
              type="text"
              name="dia_chi"
              value={formData.dia_chi}
              onChange={handleChange}
              placeholder="Hà Nội, Đà Nẵng, TP. HCM..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm transition"
            />
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
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm transition resize-none"
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
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-xl text-white font-medium transition disabled:opacity-50 text-sm flex items-center gap-2"
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isLoading ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Thêm liên hệ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

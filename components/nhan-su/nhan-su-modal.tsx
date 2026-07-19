"use client";

import { useState, useEffect } from "react";
import { X, User, Loader2 } from "lucide-react";
import { createNhanSu, updateNhanSu, generateNextMaNhanSu, NhanSu } from "@/lib/nhan-su-operations";

interface NhanSuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editData?: NhanSu | null; // null = create mode, NhanSu = edit mode
}

const emptyForm = {
  ten_nhan_su: "",
  bo_phan: "",
  chuc_vu: "",
  phu_trach: "",
  ngay_sinh: "",
  so_cccd: "",
  cap_ngay: "",
  email: "",
  so_dien_thoai: "",
  dia_chi: "",
};

const BO_PHAN_OPTIONS = [
  "Kỹ thuật",
  "Nhân Sự",
  "Kế toán",
  "Kinh doanh",
  "Hành chính",
  "IT",
  "Ban giám đốc",
  "Khác",
];

const CHUC_VU_OPTIONS = [
  "Nhân viên",
  "Trưởng phòng",
  "Phó phòng",
  "Giám đốc",
  "Phó giám đốc",
  "Chuyên viên",
  "Kỹ thuật viên",
  "Thực tập sinh",
  "Khác",
];

export default function NhanSuModal({ isOpen, onClose, onSuccess, editData }: NhanSuModalProps) {
  const isEditMode = !!editData;
  const [formData, setFormData] = useState(emptyForm);
  const [previewCode, setPreviewCode] = useState("NS-001");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load preview code on open (create mode only)
  useEffect(() => {
    if (isOpen && !isEditMode) {
      generateNextMaNhanSu().then((code) => setPreviewCode(code));
    }
  }, [isOpen, isEditMode]);

  // Fill form when editing
  useEffect(() => {
    if (editData) {
      setFormData({
        ten_nhan_su: editData.ten_nhan_su || "",
        bo_phan: editData.bo_phan || "",
        chuc_vu: editData.chuc_vu || "",
        phu_trach: editData.phu_trach || "",
        ngay_sinh: editData.ngay_sinh || "",
        so_cccd: editData.so_cccd || "",
        cap_ngay: editData.cap_ngay || "",
        email: editData.email || "",
        so_dien_thoai: editData.so_dien_thoai || "",
        dia_chi: editData.dia_chi || "",
      });
    } else {
      setFormData(emptyForm);
    }
    setError("");
  }, [editData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ten_nhan_su.trim()) {
      setError("Vui lòng nhập tên nhân sự.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      let result: { success: boolean; error?: string };
      if (isEditMode && editData) {
        result = await updateNhanSu(editData.id, formData);
      } else {
        result = await createNhanSu(formData);
      }

      if (!result.success) {
        setError(result.error || "Đã xảy ra lỗi.");
        return;
      }

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
              <User size={18} className="text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditMode ? "Chỉnh sửa nhân sự" : "Thêm nhân sự mới"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? `Đang sửa: ${editData?.ma_nhan_su}`
                  : `Mã tự động: ${previewCode}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Mã nhân sự (read-only preview) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Mã nhân sự
            </label>
            <input
              type="text"
              value={isEditMode ? editData?.ma_nhan_su : previewCode}
              readOnly
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-sm font-mono cursor-not-allowed"
            />
          </div>

          {/* Row 1: Tên + Bộ phận */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Tên nhân sự <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ten_nhan_su"
                value={formData.ten_nhan_su}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Bộ phận
              </label>
              <select
                name="bo_phan"
                value={formData.bo_phan}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition bg-white appearance-none"
              >
                <option value="">-- Chọn bộ phận --</option>
                {BO_PHAN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Chức vụ + Phụ trách */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Chức vụ
              </label>
              <select
                name="chuc_vu"
                value={formData.chuc_vu}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition bg-white appearance-none"
              >
                <option value="">-- Chọn chức vụ --</option>
                {CHUC_VU_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Phụ trách (mảng)
              </label>
              <input
                type="text"
                name="phu_trach"
                value={formData.phu_trach}
                onChange={handleChange}
                placeholder="vd: HC-NS, database..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
              />
            </div>
          </div>

          {/* Row 3: Ngày sinh + Số CCCD */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Ngày sinh
              </label>
              <input
                type="date"
                name="ngay_sinh"
                value={formData.ngay_sinh}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Số CCCD
              </label>
              <input
                type="text"
                name="so_cccd"
                value={formData.so_cccd}
                onChange={handleChange}
                placeholder="012345678901"
                maxLength={12}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition font-mono"
              />
            </div>
          </div>

          {/* Row 4: Cấp ngày + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Cấp ngày
              </label>
              <input
                type="date"
                name="cap_ngay"
                value={formData.cap_ngay}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nhanvien@company.com"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
              />
            </div>
          </div>

          {/* Row 5: Số điện thoại + Địa chỉ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="so_dien_thoai"
                value={formData.so_dien_thoai}
                onChange={handleChange}
                placeholder="0901234567"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Địa chỉ
              </label>
              <input
                type="text"
                name="dia_chi"
                value={formData.dia_chi}
                onChange={handleChange}
                placeholder="Số nhà, đường, quận..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
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
              id="btn-save-nhan-su"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-xl text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isLoading ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Thêm nhân sự"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Inbox, Loader2, Send } from "lucide-react";
import { createServiceRequest } from "@/lib/portal-operations";
import { fetchContractsByCustomer, Contract } from "@/lib/contract-operations";

interface NewServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onSuccess?: () => void;
  defaultType?: string;
  defaultCategory?: string;
}

export default function NewServiceRequestModal({
  isOpen,
  onClose,
  customerId,
  onSuccess,
  defaultType,
  defaultCategory,
}: NewServiceRequestModalProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tt_type: "",
    category: "",
    priority: "Medium",
    contract_no: "",
    incident_start_time: new Date().toISOString().substring(0, 16),
    affected_service: ""
  });

  useEffect(() => {
    if (isOpen && customerId) {
      setFormData({
        title: "",
        description: "",
        tt_type: defaultType || "",
        category: defaultCategory || "",
        priority: "Medium",
        contract_no: "",
        incident_start_time: new Date().toISOString().substring(0, 16),
        affected_service: ""
      });

      // Fetch contracts for the customer
      fetchContractsByCustomer(customerId)
        .then(setContracts)
        .catch((err) => console.error("Error loading contracts:", err));
    }
  }, [isOpen, customerId, defaultType, defaultCategory]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await createServiceRequest(customerId, {
        title: formData.title,
        description: formData.description,
        tt_type: formData.tt_type,
        category: formData.category,
        priority: "Medium",
        contract_no: formData.contract_no,
        affected_service: formData.tt_type === "Xử lý lỗi" ? formData.affected_service : undefined,
        start_time: formData.tt_type === "Xử lý lỗi"
          ? new Date(formData.incident_start_time).toISOString()
          : new Date().toISOString()
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error creating service request:", err);
      setError(err?.message || err?.details || String(err) || "Không thể tạo yêu cầu dịch vụ");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto text-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-150 sticky top-0 bg-white z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Inbox size={16} />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-bold text-slate-900">
                Yêu cầu Hỗ Trợ Kỹ Thuật
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                Nhập các thông tin chi tiết dưới đây để gửi kỹ thuật hỗ trợ.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-655 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Tiêu đề yêu cầu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Cung cấp tóm tắt ngắn gọn vấn đề cần hỗ trợ..."
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs transition"
            />
          </div>

          {/* Description */}
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Mô tả chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả cụ thể sự cố, thông tin máy chủ, mã lỗi, hoặc các hướng dẫn chi tiết..."
              required
              rows={4}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs transition resize-none leading-relaxed"
            />
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Loại yêu cầu <span className="text-rose-500">*</span>
              </label>
              <select
                name="tt_type"
                value={formData.tt_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs transition cursor-pointer"
              >
                <option value="">-- Chọn loại yêu cầu --</option>
                <option value="Xử lý lỗi">Xử lý lỗi</option>
                <option value="Thay đổi cấu hình">Thay đổi cấu hình</option>
                <option value="Cài đặt - Nâng cấp">Cài đặt - Nâng cấp</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                Danh mục <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs transition cursor-pointer"
              >
                <option value="">-- Chọn danh mục --</option>
                <option value="Phần cứng">Phần cứng</option>
                <option value="Phần mềm">Phần mềm</option>
                <option value="Database">Database</option>
                <option value="Network">Network</option>
                <option value="Security">Security</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          {/* Conditional Incident Fields */}
          {formData.tt_type === "Xử lý lỗi" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Thời gian bắt đầu sự cố <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="incident_start_time"
                  value={formData.incident_start_time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Dịch vụ bị ảnh hưởng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="affected_service"
                  value={formData.affected_service}
                  onChange={handleChange}
                  placeholder="ERP, Website, Email, Internet..."
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs transition"
                />
              </div>
            </div>
          )}

          {/* Contract Selector */}
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              Chọn hợp đồng liên quan
            </label>
            <select
              name="contract_no"
              value={formData.contract_no}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs transition cursor-pointer"
            >
              <option value="">-- Không liên kết hợp đồng --</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.contract_no || c.code}>
                  {c.name} ({c.contract_no || c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Gửi yêu cầu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

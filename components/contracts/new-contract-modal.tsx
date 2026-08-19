"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Save, Loader2 } from "lucide-react";
import { Contract, createContract, updateContract } from "@/lib/contract-operations";

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Contract | null;
}

const CONTRACT_TYPES = [
  "Hợp đồng dịch vụ",
  "Hợp đồng bảo trì định kỳ",
  "Hợp đồng mua sắm thiết bị",
  "Hợp đồng phát triển phần mềm",
  "Hợp đồng tư vấn giải pháp",
  "Phụ lục hợp đồng",
];

const STATUS_LIST = [
  "Active",
  "Pending",
  "Hết hạn",
  "Thanh lý",
  "Tạm dừng",
];

const TTKD_LIST = [
  "TTKD 1",
  "TTKD 2",
  "TTKD 3",
  "TTKD 4",
  "TTKD 5",
  "TTKD HCM",
  "TTKD HN",
  "Khối Giải pháp",
];

export default function ContractModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ContractModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    contract_no: "",
    name: "",
    contract_type: "Hợp đồng dịch vụ",
    customer_name: "",
    signed_date: "",
    start_date: "",
    end_date: "",
    value: "",
    status: "Active",
    owner_name: "",
    ttkd: "",
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        contract_no: initialData.contract_no || "",
        name: initialData.name || "",
        contract_type: initialData.contract_type || "Hợp đồng dịch vụ",
        customer_name: initialData.customer_name || "",
        signed_date: initialData.signed_date || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        value: initialData.value || "",
        status: initialData.status || "Active",
        owner_name: initialData.owner_name || initialData.phu_trach || "",
        ttkd: initialData.ttkd || "",
        description: initialData.description || initialData.ghi_chu || "",
      });
    } else {
      setFormData({
        code: "",
        contract_no: "",
        name: "",
        contract_type: "Hợp đồng dịch vụ",
        customer_name: "",
        signed_date: "",
        start_date: "",
        end_date: "",
        value: "",
        status: "Active",
        owner_name: "",
        ttkd: "",
        description: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên hợp đồng.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && initialData?.id) {
        const res = await updateContract(initialData.id, formData);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          alert("Lỗi cập nhật: " + res.error);
        }
      } else {
        const res = await createContract({
          ...formData,
          code: formData.code.trim() || `CTR-${Date.now().toString().slice(-4)}`,
        });
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          alert("Lỗi tạo mới: " + res.error);
        }
      }
    } catch (err: any) {
      alert("Lỗi: " + (err.message || "Không thể lưu thông tin hợp đồng."));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 via-white to-blue-50/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEdit ? "Chỉnh sửa Hợp đồng" : "Thêm mới Hợp đồng"}
              </h3>
              <p className="text-xs text-slate-500">Quản lý hồ sơ pháp lý, thời hạn và giá trị hợp đồng</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Hợp đồng (Code)</label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: CTR-2026-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Hợp đồng (Pháp lý)</label>
              <input
                type="text"
                value={formData.contract_no}
                onChange={e => setFormData({ ...formData, contract_no: e.target.value })}
                placeholder="VD: 01/2026/HĐ-JPT"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Hợp đồng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Hợp đồng bảo trì hệ thống máy chủ 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại Hợp đồng</label>
              <select
                value={formData.contract_type}
                onChange={e => setFormData({ ...formData, contract_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khách hàng</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="VD: Công ty J-TECH"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giá trị hợp đồng (VNĐ)</label>
              <input
                type="text"
                value={formData.value}
                onChange={e => setFormData({ ...formData, value: e.target.value })}
                placeholder="VD: 1,200,000,000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày ký</label>
              <input
                type="date"
                value={formData.signed_date}
                onChange={e => setFormData({ ...formData, signed_date: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày hiệu lực</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày hết hạn</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Người phụ trách (Owner)</label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                placeholder="Tên nhân sự phụ trách"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">TTKD</label>
              <input
                type="text"
                list="ttkd-ctr-list"
                value={formData.ttkd}
                onChange={e => setFormData({ ...formData, ttkd: e.target.value })}
                placeholder="Chọn hoặc nhập TTKD"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="ttkd-ctr-list">
                {TTKD_LIST.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Thông tin bổ sung..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

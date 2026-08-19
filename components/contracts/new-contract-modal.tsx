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

export default function ContractModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ContractModalProps) {
  const [formData, setFormData] = useState({
    contract_no: "",
    project_id: "",
    status: "Active",
    signed_date: "",
    expiry_date: "",
    service: "",
    contract_type: "Hợp đồng dịch vụ",
    description: "",
    supplier: "",
    end_user: "",
    customer: "",
    am: "",
    team: "",
    fy: "",
  });

  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        contract_no: initialData.contract_no || "",
        project_id: initialData.project_id || "",
        status: initialData.status || "Active",
        signed_date: initialData.signed_date || "",
        expiry_date: initialData.expiry_date || "",
        service: initialData.service || "",
        contract_type: initialData.contract_type || "Hợp đồng dịch vụ",
        description: initialData.description || "",
        supplier: initialData.supplier || "",
        end_user: initialData.end_user || "",
        customer: initialData.customer || "",
        am: initialData.am || "",
        team: initialData.team || "",
        fy: initialData.fy || "",
      });
    } else {
      setFormData({
        contract_no: "",
        project_id: "",
        status: "Active",
        signed_date: "",
        expiry_date: "",
        service: "",
        contract_type: "Hợp đồng dịch vụ",
        description: "",
        supplier: "",
        end_user: "",
        customer: "",
        am: "",
        team: "",
        fy: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contract_no.trim()) {
      alert("Vui lòng nhập CONTRACT NO (Mã hợp đồng)");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && initialData) {
        const res = await updateContract(initialData.id, formData);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          alert("Lỗi cập nhật: " + res.error);
        }
      } else {
        const res = await createContract(formData);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          alert("Lỗi tạo hợp đồng: " + res.error);
        }
      }
    } catch {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl shadow-sm">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEdit ? "Chỉnh sửa Hợp đồng" : "Thêm mới Hợp đồng"}
              </h3>
              <p className="text-xs text-slate-500">
                Nhập đầy đủ thông tin hợp đồng theo chuẩn 14 trường dữ liệu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CONTRACT NO */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                CONTRACT NO <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contract_no}
                onChange={(e) => setFormData({ ...formData, contract_no: e.target.value })}
                placeholder="VD: HD-2026/001"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-mono font-bold"
              />
            </div>

            {/* PROJECT ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">PROJECT ID</label>
              <input
                type="text"
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                placeholder="VD: PRJ-992"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-mono"
              />
            </div>

            {/* STATUS */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">STATUS</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden bg-white"
              >
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SIGNED DATE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">SIGNED DATE</label>
              <input
                type="text"
                value={formData.signed_date}
                onChange={(e) => setFormData({ ...formData, signed_date: e.target.value })}
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            {/* EXPIRY DATE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">EXPIRY DATE</label>
              <input
                type="text"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            {/* FY */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">FY (Fiscal Year)</label>
              <input
                type="text"
                value={formData.fy}
                onChange={(e) => setFormData({ ...formData, fy: e.target.value })}
                placeholder="VD: FY26"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SERVICE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">SERVICE (Dịch vụ)</label>
              <input
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                placeholder="VD: Bảo trì hệ thống máy chủ & mạng"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            {/* CONTRACT TYPE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">CONTRACT TYPE</label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden bg-white"
              >
                {CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CUSTOMER */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">CUSTOMER (Khách hàng)</label>
              <input
                type="text"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                placeholder="Tên khách hàng / Doanh nghiệp"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            {/* END USER */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">END USER (Người dùng cuối)</label>
              <input
                type="text"
                value={formData.end_user}
                onChange={(e) => setFormData({ ...formData, end_user: e.target.value })}
                placeholder="Tên đơn vị sử dụng cuối"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            {/* SUPPLIER */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">SUPPLIER (Nhà cung cấp)</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Nhà cung cấp thiết bị / dịch vụ"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AM */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">AM (Account Manager / Phụ trách)</label>
              <input
                type="text"
                value={formData.am}
                onChange={(e) => setFormData({ ...formData, am: e.target.value })}
                placeholder="Tên nhân sự phụ trách kinh doanh"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>

            {/* TEAM */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">TEAM (Nhóm / TTKD)</label>
              <input
                type="text"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                placeholder="VD: TTKD 1, Khối Giải pháp..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">DESCRIPTION (Mô tả / Ghi chú)</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Chi tiết mô tả hợp đồng, phạm vi công việc, lưu ý..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? "Đang lưu..." : isEdit ? "Cập nhật hợp đồng" : "Tạo hợp đồng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

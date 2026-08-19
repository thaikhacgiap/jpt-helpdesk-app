"use client";

import React, { useState, useEffect } from "react";
import { X, Target, Save, Loader2 } from "lucide-react";
import { Opportunity, createOpportunity, updateOpportunity } from "@/lib/opportunity-operations";

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: Opportunity | null;
}

const STAGES = [
  "Tiềm năng",
  "Khảo sát / Nhu cầu",
  "Đang chào giá",
  "Đàm phán hợp đồng",
  "Đã ký hợp đồng",
  "Tạm dừng",
  "Thất bại / Hủy",
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

export default function OpportunityModal({
  isOpen,
  onClose,
  onSuccess,
  editData,
}: OpportunityModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    customer_name: "",
    customer_code: "",
    giai_doan: "Tiềm năng",
    gia_tri: "",
    xac_suat: "50%",
    ngay_du_kien: "",
    ttkd: "",
    phu_trach: "",
    ghi_chu: "",
  });

  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(editData);

  useEffect(() => {
    if (editData) {
      setFormData({
        code: editData.code || "",
        name: editData.name || "",
        customer_name: editData.customer_name || "",
        customer_code: editData.customer_code || "",
        giai_doan: editData.giai_doan || "Tiềm năng",
        gia_tri: editData.gia_tri || "",
        xac_suat: editData.xac_suat || "50%",
        ngay_du_kien: editData.ngay_du_kien || "",
        ttkd: editData.ttkd || "",
        phu_trach: editData.phu_trach || "",
        ghi_chu: editData.ghi_chu || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        customer_name: "",
        customer_code: "",
        giai_doan: "Tiềm năng",
        gia_tri: "",
        xac_suat: "50%",
        ngay_du_kien: "",
        ttkd: "",
        phu_trach: "",
        ghi_chu: "",
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên cơ hội kinh doanh.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editData?.id) {
        const res = await updateOpportunity(editData.id, formData);
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          alert("Lỗi cập nhật: " + res.error);
        }
      } else {
        const res = await createOpportunity({
          ...formData,
          code: formData.code.trim() || `OPP-${Date.now().toString().slice(-4)}`,
        });
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          alert("Lỗi tạo mới: " + res.error);
        }
      }
    } catch (err: any) {
      alert("Lỗi: " + (err.message || "Không thể lưu thông tin."));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/60 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEdit ? "Chỉnh sửa Cơ hội Kinh doanh" : "Thêm mới Cơ hội Kinh doanh"}
              </h3>
              <p className="text-xs text-slate-500">Quản lý giai đoạn, giá trị và thông tin cơ hội</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Cơ hội / Dự án</label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: OPP-2026-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giai đoạn</label>
              <select
                value={formData.giai_doan}
                onChange={e => setFormData({ ...formData, giai_doan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Cơ hội / Dự án <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Nâng cấp hệ thống Core Network VNPT"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên Khách hàng</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="VD: Tập đoàn VNPT"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Giá trị dự kiến (VNĐ)</label>
              <input
                type="text"
                value={formData.gia_tri}
                onChange={e => setFormData({ ...formData, gia_tri: e.target.value })}
                placeholder="VD: 500,000,000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trung tâm kinh doanh (TTKD)</label>
              <input
                type="text"
                list="ttkd-opp-list"
                value={formData.ttkd}
                onChange={e => setFormData({ ...formData, ttkd: e.target.value })}
                placeholder="Chọn hoặc nhập TTKD"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <datalist id="ttkd-opp-list">
                {TTKD_LIST.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Người phụ trách (Sales)</label>
              <input
                type="text"
                value={formData.phu_trach}
                onChange={e => setFormData({ ...formData, phu_trach: e.target.value })}
                placeholder="Tên nhân sự phụ trách"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={formData.ghi_chu}
              onChange={e => setFormData({ ...formData, ghi_chu: e.target.value })}
              placeholder="Thông tin bổ sung..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
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
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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

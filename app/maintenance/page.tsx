"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Search, Wrench, X, CheckCircle2, Clock, RotateCcw, Pencil, Trash2 } from "lucide-react";

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  
  const [form, setForm] = useState({
    customerId: "",
    contractId: "",
    currentPeriod: 1,
    totalPeriods: 12,
    status: "New",
    description: "",
  });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("tickets")
        .select("*, customer:customers(id, name), contract:contracts(id, name)")
        .eq("tt_type", "Maintenance")
        .order("created_at", { ascending: false });
      setTickets(data || []);
    } catch (err) {
      console.error("Error loading maintenance tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const { data: custData } = await supabase
        .from("customers")
        .select("id, code, name")
        .order("name", { ascending: true });
      setCustomers(custData || []);

      const { data: contrData } = await supabase
        .from("contracts")
        .select("id, code, name, customer_id")
        .order("name", { ascending: true });
      setAllContracts(contrData || []);
    } catch (err) {
      console.error("Error loading reference data:", err);
    }
  };

  useEffect(() => {
    loadTickets();
    loadReferenceData();
  }, []);

  const handleCustomerChange = (customerId: string) => {
    setForm(f => ({ ...f, customerId, contractId: "" }));
    if (customerId) {
      const matched = allContracts.filter(c => c.customer_id === customerId);
      setFilteredContracts(matched);
    } else {
      setFilteredContracts([]);
    }
  };

  const generateNextMaintenanceId = async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.getFullYear().toString()
      + String(today.getMonth() + 1).padStart(2, '0')
      + String(today.getDate()).padStart(2, '0');

    const btrPrefix = `BTR-${dateStr}-`;
    const tkPrefix = `TK-${dateStr}-`;

    const { data, error } = await supabase
      .from("tickets")
      .select("ticket_id")
      .or(`ticket_id.like.${btrPrefix}%,ticket_id.like.${tkPrefix}%`);

    let maxSeq = 0;
    if (data && data.length > 0) {
      data.forEach((row: any) => {
        const parts = row.ticket_id.split("-");
        const seqStr = parts[parts.length - 1];
        const seq = parseInt(seqStr, 10) || 0;
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      });
    }

    const nextSeq = String(maxSeq + 1).padStart(3, "0");
    return `${btrPrefix}${nextSeq}`;
  };

  const handleCreateOpen = () => {
    setEditingPlan(null);
    setForm({
      customerId: "",
      contractId: "",
      currentPeriod: 1,
      totalPeriods: 12,
      status: "New",
      description: "",
    });
    setFilteredContracts([]);
    setIsModalOpen(true);
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      customerId: plan.customer_id || "",
      contractId: plan.contract_id || "",
      currentPeriod: parseInt(plan.sla_time) || 1,
      totalPeriods: parseInt(plan.hold_time) || 12,
      status: plan.tt_status || "New",
      description: plan.description || "",
    });
    if (plan.customer_id) {
      const matched = allContracts.filter(c => c.customer_id === plan.customer_id);
      setFilteredContracts(matched);
    } else {
      setFilteredContracts([]);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kế hoạch này?")) return;
    try {
      await supabase.from("tickets").delete().eq("id", id);
      loadTickets();
    } catch (err) {
      console.error("Error deleting plan:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) return;
    setSubmitting(true);
    try {
      const current = parseInt(String(form.currentPeriod)) || 0;
      const total = parseInt(String(form.totalPeriods)) || 0;
      const progressPercent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
      const progressStr = `${progressPercent}%`;

      const custObj = customers.find(c => c.id === form.customerId);
      const contrObj = allContracts.find(c => c.id === form.contractId);

      const payload = {
        title: `Kế hoạch bảo trì - ${custObj?.name || "Khách hàng"}`,
        description: form.description,
        customer_id: form.customerId,
        customer_name: custObj?.name || null,
        contract_id: form.contractId || null,
        contract_no: contrObj?.name || null,
        sla_time: String(form.currentPeriod),
        hold_time: String(form.totalPeriods),
        progress: progressStr,
        tt_status: form.status,
      };

      if (editingPlan) {
        await supabase
          .from("tickets")
          .update(payload)
          .eq("id", editingPlan.id);
      } else {
        const ticketId = await generateNextMaintenanceId();
        await supabase
          .from("tickets")
          .insert([{
            ...payload,
            ticket_id: ticketId,
            tt_type: "Maintenance",
            start_time: new Date().toISOString(),
          }]);
      }

      setIsModalOpen(false);
      setEditingPlan(null);
      setForm({
        customerId: "",
        contractId: "",
        currentPeriod: 1,
        totalPeriods: 12,
        status: "New",
        description: "",
      });
      setFilteredContracts([]);
      loadTickets();
    } catch (err) {
      console.error("Error saving plan:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = tickets.filter(t => {
    const term = search.toLowerCase();
    const displayId = (t.ticket_id || "").replace(/^[A-Z]+-/, 'BTR-').toLowerCase();
    const idMatch = displayId.includes(term);
    const custMatch = (t.customer?.name || t.customer_name || "")?.toLowerCase().includes(term);
    const contrMatch = (t.contract?.name || t.contract_no || "")?.toLowerCase().includes(term);
    return idMatch || custMatch || contrMatch;
  });

  const total = tickets.length;
  const pending = tickets.filter(t => t.tt_status === "New").length;
  const inProgress = tickets.filter(t => t.tt_status === "In Progress").length;
  const completed = tickets.filter(t => ["Resolved", "Closed"].includes(t.tt_status)).length;

  return (
    <MainLayout>
      <Header title="Kế Hoạch Bảo Trì" description="Quản lý kế hoạch bảo trì định kỳ và hợp đồng dịch vụ" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Tổng kế hoạch", value: total, icon: Wrench, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Mới tạo", value: pending, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Đang chạy", value: inProgress, icon: RotateCcw, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Hoàn thành", value: completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
              <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={20} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateOpen}
            className="h-10 flex items-center gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Thêm kế hoạch
          </button>
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="h-10 w-80 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500 font-medium text-left">
              <th className="px-6 py-3">ID</th>
              <th className="px-4 py-3">Tên khách hàng</th>
              <th className="px-4 py-3">Tên hợp đồng</th>
              <th className="px-4 py-3 text-center">Kỳ thực hiện</th>
              <th className="px-4 py-3 text-center">Tổng kỳ</th>
              <th className="px-4 py-3">Tình trạng</th>
              <th className="px-4 py-3">Tiến độ</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-400">
                  <Wrench size={36} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">{search ? "Không tìm thấy kết quả" : "Chưa có kế hoạch bảo trì nào"}</p>
                  <button onClick={handleCreateOpen} className="mt-3 text-blue-500 text-sm hover:underline cursor-pointer">
                    + Tạo kế hoạch đầu tiên
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map((t: any, i: number) => {
                const progressVal = parseInt(t.progress) || 0;
                return (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-3.5 font-medium text-blue-600">
                      <Link href={`/maintenance/${t.id}`} className="hover:underline">
                        {t.ticket_id ? t.ticket_id.replace(/^[A-Z]+-/, 'BTR-') : '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 max-w-[200px] truncate" title={t.customer?.name || t.customer_name}>
                      {t.customer?.name || t.customer_name || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate" title={t.contract?.name || t.contract_no}>
                      {t.contract?.name || t.contract_no || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-700">{t.sla_time || 0}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-500">{t.hold_time || 0}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        t.tt_status === "Resolved" || t.tt_status === "Closed" ? "bg-green-100 text-green-700" :
                        t.tt_status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                        t.tt_status === "On Hold" ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-700"
                      }`}>{
                        t.tt_status === "New" ? "Mới tạo" :
                        t.tt_status === "In Progress" ? "Đang chạy" :
                        t.tt_status === "On Hold" ? "Tạm ngưng" :
                        t.tt_status === "Resolved" ? "Hoàn thành" :
                        t.tt_status === "Closed" ? "Đã đóng" :
                        t.tt_status || "Mới tạo"
                      }</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 min-w-[130px]">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                              t.tt_status === "Resolved" || t.tt_status === "Closed"
                                ? "from-emerald-400 to-teal-500"
                                : t.tt_status === "On Hold"
                                ? "from-rose-400 to-red-500"
                                : t.tt_status === "In Progress"
                                ? "from-amber-400 to-orange-500"
                                : "from-blue-400 to-indigo-500"
                            }`}
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 min-w-[32px]">{progressVal}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleEdit(t)}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                          title="Sửa kế hoạch"
                        >
                          <Pencil size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded transition cursor-pointer"
                          title="Xóa kế hoạch"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden transform scale-100 transition-all">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPlan ? "Cập nhật kế hoạch" : "Thêm kế hoạch mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Customer Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.customerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  required
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Contract Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Hợp đồng
                </label>
                <select
                  value={form.contractId}
                  onChange={e => setForm(f => ({ ...f, contractId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  disabled={!form.customerId}
                >
                  <option value="">-- Chọn hợp đồng --</option>
                  {filteredContracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Periods Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Kỳ đang thực hiện <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.currentPeriod}
                    onChange={e => setForm(f => ({ ...f, currentPeriod: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Tổng số kỳ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.totalPeriods}
                    onChange={e => setForm(f => ({ ...f, totalPeriods: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tình trạng <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  required
                >
                  <option value="New">Mới tạo</option>
                  <option value="In Progress">Đang chạy</option>
                  <option value="On Hold">Tạm ngưng</option>
                  <option value="Resolved">Hoàn thành</option>
                  <option value="Closed">Đã đóng</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mô tả / Ghi chú</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Ghi chú chi tiết..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Progress Live Preview */}
              {form.totalPeriods > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-600">Tiến độ tính toán:</span>
                    <span className="text-xs font-bold text-blue-600">
                      {Math.min(100, Math.round(((parseInt(String(form.currentPeriod)) || 0) / (parseInt(String(form.totalPeriods)) || 1)) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round(((parseInt(String(form.currentPeriod)) || 0) / (parseInt(String(form.totalPeriods)) || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Đang lưu..." : (editingPlan ? "Cập nhật" : "Tạo kế hoạch")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

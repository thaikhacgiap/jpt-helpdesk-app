"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { fetchCustomers } from "@/lib/customer-operations";
import { fetchContractsByCustomer } from "@/lib/contract-operations";
import { supabase } from "@/lib/supabase";
import {
  fetchSLASettings,
  saveSLASetting,
  deleteSLASetting,
  generateSlaId,
  type SLASetting,
} from "@/lib/sla-operations";
import type { Customer } from "@/lib/customer-operations";
import type { Contract } from "@/lib/contract-operations";
import {
  Plus, Pencil, Trash2, X, Check, Search,
  ChevronDown, Building2, FileText, Shield, Save,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────── */
/* Constants                                                   */
/* ─────────────────────────────────────────────────────────── */
const PRIORITIES = ["L1", "L2", "L3", "L4"];

const PRIORITY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  L1: { label: "L1 (Critical)", color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
  L2: { label: "L2 (Major)",    color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  L3: { label: "L3 (Minor)",    color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  L4: { label: "L4 (Warning)",  color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
};

/* ─────────────────────────────────────────────────────────── */
/* Customer picker sub-component                               */
/* ─────────────────────────────────────────────────────────── */
function CustomerPicker({
  customers, value, onChange, loading,
}: {
  customers: Customer[]; value: Customer | null;
  onChange: (c: Customer | null) => void; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-3 py-2 border rounded-lg text-left text-sm flex items-center justify-between transition
          ${value ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}
          focus:outline-none focus:ring-2 focus:ring-blue-400`}
      >
        <span className="flex items-center gap-2 truncate">
          {loading ? <span className="text-slate-400 text-xs">Đang tải...</span>
            : value ? (
              <>
                <Building2 size={13} className="text-blue-500 shrink-0" />
                <span className="font-medium text-slate-800 truncate">{value.name}</span>
              </>
            ) : <span className="text-slate-400">Chọn khách hàng...</span>}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {value && (
        <button type="button" onClick={() => onChange(null)}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400">
          <X size={12} />
        </button>
      )}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input autoFocus type="text" placeholder="Tìm khách hàng..."
                value={q} onChange={(e) => setQ(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((c) => (
              <button key={c.id} type="button"
                onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 text-sm transition ${value?.id === c.id ? "bg-blue-50" : ""}`}>
                <Building2 size={12} className="text-slate-400 shrink-0" />
                <span className="truncate font-medium text-slate-700">{c.name}</span>
                <span className="text-xs text-slate-400 shrink-0">{c.code}</span>
                {value?.id === c.id && <Check size={12} className="text-blue-500 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Contract picker sub-component                               */
/* ─────────────────────────────────────────────────────────── */
function ContractPicker({
  contracts, value, onChange, loading, disabled,
}: {
  contracts: Contract[]; value: Contract | null;
  onChange: (c: Contract | null) => void; loading: boolean; disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) setOpen(false);
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [disabled]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button" disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full px-3 py-2 border rounded-lg text-left text-sm flex items-center justify-between transition
          ${disabled ? "bg-slate-50 border-slate-100 cursor-not-allowed" : ""}
          ${!disabled && value ? "border-emerald-400 bg-emerald-50" : ""}
          ${!disabled && !value ? "border-slate-200 bg-white hover:bg-slate-50" : ""}
          focus:outline-none focus:ring-2 focus:ring-emerald-400`}
      >
        <span className="flex items-center gap-2 truncate text-sm">
          {loading ? <span className="text-slate-400 text-xs">Đang tải...</span>
            : disabled ? <span className="text-slate-300 text-xs">Chọn khách hàng trước</span>
            : value ? (
              <>
                <FileText size={13} className="text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">{value.contract_no || value.code}</span>
              </>
            ) : contracts.length === 0
              ? <span className="text-slate-400 text-xs">Không có hợp đồng</span>
              : <span className="text-slate-400">Chọn số HĐ...</span>}
        </span>
        {!disabled && contracts.length > 0 && (
          <ChevronDown size={14} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
        )}
      </button>
      {value && !disabled && (
        <button type="button" onClick={() => onChange(null)}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400">
          <X size={12} />
        </button>
      )}
      {open && !disabled && contracts.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-semibold uppercase">
            Số Hợp Đồng
          </div>
          <div className="max-h-48 overflow-y-auto">
            {contracts.map((c) => (
              <button key={c.id} type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-emerald-50 border-b border-slate-50 last:border-0 transition ${value?.id === c.id ? "bg-emerald-50" : ""}`}>
                <FileText size={12} className="text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-800 text-sm">{c.contract_no || c.code}</span>
                  <p className="text-xs text-slate-400 truncate">{c.name}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${c.status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {c.status}
                </span>
                {value?.id === c.id && <Check size={12} className="text-emerald-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Add / Edit Modal                                            */
/* ─────────────────────────────────────────────────────────── */
interface ModalProps {
  mode: "add" | "edit";
  initial?: SLASetting | null;
  customers: Customer[];
  onClose: () => void;
  onSave: () => void;
}

function SlaModal({ mode, initial, customers, onClose, onSave }: ModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Per-priority rows: L1, L2, L3, L4
  const [rows, setRows] = useState<Record<string, { response: string; resolve: string }>>({
    L1: { response: "10",   resolve: "180" },
    L2: { response: "60",   resolve: "1440" },
    L3: { response: "1440", resolve: "10080" },
    L4: { response: "1440", resolve: "43200" },
  });

  const [saving, setSaving] = useState(false);

  /* Prefill edit mode */
  useEffect(() => {
    if (mode === "edit" && initial) {
      // Find the customer and contract from initial data
      const cust = customers.find((c) => c.id === initial.customer_id) || null;
      setSelectedCustomer(cust);
      // rows: we only have one priority per record — prefill that row
      setRows((r) => ({
        ...r,
        [initial.priority]: {
          response: String(initial.response_time),
          resolve:  String(initial.resolve_time),
        },
      }));
    }
  }, []);

  /* Load contracts when customer selected */
  useEffect(() => {
    if (!selectedCustomer) { setContracts([]); setSelectedContract(null); return; }
    setLoadingContracts(true);
    fetchContractsByCustomer(selectedCustomer.id)
      .then(setContracts)
      .finally(() => setLoadingContracts(false));
  }, [selectedCustomer]);

  const setRow = (priority: string, field: "response" | "resolve", val: string) => {
    setRows((r) => ({ ...r, [priority]: { ...r[priority], [field]: val } }));
  };

  const handleSave = async () => {
    if (!selectedCustomer) { alert("Vui lòng chọn khách hàng"); return; }

    setSaving(true);
    try {
      if (mode === "edit" && initial) {
        // Edit: update only the matching priority row
        await saveSLASetting({
          id:             initial.id,
          customer_id:    selectedCustomer.id,
          customer_name:  selectedCustomer.name,
          contract_id:    selectedContract?.id || null,
          contract_no:    selectedContract?.contract_no || selectedContract?.code || null,
          priority:       initial.priority,
          response_time:  parseInt(rows[initial.priority].response) || 0,
          resolve_time:   parseInt(rows[initial.priority].resolve) || 0,
        });
      } else {
        // Add: insert one row per priority that has values
        for (const p of PRIORITIES) {
          const slaId = await generateSlaId();
          await saveSLASetting({
            sla_id:         slaId,
            customer_id:    selectedCustomer.id,
            customer_name:  selectedCustomer.name,
            contract_id:    selectedContract?.id || null,
            contract_no:    selectedContract?.contract_no || selectedContract?.code || null,
            priority:       p,
            response_time:  parseInt(rows[p].response) || 0,
            resolve_time:   parseInt(rows[p].resolve) || 0,
          });
        }
      }
      onSave();
    } catch (err: any) {
      alert("Lỗi khi lưu SLA: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const priorityToEdit = mode === "edit" && initial ? [initial.priority] : PRIORITIES;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{mode === "add" ? "Thêm Cấu Hình SLA" : "Chỉnh Sửa SLA"}</h2>
              <p className="text-xs text-slate-400">Thiết lập thời gian phản hồi và giải quyết theo độ ưu tiên</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Khách Hàng <span className="text-red-500 normal-case">*</span>
            </label>
            <CustomerPicker customers={customers} value={selectedCustomer} onChange={setSelectedCustomer} loading={false} />
          </div>

          {/* Contract */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Số Hợp Đồng</label>
            <ContractPicker
              contracts={contracts} value={selectedContract}
              onChange={setSelectedContract} loading={loadingContracts}
              disabled={!selectedCustomer}
            />
          </div>

          {/* SLA Table */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Thời Gian SLA (phút)
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-semibold uppercase">
                    <th className="px-4 py-2.5 text-left">Priority</th>
                    <th className="px-4 py-2.5 text-right">Response time (phút)</th>
                    <th className="px-4 py-2.5 text-right">Resolve time (phút)</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityToEdit.map((p, i) => {
                    const meta = PRIORITY_META[p];
                    return (
                      <tr key={p} className={`border-t border-slate-100 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                        <td className="px-4 py-2.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number" min={0}
                            value={rows[p].response}
                            onChange={(e) => setRow(p, "response", e.target.value)}
                            className="w-full text-right px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number" min={0}
                            value={rows[p].resolve}
                            onChange={(e) => setRow(p, "resolve", e.target.value)}
                            className="w-full text-right px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              💡 Tip: 60 phút = 1 giờ · 1440 phút = 1 ngày · 10080 = 1 tuần
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} type="button"
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving} type="button"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
            ) : (
              <><Save size={14} /> Lưu SLA</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Main Page                                                   */
/* ─────────────────────────────────────────────────────────── */
export default function SlaPage() {
  const [settings, setSettings] = useState<SLASetting[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<SLASetting | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, c] = await Promise.all([fetchSLASettings(), fetchCustomers()]);
    setSettings(s);
    setCustomers(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, slaId: string) => {
    if (!confirm(`Xóa cấu hình ${slaId}?`)) return;
    const res = await deleteSLASetting(id);
    if (!res.success) { alert("Lỗi xóa: " + res.error); return; }
    setSettings((s) => s.filter((x) => x.id !== id));
  };

  const filtered = settings.filter((s) => {
    const matchSearch =
      !search ||
      (s.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.contract_no || "").toLowerCase().includes(search.toLowerCase()) ||
      s.sla_id.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === "all" || s.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  return (
    <MainLayout>
      <Header title="Quản lý SLA" description="Thiết lập SLA cho từng hợp đồng khách hàng theo mức độ ưu tiên" />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {PRIORITIES.map((p) => {
          const meta = PRIORITY_META[p];
          const count = settings.filter((s) => s.priority === p).length;
          return (
            <div key={p} className={`rounded-xl border ${meta.border} ${meta.bg} p-4 flex items-center gap-3`}>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${meta.color}`}>{count}</p>
                <p className="text-xs text-slate-400 mt-0.5">cấu hình</p>
              </div>
              <Shield size={28} className={`${meta.color} opacity-30`} />
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Tìm theo khách hàng, số HĐ, SLA ID..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Priority filter */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterPriority("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${filterPriority === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >Tất cả</button>
            {PRIORITIES.map((p) => (
              <button key={p}
                onClick={() => setFilterPriority(filterPriority === p ? "all" : p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  filterPriority === p
                    ? `${PRIORITY_META[p].bg} ${PRIORITY_META[p].color} border ${PRIORITY_META[p].border}`
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >{p}</button>
            ))}
          </div>

          <button
            onClick={() => { setEditTarget(null); setModalMode("add"); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
          >
            <Plus size={15} /> Thêm SLA
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">SLA ID</th>
                <th className="px-4 py-3 text-left">Customer Name</th>
                <th className="px-4 py-3 text-left">Contract No</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-right">Response time (minutes)</th>
                <th className="px-4 py-3 text-right">Resolve time (minutes)</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-sm">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <Shield size={40} className="opacity-40" />
                      <div>
                        <p className="font-semibold text-slate-400">Chưa có cấu hình SLA</p>
                        <p className="text-xs mt-0.5">Bấm "Thêm SLA" để thiết lập SLA cho hợp đồng</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => {
                  const meta = PRIORITY_META[s.priority] || PRIORITY_META["L4"];
                  return (
                    <tr key={s.id}
                      className={`border-t border-slate-100 hover:bg-slate-50 transition ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                      {/* SLA ID */}
                      <td className="px-5 py-3">
                        <span className="font-bold text-blue-600 font-mono">{s.sla_id}</span>
                      </td>
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                            <Building2 size={11} className="text-slate-400" />
                          </div>
                          <span className="font-medium text-slate-700 truncate max-w-[180px]">
                            {s.customer_name || "—"}
                          </span>
                        </div>
                      </td>
                      {/* Contract No */}
                      <td className="px-4 py-3">
                        {s.contract_no ? (
                          <div className="flex items-center gap-1.5">
                            <FileText size={12} className="text-emerald-500" />
                            <span className="font-semibold text-slate-700">{s.contract_no}</span>
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.color} ${meta.border} border`}>
                          {s.priority}
                        </span>
                      </td>
                      {/* Response time */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-slate-800">{s.response_time.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">phút</span>
                      </td>
                      {/* Resolve time */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-slate-800">{s.resolve_time.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">phút</span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditTarget(s); setModalMode("edit"); }}
                            className="p-1.5 hover:bg-blue-100 rounded-lg transition text-slate-400 hover:text-blue-600"
                            title="Sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.sla_id)}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition text-slate-400 hover:text-red-500"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
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

        {/* Footer count */}
        {!loading && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
            Hiển thị {filtered.length} / {settings.length} cấu hình SLA
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <SlaModal
          mode={modalMode}
          initial={editTarget}
          customers={customers}
          onClose={() => { setModalMode(null); setEditTarget(null); }}
          onSave={() => { setModalMode(null); setEditTarget(null); load(); }}
        />
      )}
    </MainLayout>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Search, Building2, Check, FileText } from "lucide-react";
import { createTicket } from "@/lib/ticket-operations";
import { fetchCustomers } from "@/lib/customer-operations";
import { fetchContractsByCustomer } from "@/lib/contract-operations";
import type { Customer } from "@/lib/customer-operations";
import type { Contract } from "@/lib/contract-operations";

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ticketId: string) => void;
}

/* ── Static lists ─────────────────────────────────────────── */
const TT_TYPE_OPTIONS    = ["Technical support", "Implementation", "Health-Check", "Consultation"];
const CONTRACT_SCOPE_OPT = ["In scope", "Out scope", "Presale"];
const CATEGORY_OPTIONS   = ["Hardware", "Software", "Network", "Security", "Cloud", "Other"];
const PRIORITY_OPTIONS   = ["L1(Critical)", "L2(Major)", "L3(Minor)", "L4(Warning)"];
const TT_STATUS_OPTIONS  = ["In progress", "On Hold", "Reporting", "Cancel", "Completed"];
const SLA_STATUS_OPTIONS = ["Under SLA", "Going to breach SLA", "Failure SLA"];
const STAFF_LIST = [
  "Nguyễn Văn Quang", "Trần Thị Minh", "Lê Thị Linh", "Phạm Văn Hùng",
  "Võ Thị Thu Hà", "Đặng Minh Tuấn", "Hồ Văn Thành", "Cao Thị Phương",
  "Trương Quốc Bảo", "Lý Thanh Tùng",
];

/* ── Customer search dropdown ─────────────────────────────── */
function CustomerSelect({
  customers, value, onChange, loading,
}: {
  customers: Customer[]; value: Customer | null;
  onChange: (c: Customer | null) => void; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-4 py-2.5 border rounded-lg text-left flex items-center justify-between text-sm transition outline-none
          ${value ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}
          focus:ring-2 focus:ring-blue-500`}
      >
        <span className="flex items-center gap-2 truncate">
          {loading ? (
            <span className="text-slate-400">Đang tải...</span>
          ) : value ? (
            <>
              <Building2 size={14} className="text-blue-500 shrink-0" />
              <span className="font-medium text-slate-800 truncate">{value.name}</span>
              <span className="text-xs text-slate-400 shrink-0">{value.code}</span>
            </>
          ) : (
            <span className="text-slate-400">Tìm kiếm khách hàng...</span>
          )}
        </span>
        <ChevronDown size={15} className={`text-slate-400 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition"
        >
          <X size={13} />
        </button>
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus type="text" placeholder="Tìm theo tên hoặc mã..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">Không tìm thấy khách hàng</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id} type="button"
                  onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition text-sm ${value?.id === c.id ? "bg-blue-50" : ""}`}
                >
                  <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                    <Building2 size={13} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.code} · {c.type || "—"}</div>
                  </div>
                  {value?.id === c.id && <Check size={14} className="text-blue-500 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Contract dropdown (lọc theo customer) ────────────────── */
function ContractSelect({
  contracts, value, onChange, loading, disabled,
}: {
  contracts: Contract[]; value: Contract | null;
  onChange: (c: Contract | null) => void; loading: boolean; disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Reset khi disabled thay đổi
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full px-4 py-2.5 border rounded-lg text-left flex items-center justify-between text-sm transition outline-none
          ${disabled ? "bg-slate-50 border-slate-100 cursor-not-allowed" : ""}
          ${!disabled && value ? "border-emerald-400 bg-emerald-50" : ""}
          ${!disabled && !value ? "border-slate-200 bg-white hover:bg-slate-50" : ""}
          focus:ring-2 focus:ring-emerald-500`}
      >
        <span className="flex items-center gap-2 truncate">
          {loading ? (
            <>
              <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-400 text-xs">Đang tải hợp đồng...</span>
            </>
          ) : disabled ? (
            <span className="text-slate-300">Chọn khách hàng trước</span>
          ) : value ? (
            <>
              <FileText size={14} className="text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-800 shrink-0">{value.contract_no || value.code}</span>
              <span className="text-xs text-slate-500 truncate">— {value.name}</span>
            </>
          ) : contracts.length === 0 ? (
            <span className="text-slate-400 text-xs">Không có hợp đồng cho khách hàng này</span>
          ) : (
            <span className="text-slate-400">Chọn số hợp đồng...</span>
          )}
        </span>
        {!disabled && contracts.length > 0 && (
          <ChevronDown size={15} className={`text-slate-400 shrink-0 transition ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition"
        >
          <X size={13} />
        </button>
      )}

      {open && !disabled && contracts.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide flex justify-between">
            <span>Số HĐ</span>
            <span>{contracts.length} hợp đồng</span>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {contracts.map((c) => (
              <button
                key={c.id} type="button"
                onClick={() => { onChange(c); setOpen(false); }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-emerald-50 transition border-b border-slate-50 last:border-0
                  ${value?.id === c.id ? "bg-emerald-50" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{c.contract_no || c.code}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      c.status === "Active" ? "bg-green-100 text-green-700" :
                      c.status === "Expired" ? "bg-red-100 text-red-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>{c.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{c.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {c.start_date ? `${c.start_date} → ${c.end_date || "?"}` : "Không có ngày"}
                    {c.owner_name ? ` · ${c.owner_name}` : ""}
                  </div>
                </div>
                {value?.id === c.id && <Check size={14} className="text-emerald-600 shrink-0 mt-1" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Multi-select staff ───────────────────────────────────── */
function MultiStaffSelect({
  label, value, onChange, colorClass = "bg-blue-100 text-blue-700",
}: {
  label: string; value: string[];
  onChange: (v: string[]) => void; colorClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (p: string) =>
    onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-left flex items-center justify-between text-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition"
      >
        <span className="text-slate-500">
          {value.length === 0 ? `Chọn ${label}...` : `${value.length} người đã chọn`}
        </span>
        <ChevronDown size={15} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {STAFF_LIST.map((person) => (
            <label key={person} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
              <input
                type="checkbox" checked={value.includes(person)} onChange={() => toggle(person)}
                className="w-4 h-4 rounded border-slate-300 accent-blue-500 cursor-pointer"
              />
              <span className="text-sm text-slate-700">{person}</span>
            </label>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((p) => (
            <span key={p} className={`px-2.5 py-1 ${colorClass} rounded-full text-xs font-medium flex items-center gap-1.5`}>
              {p}
              <button type="button" onClick={() => toggle(p)} className="hover:opacity-70"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Select helper ────────────────────────────────────────── */
function FormSelect({ label, name, value, onChange, options, required }: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </label>
      <select
        name={name} value={value} onChange={onChange}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">— Chọn —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ── Form initial state ───────────────────────────────────── */
const EMPTY_FORM = {
  title: "", description: "",
  ttType: "", contractScope: "", category: "", priority: "",
  creatorName: STAFF_LIST[0],
  assigned: [] as string[], following: [] as string[],
  ttStatus: "In progress", slaStatus: "", slaTime: "",
  startTime: "", endTime: "", closeTime: "",
  holdTime: "", holdReason: "", remark: "", documentLink: "",
};

/* ── Main modal ───────────────────────────────────────────── */
export default function NewTicketModal({ isOpen, onClose, onSuccess }: NewTicketModalProps) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Load customers khi modal mở */
  useEffect(() => {
    if (!isOpen) return;
    setLoadingCustomers(true);
    fetchCustomers()
      .then(setCustomers)
      .finally(() => setLoadingCustomers(false));
  }, [isOpen]);

  /* Load contracts khi customer thay đổi */
  useEffect(() => {
    if (!selectedCustomer) {
      setContracts([]);
      setSelectedContract(null);
      return;
    }
    setLoadingContracts(true);
    setSelectedContract(null);
    fetchContractsByCustomer(selectedCustomer.id)
      .then(setContracts)
      .finally(() => setLoadingContracts(false));
  }, [selectedCustomer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { alert("Vui lòng nhập tiêu đề ticket"); return; }
    if (!selectedCustomer)      { alert("Vui lòng chọn khách hàng");       return; }

    setSubmitting(true);
    try {
      const result = await createTicket({
        ...formData,
        customerId:    selectedCustomer.id,
        customerName:  selectedCustomer.name,
        customerCode:  selectedCustomer.code,
        contractId:    selectedContract?.id    || null,
        contractNo:    selectedContract?.contract_no || selectedContract?.code || null,
        contractName:  selectedContract?.name  || null,
      });

      if (result.success) {
        alert(`✅ Tạo ticket thành công: ${result.ticketId}`);
        setFormData(EMPTY_FORM);
        setSelectedCustomer(null);
        setSelectedContract(null);
        onSuccess?.(result.ticketId!);
        onClose();
      } else {
        alert(`❌ Lỗi: ${result.error}`);
      }
    } catch (err) {
      alert("Đã xảy ra lỗi. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tạo Ticket Mới</h2>
            <p className="text-xs text-slate-400 mt-0.5">Điền đầy đủ thông tin để tạo ticket hỗ trợ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ─ Tiêu đề ─ */}
          <div>
            <label className={labelCls}>Tiêu đề <span className="text-red-500 normal-case">*</span></label>
            <input
              type="text" name="title" value={formData.title} onChange={handleChange}
              placeholder="Mô tả ngắn gọn vấn đề..." required className={inputCls}
            />
          </div>

          {/* ─ Mô tả ─ */}
          <div>
            <label className={labelCls}>Mô tả chi tiết</label>
            <textarea
              name="description" value={formData.description} onChange={handleChange}
              placeholder="Mô tả chi tiết vấn đề, bước tái hiện lỗi..."
              rows={3} className={`${inputCls} resize-none`}
            />
          </div>

          {/* ─ Khách hàng ─ */}
          <div>
            <label className={labelCls}>
              Khách Hàng <span className="text-red-500 normal-case">*</span>
            </label>
            <CustomerSelect
              customers={customers} value={selectedCustomer}
              onChange={setSelectedCustomer} loading={loadingCustomers}
            />
            {selectedCustomer && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                <span>📍 {selectedCustomer.khu_vuc || "—"}</span>
                <span>📞 {selectedCustomer.phone || "—"}</span>
                <span>👤 {selectedCustomer.phu_trach || "—"}</span>
                <span className={`font-medium ${selectedCustomer.tinh_trang === "Active" ? "text-green-600" : "text-red-500"}`}>
                  ● {selectedCustomer.tinh_trang || "Active"}
                </span>
              </div>
            )}
          </div>

          {/* ─ Hợp đồng (Contract No) ─ */}
          <div>
            <label className={labelCls}>
              Số Hợp Đồng (Contract No)
              {selectedCustomer && contracts.length > 0 && (
                <span className="ml-2 text-emerald-600 normal-case font-normal">
                  — {contracts.length} hợp đồng
                </span>
              )}
            </label>
            <ContractSelect
              contracts={contracts}
              value={selectedContract}
              onChange={setSelectedContract}
              loading={loadingContracts}
              disabled={!selectedCustomer}
            />
            {selectedContract && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                <span>📄 <span className="font-semibold text-slate-700">{selectedContract.contract_no || selectedContract.code}</span></span>
                <span>📅 {selectedContract.start_date || "?"} → {selectedContract.end_date || "?"}</span>
                <span>🔖 {selectedContract.contract_type || "—"}</span>
                <span className={`font-medium ${selectedContract.status === "Active" ? "text-green-600" : "text-red-500"}`}>
                  ● {selectedContract.status}
                </span>
              </div>
            )}
          </div>

          {/* ─ TT Type + Contract Scope ─ */}
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="TT Type" name="ttType" value={formData.ttType} onChange={handleChange} options={TT_TYPE_OPTIONS} required />
            <FormSelect label="Contract Scope" name="contractScope" value={formData.contractScope} onChange={handleChange} options={CONTRACT_SCOPE_OPT} />
          </div>

          {/* ─ Category + Priority ─ */}
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Category" name="category" value={formData.category} onChange={handleChange} options={CATEGORY_OPTIONS} required />
            <FormSelect label="Priority" name="priority" value={formData.priority} onChange={handleChange} options={PRIORITY_OPTIONS} required />
          </div>

          {/* ─ TT Status + SLA Status ─ */}
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="TT Status" name="ttStatus" value={formData.ttStatus} onChange={handleChange} options={TT_STATUS_OPTIONS} />
            <FormSelect label="SLA Status" name="slaStatus" value={formData.slaStatus} onChange={handleChange} options={SLA_STATUS_OPTIONS} />
          </div>

          {/* ─ Creator ─ */}
          <div>
            <label className={labelCls}>Người tạo</label>
            <select name="creatorName" value={formData.creatorName} onChange={handleChange} className={inputCls}>
              {STAFF_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* ─ Assigned + Following ─ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Assigned To <span className="text-red-500 normal-case">*</span></label>
              <MultiStaffSelect
                label="nhân viên xử lý" value={formData.assigned}
                onChange={(v) => setFormData((p) => ({ ...p, assigned: v }))}
                colorClass="bg-blue-100 text-blue-700"
              />
            </div>
            <div>
              <label className={labelCls}>Following</label>
              <MultiStaffSelect
                label="người theo dõi" value={formData.following}
                onChange={(v) => setFormData((p) => ({ ...p, following: v }))}
                colorClass="bg-purple-100 text-purple-700"
              />
            </div>
          </div>

          {/* ─ SLA Time ─ */}
          <div>
            <label className={labelCls}>SLA Time</label>
            <input type="text" name="slaTime" value={formData.slaTime} onChange={handleChange}
              placeholder="VD: 4h, 2h 30m, 24h" className={inputCls} />
          </div>

          {/* ─ Thời gian ─ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Time</label>
              <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>TT Close Time</label>
              <input type="datetime-local" name="closeTime" value={formData.closeTime} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Hold Time</label>
              <input type="text" name="holdTime" value={formData.holdTime} onChange={handleChange} placeholder="VD: 30m, 2h" className={inputCls} />
            </div>
          </div>

          {/* ─ Hold Reason ─ */}
          <div>
            <label className={labelCls}>Hold Reason</label>
            <textarea name="holdReason" value={formData.holdReason} onChange={handleChange}
              placeholder="Lý do tạm dừng ticket..." rows={2} className={`${inputCls} resize-none`} />
          </div>

          {/* ─ Remark ─ */}
          <div>
            <label className={labelCls}>Remark</label>
            <textarea name="remark" value={formData.remark} onChange={handleChange}
              placeholder="Ghi chú thêm..." rows={2} className={`${inputCls} resize-none`} />
          </div>

          {/* ─ Document Link ─ */}
          <div>
            <label className={labelCls}>Document Link</label>
            <input type="url" name="documentLink" value={formData.documentLink} onChange={handleChange}
              placeholder="https://..." className={inputCls} />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 text-sm font-medium transition">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : "Tạo Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

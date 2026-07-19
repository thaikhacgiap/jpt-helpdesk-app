"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/layout/main-layout";
import TicketFormModal from "./ticket-form-modal";
import type { TicketData } from "./ticket-form-modal";
import { fetchTickets } from "@/lib/ticket-operations";
import {
  Plus, Trash2, Search, ChevronDown, Pencil, MoreVertical, X,
  Download, SlidersHorizontal, RotateCcw, Settings, ChevronLeft, ChevronRight,
  FileText, Activity, Clock, AlertTriangle, CheckCircle2
} from "lucide-react";

/* ─── Dropdown options ─────────────────────────────────────── */
const TT_TYPE_OPTIONS = ["Technical support", "Implementation", "Health-Check", "Consultation"];
const CONTRACT_SCOPE_OPTIONS = ["In scope", "Out scope", "Presale"];
const CATEGORY_OPTIONS = ["Hardware", "Software", "Network", "Security", "Cloud", "Other"];
const PRIORITY_OPTIONS = ["L1(Critical)", "L2(Major)", "L3(Minor)", "L4(Warning)"];
const TT_STATUS_OPTIONS = ["In progress", "On Hold", "Reporting", "Cancel", "Completed"];
const SLA_STATUS_OPTIONS = ["Under SLA", "Going to breach SLA", "Failure SLA"];

/* ─── Types ────────────────────────────────────────────────── */
interface Ticket {
  id: string;
  ticket_id: string;
  title: string;
  description?: string;
  customer_id?: string;
  customer_name?: string;
  contract_no?: string;
  tt_type?: string;
  contract_scope?: string;
  category?: string;
  priority?: string;
  creator_name?: string;
  assigned?: string;
  following?: string;
  tt_status?: string;
  progress?: string;
  hold_time?: string;
  holdTime?: string;
  unhold_time?: string;
  hold_reason?: string;
  created_time?: string;
  start_time?: string;
  startTime?: string;
  event_time?: string;
  end_time?: string;
  endTime?: string;
  tt_close_time?: string;
  sla_time?: string;
  sla_status?: string;
  remark?: string;
}

interface Filters {
  tt_type: string;
  contract_scope: string;
  category: string;
  priority: string;
  tt_status: string;
  sla_status: string;
}

/* ─── Dropdown component ───────────────────────────────────── */
function FilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap ${
          value
            ? "border-blue-400 bg-blue-50/50 text-blue-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        {value || label}
        {value ? (
          <X
            size={11}
            className="ml-0.5 text-blue-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
          />
        ) : (
          <ChevronDown size={11} className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[150px] animate-in fade-in slide-in-from-top-1 duration-100 animate-out fade-out duration-100">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 transition ${
                value === opt ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function TicketsPage() {
  const [modalMode, setModalMode] = useState<"create" | "view" | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | undefined>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>({
    tt_type: "",
    contract_scope: "",
    category: "",
    priority: "",
    tt_status: "",
    sla_status: "",
  });

  // On-behalf ticket linking states
  const [linkedRequestDbId, setLinkedRequestDbId] = useState<string | null>(null);
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { loadTickets(); }, []);

  // Check query params for on-behalf ticket creation or ticket search
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      const requestTicketId = params.get("requestTicketId");
      const searchQuery = params.get("search");

      if (searchQuery) {
        setSearch(searchQuery);
        // Clean URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (action === "create" && requestTicketId) {
        const customerId = params.get("customerId") || "";
        const title = params.get("title") || "";
        const description = params.get("description") || "";
        const priority = params.get("priority") || "";
        const category = params.get("category") || "";
        const requestDbId = params.get("requestDbId") || "";

        setLinkedRequestDbId(requestDbId);
        setLinkedCustomerId(customerId);

        import("@/lib/customer-operations").then(async ({ fetchCustomerById }) => {
          let customerName = "";
          if (customerId) {
            try {
              const cust = await fetchCustomerById(customerId);
              if (cust) customerName = cust.name;
            } catch (err) {
              console.error(err);
            }
          }

          setSelectedTicket({
            id: "",
            ticket_id: "",
            title: title,
            description: description,
            customer_id: customerId,
            customer_name: customerName,
            priority: priority === "Critical" ? "L1(Critical)" : 
                      priority === "High" ? "L2(Major)" : 
                      priority === "Medium" ? "L3(Minor)" : "L4(Warning)",
            category: category === "Technical" ? "Software" : "Other",
            remark: `Tạo từ yêu cầu: ${requestTicketId}`,
          } as any);

          setModalMode("create");

          // Clean URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      }
    }
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await fetchTickets();
      setTickets(data as Ticket[]);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnSuccess = async () => {
    await loadTickets();

    if (linkedRequestDbId && linkedCustomerId) {
      try {
        const allTickets = await fetchTickets();
        const customerTickets = allTickets.filter(t => t.customer_id === linkedCustomerId);
        if (customerTickets.length > 0) {
          // The newest created ticket will be the first one in the list (since fetchTickets orders by created_at desc)
          const newTicketId = customerTickets[0].ticket_id;
          const { updateServiceTicket } = await import("@/lib/portal-operations");
          await updateServiceTicket(linkedRequestDbId, { document_link: newTicketId });
          console.log("Successfully linked ticket", newTicketId, "to request", linkedRequestDbId);
        }
      } catch (err) {
        console.error("Failed to link ticket to customer request:", err);
      } finally {
        setLinkedRequestDbId(null);
        setLinkedCustomerId(null);
      }
    }
  };

  const setFilter = (key: keyof Filters) => (val: string) =>
    setFilters((f) => ({ ...f, [key]: val }));

  const filtered = tickets.filter((t) => {
    if (search && !Object.values(t).some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))) return false;
    if (filters.tt_type && t.tt_type !== filters.tt_type) return false;
    if (filters.contract_scope && t.contract_scope !== filters.contract_scope) return false;
    if (filters.category && t.category !== filters.category) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.tt_status && t.tt_status !== filters.tt_status) return false;
    if (filters.sla_status && t.sla_status !== filters.sla_status) return false;
    return true;
  });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const clearAllFilters = () =>
    setFilters({ tt_type: "", contract_scope: "", category: "", priority: "", tt_status: "", sla_status: "" });

  // Metric counts
  const totalCount = tickets.length;
  const inProgressCount = tickets.filter((t) => t.tt_status === "In progress").length;
  const onHoldCount = tickets.filter((t) => t.tt_status === "On Hold").length;
  const slaWarningCount = tickets.filter((t) => t.sla_status === "Going to breach SLA" || t.sla_status === "Failure SLA").length;
  const completedCount = tickets.filter((t) => t.tt_status === "Completed" || t.tt_status === "Closed").length;

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedTickets = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (num: number) => String(num).padStart(2, "0");
      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <MainLayout>
      {/* Header Block */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản Lý Ticket</h1>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý và theo dõi tất cả các ticket hỗ trợ</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-2 transition shadow-sm">
            <Download size={14} />
            Xuất Excel
          </button>
          <button
            onClick={() => { setSelectedTicket(undefined); setModalMode("create"); }}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <Plus size={15} />
            Tạo Ticket
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Total Ticket */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 rounded-xl bg-blue-50 text-[#1e5883]">
            <FileText size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Tổng số ticket</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{totalCount}</span>
              <span className="text-[10px] font-medium text-slate-400">Tất cả</span>
            </div>
          </div>
        </div>

        {/* In progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 rounded-xl bg-green-50 text-green-600">
            <Activity size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Đang xử lý</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-800">{inProgressCount}</span>
              <span className="text-[10px] font-semibold text-green-600 flex items-center">↑ 20% so với tuần trước</span>
            </div>
          </div>
        </div>

        {/* On hold */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
            <Clock size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Chờ khách hàng</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-800">{onHoldCount}</span>
              <span className="text-[10px] font-semibold text-orange-500 flex items-center">↑ 15% so với tuần trước</span>
            </div>
          </div>
        </div>

        {/* SLA warn */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">SLA cảnh báo</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-800">{slaWarningCount}</span>
              <span className="text-[10px] font-semibold text-red-500 flex items-center">↑ 10% so với tuần trước</span>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle2 size={20} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Đã hoàn thành</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{completedCount}</span>
              <span className="text-[10px] font-medium text-blue-500">Tuần này</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Search and filters */}
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px] max-w-[340px]">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                type="text"
                placeholder="Tìm kiếm ticket, khách hàng, hợp đồng..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-4 pr-16 text-xs outline-none focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-400 transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                <span className="text-[10px] font-semibold border border-slate-200/80 rounded px-1.5 py-0.5 bg-white shadow-2xs">Ctrl+K</span>
                <Search size={14} />
              </div>
            </div>

            {/* Filter Dropdowns */}
            <FilterDropdown
              label="TT Type"
              options={TT_TYPE_OPTIONS}
              value={filters.tt_type}
              onChange={(v) => { setFilter("tt_type")(v); setCurrentPage(1); }}
            />
            <FilterDropdown
              label="Contract Scope"
              options={CONTRACT_SCOPE_OPTIONS}
              value={filters.contract_scope}
              onChange={(v) => { setFilter("contract_scope")(v); setCurrentPage(1); }}
            />
            <FilterDropdown
              label="Category"
              options={CATEGORY_OPTIONS}
              value={filters.category}
              onChange={(v) => { setFilter("category")(v); setCurrentPage(1); }}
            />
            <FilterDropdown
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={filters.priority}
              onChange={(v) => { setFilter("priority")(v); setCurrentPage(1); }}
            />
            <FilterDropdown
              label="TT Status"
              options={TT_STATUS_OPTIONS}
              value={filters.tt_status}
              onChange={(v) => { setFilter("tt_status")(v); setCurrentPage(1); }}
            />
            <FilterDropdown
              label="SLA Status"
              options={SLA_STATUS_OPTIONS}
              value={filters.sla_status}
              onChange={(v) => { setFilter("sla_status")(v); setCurrentPage(1); }}
            />

            <button className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition shadow-2xs">
              <SlidersHorizontal size={12} className="text-slate-400" />
              Thêm bộ lọc
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => { clearAllFilters(); setCurrentPage(1); }}
                className="h-9 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-600 flex items-center gap-1.5 transition"
              >
                <RotateCcw size={12} />
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Hiển thị <span className="text-slate-700">{filtered.length}</span> / {totalCount} ticket
          </div>
        </div>
      </div>

      <TicketFormModal
        mode={modalMode === "create" ? "create" : "view"}
        ticket={selectedTicket as TicketData | undefined}
        isOpen={modalMode !== null}
        onClose={() => { setModalMode(null); setSelectedTicket(undefined); }}
        onSuccess={handleOnSuccess}
      />

      {/* Redesigned Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-390px)] min-h-[300px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th>
                <th className="px-3 py-3.5 whitespace-nowrap">Ticket ID</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Tiêu đề</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Khách hàng</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Contract No</th>
                <th className="px-3 py-3.5 whitespace-nowrap">TT Type</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Contract Scope</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Category</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Priority</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Assigned</th>
                <th className="px-3 py-3.5 whitespace-nowrap">Cập nhật gần nhất</th>
                <th className="px-3 py-3.5 w-20 text-center whitespace-nowrap">
                  <Settings size={14} className="mx-auto text-slate-400" />
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4.5 h-4.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="font-semibold text-xs text-slate-600">Đang tải ticket...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-400 font-medium">
                    {tickets.length === 0
                      ? "Chưa có ticket nào. Tạo ticket mới để bắt đầu."
                      : "Không tìm thấy ticket phù hợp với bộ lọc."}
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket, index) => (
                  <tr key={ticket.id || index} className="hover:bg-slate-50/40 transition">
                    <td className="px-4 py-3.5 text-center"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></td>

                    {/* Ticket ID */}
                    <td
                      className="px-3 py-3.5 font-bold text-[#1e5883] cursor-pointer whitespace-nowrap hover:underline hover:text-blue-700"
                      onClick={() => { setSelectedTicket(ticket); setModalMode("view"); }}
                    >
                      {ticket.ticket_id}
                    </td>

                    {/* Title */}
                    <td className="px-3 py-3.5 text-slate-800 font-medium max-w-[200px] truncate">
                      {ticket.title}
                    </td>

                    {/* Customer Name */}
                    <td className="px-3 py-3.5 text-slate-700 font-semibold">{ticket.customer_name || "—"}</td>

                    {/* Contract No */}
                    <td className="px-3 py-3.5 text-slate-500 whitespace-nowrap">{ticket.contract_no || "—"}</td>

                    {/* TT Type — badge */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {ticket.tt_type ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-[#1e5883] border border-blue-100">
                          {ticket.tt_type}
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>

                    {/* Contract Scope */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {ticket.contract_scope ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          ticket.contract_scope === "In scope"
                            ? "bg-[#ecfbf5] text-[#27ae60] border border-[#c3f2dd]"
                            : ticket.contract_scope === "Out scope"
                            ? "bg-[#fef4f4] text-[#eb5757] border border-[#fdd1d1]"
                            : "bg-[#fcf8e3] text-[#f2994a] border border-[#faebcc]"
                        }`}>
                          {ticket.contract_scope}
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">{ticket.category || "—"}</td>

                    {/* Priority — badge */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      {ticket.priority ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          ticket.priority.toLowerCase().includes("l1")
                            ? "bg-[#fef4f4] text-[#eb5757] border border-[#fdd1d1]"
                            : ticket.priority.toLowerCase().includes("l2")
                            ? "bg-[#fff9e6] text-[#f2994a] border border-[#ffeeba]"
                            : ticket.priority.toLowerCase().includes("l3")
                            ? "bg-[#fafaf0] text-[#828282] border border-[#e0e0e0]"
                            : "bg-[#edf4fc] text-[#2f80ed] border border-[#d2e5f9]"
                        }`}>
                          {ticket.priority}
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>

                    {/* Assigned */}
                    <td className="px-3 py-3.5 text-slate-700 whitespace-nowrap">{ticket.assigned || "—"}</td>

                    {/* Updated At */}
                    <td className="px-3 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDateString(ticket.created_time || ticket.start_time)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <button
                          className="hover:text-blue-600 transition p-1 rounded hover:bg-blue-50"
                          title="Chỉnh sửa"
                          onClick={() => { setSelectedTicket(ticket); setModalMode("view"); }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button className="hover:text-red-500 transition p-1 rounded hover:bg-red-50" title="Xóa">
                          <Trash2 size={13} />
                        </button>
                        <button className="hover:text-slate-700 transition p-1 rounded hover:bg-slate-100" title="Thêm">
                          <MoreVertical size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between border border-slate-200 bg-white px-6 py-3.5 mt-4 rounded-2xl shadow-sm">
        {/* Left side: Rows per page selection */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-lg px-2 py-1 outline-none bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 transition cursor-pointer font-semibold"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="ml-2 font-medium">
            {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} – {Math.min(currentPage * pageSize, filtered.length)} của {filtered.length} ticket
          </span>
        </div>

        {/* Right side: Page numbers */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg border border-slate-200 transition ${
                currentPage === 1 ? "opacity-30 pointer-events-none" : "hover:bg-slate-50 text-slate-600"
              }`}
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isSelected = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition border ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg border border-slate-200 transition ${
                currentPage === totalPages ? "opacity-30 pointer-events-none" : "hover:bg-slate-50 text-slate-600"
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
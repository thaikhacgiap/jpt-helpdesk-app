"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import TicketFormModal, { TicketData } from "./ticket-form-modal";
import { fetchTickets } from "@/lib/ticket-operations";
import {
  Plus, Trash2, Search, ChevronDown, Pencil, MoreVertical, X,
  Download, SlidersHorizontal, RotateCcw, Settings, ChevronLeft, ChevronRight,
  Ticket
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
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full h-[44px] px-3.5 rounded-xl border text-left flex items-center justify-between transition shadow-2xs ${
          value
            ? "border-teal-500 bg-teal-50/10 text-teal-700 font-normal"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-normal text-slate-400 uppercase tracking-wider leading-tight">{label}</span>
          <span className={`text-sm font-normal mt-0.5 truncate ${value ? "text-teal-700" : "text-slate-700"}`}>
            {value || "Tất cả"}
          </span>
        </div>
        <ChevronDown size={13} className={`text-slate-400 shrink-0 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-100">
          <button
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
              !value ? "bg-teal-50 text-teal-700 font-normal" : "text-slate-700"
            }`}
          >
            Tất cả (Bỏ chọn)
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition ${
                value === opt ? "bg-teal-50 text-teal-700 font-normal" : "text-slate-700"
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

/* ─── Helpers ──────────────────────────────────────────────── */
const timeAgo = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 0) {
      return dateStr;
    }

    const intervals = [
      { label: "năm trước", seconds: 31536000 },
      { label: "tháng trước", seconds: 2592000 },
      { label: "ngày trước", seconds: 86400 },
      { label: "giờ trước", seconds: 3600 },
      { label: "phút trước", seconds: 60 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}`;
      }
    }
    return "vừa xong";
  } catch {
    return dateStr;
  }
};

const renderPriorityBadge = (priority?: string) => {
  if (!priority) return <span className="text-slate-400">—</span>;
  let dotColor = "bg-slate-400";
  let textColor = "text-slate-700";
  
  const pLower = priority.toLowerCase();
  if (pLower.includes("l1") || pLower.includes("critical")) {
    dotColor = "bg-red-500";
    textColor = "text-slate-800 font-normal";
  } else if (pLower.includes("l2") || pLower.includes("major")) {
    dotColor = "bg-orange-500";
    textColor = "text-slate-800 font-normal";
  } else if (pLower.includes("l3") || pLower.includes("minor") || pLower.includes("medium")) {
    dotColor = "bg-amber-500";
    textColor = "text-slate-800 font-normal";
  } else if (pLower.includes("l4") || pLower.includes("warning")) {
    dotColor = "bg-blue-500";
    textColor = "text-slate-800 font-normal";
  }

  let displayName = priority;
  const match = priority.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    displayName = match[1];
  }

  return (
    <span className="flex items-center gap-1.5 font-normal whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className={`text-sm ${textColor}`}>{displayName}</span>
    </span>
  );
};

const renderStatusBadge = (status?: string) => {
  if (!status) return <span className="text-slate-400">—</span>;
  let styles = "bg-slate-50 text-slate-600 border-slate-200";
  
  const sLower = status.toLowerCase();
  if (sLower === "new" || sLower === "in progress" || sLower === "in-progress") {
    styles = "bg-blue-50/70 text-blue-600 border-blue-100";
  } else if (sLower === "closed" || sLower === "completed") {
    styles = "bg-slate-100 text-slate-700 border-slate-200";
  } else if (sLower === "on hold" || sLower === "on-hold" || sLower === "hold") {
    styles = "bg-amber-50/70 text-amber-700 border-amber-200";
  } else if (sLower === "reporting") {
    styles = "bg-purple-50/70 text-purple-700 border-purple-200";
  } else if (sLower === "cancel") {
    styles = "bg-red-50/70 text-red-700 border-red-200";
  } else {
    styles = "bg-teal-50/70 text-teal-700 border-teal-200";
  }

  return (
    <span className={`px-2.5 py-1 rounded text-sm font-normal border ${styles} whitespace-nowrap`}>
      {status}
    </span>
  );
};

const renderSlaStatusBadge = (slaStatus?: string) => {
  if (!slaStatus) return <span className="text-slate-400">—</span>;
  let styles = "bg-slate-50 text-slate-600 border-slate-200";
  
  const sLower = slaStatus.toLowerCase();
  if (sLower.includes("under") || sLower.includes("in scope") || sLower.includes("in-scope")) {
    styles = "bg-green-50 text-green-600 border-green-100";
  } else if (sLower.includes("going") || sLower.includes("breach") || sLower.includes("warning")) {
    styles = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (sLower.includes("failure") || sLower.includes("out scope") || sLower.includes("out-scope")) {
    styles = "bg-red-50 text-red-600 border-red-100";
  }

  return (
    <span className={`px-2.5 py-1 rounded text-sm font-normal border ${styles} whitespace-nowrap`}>
      {slaStatus}
    </span>
  );
};

/* ─── Page ─────────────────────────────────────────────────── */
export default function TicketsPage() {
  const router = useRouter();
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

  // Column Visibility States
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const columnRef = useRef<HTMLTableHeaderCellElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    ticket_id: true,
    title: true,
    customer_name: true,
    contract_no: true,
    tt_type: true,
    contract_scope: true,
    category: true,
    priority: true,
    tt_status: true,
    sla_status: true,
    assigned: true,
    updated_at: true,
  });

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const getTicketStatusBadge = (status?: string) => {
    if (!status) return "bg-slate-50 text-slate-500 border border-slate-200";
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-700 border border-green-200";
      case "In progress":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Reporting":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "Cancel":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-slate-50 text-slate-500 border border-slate-200";
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnRef.current && !columnRef.current.contains(e.target as Node)) {
        setColumnDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length + 2;

  return (
    <MainLayout>
      {/* Header Block Banner */}
      <div className="flex items-center justify-between gap-3 mb-3 bg-gradient-to-r from-teal-800/90 via-teal-900/95 to-slate-900/95 backdrop-blur-md border border-teal-700/30 text-white py-3.5 px-5 rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.15)] flex items-center justify-between gap-4 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(20,184,166,0.15),transparent_60%)] pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shrink-0">
            <Ticket size={18} className="text-white" />
          </div>
          <div className="space-y-0 text-left">
            <h1 className="text-[18px] font-normal tracking-tight leading-tight text-white">Quản lý Ticket</h1>
            <p className="text-sm text-teal-200/70 font-normal leading-normal">Trang chủ &nbsp;/&nbsp; Ticket</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end relative z-10">
          {/* Search Input inside Header */}
          <div className="relative w-full max-w-[340px]">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              type="text"
              placeholder="Tìm kiếm ticket, khách hàng, hợp đồng..."
              className="h-9 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-14 text-sm text-white placeholder-white/40 outline-none focus:bg-white/10 focus:border-white/20 shadow-inner transition font-normal"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50">
              <Search size={14} />
            </div>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/40">
              <span className="text-[8px] font-normal border border-white/10 rounded px-1 py-0.5 bg-white/5 shadow-2xs">Ctrl + K</span>
            </div>
          </div>

          <button className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-normal flex items-center gap-1.5 transition cursor-pointer">
            <Download size={14} className="text-white" />
            Xuất Excel
          </button>
          
          <button
            onClick={() => router.push("/tickets/create")}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 border border-amber-300/40 text-slate-950 text-sm font-semibold flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer relative overflow-hidden"
          >
            <Plus size={14} className="text-slate-950" />
            <span>Tạo Ticket</span>
            <span className="absolute top-1 right-1 text-[8px] opacity-80 animate-pulse text-slate-900">✦</span>
          </button>
        </div>
      </div>

      {/* Grid Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-3">
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
        
        <div className="relative w-full flex gap-2">
          <button className="flex-1 h-[44px] flex items-center justify-between gap-1 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg px-3 text-sm font-normal text-slate-600 transition shadow-2xs">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal size={13} className="text-slate-400" />
              <span>Bộ lọc nâng cao</span>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </button>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { clearAllFilters(); setCurrentPage(1); }}
              className="h-[44px] px-3 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200/50 text-teal-700 flex items-center justify-center transition shadow-2xs"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Redesigned Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] min-h-[300px]">
          <table className="w-full text-sm text-left border-collapse font-normal">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="px-4 py-2.5 w-10 text-center sticky top-0 z-20 bg-slate-50 border-b border-slate-200"><input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" /></th>
                {visibleColumns.ticket_id && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Ticket ID
                  </th>
                )}
                {visibleColumns.title && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Tiêu đề
                  </th>
                )}
                {visibleColumns.customer_name && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Khách hàng
                  </th>
                )}
                {visibleColumns.contract_no && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Contract No
                  </th>
                )}
                {visibleColumns.tt_type && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    TT Type
                  </th>
                )}
                {visibleColumns.contract_scope && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Contract Scope
                  </th>
                )}
                {visibleColumns.category && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Category
                  </th>
                )}
                {visibleColumns.priority && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Priority
                  </th>
                )}
                {visibleColumns.tt_status && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    TT Status
                  </th>
                )}
                {visibleColumns.sla_status && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    SLA Status
                  </th>
                )}
                {visibleColumns.assigned && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Người xử lý
                  </th>
                )}
                {visibleColumns.updated_at && (
                  <th className="px-3 py-2.5 text-sm font-normal text-slate-700 normal-case leading-normal whitespace-nowrap sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    Cập nhật
                  </th>
                )}
                <th className="px-3 py-2.5 w-10 text-center whitespace-nowrap relative sticky top-0 z-20 bg-slate-50 border-b border-slate-200" ref={columnRef}>
                  <button 
                    onClick={() => setColumnDropdownOpen(o => !o)}
                    className="p-1 hover:bg-slate-100 rounded-lg transition"
                    title="Hiển thị cột"
                  >
                    <Settings size={14} className="mx-auto text-slate-500" />
                  </button>

                  {columnDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[200px] text-left space-y-1 normal-case font-normal">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cột hiển thị</span>
                      <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto custom-scrollbar">
                        {Object.entries({
                          ticket_id: "Ticket ID",
                          title: "Tiêu đề",
                          customer_name: "Khách hàng",
                          contract_no: "Contract No",
                          tt_type: "TT Type",
                          contract_scope: "Contract Scope",
                          category: "Category",
                          priority: "Priority",
                          tt_status: "Trạng thái",
                          sla_status: "Trạng thái SLA",
                          assigned: "Người xử lý",
                          updated_at: "Cập nhật",
                        }).map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded px-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={visibleColumns[key as keyof typeof visibleColumns]}
                              onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-normal">
              {loading ? (
                <tr>
                  <td colSpan={visibleCount} className="px-6 py-12 text-center text-slate-500 text-sm font-normal">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4.5 h-4.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-slate-600 font-normal">Đang tải ticket...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={visibleCount} className="px-6 py-12 text-center text-slate-400 text-sm font-normal">
                    {tickets.length === 0
                      ? "Chưa có ticket nào. Tạo ticket mới để bắt đầu."
                      : "Không tìm thấy ticket phù hợp với bộ lọc."}
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket, index) => (
                  <tr key={ticket.id || index} className="hover:bg-slate-50/40 transition text-sm font-normal">
                    <td className="px-4 py-2 text-center whitespace-nowrap"><input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" /></td>

                    {/* Ticket ID */}
                    {visibleColumns.ticket_id && (
                      <td
                        className="px-3 py-2 text-teal-600 cursor-pointer whitespace-nowrap hover:underline hover:text-teal-800 text-sm font-normal"
                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                      >
                        {ticket.ticket_id}
                      </td>
                    )}

                    {/* Title */}
                    {visibleColumns.title && (
                      <td className="px-3 py-2 text-slate-800 font-normal max-w-[220px] truncate whitespace-nowrap text-sm" title={ticket.title}>
                        {ticket.title}
                      </td>
                    )}

                    {/* Customer Name */}
                    {visibleColumns.customer_name && (
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap truncate max-w-[180px] text-sm font-normal" title={ticket.customer_name || ""}>
                        {ticket.customer_name || "—"}
                      </td>
                    )}

                    {/* Contract No */}
                    {visibleColumns.contract_no && (
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-sm font-normal">{ticket.contract_no || "—"}</td>
                    )}

                    {/* TT Type */}
                    {visibleColumns.tt_type && (
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-sm font-normal">
                        {ticket.tt_type || "—"}
                      </td>
                    )}

                    {/* Contract Scope */}
                    {visibleColumns.contract_scope && (
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-sm font-normal">
                        {ticket.contract_scope || "—"}
                      </td>
                    )}

                    {/* Category */}
                    {visibleColumns.category && (
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap text-sm font-normal">{ticket.category || "—"}</td>
                    )}

                    {/* Priority */}
                    {visibleColumns.priority && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderPriorityBadge(ticket.priority)}
                      </td>
                    )}

                    {/* TT Status */}
                    {visibleColumns.tt_status && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderStatusBadge(ticket.tt_status)}
                      </td>
                    )}

                    {/* SLA Status */}
                    {visibleColumns.sla_status && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {renderSlaStatusBadge(ticket.sla_status)}
                      </td>
                    )}

                    {/* Assigned */}
                    {visibleColumns.assigned && (
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap text-sm font-normal">{ticket.assigned || "—"}</td>
                    )}

                    {/* Updated At */}
                    {visibleColumns.updated_at && (
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap text-sm font-normal">
                        {timeAgo(ticket.created_time || ticket.start_time)}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <button
                          className="hover:text-teal-600 transition p-1.5 rounded-lg hover:bg-teal-50"
                          title="Chỉnh sửa"
                          onClick={() => router.push(`/tickets/${ticket.id}`)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button className="hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50" title="Xóa">
                          <Trash2 size={13} />
                        </button>
                        <button className="hover:text-slate-700 transition p-1.5 rounded-lg hover:bg-slate-100" title="Thêm">
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

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3 rounded-b-2xl">
          {/* Left side: Rows per page selection */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1 outline-none bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-400 transition cursor-pointer font-semibold"
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
                        ? "bg-teal-600 border-teal-600 text-white shadow-xs"
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
      </div>

      {modalMode && (
        <TicketFormModal
          mode={modalMode}
          ticket={selectedTicket}
          isOpen={!!modalMode}
          onClose={() => {
            setModalMode(null);
            setSelectedTicket(undefined);
          }}
          onSuccess={handleOnSuccess}
        />
      )}
    </MainLayout>
  );
}
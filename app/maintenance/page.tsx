"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus, Search, Wrench, X, CheckCircle2, Clock, RotateCcw, Pencil, Trash2, ClipboardList, Filter, ArrowUpDown, ArrowUp, ArrowDown, User, ChevronDown, Check } from "lucide-react";

import { fetchContractsByCustomer, fetchContracts, Contract } from "@/lib/contract-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";
import CustomerSearchSelect from "@/components/common/customer-search-select";
import StaffSearchSelect from "@/components/common/staff-search-select";

interface Task {
  id: string;
  parentId: string | null;
  name: string;
  assignees: string[];
  department: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
  orderIndex: number;
}

const getWeekOfYear = (dateStr: string): number => {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const dayOfYear = Math.floor(diff / oneDay);
  return Math.min(51, Math.floor(dayOfYear / 7));
};

const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(diff / oneDay);
};

const addMonths = (dateStr: string, months: number): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().substring(0, 10);
};

const getCycleStartDate = (cycleNum: string, ticketStart: string, config: any, cycleMeta: any) => {
  if (cycleMeta?.[cycleNum]?.startDate) {
    return cycleMeta[cycleNum].startDate;
  }
  const baseDate = config?.startDate || ticketStart?.substring(0, 10) || new Date().toISOString().substring(0, 10);
  const monthsToAdd = config?.interval === "yearly"
    ? (parseInt(cycleNum) - 1) * 12
    : config?.interval === "quarterly" 
    ? (parseInt(cycleNum) - 1) * 3 
    : (parseInt(cycleNum) - 1);
  return addMonths(baseDate, monthsToAdd);
};

const formatDateVN = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTimeVN = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const calculateCycleProgress = (tasks: Task[]) => {
  if (!tasks || tasks.length === 0) return 0;
  
  // Find parent tasks with subtasks
  const parentIdsWithChildren = new Set(
    tasks.map(t => t.parentId).filter(Boolean) as string[]
  );
  
  // Leaf tasks are subtasks OR parent tasks with no subtasks
  const leafTasks = tasks.filter(t => !parentIdsWithChildren.has(t.id));
  
  if (leafTasks.length === 0) return 0;
  
  const completed = leafTasks.filter(t => t.status === "Hoàn thành").length;
  return Math.round((completed / leafTasks.length) * 100);
};

// Helper: tính % tiến độ tổng thể (chỉ tính % nếu lần thực hiện hoàn thành 100%, trên tổng số lần thực hiện)
const calculatePlanProgress = (t: any): number => {
  const total = parseInt(t.hold_time) || 0;
  if (total <= 0) return 0;
  
  if (t.remark) {
    try {
      const parsed = JSON.parse(t.remark);
      const tasksData = parsed?.tasks || (parsed && !parsed.config ? parsed : null);
      if (tasksData && typeof tasksData === "object") {
        let completedCycles = 0;
        for (let i = 1; i <= total; i++) {
          const cycleTaskList = tasksData[String(i)] || [];
          if (calculateCycleProgress(cycleTaskList) === 100) {
            completedCycles++;
          }
        }
        return Math.min(100, Math.round((completedCycles / total) * 100));
      }
    } catch (e) {}
  }
  
  return parseInt(t.progress) || 0;
};

// Helper: xác định tình trạng (Completed nếu tất cả các kỳ hoàn thành, Processing nếu có kỳ đang làm hoặc chưa hoàn thành, New nếu mới tạo)
const getPlanStatus = (t: any, progressPercent: number): { label: string; statusKey: string; badgeClass: string; barClass: string } => {
  const total = parseInt(t.hold_time) || 0;
  
  if (t.tt_status === "On Hold") {
    return {
      label: "Tạm ngưng",
      statusKey: "On Hold",
      badgeClass: "bg-red-100 text-red-600",
      barClass: "from-rose-400 to-red-500",
    };
  }
  
  if (t.tt_status === "Closed") {
    return {
      label: "Đã đóng",
      statusKey: "Closed",
      badgeClass: "bg-slate-100 text-slate-700",
      barClass: "from-slate-400 to-slate-500",
    };
  }
  
  if (total > 0 && progressPercent === 100) {
    return {
      label: "Completed",
      statusKey: "Completed",
      badgeClass: "bg-green-100 text-green-700",
      barClass: "from-emerald-400 to-teal-500",
    };
  }
  
  if (progressPercent > 0 || t.tt_status === "In Progress" || t.tt_status === "Processing") {
    return {
      label: "Processing",
      statusKey: "Processing",
      badgeClass: "bg-yellow-100 text-yellow-700",
      barClass: "from-amber-400 to-orange-500",
    };
  }

  // Check if any tasks exist in remark and have started or completed
  if (t.remark) {
    try {
      const parsed = JSON.parse(t.remark);
      const tasksData = parsed?.tasks || (parsed && !parsed.config ? parsed : null);
      if (tasksData && typeof tasksData === "object") {
        for (const k in tasksData) {
          const list = tasksData[k] || [];
          if (list.some((task: Task) => task.status === "Đang thực hiện" || task.status === "Hoàn thành")) {
            return {
              label: "Processing",
              statusKey: "Processing",
              badgeClass: "bg-yellow-100 text-yellow-700",
              barClass: "from-amber-400 to-orange-500",
            };
          }
        }
      }
    } catch (e) {}
  }

  return {
    label: "Mới tạo",
    statusKey: "New",
    badgeClass: "bg-blue-100 text-blue-700",
    barClass: "from-blue-400 to-indigo-500",
  };
};

const DEFAULT_COL_WIDTHS: Record<string, number> = {
  id: 150,
  customer: 240,
  contract: 220,
  creator: 160,
  created_at: 160,
  hold_time: 90,
  status: 130,
  progress: 170,
  actions: 90,
};

const MIN_COL_WIDTHS: Record<string, number> = {
  id: 100,
  customer: 140,
  contract: 120,
  creator: 110,
  created_at: 120,
  hold_time: 70,
  status: 100,
  progress: 120,
  actions: 80,
};

const STORAGE_COL_WIDTHS_KEY = "jpt_maintenance_col_widths";

const STATUS_OPTIONS = [
  { key: "New", label: "Mới tạo", badgeClass: "bg-blue-100 text-blue-700 border border-blue-200" },
  { key: "Processing", label: "Processing", badgeClass: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
  { key: "Completed", label: "Completed", badgeClass: "bg-green-100 text-green-700 border border-green-200" },
  { key: "On Hold", label: "Tạm ngưng", badgeClass: "bg-red-100 text-red-600 border border-red-200" },
  { key: "Closed", label: "Đã đóng", badgeClass: "bg-slate-100 text-slate-700 border border-slate-200" },
];

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<NhanSu[]>([]);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [customerFilter, setCustomerFilter] = useState("All");
  const [timeScale, setTimeScale] = useState<"day" | "week" | "month">("month");
  const [sortField, setSortField] = useState<"customer" | "created_at" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Column Resizing state
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_COL_WIDTHS_KEY);
        if (saved) {
          return { ...DEFAULT_COL_WIDTHS, ...JSON.parse(saved) };
        }
      } catch (e) {}
    }
    return DEFAULT_COL_WIDTHS;
  });

  const resizingRef = useRef<{ colKey: string; startX: number; startWidth: number } | null>(null);

  const handleMouseDown = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey] || DEFAULT_COL_WIDTHS[colKey] || 120,
    };

    let latestWidths = { ...colWidths };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colKey, startX, startWidth } = resizingRef.current;
      const delta = moveEvent.clientX - startX;
      const minW = MIN_COL_WIDTHS[colKey] || 70;
      const newWidth = Math.max(minW, startWidth + delta);
      latestWidths = {
        ...latestWidths,
        [colKey]: newWidth,
      };
      setColWidths({ ...latestWidths });
    };

    const onMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem(STORAGE_COL_WIDTHS_KEY, JSON.stringify(latestWidths));
      } catch (e) {}
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleResetColWidths = () => {
    setColWidths(DEFAULT_COL_WIDTHS);
    try {
      localStorage.removeItem(STORAGE_COL_WIDTHS_KEY);
    } catch (e) {}
  };

  // Close status dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStatus = (key: string) => {
    setStatusFilter(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Count tickets per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      New: 0,
      Processing: 0,
      Completed: 0,
      "On Hold": 0,
      Closed: 0,
    };
    tickets.forEach(t => {
      const p = calculatePlanProgress(t);
      const s = getPlanStatus(t, p);
      if (counts[s.statusKey] !== undefined) {
        counts[s.statusKey]++;
      }
    });
    return counts;
  }, [tickets]);
  
  const [form, setForm] = useState({
    customerId: "",
    contractId: "",
    totalPeriods: 12,
    status: "New",
    description: "",
    creatorName: "",
  });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, customer:customers(id, name, code)")
        .or("tt_type.ilike.maintenance,ticket_id.ilike.BTR-%")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error loading maintenance tickets:", error);
      }
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

      const contrData = await fetchContracts();
      setAllContracts(contrData || []);

      const nhanSuData = await fetchNhanSu();
      setStaffList(nhanSuData || []);
    } catch (err) {
      console.error("Error loading reference data:", err);
    }
  };

  useEffect(() => {
    loadTickets();
    loadReferenceData();
  }, []);

  const handleSort = (field: "customer" | "created_at") => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    setForm(f => ({ ...f, customerId, contractId: "" }));
    if (customerId) {
      try {
        const matched = await fetchContractsByCustomer(customerId);
        setFilteredContracts(matched);
      } catch (err) {
        console.error("Error loading contracts for customer:", err);
        setFilteredContracts([]);
      }
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
      totalPeriods: 12,
      status: "New",
      description: "",
      creatorName: staffList[0]?.ten_nhan_su || "Admin",
    });
    setFilteredContracts([]);
    setIsModalOpen(true);
  };

  const handleEdit = async (plan: any) => {
    setEditingPlan(plan);
    setForm({
      customerId: plan.customer_id || "",
      contractId: plan.contract_id || "",
      totalPeriods: parseInt(plan.hold_time) || 12,
      status: plan.tt_status || "New",
      description: plan.description || "",
      creatorName: plan.creator_name || plan.created_by || plan.user_name || "",
    });
    if (plan.customer_id) {
      try {
        const matched = await fetchContractsByCustomer(plan.customer_id);
        setFilteredContracts(matched);
      } catch (err) {
        console.error("Error loading contracts for plan edit:", err);
        setFilteredContracts([]);
      }
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
      const custObj = customers.find(c => c.id === form.customerId);
      const contrObj = filteredContracts.find(c => c.id === form.contractId) || allContracts.find(c => c.id === form.contractId);

      const payload: any = {
        title: `Kế hoạch bảo trì - ${custObj?.name || "Khách hàng"}`,
        description: form.description,
        customer_id: form.customerId,
        customer_name: custObj?.name || null,
        contract_id: form.contractId || null,
        contract_no: contrObj?.contract_no || contrObj?.code || contrObj?.name || null,
        hold_time: String(form.totalPeriods),
        tt_status: form.status,
        creator_name: form.creatorName || null,
      };

      if (editingPlan) {
        await supabase
          .from("tickets")
          .update(payload)
          .eq("id", editingPlan.id);
      } else {
        const ticketId = await generateNextMaintenanceId();
        const todayStr = new Date().toISOString().substring(0, 10);
        const remarkData = {
          config: {
            interval: "monthly",
            startDate: todayStr
          },
          cycleMeta: {},
          tasks: {},
          recommendations: {}
        };

        await supabase
          .from("tickets")
          .insert([{
            ...payload,
            ticket_id: ticketId,
            tt_type: "Maintenance",
            start_time: new Date().toISOString(),
            sla_time: "1",
            progress: "0%",
            remark: JSON.stringify(remarkData),
          }]);
      }

      setIsModalOpen(false);
      setEditingPlan(null);
      setForm({
        customerId: "",
        contractId: "",
        totalPeriods: 12,
        status: "New",
        description: "",
        creatorName: "",
      });
      setFilteredContracts([]);
      loadTickets();
    } catch (err) {
      console.error("Error saving plan:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const list = tickets.filter(t => {
      const term = (search || "").toLowerCase().trim();
      const displayId = (t.ticket_id || "").replace(/^[A-Z]+-/, 'BTR-').toLowerCase();
      const idMatch = !term || displayId.includes(term) || (t.ticket_id || "").toLowerCase().includes(term);
      const custMatch = !term || (t.customer?.name || t.customer_name || "")?.toLowerCase().includes(term);
      const contrMatch = !term || (t.contract_no || t.contract?.contract_no || t.contract?.service || t.contract?.name || "")?.toLowerCase().includes(term);
      const creatorMatch = !term || (t.creator_name || t.created_by || t.user_name || "")?.toLowerCase().includes(term);
      
      const matchesSearch = !term || idMatch || custMatch || contrMatch || creatorMatch;
      
      const progressVal = calculatePlanProgress(t);
      const planStatus = getPlanStatus(t, progressVal);
      
      let matchesStatus = true;
      if (statusFilter && statusFilter.length > 0) {
        matchesStatus = statusFilter.some(sKey => {
          if (sKey === "Completed") {
            return planStatus.statusKey === "Completed" || t.tt_status === "Resolved" || t.tt_status === "Completed";
          } else if (sKey === "Processing") {
            return planStatus.statusKey === "Processing" || t.tt_status === "In Progress" || t.tt_status === "Processing";
          } else if (sKey === "New") {
            return planStatus.statusKey === "New" || t.tt_status === "New";
          } else {
            return planStatus.statusKey === sKey || t.tt_status === sKey;
          }
        });
      }

      const matchesCustomer = !customerFilter || customerFilter === "All" || customerFilter === "" || t.customer_id === customerFilter || (t.customer?.name === customerFilter) || (t.customer_name === customerFilter);

      return matchesSearch && matchesStatus && matchesCustomer;
    });

    if (sortField === "customer") {
      list.sort((a, b) => {
        const nameA = (a.customer?.name || a.customer_name || "").trim().toLowerCase();
        const nameB = (b.customer?.name || b.customer_name || "").trim().toLowerCase();
        const cmp = nameA.localeCompare(nameB, "vi");
        return sortOrder === "asc" ? cmp : -cmp;
      });
    } else if (sortField === "created_at") {
      list.sort((a, b) => {
        const timeA = new Date(a.created_at || a.created_time || a.start_time || 0).getTime();
        const timeB = new Date(b.created_at || b.created_time || b.start_time || 0).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
    }

    return list;
  }, [tickets, search, statusFilter, customerFilter, sortField, sortOrder]);

  const getTimelineYears = () => {
    const curYear = new Date().getFullYear();
    const yearSet = new Set<number>([curYear - 1, curYear, curYear + 1]);
    tickets.forEach((t: any) => {
      if (t.start_time) {
        const y = new Date(t.start_time).getFullYear();
        if (!isNaN(y) && y >= 2020 && y <= 2040) yearSet.add(y);
      }
    });
    return Array.from(yearSet).sort((a, b) => a - b);
  };
  const yearsList = getTimelineYears();

  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getTodayLinePercent = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const yearIdx = yearsList.indexOf(currentYear);
    if (yearIdx === -1) return -1;
    
    if (timeScale === "month") {
      const currentMonth = today.getMonth();
      const currentDate = today.getDate();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const globalMonthOffset = yearIdx * 12 + currentMonth + (currentDate / daysInMonth);
      return globalMonthOffset / (yearsList.length * 12);
    } else if (timeScale === "week") {
      const currentWeek = getWeekOfYear(today.toISOString());
      const globalWeekOffset = yearIdx * 52 + currentWeek;
      return globalWeekOffset / (yearsList.length * 52);
    } else {
      let daysBefore = 0;
      for (let i = 0; i < yearIdx; i++) {
        daysBefore += isLeapYear(yearsList[i]) ? 366 : 365;
      }
      const dayOfYear = getDayOfYear(today);
      let totalDays = 0;
      for (let i = 0; i < yearsList.length; i++) {
        totalDays += isLeapYear(yearsList[i]) ? 366 : 365;
      }
      return (daysBefore + dayOfYear) / totalDays;
    }
  };
  const todayLineFraction = getTodayLinePercent();

  useEffect(() => {
    if (activeTab === "timeline" && scrollContainerRef.current) {
      let attempts = 0;
      const scroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        
        const scrollWidth = container.scrollWidth;
        const containerWidth = container.clientWidth;
        
        // Wait for rendering to expand scrollWidth for wider timelines
        if (timeScale === "day" && scrollWidth < 10000 && attempts < 15) {
          attempts++;
          setTimeout(scroll, 100);
          return;
        }
        if (timeScale === "week" && scrollWidth < 2000 && attempts < 15) {
          attempts++;
          setTimeout(scroll, 100);
          return;
        }

        if (todayLineFraction >= 0) {
          const lineLeft = 378 + (scrollWidth - 378) * todayLineFraction;
          const targetScrollLeft = lineLeft - containerWidth / 2;
          container.scrollTo({
            left: Math.max(0, targetScrollLeft),
            behavior: "smooth"
          });
        }
      };

      const timer = setTimeout(scroll, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, timeScale, tickets, todayLineFraction]);

  const renderTimelineRows = () => {
    let limit = yearsList.length * 12;
    if (timeScale === "week") limit = yearsList.length * 52;
    if (timeScale === "day") {
      limit = yearsList.reduce((acc, y) => acc + (isLeapYear(y) ? 366 : 365), 0);
    }

    return filtered.map((t: any, idx: number) => {
      const segments: { type: "empty" | "cycle"; startMonth: number; span: number; cycleNum?: string; cycle?: any }[] = [];
      let currentIdx = 0;

      const totalCycles = parseInt(t.hold_time) || 1;
      let parsedConfig = { 
        interval: "monthly", 
        startDate: t.start_time ? t.start_time.substring(0, 10) : new Date().toISOString().substring(0, 10) 
      };
      let parsedMeta: any = {};
      let parsedTasks: any = {};
      if (t.remark) {
        try {
          const parsed = JSON.parse(t.remark);
          if (parsed && (parsed.tasks !== undefined || parsed.recommendations !== undefined)) {
            parsedConfig = parsed.config || parsedConfig;
            parsedMeta = parsed.cycleMeta || {};
            parsedTasks = parsed.tasks || {};
          }
        } catch (e) {}
      }

      const cycleRanges: any[] = [];

      if (timeScale === "month") {
        for (let i = 1; i <= totalCycles; i++) {
          const cycleNum = String(i);
          const plannedDate = getCycleStartDate(cycleNum, t.start_time, parsedConfig, parsedMeta);
          const date = new Date(plannedDate);
          if (!isNaN(date.getTime())) {
            const cycleYear = date.getFullYear();
            const yIdx = yearsList.indexOf(cycleYear);
            if (yIdx !== -1) {
              const startMn = yIdx * 12 + date.getMonth();
              const span = parsedConfig.interval === "yearly" ? 12 : parsedConfig.interval === "quarterly" ? 3 : 1;
              cycleRanges.push({
                cycleNum,
                startMonth: startMn,
                endMonth: Math.min(yearsList.length * 12 - 1, startMn + span - 1),
                span: Math.min(yearsList.length * 12 - startMn, span),
                plannedDate,
                tasks: parsedTasks[cycleNum] || [],
                progress: calculateCycleProgress(parsedTasks[cycleNum] || [])
              });
            }
          }
        }
      } else if (timeScale === "week") {
        for (let i = 1; i <= totalCycles; i++) {
          const cycleNum = String(i);
          const plannedDate = getCycleStartDate(cycleNum, t.start_time, parsedConfig, parsedMeta);
          const date = new Date(plannedDate);
          if (!isNaN(date.getTime())) {
            const cycleYear = date.getFullYear();
            const yIdx = yearsList.indexOf(cycleYear);
            if (yIdx !== -1) {
              const startWk = yIdx * 52 + getWeekOfYear(plannedDate);
              const spanWeeks = parsedConfig.interval === "yearly" ? 52 : parsedConfig.interval === "quarterly" ? 13 : 4;
              cycleRanges.push({
                cycleNum,
                startMonth: startWk,
                endMonth: Math.min(yearsList.length * 52 - 1, startWk + spanWeeks - 1),
                span: Math.min(yearsList.length * 52 - startWk, spanWeeks),
                plannedDate,
                tasks: parsedTasks[cycleNum] || [],
                progress: calculateCycleProgress(parsedTasks[cycleNum] || [])
              });
            }
          }
        }
      } else {
        // Day scale across years
        for (let i = 1; i <= totalCycles; i++) {
          const cycleNum = String(i);
          const plannedDate = getCycleStartDate(cycleNum, t.start_time, parsedConfig, parsedMeta);
          const date = new Date(plannedDate);
          if (!isNaN(date.getTime())) {
            const cycleYear = date.getFullYear();
            const yIdx = yearsList.indexOf(cycleYear);
            if (yIdx !== -1) {
              let daysBefore = 0;
              for (let yi = 0; yi < yIdx; yi++) {
                daysBefore += isLeapYear(yearsList[yi]) ? 366 : 365;
              }
              const startDay = daysBefore + getDayOfYear(date);
              const spanDays = parsedConfig.interval === "yearly" ? 365 : parsedConfig.interval === "quarterly" ? 90 : 30;
              cycleRanges.push({
                cycleNum,
                startMonth: startDay,
                endMonth: Math.min(limit - 1, startDay + spanDays - 1),
                span: Math.min(limit - startDay, spanDays),
                plannedDate,
                tasks: parsedTasks[cycleNum] || [],
                progress: calculateCycleProgress(parsedTasks[cycleNum] || [])
              });
            }
          }
        }
      }

      cycleRanges.sort((a, b) => a.startMonth - b.startMonth);

      while (currentIdx < limit) {
        const coveringCycle = cycleRanges.find(r => currentIdx >= r.startMonth && currentIdx <= r.endMonth);
        if (coveringCycle) {
          const actualSpan = coveringCycle.endMonth - currentIdx + 1;
          let status = "Planned";
          if (coveringCycle.progress === 100) {
            status = "Completed";
          } else if (coveringCycle.progress > 0 || (coveringCycle.cycleNum === t.sla_time && t.tt_status === "In Progress") || t.tt_status === "In Progress") {
            status = "In Progress";
          }

          segments.push({
            type: "cycle",
            startMonth: currentIdx,
            span: actualSpan,
            cycleNum: coveringCycle.cycleNum,
            cycle: {
              ...coveringCycle,
              status
            }
          });
          currentIdx += actualSpan;
        } else {
          const nextCycle = cycleRanges.find(r => r.startMonth > currentIdx);
          const nextStart = nextCycle ? nextCycle.startMonth : limit;
          const emptySpan = nextStart - currentIdx;
          segments.push({
            type: "empty",
            startMonth: currentIdx,
            span: emptySpan
          });
          currentIdx += emptySpan;
        }
      }

      // Check if a segment end position reaches a year boundary to apply thick border
      const isYearBoundary = (endIndex: number) => {
        if (timeScale === "month") {
          return endIndex % 12 === 0;
        } else if (timeScale === "week") {
          return endIndex % 52 === 0;
        } else {
          let accumulated = 0;
          for (const y of yearsList) {
            accumulated += isLeapYear(y) ? 366 : 365;
            if (endIndex === accumulated) return true;
          }
          return false;
        }
      };

      return (
        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition group">
          <td 
            className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 text-center font-normal text-slate-700 text-sm" 
            style={{ left: 0, minWidth: "48px", width: "48px" }}
          >
            {idx + 1}
          </td>
          <td 
            className="sticky z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 font-normal text-slate-700 text-sm max-w-[150px] truncate" 
            style={{ left: "48px", minWidth: "150px", width: "150px" }} 
            title={t.customer?.name || t.customer_name}
          >
            {t.customer?.name || t.customer_name || "—"}
          </td>
          <td 
            className="sticky z-10 bg-white group-hover:bg-slate-50 border-r-2 border-slate-300 text-slate-700 text-sm font-normal max-w-[180px] truncate" 
            style={{ left: "198px", minWidth: "180px", width: "180px" }} 
            title={t.contract_no || t.contract?.contract_no || t.contract?.name}
          >
            <Link href={`/maintenance/${t.id}`} className="text-blue-600 hover:underline font-medium">
              {t.contract_no || t.contract?.contract_no || t.contract?.name || "—"}
            </Link>
          </td>
          
          {segments.map((seg, sIdx) => {
            const atYearBoundary = isYearBoundary(seg.startMonth + seg.span);
            const borderClass = atYearBoundary ? "border-r-2 border-slate-300" : "border-r border-slate-200";

            if (seg.type === "empty") {
              return (
                <td 
                  key={sIdx} 
                  colSpan={seg.span} 
                  className={`${borderClass} last:border-r-0 bg-slate-50/30`} 
                />
              );
            }

            const c = seg.cycle;
            const isHold = t.tt_status === "On Hold";
            
            // Choose background color based on status:
            // - Đang thực hiện: Cam nhạt
            // - Done rồi: Xanh lá nhạt
            // - Chưa thực hiện: Xám nhạt
            // - Tạm ngưng: Tím nhạt
            let bgClass = "bg-slate-100 text-slate-600 border-slate-300 font-medium"; // Planning (Chưa thực hiện)
            if (isHold && c.status !== "Completed") {
              bgClass = "bg-purple-100 text-purple-800 border-purple-300 font-medium"; // Hold (Tạm ngưng)
            } else if (c.status === "Completed") {
              bgClass = "bg-emerald-100 text-emerald-800 border-emerald-300 font-medium"; // Done (Hoàn thành)
            } else if (c.status === "In Progress") {
              bgClass = "bg-orange-100 text-orange-800 border-orange-300 font-medium"; // On-going (Đang thực hiện)
            }

            return (
              <td 
                key={sIdx} 
                colSpan={seg.span} 
                className={`p-1 ${borderClass} last:border-r-0`}
              >
                <Link href={`/maintenance/${t.id}`}>
                  <div className={`h-8 w-full rounded flex items-center justify-center text-sm font-medium shadow-xs border transition hover:brightness-95 hover:shadow-sm cursor-pointer ${bgClass}`} title={`Lần ${seg.cycleNum} - Ngày dự kiến: ${formatDateVN(c.plannedDate)} - Tiến độ: ${c.progress}%`}>
                    Lần {seg.cycleNum}
                  </div>
                </Link>
              </td>
            );
          })}
        </tr>
      );
    });
  };

  const total = tickets.length;
  const pending = tickets.filter(t => getPlanStatus(t, calculatePlanProgress(t)).statusKey === "New").length;
  const inProgress = tickets.filter(t => getPlanStatus(t, calculatePlanProgress(t)).statusKey === "Processing").length;
  const completed = tickets.filter(t => {
    const s = getPlanStatus(t, calculatePlanProgress(t)).statusKey;
    return s === "Completed" || s === "Closed";
  }).length;

  return (
    <MainLayout>
      <Header 
        title="Kế Hoạch Bảo Trì" 
        description="Quản lý kế hoạch bảo trì định kỳ và hợp đồng dịch vụ" 
        tabs={[
          { id: "list", label: "Danh sách", icon: ClipboardList },
          { id: "timeline", label: "Timeline", icon: Clock },
        ]}
        activeTab={activeTab}
        setActiveTab={(id: any) => setActiveTab(id)}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateOpen}
            className="h-10 flex items-center gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm cursor-pointer shrink-0"
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

          {/* Status Multi-Select Filter */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(prev => !prev)}
              className={`h-10 px-3.5 border rounded-xl text-sm bg-white flex items-center gap-2 shadow-sm transition cursor-pointer select-none ${
                statusFilter.length > 0
                  ? "border-blue-400 ring-2 ring-blue-500/10 font-medium text-blue-900"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <Filter size={14} className={statusFilter.length > 0 ? "text-blue-600" : "text-slate-400"} />
              {statusFilter.length === 0 ? (
                <span>Tất cả tình trạng</span>
              ) : statusFilter.length === 1 ? (
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_OPTIONS.find(o => o.key === statusFilter[0])?.badgeClass}`}>
                    {STATUS_OPTIONS.find(o => o.key === statusFilter[0])?.label}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Tình trạng</span>
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white leading-none">
                    {statusFilter.length}
                  </span>
                </div>
              )}
              {statusFilter.length > 0 ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusFilter([]);
                  }}
                  className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                  title="Xóa chọn tình trạng"
                >
                  <X size={13} />
                </span>
              ) : (
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
              )}
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-xs font-semibold text-slate-600">Lọc theo tình trạng</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusFilter(STATUS_OPTIONS.map(o => o.key))}
                      className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter([])}
                      className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {STATUS_OPTIONS.map((opt) => {
                    const isChecked = statusFilter.includes(opt.key);
                    const count = statusCounts[opt.key] || 0;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => toggleStatus(opt.key)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer select-none transition ${
                          isChecked ? "bg-blue-50/70" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
                          />
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${opt.badgeClass}`}>
                            {opt.label}
                          </span>
                        </div>
                        <span className="text-slate-400 font-medium">({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Customer Filter */}
          <div className="w-56 sm:w-64">
            <CustomerSearchSelect
              value={customerFilter}
              onChange={(val) => setCustomerFilter(val || "All")}
              customers={customers}
              allowAll={true}
              allValue="All"
              allLabel="Tất cả khách hàng"
              placeholder="Tất cả khách hàng"
            />
          </div>

          {/* Clear Filters Button */}
          {(statusFilter.length > 0 || (customerFilter && customerFilter !== "All") || search) && (
            <button
              onClick={() => {
                setStatusFilter([]);
                setCustomerFilter("All");
                setSearch("");
              }}
              className="h-10 px-3 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-red-200 transition cursor-pointer"
              title="Xóa tất cả bộ lọc"
            >
              <X size={14} />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Right toolbar controls */}
        {activeTab === "list" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetColWidths}
              className="h-10 px-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 bg-white shadow-xs transition cursor-pointer"
              title="Khôi phục độ rộng cột mặc định"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Đặt lại cột</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {activeTab === "list" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full text-sm table-fixed border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs text-slate-500 font-medium text-left">
                  {/* ID */}
                  <th 
                    style={{ width: `${colWidths.id}px`, minWidth: `${colWidths.id}px` }}
                    className="relative px-4 py-3 border-r border-slate-200 select-none group"
                  >
                    <span className="truncate">ID</span>
                    <div
                      onMouseDown={(e) => handleMouseDown("id", e)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                      title="Kéo để điều chỉnh độ rộng cột"
                    />
                  </th>

                  {/* Customer */}
                  <th 
                    style={{ width: `${colWidths.customer}px`, minWidth: `${colWidths.customer}px` }}
                    className="relative px-4 py-3 border-r border-slate-200 cursor-pointer select-none hover:bg-slate-100/80 transition group"
                    onClick={() => handleSort("customer")}
                    title="Bấm để sắp xếp theo tên khách hàng • Kéo viền phải để chỉnh kích thước"
                  >
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <span className={sortField === "customer" ? "font-semibold text-blue-700" : ""}>Tên khách hàng</span>
                      <span className="text-slate-400 group-hover:text-slate-600">
                        {sortField === "customer" ? (
                          sortOrder === "asc" ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                        ) : (
                          <ArrowUpDown size={13} className="opacity-40 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                    <div
                      onMouseDown={(e) => handleMouseDown("customer", e)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                      title="Kéo để điều chỉnh độ rộng cột"
                    />
                  </th>

                  {/* Contract */}
                  <th 
                    style={{ width: `${colWidths.contract}px`, minWidth: `${colWidths.contract}px` }}
                    className="relative px-4 py-3 border-r border-slate-200 select-none group"
                  >
                    <span className="truncate">Tên hợp đồng</span>
                    <div
                      onMouseDown={(e) => handleMouseDown("contract", e)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                      title="Kéo để điều chỉnh độ rộng cột"
                    />
                  </th>

                  {/* Creator */}
                  <th 
                    style={{ width: `${colWidths.creator}px`, minWidth: `${colWidths.creator}px` }}
                    className="relative px-4 py-3 border-r border-slate-200 select-none group"
                  >
                    <span className="truncate">Người tạo</span>
                    <div
                      onMouseDown={(e) => handleMouseDown("creator", e)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                      title="Kéo để điều chỉnh độ rộng cột"
                    />
                  </th>

                  {/* Created At */}
                  <th 
                    style={{ width: `${colWidths.created_at}px`, minWidth: `${colWidths.created_at}px` }}
                    className="relative px-4 py-3 border-r border-slate-200 cursor-pointer select-none hover:bg-slate-100/80 transition group"
                    onClick={() => handleSort("created_at")}
                    title="Bấm để sắp xếp theo thời gian tạo • Kéo viền phải để chỉnh kích thước"
                  >
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <span className={sortField === "created_at" ? "font-semibold text-blue-700" : ""}>Thời gian tạo</span>
                      <span className="text-slate-400 group-hover:text-slate-600">
                        {sortField === "created_at" ? (
                          sortOrder === "asc" ? <ArrowUp size={14} className="text-blue-600" /> : <ArrowDown size={14} className="text-blue-600" />
                        ) : (
                          <ArrowUpDown size={13} className="opacity-40 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                    <div
                      onMouseDown={(e) => handleMouseDown("created_at", e)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                      title="Kéo để điều chỉnh độ rộng cột"
                    />
                  </th>

                  {/* Hold Time */}
                  <th 
                    style={{ width: `${colWidths.hold_time}px`, minWidth: `${colWidths.hold_time}px` }}
                    className="relative px-4 py-3 border-r border-slate-200 text-center select-none group"
                  >
                    <span className="truncate">Tổng kỳ</span>
                    <div
                      onMouseDown={(e) => handleMouseDown("hold_time", e)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                      title="Kéo để điều chỉnh độ rộng cột"
                    />
                  </th>

                  {/* Status */}
                  <th 
                    style={{ width: `${colWidths.status}px`, minWidth: `${colWidths.status}px` }}
                    className="relative px-4 py-3 border-r border-slate-200 select-none group"
                  >
                    <span className="truncate">Tình trạng</span>
                    <div
                      onMouseDown={(e) => handleMouseDown("status", e)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                      title="Kéo để điều chỉnh độ rộng cột"
                    />
                  </th>

                  {/* Progress */}
                  <th 
                    style={{ width: `${colWidths.progress}px`, minWidth: `${colWidths.progress}px` }}
                    className="relative px-4 py-3 border-r border-slate-200 select-none group"
                  >
                    <span className="truncate">Tiến độ</span>
                    <div
                      onMouseDown={(e) => handleMouseDown("progress", e)}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                      title="Kéo để điều chỉnh độ rộng cột"
                    />
                  </th>

                  {/* Actions */}
                  <th 
                    style={{ width: `${colWidths.actions}px`, minWidth: `${colWidths.actions}px` }}
                    className="relative px-4 py-3 text-center select-none group"
                  >
                    <span className="truncate">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-slate-400">
                      <Wrench size={36} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm">{search || statusFilter.length > 0 || customerFilter !== "All" ? "Không tìm thấy kết quả phù hợp bộ lọc" : "Chưa có kế hoạch bảo trì nào"}</p>
                      <button onClick={handleCreateOpen} className="mt-3 text-blue-500 text-sm hover:underline cursor-pointer">
                        + Tạo kế hoạch đầu tiên
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t: any, i: number) => {
                    const progressVal = calculatePlanProgress(t);
                    const statusInfo = getPlanStatus(t, progressVal);
                    return (
                      <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                        <td style={{ width: `${colWidths.id}px` }} className="px-4 py-3.5 font-medium text-blue-600 border-r border-b border-slate-200 truncate">
                          <Link href={`/maintenance/${t.id}`} className="hover:underline">
                            {t.ticket_id ? t.ticket_id.replace(/^[A-Z]+-/, 'BTR-') : '—'}
                          </Link>
                        </td>
                        <td style={{ width: `${colWidths.customer}px` }} className="px-4 py-3.5 text-slate-700 border-r border-b border-slate-200 truncate" title={t.customer?.name || t.customer_name}>
                          {t.customer?.name || t.customer_name || "—"}
                        </td>
                        <td style={{ width: `${colWidths.contract}px` }} className="px-4 py-3.5 text-slate-500 border-r border-b border-slate-200 truncate" title={t.contract_no || t.contract?.contract_no || t.contract?.name}>
                          {t.contract_no || t.contract?.contract_no || t.contract?.name || "—"}
                        </td>
                        <td style={{ width: `${colWidths.creator}px` }} className="px-4 py-3.5 text-slate-700 border-r border-b border-slate-200 truncate" title={t.creator_name || t.created_by || t.user_name || ""}>
                          <div className="flex items-center gap-1.5 truncate">
                            <User size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{t.creator_name || t.created_by || t.user_name || "—"}</span>
                          </div>
                        </td>
                        <td style={{ width: `${colWidths.created_at}px` }} className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs border-r border-b border-slate-200 truncate" title={t.created_at || ""}>
                          {formatDateTimeVN(t.created_at || t.created_time || t.start_time)}
                        </td>
                        <td style={{ width: `${colWidths.hold_time}px` }} className="px-4 py-3.5 text-center font-medium text-slate-500 border-r border-b border-slate-200 truncate">
                          {t.hold_time || 0}
                        </td>
                        <td style={{ width: `${colWidths.status}px` }} className="px-4 py-3.5 border-r border-b border-slate-200 truncate">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td style={{ width: `${colWidths.progress}px` }} className="px-4 py-3.5 border-r border-b border-slate-200 truncate">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${statusInfo.barClass}`}
                                style={{ width: `${progressVal}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-600 min-w-[32px]">{progressVal}%</span>
                          </div>
                        </td>
                        <td style={{ width: `${colWidths.actions}px` }} className="px-4 py-3.5 text-center border-b border-slate-200">
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
        </div>
      )}

      {/* Timeline View */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col gap-4">
          {/* Legend and header toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 text-base">Timeline Kế Hoạch Bảo Trì</h3>
              
              {/* Scale switch */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
                {[
                  { id: "day", label: "Ngày" },
                  { id: "week", label: "Tuần" },
                  { id: "month", label: "Tháng" },
                ].map((scale) => (
                  <button
                    key={scale.id}
                    onClick={() => setTimeScale(scale.id as any)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      timeScale === scale.id
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chú thích */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-slate-500">Chú thích:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300" />
                <span className="text-slate-600">Done (Hoàn thành)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-orange-100 border border-orange-300" />
                <span className="text-slate-600">On-going (Đang thực hiện)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300" />
                <span className="text-slate-600">Planing (Chưa thực hiện)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-purple-100 border border-purple-300" />
                <span className="text-slate-600">Hold (Tạm ngưng)</span>
              </div>
            </div>
          </div>

          <div ref={scrollContainerRef} className="relative overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl shadow-xs">
            <div className={`relative ${
              timeScale === "month" ? "min-w-[1800px]" : 
              timeScale === "week" ? "min-w-[4500px]" : 
              "min-w-[28000px]"
            } w-full`}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  {/* Year header row with year dividers */}
                  <tr className="text-center font-bold text-slate-700 bg-slate-100 border-b border-slate-200">
                    <th colSpan={3} className="px-4 py-2 border-r-2 border-slate-300 text-left sticky left-0 bg-slate-100 z-30" style={{ left: 0 }}>
                      Giai đoạn
                    </th>
                    {yearsList.map((year) => {
                      let span = 12;
                      if (timeScale === "week") span = 52;
                      if (timeScale === "day") span = isLeapYear(year) ? 366 : 365;

                      return (
                        <th 
                          key={year} 
                          colSpan={span} 
                          className="px-4 py-2 text-center text-sm font-bold border-r-2 border-slate-300 bg-slate-100 text-slate-800"
                        >
                          Năm {year}
                        </th>
                      );
                    })}
                  </tr>
                  
                  {/* Column sub-headers */}
                  <tr className="text-xs text-slate-500 font-medium text-left bg-slate-50 border-b border-slate-200">
                    <th className="px-2 py-3 border-r border-slate-200 text-center sticky left-0 bg-slate-50 z-30 font-semibold" style={{ left: 0, minWidth: "48px", width: "48px" }}>No</th>
                    <th className="px-4 py-3 border-r border-slate-200 sticky bg-slate-50 z-30 font-semibold" style={{ left: "48px", minWidth: "150px", width: "150px" }}>Khách hàng</th>
                    <th className="px-4 py-3 border-r-2 border-slate-300 sticky bg-slate-50 z-30 font-semibold" style={{ left: "198px", minWidth: "180px", width: "180px" }}>Dự án / Hợp đồng</th>
                    
                    {timeScale === "month" && yearsList.flatMap((year) => 
                      ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                        <th 
                          key={`${year}-${m}`} 
                          className={`px-2 py-3 text-center text-xs font-semibold ${idx === 11 ? "border-r-2 border-slate-300 bg-slate-100/40" : "border-r border-slate-200"}`} 
                          style={{ minWidth: "45px" }}
                        >
                          {m}
                        </th>
                      ))
                    )}
                    
                    {timeScale === "week" && yearsList.flatMap((year) => 
                      Array.from({ length: 52 }, (_, i) => `W${i + 1}`).map((w, idx) => (
                        <th 
                          key={`${year}-${w}`} 
                          className={`px-1 py-3 text-center text-[9px] font-medium ${idx === 51 ? "border-r-2 border-slate-300 bg-slate-100/40" : "border-r border-slate-200"}`} 
                          style={{ minWidth: "26px" }}
                        >
                          {w}
                        </th>
                      ))
                    )}
                    
                    {timeScale === "day" && yearsList.flatMap((year) => 
                      Array.from({ length: 12 }, (_, mIdx) => {
                        const daysInM = getDaysInMonth(year, mIdx);
                        return Array.from({ length: daysInM }, (_, dIdx) => ({
                          day: dIdx + 1,
                          isYearEnd: mIdx === 11 && dIdx === daysInM - 1,
                          key: `${year}-M${mIdx + 1}-D${dIdx + 1}`
                        }));
                      }).flat()
                    ).map((d) => (
                      <th 
                        key={d.key} 
                        className={`px-1 py-3 text-center text-[9px] ${d.isYearEnd ? "border-r-2 border-slate-300 bg-slate-100/40" : "border-r border-slate-200"}`} 
                        style={{ minWidth: "26px" }}
                      >
                        {d.day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={3 + (timeScale === "month" ? yearsList.length * 12 : timeScale === "week" ? yearsList.length * 52 : yearsList.reduce((acc, y) => acc + (isLeapYear(y) ? 366 : 365), 0))} 
                        className="py-14 text-center text-slate-400"
                      >
                        Chưa có kế hoạch bảo trì nào phù hợp bộ lọc
                      </td>
                    </tr>
                  ) : (
                    renderTimelineRows()
                  )}
                </tbody>
              </table>

              {/* Blue line for current point in time running vertically across the table */}
              {filtered.length > 0 && todayLineFraction >= 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-[2.5px] bg-sky-500 pointer-events-none shadow-[0_0_8px_rgba(14,165,233,0.5)] z-20"
                  style={{ left: `calc(378px + (100% - 378px) * ${todayLineFraction})` }}
                >
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap shadow-xs">
                    Hiện tại
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-visible flex flex-col relative">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPlan ? "Cập nhật kế hoạch" : "Thêm kế hoạch mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Customer Select */}
              <div className="relative z-20">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <CustomerSearchSelect
                  value={form.customerId}
                  onChange={(val) => handleCustomerChange(val)}
                  customers={customers}
                  placeholder="-- Chọn khách hàng --"
                  dropdownPosition="absolute"
                  required
                />
              </div>

              {/* Contract Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Hợp đồng dịch vụ
                </label>
                <select
                  value={form.contractId}
                  onChange={e => setForm(f => ({ ...f, contractId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  disabled={!form.customerId || filteredContracts.length === 0}
                >
                  <option value="">
                    {!form.customerId 
                      ? "-- Vui lòng chọn khách hàng trước --" 
                      : filteredContracts.length === 0 
                      ? "-- Không có hợp đồng tương ứng --" 
                      : "-- Chọn hợp đồng --"}
                  </option>
                  {filteredContracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.contract_no || c.code} - {c.service || c.name || "Hợp đồng dịch vụ"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Creator Select */}
              <div className="relative z-10">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Người tạo
                </label>
                <StaffSearchSelect
                  value={form.creatorName}
                  onChange={(val) => setForm(f => ({ ...f, creatorName: typeof val === "string" ? val : "" }))}
                  staffList={staffList}
                  placeholder="-- Chọn người tạo --"
                  dropdownPosition="absolute"
                  allowClear={true}
                />
              </div>

              {/* Total Periods */}
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
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">Tạm ngưng</option>
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

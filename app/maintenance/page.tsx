"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Plus, Search, Wrench, X, CheckCircle2, Clock, RotateCcw, Pencil, Trash2,
  ClipboardList, Filter, ArrowUpDown, ArrowUp, ArrowDown, User, ChevronDown, Check,
  GripVertical, SlidersHorizontal, Layout, Eye, EyeOff, Sparkles, Settings,
  AlertTriangle, Calendar, Activity
} from "lucide-react";

import { fetchContractsByCustomer, fetchContracts, Contract } from "@/lib/contract-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";
import CustomerSearchSelect from "@/components/common/customer-search-select";
import StaffSearchSelect from "@/components/common/staff-search-select";
import MaintenanceColumnConfigModal, {
  MAINTENANCE_COLUMN_ORDER,
  MAINTENANCE_COLUMN_LABELS,
  DEFAULT_MAINTENANCE_COL_WIDTHS,
  MIN_MAINTENANCE_COL_WIDTHS,
  MAINTENANCE_SYSTEM_TEMPLATES,
  MaintenanceColumnTemplate,
} from "./column-config-modal";

export const TIMELINE_COL_DEFS = [
  { key: "no", label: "No", defaultWidth: 44 },
  { key: "customer", label: "Khách hàng", defaultWidth: 150 },
  { key: "customer_short", label: "Tên KH Viết tắt", defaultWidth: 100 },
  { key: "contract", label: "Dự án / Hợp đồng", defaultWidth: 160 },
  { key: "notes", label: "Ghi chú", defaultWidth: 140 },
] as const;

export type TimelineColKey = typeof TIMELINE_COL_DEFS[number]["key"];
const STORAGE_TIMELINE_COLS_KEY = "jpt_maintenance_timeline_cols";

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
  
  const completed = leafTasks.filter(t => t.status === "Hoàn thành" || t.progress === 100).length;
  return Math.round((completed / leafTasks.length) * 100);
};

// Helper: tính % tiến độ tổng thể (chỉ tính % nếu lần thực hiện hoàn thành 100%, trên tổng số lần thực hiện)
const calculatePlanProgress = (t: any): number => {
  const total = parseInt(t.hold_time) || 0;
  if (total <= 0) return 0;
  
  if (t.remark) {
    try {
      const parsed = JSON.parse(t.remark);
      let tasksData = parsed?.tasks;
      if (!tasksData && parsed?.taskLists) {
        tasksData = {};
        Object.keys(parsed.taskLists).forEach(cKey => {
          const all: Task[] = [];
          (parsed.taskLists[cKey] || []).forEach((tl: any) => all.push(...(tl.tasks || [])));
          tasksData[cKey] = all;
        });
      } else if (!tasksData && !parsed.config) {
        tasksData = parsed;
      }
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

const STORAGE_MAINTENANCE_CONFIG_KEY = "jpt_maintenance_col_config";
const STORAGE_MAINTENANCE_TEMPLATES_KEY = "jpt_maintenance_templates";

// Helper lấy Tên KH Viết tắt từ ticket
export const getCustomerShortName = (t: any): string => {
  if (t?.customer_short_name) return String(t.customer_short_name);
  if (t?.short_name) return String(t.short_name);
  if (t?.customer_code) return String(t.customer_code);
  if (t?.remark) {
    try {
      const parsed = typeof t.remark === "string" ? JSON.parse(t.remark) : t.remark;
      if (parsed?.customer_short_name) return String(parsed.customer_short_name);
      if (parsed?.short_name) return String(parsed.short_name);
    } catch {}
  }
  return t?.customer?.code || "";
};

// Helper lấy Ghi chú từ ticket
export const getPlanNotes = (t: any): string => {
  if (t?.notes) return String(t.notes);
  if (t?.description) return String(t.description);
  if (t?.remark) {
    try {
      const parsed = typeof t.remark === "string" ? JSON.parse(t.remark) : t.remark;
      if (parsed?.notes) return String(parsed.notes);
      if (parsed?.description) return String(parsed.description);
    } catch {}
  }
  return "";
};

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
  const [sortField, setSortField] = useState<"customer" | "customer_short" | "created_at" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Timeline columns visibility state
  const [timelineVisibleCols, setTimelineVisibleCols] = useState<Record<string, boolean>>(() => ({
    no: true,
    customer: true,
    customer_short: true,
    contract: true,
    notes: true,
  }));
  const [isTimelineColDropdownOpen, setIsTimelineColDropdownOpen] = useState(false);
  const timelineColDropdownRef = useRef<HTMLDivElement>(null);

  // Column Configuration & Templates state
  const [columnOrder, setColumnOrder] = useState<string[]>(MAINTENANCE_COLUMN_ORDER);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    MAINTENANCE_COLUMN_ORDER.reduce((acc, k) => ({ ...acc, [k]: true }), {})
  );
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_MAINTENANCE_COL_WIDTHS);
  const [templates, setTemplates] = useState<MaintenanceColumnTemplate[]>(MAINTENANCE_SYSTEM_TEMPLATES);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("default");

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [isQuickVisDropdownOpen, setIsQuickVisDropdownOpen] = useState(false);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const quickVisDropdownRef = useRef<HTMLDivElement>(null);

  // Drag & drop column headers state
  const [draggedColKey, setDraggedColKey] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);

  // Load custom templates & column config on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let loadedTemplates = [...MAINTENANCE_SYSTEM_TEMPLATES];
      const savedCustomTemplates = localStorage.getItem(STORAGE_MAINTENANCE_TEMPLATES_KEY);
      if (savedCustomTemplates) {
        try {
          const parsedCustom = JSON.parse(savedCustomTemplates);
          if (Array.isArray(parsedCustom)) {
            loadedTemplates = [...MAINTENANCE_SYSTEM_TEMPLATES, ...parsedCustom];
          }
        } catch {}
      }
      setTemplates(loadedTemplates);

      const savedConfig = localStorage.getItem(STORAGE_MAINTENANCE_CONFIG_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.order && Array.isArray(parsed.order)) {
          const existing = new Set(parsed.order);
          const missing = MAINTENANCE_COLUMN_ORDER.filter(k => !existing.has(k));
          setColumnOrder([...parsed.order, ...missing]);
        }
        if (parsed.visible && typeof parsed.visible === "object") {
          setVisibleColumns(prev => ({ ...prev, ...parsed.visible }));
        }
        if (parsed.widths && typeof parsed.widths === "object") {
          setColWidths(prev => ({ ...prev, ...parsed.widths }));
        }
        if (parsed.templateId) {
          setActiveTemplateId(parsed.templateId);
        }
      }

      const savedTimelineCols = localStorage.getItem(STORAGE_TIMELINE_COLS_KEY);
      if (savedTimelineCols) {
        try {
          const parsedTimeline = JSON.parse(savedTimelineCols);
          if (parsedTimeline && typeof parsedTimeline === "object") {
            setTimelineVisibleCols(prev => ({ ...prev, ...parsedTimeline }));
          }
        } catch {}
      }
    } catch (e) {
      console.error("Error loading maintenance column config:", e);
    }
  }, []);

  const toggleTimelineCol = (key: string) => {
    setTimelineVisibleCols((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const anyVisible = Object.values(next).some(Boolean);
      if (!anyVisible) return prev; // keep at least one column visible
      try {
        localStorage.setItem(STORAGE_TIMELINE_COLS_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const timelineOffsets = useMemo(() => {
    let currentLeft = 0;
    const offsets: Record<string, number> = {};
    const widths: Record<string, number> = {};
    let visibleCount = 0;
    let lastColKey = "";

    for (const col of TIMELINE_COL_DEFS) {
      if (timelineVisibleCols[col.key] !== false) {
        offsets[col.key] = currentLeft;
        widths[col.key] = col.defaultWidth;
        currentLeft += col.defaultWidth;
        visibleCount += 1;
        lastColKey = col.key;
      }
    }

    return {
      offsets,
      widths,
      totalStickyWidth: currentLeft,
      visibleCount,
      lastColKey,
    };
  }, [timelineVisibleCols]);

  const saveActiveConfig = (patch: {
    order?: string[];
    visible?: Record<string, boolean>;
    widths?: Record<string, number>;
    templateId?: string;
  }) => {
    if (typeof window === "undefined") return;
    try {
      const current = {
        order: patch.order ?? columnOrder,
        visible: patch.visible ?? visibleColumns,
        widths: patch.widths ?? colWidths,
        templateId: patch.templateId ?? activeTemplateId,
      };
      localStorage.setItem(STORAGE_MAINTENANCE_CONFIG_KEY, JSON.stringify(current));
    } catch (e) {}
  };

  const handleApplyTemplate = (tpl: MaintenanceColumnTemplate) => {
    const order = [...tpl.order];
    const existing = new Set(order);
    MAINTENANCE_COLUMN_ORDER.forEach(k => {
      if (!existing.has(k)) order.push(k);
    });
    const visible = { ...tpl.visible };
    const widths = { ...DEFAULT_MAINTENANCE_COL_WIDTHS, ...(tpl.widths || {}) };

    setColumnOrder(order);
    setVisibleColumns(visible);
    setColWidths(widths);
    setActiveTemplateId(tpl.id);
    saveActiveConfig({ order, visible, widths, templateId: tpl.id });
    setIsTemplateDropdownOpen(false);
  };

  const handleSaveNewTemplate = (name: string) => {
    const newTpl: MaintenanceColumnTemplate = {
      id: "custom_" + Date.now(),
      name: name.trim(),
      isSystem: false,
      order: [...columnOrder],
      visible: { ...visibleColumns },
      widths: { ...colWidths },
      createdAt: new Date().toISOString(),
    };
    const customOnly = templates.filter(t => !t.isSystem);
    const updatedCustom = [...customOnly, newTpl];
    try {
      localStorage.setItem(STORAGE_MAINTENANCE_TEMPLATES_KEY, JSON.stringify(updatedCustom));
    } catch {}
    setTemplates([...MAINTENANCE_SYSTEM_TEMPLATES, ...updatedCustom]);
    setActiveTemplateId(newTpl.id);
    saveActiveConfig({ templateId: newTpl.id });
  };

  const handleDeleteTemplate = (templateId: string) => {
    const customOnly = templates.filter(t => !t.isSystem && t.id !== templateId);
    try {
      localStorage.setItem(STORAGE_MAINTENANCE_TEMPLATES_KEY, JSON.stringify(customOnly));
    } catch {}
    setTemplates([...MAINTENANCE_SYSTEM_TEMPLATES, ...customOnly]);
    if (activeTemplateId === templateId) {
      handleApplyTemplate(MAINTENANCE_SYSTEM_TEMPLATES[0]);
    }
  };

  const handleResetDefault = () => {
    handleApplyTemplate(MAINTENANCE_SYSTEM_TEMPLATES[0]);
  };

  // Drag and drop column headers
  const handleHeaderDragStart = (e: React.DragEvent, colKey: string) => {
    setDraggedColKey(colKey);
    e.dataTransfer.setData("text/plain", colKey);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleHeaderDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (draggedColKey && draggedColKey !== colKey) {
      setDragOverColKey(colKey);
    }
  };

  const handleHeaderDrop = (e: React.DragEvent, targetColKey: string) => {
    e.preventDefault();
    if (!draggedColKey || draggedColKey === targetColKey) {
      setDraggedColKey(null);
      setDragOverColKey(null);
      return;
    }
    const oldIdx = columnOrder.indexOf(draggedColKey);
    const newIdx = columnOrder.indexOf(targetColKey);
    if (oldIdx !== -1 && newIdx !== -1) {
      const newOrder = [...columnOrder];
      newOrder.splice(oldIdx, 1);
      newOrder.splice(newIdx, 0, draggedColKey);
      setColumnOrder(newOrder);
      saveActiveConfig({ order: newOrder });
    }
    setDraggedColKey(null);
    setDragOverColKey(null);
  };

  // Column Resizing state
  const resizingRef = useRef<{ colKey: string; startX: number; startWidth: number } | null>(null);

  const handleMouseDown = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey] || DEFAULT_MAINTENANCE_COL_WIDTHS[colKey] || 120,
    };

    let latestWidths = { ...colWidths };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colKey, startX, startWidth } = resizingRef.current;
      const delta = moveEvent.clientX - startX;
      const minW = MIN_MAINTENANCE_COL_WIDTHS[colKey] || 40;
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
      saveActiveConfig({ widths: latestWidths });
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const totalTableWidth = useMemo(() => {
    let sum = colWidths.actions || 85;
    for (const key of columnOrder) {
      if (visibleColumns[key]) {
        sum += Number(colWidths[key]) || DEFAULT_MAINTENANCE_COL_WIDTHS[key] || 120;
      }
    }
    return sum;
  }, [colWidths, columnOrder, visibleColumns]);

  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === activeTemplateId) || templates[0];
  }, [templates, activeTemplateId]);

  const visibleCount = useMemo(() => {
    return columnOrder.filter(k => visibleColumns[k]).length;
  }, [columnOrder, visibleColumns]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
      if (quickVisDropdownRef.current && !quickVisDropdownRef.current.contains(e.target as Node)) {
        setIsQuickVisDropdownOpen(false);
      }
      if (timelineColDropdownRef.current && !timelineColDropdownRef.current.contains(e.target as Node)) {
        setIsTimelineColDropdownOpen(false);
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
    customerShortName: "",
    contractId: "",
    totalPeriods: 12,
    status: "New",
    notes: "",
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

  const handleSort = (field: "customer" | "customer_short" | "created_at") => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    const custObj = customers.find(c => c.id === customerId);
    setForm(f => ({
      ...f,
      customerId,
      contractId: "",
      customerShortName: f.customerShortName || custObj?.code || "",
    }));
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
      customerShortName: "",
      contractId: "",
      totalPeriods: 12,
      status: "New",
      notes: "",
      creatorName: staffList[0]?.ten_nhan_su || "Admin",
    });
    setFilteredContracts([]);
    setIsModalOpen(true);
  };

  const handleEdit = async (plan: any) => {
    setEditingPlan(plan);
    setForm({
      customerId: plan.customer_id || "",
      customerShortName: getCustomerShortName(plan),
      contractId: plan.contract_id || "",
      totalPeriods: parseInt(plan.hold_time) || 12,
      status: plan.tt_status || "New",
      notes: getPlanNotes(plan),
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
        description: form.notes,
        customer_id: form.customerId,
        customer_name: custObj?.name || null,
        contract_id: form.contractId || null,
        contract_no: contrObj?.contract_no || contrObj?.code || contrObj?.name || null,
        hold_time: String(form.totalPeriods),
        tt_status: form.status,
        creator_name: form.creatorName || null,
      };

      if (editingPlan) {
        let existingRemarkObj: any = {};
        if (editingPlan.remark) {
          try {
            existingRemarkObj = typeof editingPlan.remark === "string" ? JSON.parse(editingPlan.remark) : editingPlan.remark;
          } catch {}
        }
        const updatedRemark = {
          ...existingRemarkObj,
          customer_short_name: form.customerShortName.trim(),
          notes: form.notes.trim(),
        };
        payload.remark = JSON.stringify(updatedRemark);

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
          recommendations: {},
          customer_short_name: form.customerShortName.trim(),
          notes: form.notes.trim(),
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
        customerShortName: "",
        contractId: "",
        totalPeriods: 12,
        status: "New",
        notes: "",
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
      const shortName = getCustomerShortName(t).toLowerCase();
      const shortMatch = !term || shortName.includes(term);
      const contrMatch = !term || (t.contract_no || t.contract?.contract_no || t.contract?.service || t.contract?.name || "")?.toLowerCase().includes(term);
      const notesText = getPlanNotes(t).toLowerCase();
      const notesMatch = !term || notesText.includes(term);
      const creatorMatch = !term || (t.creator_name || t.created_by || t.user_name || "")?.toLowerCase().includes(term);
      
      const matchesSearch = !term || idMatch || custMatch || shortMatch || contrMatch || notesMatch || creatorMatch;
      
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
    } else if (sortField === "customer_short") {
      list.sort((a, b) => {
        const sA = getCustomerShortName(a).trim().toLowerCase();
        const sB = getCustomerShortName(b).trim().toLowerCase();
        const cmp = sA.localeCompare(sB, "vi");
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
    if (activeTab === "timeline" && timelineScrollRef.current) {
      let attempts = 0;
      const scroll = () => {
        const container = timelineScrollRef.current;
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
          const stickyW = timelineOffsets.totalStickyWidth;
          const lineLeft = stickyW + (scrollWidth - stickyW) * todayLineFraction;
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
  }, [activeTab, timeScale, tickets, todayLineFraction, timelineOffsets.totalStickyWidth]);

  // Thống kê các kỳ bảo trì cho Timeline view: Đang chạy hiện tại, Chưa thực hiện, Quá hạn
  const timelineStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().substring(0, 10);

    let ongoingCount = 0;
    let upcomingPlannedCount = 0;
    let overdueCount = 0;
    let completedCount = 0;
    let totalCyclesCount = 0;

    for (const t of filtered) {
      const totalCycles = parseInt(t.hold_time) || 1;
      let parsedConfig = { 
        interval: "monthly", 
        startDate: t.start_time ? t.start_time.substring(0, 10) : todayStr 
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

      const spanMonths = parsedConfig.interval === "yearly" ? 12 : parsedConfig.interval === "quarterly" ? 3 : 1;

      for (let i = 1; i <= totalCycles; i++) {
        totalCyclesCount++;
        const cycleNum = String(i);
        const plannedDate = getCycleStartDate(cycleNum, t.start_time, parsedConfig, parsedMeta);
        const tasks = parsedTasks[cycleNum] || [];
        const progress = calculateCycleProgress(tasks);
        const isCompleted = progress === 100;

        if (isCompleted) {
          completedCount++;
          continue;
        }

        if (!plannedDate) {
          upcomingPlannedCount++;
          continue;
        }

        const startDate = new Date(plannedDate);
        startDate.setHours(0, 0, 0, 0);

        const endDateStr = addMonths(plannedDate, spanMonths);
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          upcomingPlannedCount++;
          continue;
        }

        if (endDate < today) {
          overdueCount++;
        } else if (startDate <= today && today <= endDate) {
          ongoingCount++;
        } else if (progress > 0) {
          ongoingCount++;
        } else {
          upcomingPlannedCount++;
        }
      }
    }

    return {
      ongoingCount,
      upcomingPlannedCount,
      overdueCount,
      completedCount,
      totalCyclesCount,
    };
  }, [filtered]);

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

      const shortName = getCustomerShortName(t);
      const notesText = getPlanNotes(t);
      const contractText = t.contract_no || t.contract?.contract_no || t.contract?.name || "—";

      return (
        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition group h-[32px]">
          {TIMELINE_COL_DEFS.map((col) => {
            if (timelineVisibleCols[col.key] === false) return null;
            const isLast = col.key === timelineOffsets.lastColKey;
            const w = timelineOffsets.widths[col.key];
            const left = timelineOffsets.offsets[col.key];
            const borderCls = isLast ? "border-r-2 border-slate-300 shadow-[2px_0_4px_rgba(0,0,0,0.03)]" : "border-r border-slate-200";

            switch (col.key) {
              case "no":
                return (
                  <td 
                    key="no"
                    className={`sticky z-20 bg-white group-hover:bg-slate-50 ${borderCls} border-b border-slate-100 text-center font-normal text-slate-500 text-xs px-1 py-1 overflow-hidden`} 
                    style={{ left: `${left}px`, minWidth: `${w}px`, width: `${w}px`, maxWidth: `${w}px` }}
                  >
                    {idx + 1}
                  </td>
                );
              case "customer":
                const custName = t.customer?.name || t.customer_name || "—";
                return (
                  <td 
                    key="customer"
                    className={`sticky z-20 bg-white group-hover:bg-slate-50 ${borderCls} border-b border-slate-100 font-medium text-slate-800 text-xs px-2 py-1 overflow-hidden`} 
                    style={{ left: `${left}px`, minWidth: `${w}px`, width: `${w}px`, maxWidth: `${w}px` }} 
                    title={custName}
                  >
                    <div className="line-clamp-2 [overflow-wrap:anywhere] break-words leading-tight">
                      {custName}
                    </div>
                  </td>
                );
              case "customer_short":
                return (
                  <td 
                    key="customer_short"
                    className={`sticky z-20 bg-white group-hover:bg-slate-50 ${borderCls} border-b border-slate-100 text-xs px-2 py-1 overflow-hidden`} 
                    style={{ left: `${left}px`, minWidth: `${w}px`, width: `${w}px`, maxWidth: `${w}px` }} 
                    title={shortName || "—"}
                  >
                    {shortName ? (
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold line-clamp-1 truncate max-w-full">
                        {shortName}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                );
              case "contract":
                return (
                  <td 
                    key="contract"
                    className={`sticky z-20 bg-white group-hover:bg-slate-50 ${borderCls} border-b border-slate-100 text-slate-700 text-xs px-2 py-1 overflow-hidden`} 
                    style={{ left: `${left}px`, minWidth: `${w}px`, width: `${w}px`, maxWidth: `${w}px` }} 
                    title={contractText}
                  >
                    <div className="line-clamp-2 [overflow-wrap:anywhere] break-words leading-tight">
                      <Link href={`/maintenance/${t.id}`} className="text-blue-600 hover:underline font-medium">
                        {contractText}
                      </Link>
                    </div>
                  </td>
                );
              case "notes":
                return (
                  <td 
                    key="notes"
                    className={`sticky z-20 bg-white group-hover:bg-slate-50 ${borderCls} border-b border-slate-100 text-slate-500 text-[11px] px-2 py-1 overflow-hidden`} 
                    style={{ left: `${left}px`, minWidth: `${w}px`, width: `${w}px`, maxWidth: `${w}px` }} 
                    title={notesText || "—"}
                  >
                    <div className="line-clamp-2 [overflow-wrap:anywhere] break-words leading-tight">
                      {notesText || "—"}
                    </div>
                  </td>
                );
              default:
                return null;
            }
          })}
          
          {segments.map((seg, sIdx) => {
            const atYearBoundary = isYearBoundary(seg.startMonth + seg.span);
            const borderClass = atYearBoundary ? "border-r-2 border-slate-300" : "border-r border-slate-200";

            if (seg.type === "empty") {
              return (
                <td 
                  key={sIdx} 
                  colSpan={seg.span} 
                  className={`${borderClass} border-b border-slate-100 last:border-r-0 bg-slate-50/30`} 
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
                className={`p-0.5 ${borderClass} border-b border-slate-100 last:border-r-0`}
              >
                <Link href={`/maintenance/${t.id}`}>
                  <div className={`h-6 w-full rounded flex items-center justify-center text-xs font-semibold shadow-2xs border transition hover:brightness-95 hover:shadow-xs cursor-pointer ${bgClass}`} title={`Lần ${seg.cycleNum} - Ngày dự kiến: ${formatDateVN(c.plannedDate)} - Tiến độ: ${c.progress}%`}>
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
      <div className="h-[calc(100vh-28px)] flex flex-col overflow-hidden">
        <Header 
          title="Kế Hoạch Bảo Trì" 
          description="Quản lý kế hoạch bảo trì định kỳ và hợp đồng dịch vụ" 
          tabs={[
            { id: "list", label: "Danh sách", icon: ClipboardList },
            { id: "timeline", label: "Timeline", icon: Clock },
          ]}
          activeTab={activeTab}
          setActiveTab={(id: any) => setActiveTab(id)}
          className="mb-2 shrink-0"
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-2 shrink-0 gap-2">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleCreateOpen}
              className="h-9 flex items-center gap-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shadow-xs cursor-pointer shrink-0"
            >
              <Plus size={15} />
              Thêm kế hoạch
            </button>
            <div className="relative">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="h-9 w-56 sm:w-64 rounded-lg border border-slate-200 bg-white pl-3.5 pr-8 text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

          {/* Status Multi-Select Filter */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(prev => !prev)}
              className={`h-9 px-3 border rounded-lg text-xs bg-white flex items-center gap-1.5 shadow-2xs transition cursor-pointer select-none ${
                statusFilter.length > 0
                  ? "border-blue-400 ring-2 ring-blue-500/10 font-medium text-blue-900"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <Filter size={13} className={statusFilter.length > 0 ? "text-blue-600" : "text-slate-400"} />
              {statusFilter.length === 0 ? (
                <span>Tất cả tình trạng</span>
              ) : statusFilter.length === 1 ? (
                <div className="flex items-center gap-1">
                  <span className={`px-1.5 py-0.2 rounded text-[11px] font-semibold ${STATUS_OPTIONS.find(o => o.key === statusFilter[0])?.badgeClass}`}>
                    {STATUS_OPTIONS.find(o => o.key === statusFilter[0])?.label}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span>Tình trạng</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white leading-none">
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
                  className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer ml-0.5"
                  title="Xóa chọn tình trạng"
                >
                  <X size={12} />
                </span>
              ) : (
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
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
          <div className="w-52 sm:w-60">
            <CustomerSearchSelect
              value={customerFilter}
              onChange={(val) => setCustomerFilter(val || "All")}
              customers={customers}
              allowAll={true}
              allValue="All"
              allLabel="Tất cả khách hàng"
              placeholder="Tất cả khách hàng"
              isSmall={true}
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
              className="h-9 px-2.5 flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition cursor-pointer"
              title="Xóa tất cả bộ lọc"
            >
              <X size={13} />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>

        {/* Right toolbar controls */}
        {activeTab === "list" && (
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {/* Template Selector Dropdown */}
            <div className="relative" ref={templateDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                className="h-9 px-2.5 flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer font-medium"
                title="Chọn mẫu hiển thị (Template)"
              >
                <Layout size={13} className="text-blue-600" />
                <span className="font-semibold text-slate-800">Mẫu:</span>
                <span className="max-w-[100px] truncate text-blue-700">{activeTemplate?.name || "Mặc định"}</span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {isTemplateDropdownOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Mẫu giao diện (Templates)
                  </div>
                  <div className="max-h-56 overflow-y-auto py-1">
                    {templates.map(tpl => {
                      const isSelected = tpl.id === activeTemplateId;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs transition cursor-pointer ${
                            isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {isSelected ? <Check size={13} className="text-blue-600 shrink-0" /> : <div className="w-3.5 shrink-0" />}
                            <span className="truncate">{tpl.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {tpl.isSystem ? "Hệ thống" : "Tùy chỉnh"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 p-1.5 bg-slate-50/60 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsTemplateDropdownOpen(false);
                        setIsConfigModalOpen(true);
                      }}
                      className="flex-1 py-1.5 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 rounded-lg transition cursor-pointer"
                    >
                      + Quản lý & Lưu mẫu mới...
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Column Visibility Dropdown */}
            <div className="relative" ref={quickVisDropdownRef}>
              <button
                type="button"
                onClick={() => setIsQuickVisDropdownOpen(!isQuickVisDropdownOpen)}
                className="h-9 px-2.5 flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer font-medium"
                title="Ẩn / Hiện nhanh các cột"
              >
                <Eye size={13} className="text-slate-500" />
                <span className="hidden sm:inline">Ẩn/Hiện cột</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-blue-200">
                  {visibleCount}/{MAINTENANCE_COLUMN_ORDER.length}
                </span>
                <ChevronDown size={13} className="text-slate-400" />
              </button>

              {isQuickVisDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 px-1">
                    <span className="text-[11px] font-bold text-slate-600">Hiển thị cột</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const allVis = columnOrder.reduce((acc, k) => ({ ...acc, [k]: true }), {});
                          setVisibleColumns(allVis);
                          saveActiveConfig({ visible: allVis });
                        }}
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Tất cả
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          const minVis = columnOrder.reduce((acc, k) => ({
                            ...acc,
                            [k]: k === "id" || k === "customer_short" || k === "customer",
                          }), {});
                          setVisibleColumns(minVis);
                          saveActiveConfig({ visible: minVis });
                        }}
                        className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                      >
                        Thu gọn
                      </button>
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 py-0.5">
                    {columnOrder.map(colKey => {
                      const isVis = !!visibleColumns[colKey];
                      const label = MAINTENANCE_COLUMN_LABELS[colKey] || colKey;
                      return (
                        <label
                          key={colKey}
                          className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded-lg cursor-pointer text-xs select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isVis}
                            onChange={() => {
                              const updatedVis = { ...visibleColumns, [colKey]: !isVis };
                              setVisibleColumns(updatedVis);
                              saveActiveConfig({ visible: updatedVis });
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className={isVis ? "text-slate-800 font-medium" : "text-slate-400"}>
                            {label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="pt-2 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickVisDropdownOpen(false);
                        setIsConfigModalOpen(true);
                      }}
                      className="w-full py-1 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                    >
                      Tùy chỉnh chi tiết & đổi vị trí →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Column Settings Button (Opens Full Modal) */}
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="h-9 px-2.5 flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer font-medium"
              title="Tùy chỉnh thứ tự, ẩn hiện cột và quản lý template"
            >
              <SlidersHorizontal size={13} className="text-slate-500" />
              <span className="hidden md:inline">Cột & Template</span>
            </button>

            {/* Reset Column Widths */}
            <button
              onClick={handleResetDefault}
              className="h-9 px-2.5 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white shadow-xs transition cursor-pointer"
              title="Khôi phục thứ tự và độ rộng cột mặc định"
            >
              <RotateCcw size={13} />
              <span className="hidden lg:inline">Đặt lại</span>
            </button>
          </div>
        )}
      </div>

      {/* Views Content Container */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Table */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div 
              ref={scrollContainerRef}
              className="table-scroll overflow-x-auto overflow-y-auto flex-1 min-h-0 relative custom-scrollbar"
            >
              <table 
                style={{ minWidth: `${totalTableWidth}px` }}
                className="w-full min-w-full text-sm table-fixed border-collapse"
              >
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <tr className="text-xs text-slate-500 font-medium text-left">
                  {/* Dynamic Draggable & Resizable Column Headers */}
                  {columnOrder.map((colKey) => {
                    if (!visibleColumns[colKey]) return null;
                    const label = MAINTENANCE_COLUMN_LABELS[colKey] || colKey;
                    const isDragging = draggedColKey === colKey;
                    const isDragOver = dragOverColKey === colKey;
                    const isSortable = colKey === "customer" || colKey === "customer_short" || colKey === "created_at";
                    const w = colWidths[colKey] || DEFAULT_MAINTENANCE_COL_WIDTHS[colKey] || 120;

                    return (
                      <th 
                        key={colKey}
                        draggable
                        onDragStart={(e) => handleHeaderDragStart(e, colKey)}
                        onDragOver={(e) => handleHeaderDragOver(e, colKey)}
                        onDrop={(e) => handleHeaderDrop(e, colKey)}
                        onDragEnd={() => { setDraggedColKey(null); setDragOverColKey(null); }}
                        onClick={() => {
                          if (isSortable) handleSort(colKey as any);
                        }}
                        style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }}
                        className={`relative px-3 py-2.5 border-r border-slate-200 select-none group transition-colors cursor-move overflow-hidden ${
                          isSortable ? "hover:bg-slate-100/80" : ""
                        } ${isDragging ? "opacity-30 bg-blue-50" : ""} ${
                          isDragOver ? "bg-blue-100 border-l-2 border-l-blue-600 shadow-inner" : ""
                        }`}
                        title="Kéo thả để thay đổi vị trí cột • Kéo viền phải để chỉnh kích thước"
                      >
                        <div className="flex items-center justify-between gap-1 pr-1.5 min-w-0">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <GripVertical size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0 cursor-grab" />
                            <span className={`line-clamp-2 break-words [overflow-wrap:anywhere] leading-tight text-xs ${sortField === colKey ? "font-semibold text-blue-700" : ""}`}>
                              {label}
                            </span>
                            {isSortable && (
                              <span className="text-slate-400 group-hover:text-slate-600 shrink-0">
                                {sortField === colKey ? (
                                  sortOrder === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                                ) : (
                                  <ArrowUpDown size={11} className="opacity-30 group-hover:opacity-100" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Resizer Handle */}
                        <div
                          draggable={false}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(colKey, e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-0 right-0 h-full w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-20"
                          title="Kéo để điều chỉnh độ rộng cột"
                        />
                      </th>
                    );
                  })}

                  {/* Actions Header */}
                  <th 
                    style={{ width: `${colWidths.actions || 85}px`, minWidth: `${colWidths.actions || 85}px`, maxWidth: `${colWidths.actions || 85}px` }}
                    className="relative px-3 py-2.5 text-center select-none group bg-slate-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="truncate">Thao tác</span>
                      <button
                        type="button"
                        onClick={() => setIsConfigModalOpen(true)}
                        className="p-1 hover:bg-slate-200/70 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                        title="Tùy biến cột & Template"
                      >
                        <SlidersHorizontal size={12} />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleCount + 1} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Đang tải...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCount + 1} className="py-14 text-center text-slate-400">
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
                    const shortName = getCustomerShortName(t);
                    const notesText = getPlanNotes(t);
                    return (
                      <tr key={t.id || i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                        {columnOrder.map((colKey) => {
                          if (!visibleColumns[colKey]) return null;
                          const w = colWidths[colKey] || DEFAULT_MAINTENANCE_COL_WIDTHS[colKey] || 120;
                          switch (colKey) {
                            case "id":
                              return (
                                <td 
                                  key="id" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 font-medium text-blue-600 border-r border-b border-slate-200 overflow-hidden"
                                >
                                  <Link 
                                    href={`/maintenance/${t.id}`} 
                                    className="hover:underline line-clamp-2 break-all [overflow-wrap:anywhere] leading-snug"
                                    title={t.ticket_id ? t.ticket_id.replace(/^[A-Z]+-/, 'BTR-') : '—'}
                                  >
                                    {t.ticket_id ? t.ticket_id.replace(/^[A-Z]+-/, 'BTR-') : '—'}
                                  </Link>
                                </td>
                              );
                            case "customer":
                              const custName = t.customer?.name || t.customer_name || "—";
                              return (
                                <td 
                                  key="customer" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 text-slate-700 font-medium border-r border-b border-slate-200 overflow-hidden" 
                                  title={custName}
                                >
                                  <div className="line-clamp-2 break-words [overflow-wrap:anywhere] leading-snug">
                                    {custName}
                                  </div>
                                </td>
                              );
                            case "customer_short":
                              return (
                                <td 
                                  key="customer_short" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 text-slate-700 border-r border-b border-slate-200 overflow-hidden" 
                                  title={shortName || "—"}
                                >
                                  {shortName ? (
                                    <span className="inline-block max-w-full px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold line-clamp-2 break-all [overflow-wrap:anywhere] leading-tight">
                                      {shortName}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                              );
                            case "contract":
                              const contractText = t.contract_no || t.contract?.contract_no || t.contract?.name || "—";
                              return (
                                <td 
                                  key="contract" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 text-slate-500 border-r border-b border-slate-200 overflow-hidden" 
                                  title={contractText}
                                >
                                  <div className="line-clamp-2 break-all [overflow-wrap:anywhere] leading-snug">
                                    {contractText}
                                  </div>
                                </td>
                              );
                            case "notes":
                              return (
                                <td 
                                  key="notes" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 text-slate-500 text-xs border-r border-b border-slate-200 overflow-hidden" 
                                  title={notesText || "—"}
                                >
                                  <div className="line-clamp-2 break-words [overflow-wrap:anywhere] leading-snug">
                                    {notesText || "—"}
                                  </div>
                                </td>
                              );
                            case "creator":
                              const creatorStr = t.creator_name || t.created_by || t.user_name || "—";
                              return (
                                <td 
                                  key="creator" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 text-slate-700 border-r border-b border-slate-200 overflow-hidden" 
                                  title={creatorStr}
                                >
                                  <div className="flex items-start gap-1.5 min-w-0">
                                    <User size={13} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2 break-words [overflow-wrap:anywhere] leading-snug">
                                      {creatorStr}
                                    </span>
                                  </div>
                                </td>
                              );
                            case "created_at":
                              const dateStr = formatDateTimeVN(t.created_at || t.created_time || t.start_time);
                              return (
                                <td 
                                  key="created_at" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 text-slate-500 text-xs border-r border-b border-slate-200 overflow-hidden" 
                                  title={t.created_at || dateStr}
                                >
                                  <div className="line-clamp-2 break-words [overflow-wrap:anywhere] leading-snug">
                                    {dateStr}
                                  </div>
                                </td>
                              );
                            case "hold_time":
                              return (
                                <td 
                                  key="hold_time" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 text-center font-medium text-slate-500 border-r border-b border-slate-200 overflow-hidden"
                                >
                                  <span className="line-clamp-2 break-all">{t.hold_time || 0}</span>
                                </td>
                              );
                            case "status":
                              return (
                                <td 
                                  key="status" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 border-r border-b border-slate-200 overflow-hidden"
                                >
                                  <span className={`inline-block max-w-full px-2 py-0.5 rounded text-xs font-semibold line-clamp-2 break-all leading-tight ${statusInfo.badgeClass}`}>
                                    {statusInfo.label}
                                  </span>
                                </td>
                              );
                            case "progress":
                              return (
                                <td 
                                  key="progress" 
                                  style={{ width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px` }} 
                                  className="px-3 py-2.5 border-r border-b border-slate-200 overflow-hidden"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="flex-1 min-w-[20px] bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${statusInfo.barClass}`}
                                        style={{ width: `${progressVal}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 shrink-0">{progressVal}%</span>
                                  </div>
                                </td>
                              );
                            default:
                              return null;
                          }
                        })}
                        <td 
                          style={{ width: `${colWidths.actions || 85}px`, minWidth: `${colWidths.actions || 85}px`, maxWidth: `${colWidths.actions || 85}px` }} 
                          className="px-2 py-2.5 text-center border-b border-slate-200 overflow-hidden"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleEdit(t)}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                              title="Sửa kế hoạch"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(t.id)}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded transition cursor-pointer"
                              title="Xóa kế hoạch"
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
        </div>
      )}

      {/* Timeline View */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 overflow-hidden flex flex-col flex-1 min-h-0 gap-2">
          {/* Compact Top Bar: Title + Scale switch + Columns dropdown + Stats badges + Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 shrink-0">
            {/* Left: Title + Scale switch + Columns dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">Timeline Kế Hoạch</span>

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
                    className={`px-2 py-0.5 rounded text-xs font-semibold transition cursor-pointer ${
                      timeScale === scale.id
                        ? "bg-white text-slate-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>

              {/* Column visibility dropdown */}
              <div className="relative" ref={timelineColDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTimelineColDropdownOpen(!isTimelineColDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
                  title="Ẩn / Hiện cột thông tin"
                >
                  <SlidersHorizontal size={12} className="text-slate-500" />
                  <span>Cột thông tin</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform ${isTimelineColDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isTimelineColDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 px-1">
                      <span className="text-xs font-bold text-slate-700">Cột thông tin cố định</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allTrue = { no: true, customer: true, customer_short: true, contract: true, notes: true };
                          setTimelineVisibleCols(allTrue);
                          try { localStorage.setItem(STORAGE_TIMELINE_COLS_KEY, JSON.stringify(allTrue)); } catch (e) {}
                        }}
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Hiện tất cả
                      </button>
                    </div>
                    <div className="space-y-1">
                      {TIMELINE_COL_DEFS.map((col) => {
                        const isChecked = timelineVisibleCols[col.key] !== false;
                        return (
                          <label
                            key={col.key}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700 select-none transition"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTimelineCol(col.key)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="flex-1 font-medium">{col.label}</span>
                            {isChecked ? (
                              <Eye size={12} className="text-blue-500" />
                            ) : (
                              <EyeOff size={12} className="text-slate-300" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Center: 3 Compact Stats Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Badge 1: Đang chạy */}
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 text-xs font-medium shadow-2xs" 
                title="Kỳ bảo trì đang trong tiến độ thực hiện"
              >
                <Clock size={13} className="text-orange-600 shrink-0" />
                <span>Đang chạy:</span>
                <span className="px-1.5 py-0.2 rounded bg-orange-500 text-white text-[11px] font-bold leading-none">
                  {timelineStats.ongoingCount}
                </span>
              </div>

              {/* Badge 2: Kế hoạch */}
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium shadow-2xs" 
                title="Kỳ bảo trì kế hoạch dự kiến tới ngày hiện tại"
              >
                <Calendar size={13} className="text-sky-600 shrink-0" />
                <span>Kế hoạch:</span>
                <span className="px-1.5 py-0.2 rounded bg-sky-600 text-white text-[11px] font-bold leading-none">
                  {timelineStats.upcomingPlannedCount}
                </span>
              </div>

              {/* Badge 3: Quá hạn */}
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium shadow-2xs" 
                title="Đã quá hạn kết thúc kỳ nhưng chưa hoàn thành"
              >
                <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                <span>Quá hạn:</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[11px] font-bold leading-none">
                  {timelineStats.overdueCount}
                </span>
              </div>
            </div>

            {/* Right: Legend */}
            <div className="flex items-center gap-2.5 text-[11px]">
              <span className="font-semibold text-slate-400 hidden xl:inline">Chú thích:</span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-400" />
                <span className="text-slate-600">Done</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-orange-100 border border-orange-400" />
                <span className="text-slate-600">On-going</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-400" />
                <span className="text-slate-600">Planing</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-purple-100 border border-purple-400" />
                <span className="text-slate-600">Hold</span>
              </div>
            </div>
          </div>

          <div 
            ref={timelineScrollRef} 
            className="table-scroll flex-1 min-h-0 overflow-x-auto overflow-y-auto relative custom-scrollbar border border-slate-200 rounded-lg shadow-2xs"
          >
            <div className={`relative ${
              timeScale === "month" ? "min-w-[1800px]" : 
              timeScale === "week" ? "min-w-[4500px]" : 
              "min-w-[28000px]"
            } w-full`}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  {/* Year header row with year dividers */}
                  <tr className="text-center font-bold text-slate-700 bg-slate-100 border-b border-slate-200 sticky top-0 z-30 h-8">
                    {timelineOffsets.visibleCount > 0 && (
                      <th 
                        colSpan={timelineOffsets.visibleCount} 
                        className="px-3 py-1 border-r-2 border-slate-300 text-left sticky left-0 top-0 bg-slate-100 z-40 text-xs font-bold text-slate-700 select-none shadow-[2px_0_4px_rgba(0,0,0,0.03)]" 
                        style={{ left: 0, width: `${timelineOffsets.totalStickyWidth}px`, minWidth: `${timelineOffsets.totalStickyWidth}px` }}
                      >
                        Giai đoạn
                      </th>
                    )}
                    {yearsList.map((year) => {
                      let span = 12;
                      if (timeScale === "week") span = 52;
                      if (timeScale === "day") span = isLeapYear(year) ? 366 : 365;

                      return (
                        <th 
                          key={year} 
                          colSpan={span} 
                          className="px-2 py-1 text-center text-xs font-bold border-r-2 border-slate-300 bg-slate-100 text-slate-800 sticky top-0 z-30 select-none"
                        >
                          Năm {year}
                        </th>
                      );
                    })}
                  </tr>
                  
                  {/* Column sub-headers */}
                  <tr className="text-xs text-slate-500 font-medium text-left bg-slate-50 border-b border-slate-200 sticky top-8 z-30 h-8">
                    {TIMELINE_COL_DEFS.map((col) => {
                      if (timelineVisibleCols[col.key] === false) return null;
                      const isLast = col.key === timelineOffsets.lastColKey;
                      const w = timelineOffsets.widths[col.key];
                      const left = timelineOffsets.offsets[col.key];
                      return (
                        <th 
                          key={col.key} 
                          className={`px-2 py-1 sticky top-8 bg-slate-50 z-40 font-semibold text-xs text-slate-600 select-none ${
                            isLast ? "border-r-2 border-slate-300 shadow-[2px_0_4px_rgba(0,0,0,0.03)]" : "border-r border-slate-200"
                          } ${col.key === "no" ? "text-center" : "text-left"}`} 
                          style={{ left: `${left}px`, minWidth: `${w}px`, width: `${w}px`, maxWidth: `${w}px` }}
                        >
                          <span className="truncate block" title={col.label}>{col.label}</span>
                        </th>
                      );
                    })}
                    
                    {timeScale === "month" && yearsList.flatMap((year) => 
                      ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                        <th 
                          key={`${year}-${m}`} 
                          className={`px-2 py-1 text-center text-xs font-semibold sticky top-8 bg-slate-50 z-30 ${idx === 11 ? "border-r-2 border-slate-300 bg-slate-100/40" : "border-r border-slate-200"}`} 
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
                          className={`px-1 py-1 text-center text-[9px] font-medium sticky top-8 bg-slate-50 z-30 ${idx === 51 ? "border-r-2 border-slate-300 bg-slate-100/40" : "border-r border-slate-200"}`} 
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
                        className={`px-1 py-1 text-center text-[9px] sticky top-8 bg-slate-50 z-30 ${d.isYearEnd ? "border-r-2 border-slate-300 bg-slate-100/40" : "border-r border-slate-200"}`} 
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
                        colSpan={timelineOffsets.visibleCount + (timeScale === "month" ? yearsList.length * 12 : timeScale === "week" ? yearsList.length * 52 : yearsList.reduce((acc, y) => acc + (isLeapYear(y) ? 366 : 365), 0))} 
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
                  className="absolute top-0 bottom-0 w-[2.5px] bg-sky-500 pointer-events-none shadow-[0_0_8px_rgba(14,165,233,0.5)] z-25"
                  style={{ left: `calc(${timelineOffsets.totalStickyWidth}px + (100% - ${timelineOffsets.totalStickyWidth}px) * ${todayLineFraction})` }}
                >
                  <div className="sticky top-2 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap shadow-xs w-fit mx-auto">
                    Hiện tại
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

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

              {/* Customer Short Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tên KH Viết tắt
                </label>
                <input
                  type="text"
                  value={form.customerShortName}
                  onChange={e => setForm(f => ({ ...f, customerShortName: e.target.value }))}
                  placeholder="Nhập tên viết tắt (vd: VIETIN, MBB, JPT...)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Nhập ghi chú cho kế hoạch bảo trì..."
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
      {/* Column Customization & Templates Modal */}
      <MaintenanceColumnConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        columnOrder={columnOrder}
        setColumnOrder={(order) => {
          setColumnOrder(order);
          saveActiveConfig({ order });
        }}
        visibleColumns={visibleColumns}
        setVisibleColumns={(vis) => {
          if (typeof vis === "function") {
            setVisibleColumns(prev => {
              const next = vis(prev);
              saveActiveConfig({ visible: next });
              return next;
            });
          } else {
            setVisibleColumns(vis);
            saveActiveConfig({ visible: vis });
          }
        }}
        colWidths={colWidths}
        setColWidths={(widths) => {
          if (typeof widths === "function") {
            setColWidths(prev => {
              const next = widths(prev);
              saveActiveConfig({ widths: next });
              return next;
            });
          } else {
            setColWidths(widths);
            saveActiveConfig({ widths });
          }
        }}
        templates={templates}
        activeTemplateId={activeTemplateId}
        onApplyTemplate={handleApplyTemplate}
        onSaveNewTemplate={handleSaveNewTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onResetDefault={handleResetDefault}
      />
    </MainLayout>
  );
}

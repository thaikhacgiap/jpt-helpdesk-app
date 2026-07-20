"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { fetchDashboardData, DashboardData } from "@/lib/dashboard-operations";
import { fetchProjects, Project } from "@/lib/project-operations";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  Ticket, AlertTriangle, CheckCircle2, Activity, TrendingUp, Clock,
  Wrench, FolderOpen, DollarSign, Briefcase, Percent, ClipboardList,
  ShieldCheck, Presentation, BarChart3, Layers
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  "New": "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  "On Hold": "bg-red-100 text-red-600",
  "Resolved": "bg-green-100 text-green-700",
  "Closed": "bg-purple-100 text-purple-700",
};

const PROJECT_STATUS_BADGE: Record<string, string> = {
  "Planning": "bg-blue-50 text-blue-600 border border-blue-200/50",
  "Active": "bg-emerald-50 text-emerald-600 border border-emerald-200/50",
  "On Hold": "bg-amber-50 text-amber-600 border border-amber-200/50",
  "Completed": "bg-purple-50 text-purple-600 border border-purple-200/50",
  "Delayed": "bg-rose-50 text-rose-600 border border-rose-200/50",
};

const TAB_COLORS = {
  "New": "#3B82F6",
  "In Progress": "#F59E0B",
  "On Hold": "#EF4444",
  "Resolved": "#10B981",
  "Closed": "#8B5CF6",
};

const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"synthesis" | "general" | "maintenance" | "deployment">("synthesis");
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        // Load general dashboard statistics
        const dashData = await fetchDashboardData();
        setData(dashData);

        // Load project data from localStorage
        const projData = fetchProjects();
        setProjects(projData || []);

        // Load all tickets from Supabase to filter
        const { data: ticketsData } = await supabase
          .from("tickets")
          .select("*, customer:customers(id, name), contract:contracts(id, name)")
          .order("created_at", { ascending: false });

        setTickets(ticketsData || []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Dynamic Date Filter Calculations
  const getFilterStartDate = () => {
    const d = new Date();
    if (timeFilter === "week") {
      d.setDate(d.getDate() - 7);
    } else if (timeFilter === "month") {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setFullYear(d.getFullYear() - 1);
    }
    return d;
  };

  const filterDate = getFilterStartDate();

  // Filter datasets dynamic based on selection
  const filteredTickets = tickets.filter(t => t.created_at && new Date(t.created_at) >= filterDate);
  const filteredProjects = projects.filter(p => p.startDate && new Date(p.startDate) >= filterDate);

  // 1. SYNTHESIS (CONSOLIDATED) TAB CALCULATIONS
  const totalHTKTSynth = filteredTickets.filter(t => t.tt_type !== "Maintenance").length;
  const totalMaintSynth = filteredTickets.filter(t => t.tt_type === "Maintenance").length;
  const totalProjectsSynth = filteredProjects.length;
  
  const totalBudgetSynth = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  // Calculate Synthesis combined progress
  const synthMaintList = filteredTickets.filter(t => t.tt_type === "Maintenance");
  const avgMaintProgressSynth = synthMaintList.length > 0 
    ? Math.round(synthMaintList.reduce((sum, t) => sum + (parseInt(t.progress || "0") || 0), 0) / synthMaintList.length) 
    : 0;
  const avgProjProgressSynth = totalProjectsSynth > 0 
    ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjectsSynth) 
    : 0;
  const overallSynthProgress = Math.round((avgMaintProgressSynth + avgProjProgressSynth) / 2) || 0;

  // Synthesis Tab KPI list
  const kpisSynthesis = [
    {
      label: "Ticket HTKT",
      value: totalHTKTSynth,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      sub: "Yêu cầu sự cố hỗ trợ",
    },
    {
      label: "Kế hoạch Bảo trì",
      value: totalMaintSynth,
      icon: Wrench,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
      sub: "Lịch bảo trì định kỳ",
    },
    {
      label: "Dự án Triển khai",
      value: totalProjectsSynth,
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      sub: "Dự án đang triển khai",
    },
    {
      label: "Tổng ngân sách dự án",
      value: totalBudgetSynth > 1000000 ? `${Math.round(totalBudgetSynth / 1000000)} Tr.đ` : formatVND(totalBudgetSynth),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      sub: "Ngân sách triển khai",
    },
    {
      label: "Tiến độ công việc chung",
      value: `${overallSynthProgress}%`,
      icon: Percent,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
      sub: "Tiến độ bảo trì & dự án",
    },
  ];

  // Synthesis Chart 1: Activity Trend (Tickets, Maintenance, Projects over time)
  const generateSynthesisTrendData = () => {
    const points: { label: string; dateStr: string }[] = [];
    const now = new Date();
    
    if (timeFilter === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        points.push({ label: d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric" }), dateStr: ds });
      }
    } else if (timeFilter === "month") {
      for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - (i * 3));
        const ds = d.toISOString().split("T")[0];
        points.push({ label: d.toLocaleDateString("vi-VN", { month: "short", day: "numeric" }), dateStr: ds });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleDateString("vi-VN", { month: "short" });
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        points.push({ label, dateStr: monthKey });
      }
    }

    return points.map(pt => {
      const ticketsCount = tickets.filter(t => t.tt_type !== "Maintenance" && t.created_at?.startsWith(pt.dateStr)).length;
      const maintCount = tickets.filter(t => t.tt_type === "Maintenance" && t.created_at?.startsWith(pt.dateStr)).length;
      const projCount = projects.filter(p => p.startDate?.startsWith(pt.dateStr)).length;

      return {
        name: pt.label,
        "Vé HTKT": ticketsCount,
        "Kỳ Bảo Trì": maintCount,
        "Dự Án": projCount
      };
    });
  };

  const synthTrendData = generateSynthesisTrendData();

  // Synthesis Chart 2: Workload distribution by status
  const workloadData = [
    {
      name: "Chờ tiếp nhận / Lập lịch",
      "Vé HTKT": filteredTickets.filter(t => t.tt_type !== "Maintenance" && t.tt_status === "New").length,
      "Kỳ Bảo Trì": filteredTickets.filter(t => t.tt_type === "Maintenance" && t.tt_status === "New").length,
      "Dự Án": filteredProjects.filter(p => p.status === "Planning").length,
    },
    {
      name: "Đang triển khai",
      "Vé HTKT": filteredTickets.filter(t => t.tt_type !== "Maintenance" && t.tt_status === "In Progress").length,
      "Kỳ Bảo Trì": filteredTickets.filter(t => t.tt_type === "Maintenance" && t.tt_status === "In Progress").length,
      "Dự Án": filteredProjects.filter(p => p.status === "Active" || p.status === "Delayed").length,
    },
    {
      name: "Tạm dừng (Hold)",
      "Vé HTKT": filteredTickets.filter(t => t.tt_type !== "Maintenance" && t.tt_status === "On Hold").length,
      "Kỳ Bảo Trì": filteredTickets.filter(t => t.tt_type === "Maintenance" && t.tt_status === "On Hold").length,
      "Dự Án": filteredProjects.filter(p => p.status === "On Hold").length,
    },
    {
      name: "Đã hoàn thành",
      "Vé HTKT": filteredTickets.filter(t => t.tt_type !== "Maintenance" && (t.tt_status === "Resolved" || t.tt_status === "Closed")).length,
      "Kỳ Bảo Trì": filteredTickets.filter(t => t.tt_type === "Maintenance" && (t.tt_status === "Resolved" || t.tt_status === "Closed")).length,
      "Dự Án": filteredProjects.filter(p => p.status === "Completed").length,
    }
  ];


  // 2. HTKT (TICKET FOCUS) TAB CALCULATIONS (Lọc theo thời gian chọn)
  const htktTickets = filteredTickets;
  const htktTotal = htktTickets.length;
  const htktOpen = htktTickets.filter(t => ["New", "In Progress", "On Hold"].includes(t.tt_status)).length;
  const htktResolved = htktTickets.filter(t => ["Resolved", "Closed"].includes(t.tt_status)).length;
  const htktSlaBreached = htktTickets.filter(t => t.sla_status === "Breached").length;
  const htktSlaMetCount = htktTotal - htktSlaBreached;
  const htktSlaMetRate = htktTotal > 0 ? Math.round((htktSlaMetCount / htktTotal) * 100) : 100;

  const kpisHTKT = [
    {
      label: "Tổng số Ticket",
      value: htktTotal,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      sub: "Tổng vé phát sinh trong kỳ",
    },
    {
      label: "Đang xử lý",
      value: htktOpen,
      icon: Activity,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
      sub: `${htktTotal ? Math.round((htktOpen / htktTotal) * 100) : 0}% tổng số lượng`,
    },
    {
      label: "Đã giải quyết",
      value: htktResolved,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
      sub: `${htktTotal ? Math.round((htktResolved / htktTotal) * 100) : 0}% hoàn thành`,
    },
    {
      label: "Vi phạm SLA",
      value: htktSlaBreached,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      sub: "Yêu cầu xử lý khẩn cấp",
    },
    {
      label: "Tỷ lệ đạt SLA",
      value: `${htktSlaMetRate}%`,
      icon: ShieldCheck,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
      sub: "Mức cam kết chất lượng",
    },
    {
      label: "Đang tạm giữ (Hold)",
      value: htktTickets.filter(t => t.tt_status === "On Hold").length,
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      sub: "Đang chờ thông tin",
    },
  ];

  // SLA Status Pie
  const slaStatusData = [
    { name: "Đạt SLA (Met)", value: htktSlaMetCount, color: "#10B981" },
    { name: "Trễ SLA (Breached)", value: htktSlaBreached, color: "#EF4444" }
  ];

  // Category Distribution
  const catMap: Record<string, number> = {};
  htktTickets.forEach(t => {
    const cat = t.category || "Chưa phân loại";
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const catColors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#6B7280"];
  const catChartData = Object.entries(catMap).map(([name, value], idx) => ({
    name, value, color: catColors[idx % catColors.length]
  }));

  // Type Distribution
  const typeMap: Record<string, number> = {};
  htktTickets.forEach(t => {
    const type = t.tt_type || "Khác";
    typeMap[type] = (typeMap[type] || 0) + 1;
  });
  const typeColorsMap = {
    "Incident": "#EF4444",
    "Request": "#3B82F6",
    "Question": "#10B981",
    "Maintenance": "#8B5CF6",
    "Khác": "#6B7280"
  };
  const typeChartData = Object.entries(typeMap).map(([name, value]) => ({
    name, value, color: typeColorsMap[name as keyof typeof typeColorsMap] || "#6B7280"
  }));

  // Tickets by Status Chart
  const statusMapSynth: Record<string, number> = {};
  htktTickets.forEach(t => {
    const s = t.tt_status || "New";
    statusMapSynth[s] = (statusMapSynth[s] || 0) + 1;
  });
  const statusChartData = Object.entries(statusMapSynth).map(([name, value]) => ({
    name, value, color: TAB_COLORS[name as keyof typeof TAB_COLORS] || "#6B7280"
  }));

  // Tickets by Priority Chart
  const priorityMapSynth: Record<string, number> = {};
  htktTickets.forEach(t => {
    const p = t.priority || "Medium";
    priorityMapSynth[p] = (priorityMapSynth[p] || 0) + 1;
  });
  const priorityColors: Record<string, string> = {
    "Low": "#10B981",
    "Medium": "#F59E0B",
    "High": "#EF4444",
    "Critical": "#7C3AED",
  };
  const priorityChartData = Object.entries(priorityMapSynth).map(([name, value]) => ({
    name, value, color: priorityColors[name] || "#6B7280"
  }));

  // Trend Chart Data (HTKT focus in selected period)
  const generateHTKTTrendData = () => {
    const points: { label: string; dateStr: string }[] = [];
    const now = new Date();
    
    if (timeFilter === "week") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        points.push({ label: d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric" }), dateStr: ds });
      }
    } else if (timeFilter === "month") {
      for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - (i * 3));
        const ds = d.toISOString().split("T")[0];
        points.push({ label: d.toLocaleDateString("vi-VN", { month: "short", day: "numeric" }), dateStr: ds });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleDateString("vi-VN", { month: "short" });
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        points.push({ label, dateStr: monthKey });
      }
    }

    return points.map(pt => ({
      date: pt.label,
      count: htktTickets.filter(t => t.tt_type !== "Maintenance" && t.created_at?.startsWith(pt.dateStr)).length,
    }));
  };

  const htktTrendChartData = generateHTKTTrendData();


  // 3. MAINTENANCE (BTR) TAB CALCULATIONS (Lọc theo thời gian chọn)
  const maintTickets = filteredTickets.filter(t => t.tt_type === "Maintenance");
  const activeMaint = maintTickets.filter(t => t.tt_status !== "Resolved" && t.tt_status !== "Closed");
  const completedMaint = maintTickets.filter(t => t.tt_status === "Resolved" || t.tt_status === "Closed");
  
  const totalMaintProgress = maintTickets.reduce((sum, t) => sum + (parseInt(t.progress || "0") || 0), 0);
  const avgMaintProgress = maintTickets.length > 0 ? Math.round(totalMaintProgress / maintTickets.length) : 0;

  const maintStatusMap: Record<string, number> = {};
  maintTickets.forEach(t => {
    const s = t.tt_status || "New";
    maintStatusMap[s] = (maintStatusMap[s] || 0) + 1;
  });
  const maintStatusData = Object.entries(maintStatusMap).map(([name, value]) => ({
    name, value, color: TAB_COLORS[name as keyof typeof TAB_COLORS] || "#6B7280"
  }));

  const maintProgressData = maintTickets.slice(0, 5).map(t => ({
    name: t.customer?.name ? (t.customer.name.length > 15 ? t.customer.name.substring(0, 15) + "..." : t.customer.name) : "Khách hàng",
    "Kỳ hiện tại": parseInt(t.sla_time) || 1,
    "Tổng kỳ": parseInt(t.hold_time) || 12
  }));


  // 4. DEPLOYMENT (PROJ) TAB CALCULATIONS (Lọc theo thời gian chọn)
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p => p.status === "Active" || p.status === "Delayed").length;
  const completedProjects = filteredProjects.filter(p => p.status === "Completed").length;
  const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalProjProgress = filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0);
  const avgProjProgress = totalProjects > 0 ? Math.round(totalProjProgress / totalProjects) : 0;

  const projStatusMap: Record<string, number> = {};
  filteredProjects.forEach(p => {
    const s = p.status || "Planning";
    projStatusMap[s] = (projStatusMap[s] || 0) + 1;
  });
  const projStatusColors: Record<string, string> = {
    "Planning": "#3B82F6",
    "Active": "#10B981",
    "On Hold": "#F59E0B",
    "Completed": "#8B5CF6",
    "Delayed": "#EF4444",
  };
  const projStatusData = Object.entries(projStatusMap).map(([name, value]) => ({
    name, value, color: projStatusColors[name] || "#6B7280"
  }));

  const projBudgetData = filteredProjects.slice(0, 5).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    "Ngân sách (Tr.đ)": Math.round(p.budget / 1000000)
  }));


  return (
    <MainLayout>
      <Header title="Bảng Điều Khiển (Dashboard)" description={today} />

      {/* Tabs and Time filter Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 mb-6 gap-4 pb-1">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab("synthesis")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "synthesis"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers size={15} />
            <span>Dashboard Tổng Hợp</span>
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "general"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp size={15} />
            <span>Dashboard HTKT</span>
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "maintenance"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wrench size={15} />
            <span>Dashboard Bảo trì định kỳ</span>
          </button>
          <button
            onClick={() => setActiveTab("deployment")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "deployment"
                ? "border-blue-600 text-blue-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderOpen size={15} />
            <span>Dashboard Triển khai dự án</span>
          </button>
        </div>

        {/* Time filters */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200/50 shrink-0 self-start md:self-auto mb-1.5 shadow-2xs">
          <button
            onClick={() => setTimeFilter("week")}
            className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              timeFilter === "week" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tuần này
          </button>
          <button
            onClick={() => setTimeFilter("month")}
            className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              timeFilter === "month" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setTimeFilter("year")}
            className={`px-3.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              timeFilter === "year" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Năm nay
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: SYNTHESIS (CONSOLIDATED) DASHBOARD */}
          {activeTab === "synthesis" && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {kpisSynthesis.map((kpi, i) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={i}
                      className={`bg-white rounded-2xl border ${kpi.border} p-4 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow`}
                    >
                      <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                        <Icon size={20} className={kpi.color} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold">{kpi.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.value}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Activity Trend */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Xu hướng hoạt động tổng hợp</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={synthTrendData}
                      margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="Vé HTKT" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Kỳ Bảo Trì" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Dự Án" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart 2: Workload Distribution */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Khối lượng công việc theo Trạng thái</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={workloadData}
                      margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Vé HTKT" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Kỳ Bảo Trì" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Dự Án" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DASHBOARD HTKT (TICKET FOCUS) */}
          {activeTab === "general" && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpisHTKT.map((kpi, i) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={i}
                      className={`bg-white rounded-2xl border ${kpi.border} p-4 flex flex-col gap-3 shadow-xs hover:shadow-md transition-shadow`}
                    >
                      <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                        <Icon size={20} className={kpi.color} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold">{kpi.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.value}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 6 Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Status Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Trạng thái xử lý Ticket</h3>
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="45%"
                          outerRadius={65}
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <TrendingUp size={32} />
                      <p className="text-xs font-semibold">Chưa có dữ liệu</p>
                    </div>
                  )}
                </div>

                {/* 2. Priority Bar Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Mức độ ưu tiên (Priority)</h3>
                  {priorityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={priorityChartData}
                        margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Tickets">
                          {priorityChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <TrendingUp size={32} />
                      <p className="text-xs font-semibold">Chưa có dữ liệu</p>
                    </div>
                  )}
                </div>

                {/* 3. Trend Line Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Xu hướng sự cố</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={htktTrendChartData}
                      margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#3B82F6" }}
                        name="Tickets"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* 4. SLA Met vs Breached Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Trạng thái cam kết SLA</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={slaStatusData}
                        cx="50%"
                        cy="45%"
                        outerRadius={65}
                        dataKey="value"
                      >
                        {slaStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 5. Category Distribution Bar Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Phân bổ theo Danh mục sự cố</h3>
                  {catChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={catChartData}
                        margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Số lượng">
                          {catChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <TrendingUp size={32} />
                      <p className="text-xs font-semibold">Chưa có danh mục nào</p>
                    </div>
                  )}
                </div>

                {/* 6. Type Distribution Pie Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Phân bổ theo Phân loại Ticket</h3>
                  {typeChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={typeChartData}
                          cx="50%"
                          cy="45%"
                          outerRadius={65}
                          dataKey="value"
                        >
                          {typeChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <TrendingUp size={32} />
                      <p className="text-xs font-semibold">Chưa có phân loại nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MAINTENANCE DASHBOARD */}
          {activeTab === "maintenance" && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Tổng kế hoạch Bảo trì</p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">{maintTickets.length}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">kế hoạch trong kỳ</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Đang thực hiện</p>
                    <p className="text-2xl font-bold text-orange-600 mt-0.5">{activeMaint.length}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">chưa hoàn tất các kỳ</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Hoàn tất / Đã đóng</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-0.5">{completedMaint.length}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">{maintTickets.length ? Math.round((completedMaint.length / maintTickets.length) * 100) : 0}% tỷ lệ hoàn thành</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Percent size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Tiến độ bình quân</p>
                    <p className="text-2xl font-bold text-blue-600 mt-0.5">{avgMaintProgress}%</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">mức độ hoàn thành các kỳ</p>
                  </div>
                </div>
              </div>

              {/* Maintenance charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Maintenance Status Pie */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Trạng thái bảo trì</h3>
                  {maintStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={maintStatusData}
                          cx="50%"
                          cy="45%"
                          outerRadius={70}
                          dataKey="value"
                        >
                          {maintStatusData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <Wrench size={32} />
                      <p className="text-xs font-semibold">Chưa có kế hoạch bảo trì nào</p>
                    </div>
                  )}
                </div>

                {/* Progress bar comparison */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">So sánh số kỳ thực tế / tổng kỳ (Top 5)</h3>
                  {maintProgressData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={maintProgressData}
                        margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Kỳ hiện tại" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Tổng kỳ" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <TrendingUp size={32} />
                      <p className="text-xs font-semibold">Chưa có dữ liệu bảo trì</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance List */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} className="text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Lịch trình kế hoạch bảo trì hiện hành</h3>
                  </div>
                  <a href="/maintenance" className="text-xs text-blue-600 hover:underline font-bold">
                    Chi tiết kế hoạch →
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-xs text-slate-500 font-semibold text-left">
                        <th className="px-6 py-3.5">Mã kế hoạch</th>
                        <th className="px-4 py-3.5">Khách hàng liên kết</th>
                        <th className="px-4 py-3.5">Hợp đồng</th>
                        <th className="px-4 py-3.5 text-center">Tiến độ kỳ hạn (Kỳ/Tổng)</th>
                        <th className="px-4 py-3.5">Thanh tiến độ</th>
                        <th className="px-6 py-3.5">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {maintTickets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                            <Wrench size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Chưa đăng ký lịch bảo trì định kỳ nào trong kỳ lọc</p>
                          </td>
                        </tr>
                      ) : (
                        maintTickets.map((t, idx) => (
                          <tr key={t.id || idx} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 font-bold text-teal-600 whitespace-nowrap">
                              {t.ticket_id}
                            </td>
                            <td className="px-4 py-4 text-slate-800 font-bold text-xs">
                              {t.customer?.name || t.customer_name || "—"}
                            </td>
                            <td className="px-4 py-4 text-slate-500 text-xs font-medium">
                              {t.contract?.name || t.contract_no || "Chưa có"}
                            </td>
                            <td className="px-4 py-4 text-center font-mono font-bold text-xs text-slate-700">
                              Kỳ {t.sla_time || 1} / {t.hold_time || 12}
                            </td>
                            <td className="px-4 py-4 min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div
                                    className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: t.progress || "0%" }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 shrink-0">{t.progress || "0%"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  STATUS_BADGE[t.tt_status] || "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {t.tt_status || "New"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEPLOYMENT DASHBOARD */}
          {activeTab === "deployment" && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Tổng Dự án triển khai</p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalProjects}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">dự án trong kỳ lọc</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Dự án đang chạy</p>
                    <p className="text-2xl font-bold text-orange-600 mt-0.5">{activeProjects}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">gồm hoạt động và trễ hạn</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <Percent size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Tiến độ triển khai trung bình</p>
                    <p className="text-2xl font-bold text-blue-600 mt-0.5">{avgProjProgress}%</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">mức độ hoàn thành các dự án</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Tổng ngân sách dự toán</p>
                    <p className="text-lg font-extrabold text-emerald-600 mt-1 truncate" title={formatVND(totalBudget)}>
                      {formatVND(totalBudget)}
                    </p>
                    <p className="text-[10px] text-slate-450 mt-0.5">tất cả dự án triển khai</p>
                  </div>
                </div>
              </div>

              {/* Projects charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Status Pie */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Trạng thái các dự án</h3>
                  {projStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={projStatusData}
                          cx="50%"
                          cy="45%"
                          outerRadius={70}
                          dataKey="value"
                        >
                          {projStatusData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <FolderOpen size={32} />
                      <p className="text-xs font-semibold">Chưa khởi tạo dự án nào</p>
                    </div>
                  )}
                </div>

                {/* Project Budget Bar Chart */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Top dự án có ngân sách lớn nhất (Triệu đồng)</h3>
                  {projBudgetData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={projBudgetData}
                        margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="Ngân sách (Tr.đ)" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <TrendingUp size={32} />
                      <p className="text-xs font-semibold">Chưa có dữ liệu ngân sách dự án</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Projects List */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} className="text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Danh sách dự án triển khai hiện tại</h3>
                  </div>
                  <a href="/projects" className="text-xs text-blue-600 hover:underline font-bold">
                    Chi tiết các dự án →
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-xs text-slate-500 font-semibold text-left">
                        <th className="px-6 py-3.5">Mã dự án</th>
                        <th className="px-4 py-3.5">Tên dự án</th>
                        <th className="px-4 py-3.5">Khách hàng</th>
                        <th className="px-4 py-3.5">PM quản lý</th>
                        <th className="px-4 py-3.5">Ngân sách</th>
                        <th className="px-4 py-3.5 text-center">Tiến độ hoàn thành</th>
                        <th className="px-6 py-3.5">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProjects.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                            <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Chưa có dự án nào được tạo lập trong kỳ lọc</p>
                          </td>
                        </tr>
                      ) : (
                        filteredProjects.map((p, idx) => (
                          <tr key={p.id || idx} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 font-bold text-blue-600 whitespace-nowrap">
                              {p.code}
                            </td>
                            <td className="px-4 py-4 text-slate-800 font-bold text-xs">
                              {p.name}
                            </td>
                            <td className="px-4 py-4 text-slate-500 text-xs font-medium">
                              {p.customer || "—"}
                            </td>
                            <td className="px-4 py-4 text-slate-650 font-medium text-xs">
                              {p.manager || "—"}
                            </td>
                            <td className="px-4 py-4 font-bold text-xs text-slate-800">
                              {formatVND(p.budget)}
                            </td>
                            <td className="px-4 py-4 min-w-[150px]">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-24 bg-slate-100 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${p.progress || 0}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 shrink-0">{p.progress || 0}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                                  PROJECT_STATUS_BADGE[p.status] || "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {p.status || "Planning"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}

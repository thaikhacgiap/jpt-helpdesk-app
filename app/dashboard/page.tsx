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
  Ticket, Users, FileText, AlertTriangle,
  CheckCircle2, Activity, TrendingUp, Clock,
  Wrench, FolderOpen, DollarSign, Briefcase, Percent, ClipboardList
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  "New": "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  "On Hold": "bg-red-100 text-red-600",
  "Resolved": "bg-green-100 text-green-700",
  "Closed": "bg-purple-100 text-purple-700",
};

const PRIORITY_BADGE: Record<string, string> = {
  "Low": "bg-green-100 text-green-700",
  "Medium": "bg-yellow-100 text-yellow-700",
  "High": "bg-red-100 text-red-600",
  "Critical": "bg-purple-100 text-purple-700",
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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"general" | "maintenance" | "deployment">("general");
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

  // Calculate Maintenance Tab Stats
  const maintTickets = tickets.filter(t => t.tt_type === "Maintenance");
  const activeMaint = maintTickets.filter(t => t.tt_status !== "Resolved" && t.tt_status !== "Closed");
  const completedMaint = maintTickets.filter(t => t.tt_status === "Resolved" || t.tt_status === "Closed");
  
  const totalMaintProgress = maintTickets.reduce((sum, t) => sum + (parseInt(t.progress || "0") || 0), 0);
  const avgMaintProgress = maintTickets.length > 0 ? Math.round(totalMaintProgress / maintTickets.length) : 0;

  // Group Maintenance tickets by Status
  const maintStatusMap: Record<string, number> = {};
  maintTickets.forEach(t => {
    const s = t.tt_status || "New";
    maintStatusMap[s] = (maintStatusMap[s] || 0) + 1;
  });
  const maintStatusData = Object.entries(maintStatusMap).map(([name, value]) => ({
    name, value, color: TAB_COLORS[name as keyof typeof TAB_COLORS] || "#6B7280"
  }));

  // Top 5 Maintenance Progress Chart Data
  const maintProgressData = maintTickets.slice(0, 5).map(t => ({
    name: t.customer?.name ? (t.customer.name.length > 15 ? t.customer.name.substring(0, 15) + "..." : t.customer.name) : "Khách hàng",
    "Kỳ hiện tại": parseInt(t.sla_time) || 1,
    "Tổng kỳ": parseInt(t.hold_time) || 12
  }));

  // Calculate Projects Tab Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "Active" || p.status === "Delayed").length;
  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalProjProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
  const avgProjProgress = totalProjects > 0 ? Math.round(totalProjProgress / totalProjects) : 0;

  // Group Projects by Status
  const projStatusMap: Record<string, number> = {};
  projects.forEach(p => {
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

  // Top 5 Projects Budget Chart Data
  const projBudgetData = projects.slice(0, 5).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
    "Ngân sách (Tr.đ)": Math.round(p.budget / 1000000)
  }));

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const kpisGeneral = [
    {
      label: "Tổng Ticket",
      value: data?.totalTickets ?? 0,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      sub: `${data?.newToday ?? 0} mới hôm nay`,
    },
    {
      label: "Đang xử lý",
      value: data?.openTickets ?? 0,
      icon: Activity,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
      sub: `${data?.totalTickets ? Math.round(((data.openTickets) / data.totalTickets) * 100) : 0}% tổng số`,
    },
    {
      label: "Đã giải quyết",
      value: data?.resolvedTickets ?? 0,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
      sub: `${data?.totalTickets ? Math.round(((data.resolvedTickets) / data.totalTickets) * 100) : 0}% hoàn thành`,
    },
    {
      label: "Vi phạm SLA",
      value: data?.slaBreached ?? 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
      sub: "Cần xử lý ngay",
    },
    {
      label: "Khách hàng",
      value: data?.totalCustomers ?? 0,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
      sub: "Đang quản lý",
    },
    {
      label: "Hợp đồng",
      value: data?.totalContracts ?? 0,
      icon: FileText,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
      sub: "Hiện có",
    },
  ];

  return (
    <MainLayout>
      <Header title="Bảng Điều Khiển (Dashboard)" description={today} />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "general"
              ? "border-teal-500 text-teal-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp size={15} />
          <span>Dashboard Tổng thể</span>
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "maintenance"
              ? "border-teal-500 text-teal-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wrench size={15} />
          <span>Dashboard Bảo trì định kỳ</span>
        </button>
        <button
          onClick={() => setActiveTab("deployment")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "deployment"
              ? "border-teal-500 text-teal-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FolderOpen size={15} />
          <span>Dashboard Triển khai dự án</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-650 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: GENERAL DASHBOARD */}
          {activeTab === "general" && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpisGeneral.map((kpi, i) => {
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Pie */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Trạng thái ticket</h3>
                  {data?.ticketsByStatus && data.ticketsByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.ticketsByStatus}
                          cx="50%"
                          cy="45%"
                          outerRadius={70}
                          dataKey="value"
                        >
                          {data.ticketsByStatus.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center text-slate-350 gap-2">
                      <TrendingUp size={32} />
                      <p className="text-xs font-semibold">Chưa có dữ liệu</p>
                    </div>
                  )}
                </div>

                {/* Priority Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Độ ưu tiên xử lý</h3>
                  {data?.ticketsByPriority && data.ticketsByPriority.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={data.ticketsByPriority}
                        margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Tickets">
                          {data.ticketsByPriority.map((entry, index) => (
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

                {/* Trend Line */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wide">Xu hướng sự cố 7 ngày qua</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={data?.ticketTrend || []}
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
              </div>

              {/* Recent Tickets */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-slate-400" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Danh sách Ticket gần đây</h3>
                  </div>
                  <a href="/tickets" className="text-xs text-blue-600 hover:underline font-bold">
                    Xem tất cả →
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-xs text-slate-500 font-semibold text-left">
                        <th className="px-6 py-3.5">Ticket ID</th>
                        <th className="px-4 py-3.5">Tiêu đề</th>
                        <th className="px-4 py-3.5">Loại</th>
                        <th className="px-4 py-3.5">Danh mục</th>
                        <th className="px-4 py-3.5">Ưu tiên</th>
                        <th className="px-4 py-3.5">Trạng thái</th>
                        <th className="px-4 py-3.5">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.recentTickets || []).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                            <Ticket size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Chưa có ticket nào đăng ký</p>
                          </td>
                        </tr>
                      ) : (
                        data?.recentTickets.map((t: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 font-bold text-blue-600 whitespace-nowrap">
                              {t.ticket_id}
                            </td>
                            <td className="px-4 py-4 text-slate-700 max-w-xs truncate font-medium">{t.title}</td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-150">
                                {t.tt_type || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-500 text-xs font-normal">{t.category || "—"}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  PRIORITY_BADGE[t.priority] || "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {t.priority || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  STATUS_BADGE[t.tt_status] || "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {t.tt_status || "New"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-400 text-xs whitespace-nowrap">
                              {t.created_at
                                ? new Date(t.created_at).toLocaleDateString("vi-VN")
                                : "—"}
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

          {/* TAB 2: MAINTENANCE DASHBOARD */}
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
                    <p className="text-[10px] text-slate-450 mt-0.5">kế hoạch trong hệ thống</p>
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
                            <p className="text-xs">Chưa đăng ký lịch bảo trì định kỳ nào</p>
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

          {/* TAB 3: DEPLOYMENT DASHBOARD */}
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
                    <p className="text-[10px] text-slate-450 mt-0.5">dự án đang lập trình / bàn giao</p>
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
                      {projects.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                            <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Chưa có dự án nào được tạo lập</p>
                          </td>
                        </tr>
                      ) : (
                        projects.map((p, idx) => (
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

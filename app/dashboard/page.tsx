"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { fetchDashboardData, DashboardData } from "@/lib/dashboard-operations";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  Ticket, Users, FileText, AlertTriangle,
  CheckCircle2, Activity, TrendingUp, Clock,
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const kpis = [
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
      <Header title="Dashboard" description={today} />

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {kpis.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={i}
                  className={`bg-white rounded-xl border ${kpi.border} p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className={kpi.color} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">{kpi.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{kpi.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Status Pie */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Trạng thái ticket</h3>
              {data?.ticketsByStatus && data.ticketsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.ticketsByStatus}
                      cx="50%"
                      cy="45%"
                      outerRadius={75}
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
                <div className="h-52 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <TrendingUp size={32} />
                  <p className="text-sm">Chưa có dữ liệu</p>
                </div>
              )}
            </div>

            {/* Priority Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Độ ưu tiên</h3>
              {data?.ticketsByPriority && data.ticketsByPriority.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.ticketsByPriority}
                    margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Tickets">
                      {data.ticketsByPriority.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <TrendingUp size={32} />
                  <p className="text-sm">Chưa có dữ liệu</p>
                </div>
              )}
            </div>

            {/* Trend Line */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Xu hướng 7 ngày qua</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={data?.ticketTrend || []}
                  margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Ticket gần đây</h3>
              </div>
              <a href="/tickets" className="text-xs text-blue-600 hover:underline font-medium">
                Xem tất cả →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs text-slate-500 font-medium text-left">
                    <th className="px-6 py-3">Ticket ID</th>
                    <th className="px-4 py-3">Tiêu đề</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Danh mục</th>
                    <th className="px-4 py-3">Ưu tiên</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentTickets || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <Ticket size={32} className="mx-auto mb-2 opacity-30" />
                        <p>Chưa có ticket nào</p>
                      </td>
                    </tr>
                  ) : (
                    data?.recentTickets.map((t: any, i: number) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-6 py-3 font-medium text-blue-600 whitespace-nowrap">
                          {t.ticket_id}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{t.title}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                            {t.tt_type || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{t.category || "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              PRIORITY_BADGE[t.priority] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.priority || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              STATUS_BADGE[t.tt_status] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.tt_status || "New"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
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
        </>
      )}
    </MainLayout>
  );
}

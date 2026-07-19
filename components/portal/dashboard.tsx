"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getDashboardStats, DashboardStats } from "@/lib/portal-operations";
import { TrendingUp, CheckCircle2, Clock, Inbox, ShieldAlert, Award } from "lucide-react";

interface DashboardProps {
  customerId: string;
}

const COLORS = {
  status: {
    "New": "#3b82f6",          // blue-500
    "In Progress": "#f59e0b",   // amber-500
    "On Hold": "#f87171",       // red-400
    "Resolved": "#10b981",      // emerald-500
    "Closed": "#8b5cf6",        // purple-500
    "Unknown": "#64748b",       // slate-500
  },
  priority: {
    "Low": "#10b981",
    "Medium": "#f59e0b",
    "High": "#ef4444",
    "Critical": "#8b5cf6",
    "Unknown": "#64748b",
  },
};

export default function Dashboard({ customerId }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, [customerId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats(customerId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải số liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">Đang tải số liệu phân tích...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 text-rose-400 text-xs flex items-center gap-2">
        <ShieldAlert size={16} />
        <span>{error}</span>
      </div>
    );
  }

  if (!stats) return null;

  // Prepare data for status chart
  const statusData = Object.entries(stats.tickets_by_status)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => ({
      name: name === "New" ? "Mới tạo" :
            name === "In Progress" ? "Đang xử lý" :
            name === "On Hold" ? "Tạm ngưng" :
            name === "Resolved" ? "Hoàn thành" :
            name === "Closed" ? "Đã đóng" : name,
      value: count,
      color: COLORS.status[name as keyof typeof COLORS.status] || "#64748b",
    }));

  // Prepare data for priority chart
  const priorityData = Object.entries(stats.tickets_by_priority).map(([name, count]) => ({
    name: name === "Low" ? "Thấp" :
          name === "Medium" ? "T.Bình" :
          name === "High" ? "Cao" :
          name === "Critical" ? "Cấp bách" : name,
    value: count,
    color: COLORS.priority[name as keyof typeof COLORS.priority] || "#64748b",
  }));

  const completionRate = stats.total_tickets > 0 
    ? Math.round((stats.total_resolved / stats.total_tickets) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* KPI Cards (Glassmorphic Glow design) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Total Tickets */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-blue-500/5 hover:border-blue-500/30 transition duration-300 group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tổng số yêu cầu</span>
              <p className="text-3xl font-extrabold text-slate-100 group-hover:text-blue-400 transition-colors">{stats.total_tickets}</p>
              <p className="text-[10px] text-slate-400">Yêu cầu đã được gửi lên</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-300">
              <Inbox size={18} />
            </div>
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-emerald-500/5 hover:border-emerald-500/30 transition duration-300 group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Yêu cầu hoàn thành</span>
              <p className="text-3xl font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors">{stats.total_resolved}</p>
              <p className="text-[10px] text-slate-400">Yêu cầu đã xử lý xong</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-300">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-purple-500/5 hover:border-purple-500/30 transition duration-300 group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tỉ lệ hoàn thành</span>
              <p className="text-3xl font-extrabold text-slate-100 group-hover:text-purple-400 transition-colors">{completionRate}%</p>
              <p className="text-[10px] text-slate-400">Tỉ lệ giải quyết thành công</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform duration-300">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-orange-500/5 hover:border-orange-500/30 transition duration-300 group">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Thời gian trung bình</span>
              <p className="text-3xl font-extrabold text-slate-100 group-hover:text-orange-400 transition-colors">
                {stats.average_resolution_time ? `${stats.average_resolution_time}h` : "—"}
              </p>
              <p className="text-[10px] text-slate-400">Thời gian đóng phiếu</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform duration-300">
              <Clock size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts (Responsive Glass Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-800/80 transition duration-300 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Trạng thái yêu cầu</h3>
            <p className="text-[10px] text-slate-400">Tỷ lệ các yêu cầu theo trạng thái xử lý</p>
          </div>

          <div className="flex-1 min-h-[280px] flex items-center justify-center">
            {statusData.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Không có dữ liệu</span>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={75}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px', 
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: '600'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 shadow-md hover:border-slate-800/80 transition duration-300 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Độ ưu tiên yêu cầu</h3>
            <p className="text-[10px] text-slate-400">Số lượng yêu cầu phân bố theo độ ưu tiên</p>
          </div>

          <div className="flex-1 min-h-[280px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={priorityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '12px', 
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}
                  cursor={{ fill: '#334155', opacity: 0.1 }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

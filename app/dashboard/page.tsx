"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { fetchDashboardData, DashboardData } from "@/lib/dashboard-operations";
import { fetchProjects, Project } from "@/lib/project-operations";
import { fetchRequests, RequestTask } from "@/lib/request-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import {
  Ticket, AlertTriangle, CheckCircle2, Activity, TrendingUp, Clock,
  Wrench, FolderOpen, Briefcase, Percent,
  ShieldCheck, BarChart3, Layers, Inbox, PieChartIcon, Users, UserCheck, Search, Filter, AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"synthesis" | "staff_workload" | "general" | "maintenance" | "deployment">("synthesis");
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [requests, setRequests] = useState<RequestTask[]>([]);
  const [nhanSuList, setNhanSuList] = useState<NhanSu[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff Workload Filters
  const [staffSearch, setStaffSearch] = useState("");
  const [staffDeptFilter, setStaffDeptFilter] = useState("All");

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const dashData = await fetchDashboardData();
        setData(dashData);

        const projData = fetchProjects();
        setProjects(projData || []);

        const reqData = fetchRequests();
        setRequests(reqData || []);

        const nsData = await fetchNhanSu();
        setNhanSuList(nsData || []);

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
  const filteredRequests = requests.filter(r => r.startTime && new Date(r.startTime) >= filterDate);

  // 1. SYNTHESIS CALCULATIONS
  const totalRequestsSynth = filteredRequests.length || 4;
  const totalHTKTSynth = filteredTickets.filter(t => t.tt_type !== "Maintenance").length || 8;
  const totalMaintSynth = filteredTickets.filter(t => t.tt_type === "Maintenance").length || 3;
  const totalProjectsSynth = filteredProjects.length || 2;
  const grandTotalServices = totalRequestsSynth + totalHTKTSynth + totalMaintSynth + totalProjectsSynth;

  const synthMaintList = filteredTickets.filter(t => t.tt_type === "Maintenance");
  const avgMaintProgressSynth = synthMaintList.length > 0 
    ? Math.round(synthMaintList.reduce((sum, t) => sum + (parseInt(t.progress || "0") || 0), 0) / synthMaintList.length) 
    : 85;
  const avgProjProgressSynth = totalProjectsSynth > 0 
    ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / totalProjectsSynth) 
    : 62;
  const overallSynthProgress = Math.round((avgMaintProgressSynth + avgProjProgressSynth) / 2) || 74;

  const kpisSynthesis = [
    { label: "Yêu cầu Dịch vụ", value: totalRequestsSynth, icon: Inbox, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", sub: "Cổng Portal & Nội bộ" },
    { label: "Ticket Sự cố HTKT", value: totalHTKTSynth, icon: Ticket, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", sub: "Ticket xử lý kỹ thuật" },
    { label: "Kế hoạch Bảo trì", value: totalMaintSynth, icon: Wrench, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100", sub: "Lịch bảo trì định kỳ" },
    { label: "Dự án Triển khai", value: totalProjectsSynth, icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", sub: "Dự án đang thực hiện" },
    { label: "Tiến độ công việc chung", value: `${overallSynthProgress}%`, icon: Percent, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", sub: "Tỷ lệ hoàn thành tổng" },
  ];

  // TAB 1: 6 CHARTS SYNTHESIS DATASETS
  const synthChart1Pie = [
    { name: "Ticket HTKT", value: totalHTKTSynth, color: "#3B82F6" },
    { name: "Dịch vụ Bảo trì", value: totalMaintSynth, color: "#10B981" },
    { name: "Triển khai Dự án", value: totalProjectsSynth, color: "#8B5CF6" },
    { name: "Yêu cầu dịch vụ", value: totalRequestsSynth, color: "#F59E0B" },
  ];

  const synthChart2Trend = [
    { name: "T1", "Yêu cầu": 3, "HTKT": 5, "Bảo trì": 2, "Dự án": 1 },
    { name: "T2", "Yêu cầu": 4, "HTKT": 7, "Bảo trì": 3, "Dự án": 2 },
    { name: "T3", "Yêu cầu": 2, "HTKT": 6, "Bảo trì": 2, "Dự án": 1 },
    { name: "T4", "Yêu cầu": 5, "HTKT": 8, "Bảo trì": 4, "Dự án": 2 },
    { name: "T5", "Yêu cầu": 3, "HTKT": 6, "Bảo trì": 3, "Dự án": 1 },
  ];

  const synthChart3HTKT = [
    { name: "Mới nhận", "Số lượng": 2, color: "#93C5FD" },
    { name: "Đang xử lý", "Số lượng": 4, color: "#3B82F6" },
    { name: "Hold", "Số lượng": 1, color: "#F59E0B" },
    { name: "Hoàn thành", "Số lượng": 5, color: "#10B981" },
  ];

  const synthChart4Maint = [
    { name: "Lập lịch", "Số lượng": 1, color: "#5EEAD4" },
    { name: "Đang bảo trì", "Số lượng": 2, color: "#10B981" },
    { name: "Hoàn tất", "Số lượng": 3, color: "#047857" },
  ];

  const synthChart5Proj = [
    { name: "Chuẩn bị", "Số lượng": 1, color: "#C084FC" },
    { name: "Đang chạy", "Số lượng": 2, color: "#8B5CF6" },
    { name: "Hold", "Số lượng": 0, color: "#F59E0B" },
    { name: "Hoàn thành", "Số lượng": 1, color: "#6D28D9" },
  ];

  const synthChart6PortalReq = [
    { name: "T2", "Yêu cầu Portal": 4, "Xử lý xong": 3 },
    { name: "T3", "Yêu cầu Portal": 6, "Xử lý xong": 5 },
    { name: "T4", "Yêu cầu Portal": 3, "Xử lý xong": 3 },
    { name: "T5", "Yêu cầu Portal": 7, "Xử lý xong": 6 },
    { name: "T6", "Yêu cầu Portal": 5, "Xử lý xong": 4 },
  ];

  // TAB 2: 6 CHARTS STAFF WORKLOAD DATASETS
  const mockStaffFallback: NhanSu[] = [
    { id: "ns-1", ma_nhan_su: "NS-001", ten_nhan_su: "Thái Khắc Giáp", bo_phan: "Ban Giám Đốc", chuc_vu: "Giám đốc dự án", phu_trach: "Quản lý chung", ngay_sinh: "", so_cccd: "", cap_ngay: "", email: "giaptk@jpt.vn", so_dien_thoai: "0987654321", dia_chi: "" },
    { id: "ns-2", ma_nhan_su: "NS-002", ten_nhan_su: "Trần Thị Q.Lý", bo_phan: "Phòng Quản lý dự án", chuc_vu: "Project Manager", phu_trach: "Dự án VPBank & Acme", ngay_sinh: "", so_cccd: "", cap_ngay: "", email: "pm@jpt.vn", so_dien_thoai: "0902345678", dia_chi: "" },
    { id: "ns-3", ma_nhan_su: "NS-003", ten_nhan_su: "Lê Văn K.Thuật", bo_phan: "Phòng Kỹ thuật & Support", chuc_vu: "Kỹ sư hệ thống", phu_trach: "Hạ tầng & Ticket L2", ngay_sinh: "", so_cccd: "", cap_ngay: "", email: "technical@jpt.vn", so_dien_thoai: "0903456789", dia_chi: "" },
    { id: "ns-4", ma_nhan_su: "NS-004", ten_nhan_su: "Nguyễn Văn Hỗ Trợ", bo_phan: "Phòng Kỹ thuật & Support", chuc_vu: "Chuyên viên Helpdesk", phu_trach: "Ticket L1 & On-site", ngay_sinh: "", so_cccd: "", cap_ngay: "", email: "support@jpt.vn", so_dien_thoai: "0905556677", dia_chi: "" },
  ];

  const activeStaffList = nhanSuList.length > 0 ? nhanSuList : mockStaffFallback;

  const staffWorkloadMetrics = activeStaffList.map((ns, idx) => {
    const sName = ns.ten_nhan_su.toLowerCase();
    const assignedTickets = filteredTickets.filter(t => t.assigned_to_name?.toLowerCase().includes(sName) || t.assignee?.toLowerCase().includes(sName));
    const assignedRequests = filteredRequests.filter(r => r.assignee?.toLowerCase().includes(sName) || r.requester?.toLowerCase().includes(sName));
    const assignedProjects = filteredProjects.filter(p => p.manager?.toLowerCase().includes(sName) || p.name?.toLowerCase().includes(sName));

    const totalTasks = (assignedTickets.length + assignedRequests.length + assignedProjects.length) || (idx === 0 ? 9 : idx === 1 ? 7 : idx === 2 ? 5 : 3);
    const activeTasks = (assignedTickets.filter(t => ["New", "In Progress"].includes(t.tt_status)).length + assignedRequests.filter(r => r.status === "In Progress").length) || (idx === 0 ? 5 : idx === 1 ? 4 : 2);
    const completedTasks = totalTasks - activeTasks;
    const overdueTasks = (assignedTickets.filter(t => t.sla_status === "Breached").length) || (idx === 0 ? 1 : 0);
    const avgProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    let loadStatus: "BÌNH THƯỜNG" | "CAO" | "QUÁ TẢI" = "BÌNH THƯỜNG";
    if (totalTasks >= 8) loadStatus = "QUÁ TẢI";
    else if (totalTasks >= 5) loadStatus = "CAO";

    return { ...ns, totalTasks, activeTasks, completedTasks, overdueTasks, avgProgress, loadStatus };
  });

  const filteredStaffWorkload = staffWorkloadMetrics.filter((s) => {
    const term = staffSearch.toLowerCase();
    const matchesSearch = s.ten_nhan_su.toLowerCase().includes(term) || s.ma_nhan_su.toLowerCase().includes(term) || s.chuc_vu.toLowerCase().includes(term);
    const matchesDept = staffDeptFilter === "All" || s.bo_phan === staffDeptFilter;
    return matchesSearch && matchesDept;
  });

  const totalStaffCount = staffWorkloadMetrics.length;
  const overloadedStaffCount = staffWorkloadMetrics.filter(s => s.loadStatus === "QUÁ TẢI").length;
  const avgCompletionRateAllStaff = Math.round(staffWorkloadMetrics.reduce((sum, s) => sum + s.avgProgress, 0) / (totalStaffCount || 1));
  const totalOverdueTasksAllStaff = staffWorkloadMetrics.reduce((sum, s) => sum + s.overdueTasks, 0);

  const staffChart1Compare = staffWorkloadMetrics.map(s => ({
    name: s.ten_nhan_su.split(" ").pop() || s.ten_nhan_su,
    "Đang xử lý": s.activeTasks,
    "Hoàn thành": s.completedTasks,
    "Quá hạn": s.overdueTasks,
  }));

  const staffChart2Dept = [
    { name: "Phòng QLDA", "Đang xử lý": 8, "Hoàn thành": 12 },
    { name: "Kỹ thuật & Support", "Đang xử lý": 14, "Hoàn thành": 18 },
    { name: "Ban Giám Đốc", "Đang xử lý": 3, "Hoàn thành": 9 },
  ];

  const staffChart3LoadPie = [
    { name: "Bình thường", value: staffWorkloadMetrics.filter(s => s.loadStatus === "BÌNH THƯỜNG").length || 2, color: "#10B981" },
    { name: "Tải cao", value: staffWorkloadMetrics.filter(s => s.loadStatus === "CAO").length || 1, color: "#F59E0B" },
    { name: "Quá tải", value: staffWorkloadMetrics.filter(s => s.loadStatus === "QUÁ TẢI").length || 1, color: "#EF4444" },
  ];

  const staffChart4Top5 = staffWorkloadMetrics.slice(0, 5).map(s => ({
    name: s.ten_nhan_su,
    "Tổng việc": s.totalTasks,
  }));

  const staffChart5SlaRate = staffWorkloadMetrics.map(s => ({
    name: s.ten_nhan_su.split(" ").pop() || s.ten_nhan_su,
    "Đạt SLA (%)": 100 - (s.overdueTasks * 15),
  }));

  const staffChart6Position = [
    { name: "Giám đốc dự án", value: 2, color: "#3B82F6" },
    { name: "Project Manager", value: 3, color: "#8B5CF6" },
    { name: "Kỹ sư hệ thống", value: 5, color: "#10B981" },
    { name: "Helpdesk Support", value: 4, color: "#F59E0B" },
  ];

  // TAB 3: 6 CHARTS HTKT & TICKET DATASETS
  const htktChart1Status = [
    { name: "Mới tiếp nhận", value: 3, color: "#93C5FD" },
    { name: "Đang xử lý", value: 5, color: "#3B82F6" },
    { name: "Tạm giữ (Hold)", value: 1, color: "#F59E0B" },
    { name: "Đã giải quyết", value: 8, color: "#10B981" },
  ];

  const htktChart2Priority = [
    { name: "P1 - Khẩn cấp", "Số lượng": 2, color: "#EF4444" },
    { name: "P2 - Cao", "Số lượng": 4, color: "#F59E0B" },
    { name: "P3 - Trung bình", "Số lượng": 8, color: "#3B82F6" },
    { name: "P4 - Thấp", "Số lượng": 3, color: "#10B981" },
  ];

  const htktChart3Trend = [
    { name: "T2", "Ticket phát sinh": 4, "Giải quyết": 3 },
    { name: "T3", "Ticket phát sinh": 6, "Giải quyết": 5 },
    { name: "T4", "Ticket phát sinh": 3, "Giải quyết": 3 },
    { name: "T5", "Ticket phát sinh": 7, "Giải quyết": 6 },
    { name: "T6", "Ticket phát sinh": 5, "Giải quyết": 5 },
  ];

  const htktChart4Category = [
    { name: "Phần mềm & App", value: 7, color: "#3B82F6" },
    { name: "Phần cứng & Server", value: 4, color: "#10B981" },
    { name: "Đường truyền Mạng", value: 3, color: "#F59E0B" },
    { name: "Tài khoản & Phân quyền", value: 3, color: "#8B5CF6" },
  ];

  const htktChart5SLA = [
    { name: "Đạt cam kết SLA", value: 15, color: "#10B981" },
    { name: "Vi phạm SLA", value: 2, color: "#EF4444" },
  ];

  const htktChart6TopCust = [
    { name: "VPBank", "Số Ticket": 8 },
    { name: "Acme Corp", "Số Ticket": 5 },
    { name: "Thép Việt", "Số Ticket": 3 },
    { name: "J-Tech Ltd", "Số Ticket": 2 },
  ];

  // HTKT TAB CALCULATIONS
  const htktTickets = filteredTickets;
  const htktTotal = htktTickets.length || 12;
  const htktOpen = htktTickets.filter(t => ["New", "In Progress", "On Hold"].includes(t.tt_status)).length || 4;
  const htktResolved = htktTickets.filter(t => ["Resolved", "Closed"].includes(t.tt_status)).length || 8;
  const htktSlaBreached = htktTickets.filter(t => t.sla_status === "Breached").length || 1;
  const htktSlaMetCount = htktTotal - htktSlaBreached;
  const htktSlaMetRate = htktTotal > 0 ? Math.round((htktSlaMetCount / htktTotal) * 100) : 92;

  const kpisHTKT = [
    { label: "Tổng số Ticket", value: htktTotal, icon: Ticket, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", sub: "Tổng vé phát sinh" },
    { label: "Đang xử lý", value: htktOpen, icon: Activity, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", sub: "Đang thực hiện" },
    { label: "Đã giải quyết", value: htktResolved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", sub: "Hoàn tất xử lý" },
    { label: "Vi phạm SLA", value: htktSlaBreached, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", sub: "Cần chú ý khẩn" },
    { label: "Tỷ lệ đạt SLA", value: `${htktSlaMetRate}%`, icon: ShieldCheck, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100", sub: "Cam kết chất lượng" },
  ];

  // TAB 4: 6 CHARTS MAINTENANCE DATASETS
  const maintChart1Status = [
    { name: "Lập lịch", value: 2, color: "#5EEAD4" },
    { name: "Đang bảo trì", value: 3, color: "#10B981" },
    { name: "Hoàn tất", value: 6, color: "#047857" },
  ];

  const maintChart2Type = [
    { name: "Máy chủ Server", "Lịch bảo trì": 4 },
    { name: "Hệ thống Mạng & FW", "Lịch bảo trì": 3 },
    { name: "Cơ sở Dữ liệu (DB)", "Lịch bảo trì": 2 },
    { name: "Thiết bị Trạm PC", "Lịch bảo trì": 2 },
  ];

  const maintChart3Progress = [
    { name: "Hoàn thành (>90%)", value: 5, color: "#10B981" },
    { name: "Đang chạy (50-90%)", value: 3, color: "#F59E0B" },
    { name: "Mới khởi chạy (<50%)", value: 2, color: "#3B82F6" },
  ];

  const maintChart4Monthly = [
    { name: "Tháng 5", "Lượt bảo trì": 4 },
    { name: "Tháng 6", "Lượt bảo trì": 6 },
    { name: "Tháng 7", "Lượt bảo trì": 5 },
    { name: "Tháng 8", "Lượt bảo trì": 7 },
  ];

  const maintChart5SLACompliance = [
    { name: "Đúng lịch cam kết", value: 10, color: "#10B981" },
    { name: "Trễ lịch bảo trì", value: 1, color: "#EF4444" },
  ];

  const maintChart6CustDist = [
    { name: "VPBank DC", "Số buổi": 4 },
    { name: "Acme HQ", "Số buổi": 3 },
    { name: "Thép Việt Nhà máy", "Số buổi": 2 },
  ];

  // TAB 5: 6 CHARTS PROJECT DEPLOYMENT DATASETS
  const projChart1Status = [
    { name: "Chuẩn bị (Planning)", value: 1, color: "#C084FC" },
    { name: "Đang chạy (Active)", value: 3, color: "#8B5CF6" },
    { name: "Tạm dừng (On Hold)", value: 1, color: "#F59E0B" },
    { name: "Hoàn thành", value: 2, color: "#6D28D9" },
  ];

  const projChart2Progress = [
    { name: "Nâng cấp DC VPBank", "Tiến độ (%)": 85 },
    { name: "Tích hợp ERP Acme", "Tiến độ (%)": 60 },
    { name: "Triển khai Hạ tầng Thép Việt", "Tiến độ (%)": 45 },
    { name: "Bảo mật SOC J-Tech", "Tiến độ (%)": 90 },
  ];

  const projChart3Budget = [
    { name: "VPBank", "Ngân sách (Tỷ VNĐ)": 2.5 },
    { name: "Acme", "Ngân sách (Tỷ VNĐ)": 1.2 },
    { name: "Thép Việt", "Ngân sách (Tỷ VNĐ)": 0.8 },
    { name: "J-Tech", "Ngân sách (Tỷ VNĐ)": 1.5 },
  ];

  const projChart4Milestones = [
    { name: "Đạt mốc Milestone", value: 18, color: "#10B981" },
    { name: "Trễ mốc Milestone", value: 2, color: "#EF4444" },
  ];

  const projChart5Burnup = [
    { name: "Giai đoạn 1", "Khối lượng đạt": 25, "Kế hoạch": 25 },
    { name: "Giai đoạn 2", "Khối lượng đạt": 55, "Kế hoạch": 50 },
    { name: "Giai đoạn 3", "Khối lượng đạt": 75, "Kế hoạch": 75 },
    { name: "Giai đoạn 4", "Khối lượng đạt": 90, "Kế hoạch": 100 },
  ];

  const projChart6PM = [
    { name: "Trần Thị Q.Lý (PM)", "Số dự án": 3 },
    { name: "Thái Khắc Giáp (Director)", "Số dự án": 2 },
    { name: "Lê Văn K.Thuật (Lead)", "Số dự án": 2 },
  ];

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-28px)] overflow-hidden gap-3">
        <Header title="Bảng Điều Khiển (Dashboard)" description={today} />

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 gap-3 pb-1 shrink-0">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("synthesis")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "synthesis" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers size={14} />
              <span>Dashboard Tổng Hợp</span>
            </button>

            <button
              onClick={() => setActiveTab("staff_workload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "staff_workload" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users size={14} className="text-teal-600" />
              <span>Dashboard Workload Nhân Sự</span>
            </button>

            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <TrendingUp size={14} />
              <span>Dashboard HTKT &amp; Ticket</span>
            </button>

            <button
              onClick={() => setActiveTab("maintenance")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "maintenance" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Wrench size={14} />
              <span>Dashboard Bảo Trì</span>
            </button>

            <button
              onClick={() => setActiveTab("deployment")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "deployment" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FolderOpen size={14} />
              <span>Dashboard Dự Án</span>
            </button>
          </div>

          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200/50 shrink-0 shadow-2xs">
            <button
              onClick={() => setTimeFilter("week")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                timeFilter === "week" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setTimeFilter("month")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                timeFilter === "month" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setTimeFilter("year")}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                timeFilter === "year" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Năm nay
            </button>
          </div>
        </div>

        {/* Content Body (Fitted to Window) */}
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-xs font-medium">Đang khởi tạo các biểu đồ...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
            
            {/* ── TAB 1: SYNTHESIS DASHBOARD (6 RICH CHARTS GRID) ────────────────── */}
            {activeTab === "synthesis" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {kpisSynthesis.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                      <div key={i} className={`bg-white rounded-2xl border ${kpi.border} p-3 flex items-center justify-between shadow-2xs`}>
                        <div>
                          <p className="text-[10px] text-slate-500 font-medium">{kpi.label}</p>
                          <p className="text-lg font-bold text-slate-900 mt-0.5">{kpi.value}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{kpi.sub}</p>
                        </div>
                        <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center shrink-0`}>
                          <Icon size={16} className={kpi.color} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 6 Charts Grid (3x2 Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Chart 1: All Service Distribution */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <PieChartIcon size={13} className="text-amber-500" />
                      1. Tỷ Trọng Tất Cả Dịch Vụ
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={synthChart1Pie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {synthChart1Pie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1 text-[10px] pt-1.5 border-t border-slate-100">
                      {synthChart1Pie.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600 truncate">{item.name}:</span>
                          <strong className="text-slate-900 ml-auto">{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart 2: Activity Trend */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <TrendingUp size={13} className="text-blue-500" />
                      2. Xu Hướng Hoạt Động Phát Sinh
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <LineChart data={synthChart2Trend} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="Yêu cầu" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="HTKT" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="Bảo trì" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 3: HTKT Status */}
                  <div className="bg-white rounded-2xl border border-blue-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Ticket size={13} className="text-blue-500" />
                      3. Thống Kế Ticket HTKT
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={synthChart3HTKT} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Số lượng" fill="#3B82F6" radius={[3, 3, 0, 0]}>
                          {synthChart3HTKT.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 4: Maintenance Status */}
                  <div className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Wrench size={13} className="text-teal-500" />
                      4. Thống Kế Bảo Trì Định Kỳ
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={synthChart4Maint} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Số lượng" fill="#10B981" radius={[3, 3, 0, 0]}>
                          {synthChart4Maint.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 5: Project Deployment Status */}
                  <div className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Briefcase size={13} className="text-purple-500" />
                      5. Thống Kế Triển Khai Dự Án
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={synthChart5Proj} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Số lượng" fill="#8B5CF6" radius={[3, 3, 0, 0]}>
                          {synthChart5Proj.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 6: Portal Requests Trend */}
                  <div className="bg-white rounded-2xl border border-amber-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <Inbox size={13} className="text-amber-500" />
                      6. Yêu Cầu Cổng Portal Khách Hàng
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <AreaChart data={synthChart6PortalReq} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Yêu cầu Portal" stroke="#F59E0B" fill="#FEF3C7" />
                        <Area type="monotone" dataKey="Xử lý xong" stroke="#10B981" fill="#D1FAE5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: STAFF WORKLOAD DASHBOARD (6 RICH CHARTS GRID) ──────────── */}
            {activeTab === "staff_workload" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Staff Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-2xl border border-blue-100 p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Tổng Nhân Sự</p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">{totalStaffCount}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-rose-100 p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Nhân Sự Quá Tải (&gt;8 việc)</p>
                      <p className="text-lg font-bold text-rose-600 mt-0.5">{overloadedStaffCount}</p>
                    </div>
                    <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle size={16} />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-emerald-100 p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Tỷ Lệ Hoàn Thành TB</p>
                      <p className="text-lg font-bold text-emerald-600 mt-0.5">{avgCompletionRateAllStaff}%</p>
                    </div>
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                      <UserCheck size={16} />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-amber-100 p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Số Việc Trễ Hạn/SLA</p>
                      <p className="text-lg font-bold text-amber-600 mt-0.5">{totalOverdueTasksAllStaff}</p>
                    </div>
                    <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                  </div>
                </div>

                {/* 6 Charts Grid for Staff Workload */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Chart 1: Staff Workload Comparison */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      1. So Sánh Khối Lượng Công Việc Nhân Sự
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={staffChart1Compare} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Đang xử lý" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Hoàn thành" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 2: Department Workload Breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      2. Tải Công Việc Theo Phòng Ban
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={staffChart2Dept} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Đang xử lý" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Hoàn thành" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 3: Load Status Share */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      3. Phân Bổ Mức Độ Tải Công Việc
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={staffChart3LoadPie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {staffChart3LoadPie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-1 text-[10px] pt-1.5 border-t border-slate-100 text-center">
                      {staffChart3LoadPie.map((item, idx) => (
                        <div key={idx} className="font-semibold" style={{ color: item.color }}>
                          {item.name}: {item.value}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart 4: Top 5 Busiest Staff */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      4. Top 5 Nhân Sự Phụ Trách Nhiều Việc Nhất
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart layout="vertical" data={staffChart4Top5} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 9 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="Tổng việc" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 5: SLA Compliance Rate by Staff */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      5. Tỷ Lệ Hoàn Thành Đúng Hạn SLA (%)
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={staffChart5SlaRate} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="Đạt SLA (%)" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart 6: Workload Distribution by Position */}
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      6. Phân Bổ Tải Theo Chức Danh
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={staffChart6Position} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {staffChart6Position.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1 text-[10px] pt-1.5 border-t border-slate-100">
                      {staffChart6Position.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600 truncate">{item.name}:</span>
                          <strong className="text-slate-900 ml-auto">{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Staff Table */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={14} className="text-teal-600" />
                      Bảng Báo Cáo Khối Lượng Công Việc Nhân Sự Chi Tiết
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-3 py-2">Mã NS</th>
                          <th className="px-3 py-2">Nhân sự</th>
                          <th className="px-3 py-2">Phòng ban</th>
                          <th className="px-3 py-2 text-center">Tổng việc</th>
                          <th className="px-3 py-2 text-center">Đang xử lý</th>
                          <th className="px-3 py-2 text-center">Hoàn thành</th>
                          <th className="px-3 py-2 text-center">Quá hạn</th>
                          <th className="px-3 py-2 text-center">Tải</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredStaffWorkload.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50 transition">
                            <td className="px-3 py-2 font-mono text-teal-600 font-bold">{s.ma_nhan_su}</td>
                            <td className="px-3 py-2 font-bold text-slate-900">{s.ten_nhan_su}</td>
                            <td className="px-3 py-2 text-slate-600 text-[11px]">{s.bo_phan}</td>
                            <td className="px-3 py-2 text-center font-bold">{s.totalTasks}</td>
                            <td className="px-3 py-2 text-center font-bold text-blue-600">{s.activeTasks}</td>
                            <td className="px-3 py-2 text-center font-bold text-emerald-600">{s.completedTasks}</td>
                            <td className="px-3 py-2 text-center font-bold text-rose-600">{s.overdueTasks}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                                s.loadStatus === "QUÁ TẢI" ? "bg-rose-50 text-rose-700 border-rose-200" : s.loadStatus === "CAO" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}>
                                {s.loadStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ── TAB 3: HTKT & TICKET DASHBOARD (6 RICH CHARTS GRID) ──────────── */}
            {activeTab === "general" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {kpisHTKT.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                      <div key={i} className={`bg-white rounded-2xl border ${kpi.border} p-3 flex items-center justify-between shadow-2xs`}>
                        <div>
                          <p className="text-[10px] text-slate-500 font-medium">{kpi.label}</p>
                          <p className="text-lg font-bold text-slate-900 mt-0.5">{kpi.value}</p>
                        </div>
                        <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center shrink-0`}>
                          <Icon size={16} className={kpi.color} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      1. Trạng Thái Xử Lý Ticket HTKT
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={htktChart1Status} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {htktChart1Status.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      2. Phân Bổ Mức Độ Ưu Tiên (P1-P4)
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={htktChart2Priority} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Số lượng" fill="#3B82F6" radius={[3, 3, 0, 0]}>
                          {htktChart2Priority.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      3. Xu Hướng Ticket Phát Sinh Theo Tuần
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <AreaChart data={htktChart3Trend} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Ticket phát sinh" stroke="#3B82F6" fill="#BFDBFE" />
                        <Area type="monotone" dataKey="Giải quyết" stroke="#10B981" fill="#D1FAE5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      4. Phân Loại Nhóm Sự Cố Kỹ Thuật
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={htktChart4Category} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {htktChart4Category.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      5. Tỷ Lệ Cam Kết Đạt SLA
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={htktChart5SLA} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {htktChart5SLA.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/60 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      6. Top Khách Hàng Phát Sinh Ticket
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart layout="vertical" data={htktChart6TopCust} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 9 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={75} />
                        <Tooltip />
                        <Bar dataKey="Số Ticket" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 4: MAINTENANCE DASHBOARD (6 RICH CHARTS GRID) ────────────── */}
            {activeTab === "maintenance" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      1. Trạng Thái Kế Hoạch Bảo Trì
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={maintChart1Status} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {maintChart1Status.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      2. Phân Bổ Bảo Trì Theo Loại Hạ Tầng
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={maintChart2Type} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="Lịch bảo trì" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      3. Tiến Độ Hoàn Thành Kế Hoạch
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={maintChart3Progress} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {maintChart3Progress.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      4. Kế Hoạch Bảo Trì Theo Tháng
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <AreaChart data={maintChart4Monthly} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Lượt bảo trì" stroke="#059669" fill="#A7F3D0" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      5. Tỷ Lệ Tuân Thủ SLA Lịch Bảo Trì
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={maintChart5SLACompliance} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {maintChart5SLACompliance.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-teal-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      6. Khối Lượng Bảo Trì Theo Khách Hàng
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart layout="vertical" data={maintChart6CustDist} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 9 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="Số buổi" fill="#047857" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: PROJECT DEPLOYMENT DASHBOARD (6 RICH CHARTS GRID) ────── */}
            {activeTab === "deployment" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      1. Trạng Thái Các Dự Án Triển Khai
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={projChart1Status} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {projChart1Status.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      2. Tiến Độ Hoàn Thành Trung Bình (%)
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart layout="vertical" data={projChart2Progress} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="Tiến độ (%)" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      3. Ngân Sách Các Dự Án (Tỷ VNĐ)
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart data={projChart3Budget} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="Ngân sách (Tỷ VNĐ)" fill="#6D28D9" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      4. Tỷ Lệ Đạt Mốc Milestone Dự Án
                    </h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={projChart4Milestones} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {projChart4Milestones.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      5. Biểu Đồ Burn-up Tiến Độ &amp; Khối Lượng
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <LineChart data={projChart5Burnup} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="Khối lượng đạt" stroke="#8B5CF6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Kế hoạch" stroke="#C084FC" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl border border-purple-100 p-3.5 shadow-2xs flex flex-col">
                    <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">
                      6. Phân Bổ Dự Án Theo Quản Lý (PM)
                    </h4>
                    <ResponsiveContainer width="100%" height={175}>
                      <BarChart layout="vertical" data={projChart6PM} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 9 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="Số dự án" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </MainLayout>
  );
}

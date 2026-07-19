"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  LogOut, 
  X, 
  Inbox, 
  Calendar, 
  Tag, 
  CheckSquare, 
  LayoutDashboard, 
  Wrench, 
  FolderOpen, 
  FileText, 
  Users, 
  User,
  Settings, 
  AlertCircle, 
  Search, 
  Bell, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  HelpCircle, 
  Phone, 
  Mail, 
  CheckCircle2, 
  BarChart2, 
  Filter,
  FileQuestion,
  ChevronLeft
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { ServiceTicket, fetchCustomerTickets, getCustomerInfo } from "@/lib/portal-operations";
import { getCurrentUser, logout, UserSession } from "@/lib/auth-operations";
import NewServiceRequestModal from "@/components/portal/new-service-request-modal";
import { supabase } from "@/lib/supabase";

const DEMO_CUSTOMER_ID = "80c26b95-f7bd-4115-a07b-72748d483ab5"; // BANK-VCB

const DONUT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

// Mock trend data for line/area chart (Xu hướng yêu cầu)
const TREND_DATA = [
  { name: "Tháng 11", count: 4 },
  { name: "Tháng 12", count: 7 },
  { name: "Tháng 1", count: 5 },
  { name: "Tháng 2", count: 8 },
  { name: "Tháng 3", count: 5 },
  { name: "Tháng 4", count: 8 }
];

export default function PortalPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState("Request");
  const [modalDefaultCategory, setModalDefaultCategory] = useState("General");
  
  const [selectedRequest, setSelectedRequest] = useState<ServiceTicket | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [trendData, setTrendData] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const monthsData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      const label = `Tháng ${monthIndex + 1}`;

      const count = tickets.filter(t => {
        const created = new Date(t.created_at);
        return created.getMonth() === monthIndex && created.getFullYear() === year;
      }).length;

      monthsData.push({ name: label, count });
    }
    setTrendData(monthsData);
  }, [tickets]);

  // Submenu state
  const [isYêuCầuOpen, setIsYêuCầuOpen] = useState(true);

  // Table Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const loadTickets = async (cid: string) => {
    setLoading(true);
    try {
      const data = await fetchCustomerTickets(cid);
      setTickets(data || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getCurrentUser();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session);
    setChecking(false);

    const cid = session.customerId || DEMO_CUSTOMER_ID;
    loadTickets(cid);

    // Load customer name dynamically from Supabase database
    getCustomerInfo(cid)
      .then(cust => {
        if (cust && cust.name) {
          setCustomerName(cust.name);
        }
      })
      .catch(err => {
        console.error("Error fetching customer details:", err);
      });
  }, [router]);

  const handleModalSuccess = () => {
    const cid = user?.customerId || DEMO_CUSTOMER_ID;
    loadTickets(cid);
  };

  // Realtime subscription: portal auto-refreshes when staff updates a ticket
  useEffect(() => {
    const cid = user?.customerId || DEMO_CUSTOMER_ID;
    if (!cid) return;

    const channel = supabase
      .channel("portal-tickets-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `customer_id=eq.${cid}`,
        },
        (payload) => {
          // Update only the changed ticket in state for minimal re-render
          if (payload.eventType === "UPDATE" && payload.new) {
            setTickets((prev) =>
              prev.map((t) =>
                t.id === (payload.new as ServiceTicket).id
                  ? { ...t, ...(payload.new as ServiceTicket) }
                  : t
              )
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            setTickets((prev) => [payload.new as ServiceTicket, ...prev]);
          } else if (payload.eventType === "DELETE" && payload.old) {
            setTickets((prev) =>
              prev.filter((t) => t.id !== (payload.old as ServiceTicket).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogoutClick = () => {
    logout();
    router.push("/login");
  };

  const openCreateModal = (type: string, category: string) => {
    setModalDefaultType(type);
    setModalDefaultCategory(category);
    setIsModalOpen(true);
  };

  // Calculation for stats
  const totalTickets = tickets.length;
  const processingCount = tickets.filter(t => t.tt_status === "In Progress" || t.tt_status === "New").length;
  const holdCount = tickets.filter(t => t.tt_status === "On Hold").length;
  const completedCount = tickets.filter(t => t.tt_status === "Resolved" || t.tt_status === "Closed").length;
  const overdueCount = tickets.filter(t => t.priority === "Critical" && t.tt_status !== "Resolved" && t.tt_status !== "Closed").length;

  // Pie chart calculation
  const technicalCount = tickets.filter(t => t.category === "Technical").length;
  const billingCount = tickets.filter(t => t.category === "Billing" || t.category === "Payment").length;
  const generalCount = tickets.filter(t => t.category === "General" || t.category === "Account").length;
  const otherCount = tickets.length - (technicalCount + billingCount + generalCount);

  const baseCategoryChartData = [
    { name: "Hỗ trợ kỹ thuật", value: technicalCount },
    { name: "Tư vấn & Hóa đơn", value: billingCount },
    { name: "Hỏi thông tin", value: generalCount },
    { name: "Khác", value: otherCount > 0 ? otherCount : 0 }
  ].filter(item => item.value > 0);

  const categoryChartData = baseCategoryChartData.length > 0 
    ? baseCategoryChartData 
    : [{ name: "Chưa có dữ liệu", value: 1 }];

  const totalCatVal = tickets.length;

  // Filter tickets
  const filteredTickets = tickets.filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query) ||
      (t.description || "").toLowerCase().includes(query);

    // Match by tt_type directly (new form values)
    const matchesType = typeFilter === "All" || t.tt_type === typeFilter;

    const matchesStatus = statusFilter === "All" || t.tt_status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New": 
        return "bg-blue-50 text-blue-600 border border-blue-200/50";
      case "In Progress": 
        return "bg-blue-50 text-blue-600 border border-blue-200/50";
      case "On Hold": 
        return "bg-purple-50 text-purple-600 border border-purple-200/50";
      case "Resolved": 
      case "Closed": 
        return "bg-green-50 text-green-700 border border-green-200/50";
      default: 
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "New": return "Mới tạo";
      case "In Progress": return "Đang xử lý";
      case "On Hold": return "Chờ phản hồi";
      case "Resolved": return "Đã hoàn thành";
      case "Closed": return "Đã hoàn thành";
      default: return status;
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Critical": 
      case "High": 
        return "text-red-500 bg-red-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-red-100";
      case "Medium": 
        return "text-amber-500 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-100";
      case "Low": 
        return "text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-100";
      default: 
        return "text-slate-500 bg-slate-50 px-2 py-0.5 rounded text-[10px] border border-slate-100";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "Critical": return "Cấp bách";
      case "High": return "Cao";
      case "Medium": return "Trung bình";
      case "Low": return "Thấp";
      default: return priority;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  };

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-medium text-slate-400 font-sans">Đang xác thực...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 flex font-sans antialiased">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-[240px] h-full bg-[#071432] text-slate-300 flex flex-col justify-between shrink-0 select-none shadow-xl border-r border-slate-800 overflow-y-auto scrollbar-none">
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="px-6 py-5 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide uppercase">ABC SERVICES</h1>
              <p className="text-[9px] text-slate-400 font-medium">Customer Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => {
                setTypeFilter("All");
                setStatusFilter("All");
                setPriorityFilter("All");
                setSearchQuery("");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-600/10 text-blue-400 hover:text-white hover:bg-blue-600/20 transition text-sm font-bold text-left cursor-pointer"
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </button>

            {/* Collapsible My Requests */}
            <div className="space-y-0.5">
              <button 
                onClick={() => setIsYêuCầuOpen(!isYêuCầuOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-slate-800/40 hover:text-white transition text-sm font-semibold text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Inbox size={15} />
                  <span>Yêu cầu của tôi</span>
                </div>
                <ChevronDown size={12} className={`transform transition-transform ${isYêuCầuOpen ? "" : "-rotate-90"}`} />
              </button>

              {isYêuCầuOpen && (
                <div className="pl-9 pr-2 space-y-0.5">
                  <button 
                    onClick={() => {
                      setTypeFilter("All");
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] transition cursor-pointer ${
                      typeFilter === "All" ? "text-blue-400 font-bold bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Tất cả yêu cầu
                  </button>
                  <button 
                    onClick={() => {
                      setTypeFilter("Technical");
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] transition cursor-pointer ${
                      typeFilter === "Technical" ? "text-blue-400 font-bold bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Yêu cầu hỗ trợ kỹ thuật
                  </button>
                  <button 
                    onClick={() => {
                      setTypeFilter("Consultant");
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left py-1.5 px-3 rounded-lg text-[11px] transition cursor-pointer ${
                      typeFilter === "Consultant" ? "text-blue-400 font-bold bg-white/5" : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Yêu cầu tư vấn
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => openCreateModal("Request", "General")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800/40 hover:text-white transition text-sm font-semibold text-left cursor-pointer"
            >
              <Plus size={15} />
              <span>Tạo yêu cầu mới</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800/40 hover:text-white transition text-sm font-semibold text-left cursor-pointer">
              <FileQuestion size={15} />
              <span>Kiến thức</span>
            </button>

            <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-slate-800/40 hover:text-white transition text-sm font-semibold text-left cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell size={15} />
                <span>Thông báo</span>
              </div>
              <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800/40 hover:text-white transition text-sm font-semibold text-left cursor-pointer">
              <FileText size={15} />
              <span>Tài liệu</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800/40 hover:text-white transition text-sm font-semibold text-left cursor-pointer">
              <CheckSquare size={15} />
              <span>Hợp đồng & SLA</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800/40 hover:text-white transition text-sm font-semibold text-left cursor-pointer">
              <FileText size={15} />
              <span>Hóa đơn</span>
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-800/40 hover:text-white transition text-sm font-semibold text-left cursor-pointer">
              <User size={15} />
              <span>Tài khoản</span>
            </button>
          </nav>
        </div>

        <div className="p-4 flex flex-col gap-4 shrink-0">
          {/* Urgent Help Card */}
          <div className="bg-[#0C1E46] border border-slate-800/60 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Cần hỗ trợ ngay?</p>
            <p className="text-[9px] text-slate-500 leading-snug text-left">Liên hệ trực tiếp với tổng đài hỗ trợ của chúng tôi:</p>
            <div className="space-y-2">
              <a href="tel:19001234" className="flex items-center gap-2 text-sm font-bold text-white hover:text-blue-400 transition">
                <Phone size={12} className="text-blue-500" />
                <span>1900 1234</span>
              </a>
              <a href="mailto:support@abc.com" className="flex items-center gap-2 text-[10px] font-medium text-slate-400 hover:text-blue-400 transition truncate">
                <Mail size={12} className="text-blue-500" />
                <span>support@abc.com</span>
              </a>
            </div>
            <p className="text-[8px] text-slate-500 font-medium text-left">Giờ làm việc: 8:00 - 17:30 (Thứ 2 - Thứ 6)</p>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 border border-transparent rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition text-sm font-semibold cursor-pointer"
          >
            <LogOut size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
        
        {/* 2. TOP HEADER (Includes Title Greeting instead of search bar) */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col text-left">
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
                Xin chào, {customerName || user?.name || "Khách hàng"}! 👋
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                Chào mừng bạn đến với Cổng thông tin Khách hàng ABC SERVICES
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <div className="relative cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition">
              <Bell size={18} className="text-slate-650" />
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                3
              </div>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-sm">
                {customerName ? customerName.substring(0, 2).toUpperCase() : "AT"}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{customerName || "An Phát Co., Ltd"}</p>
                <p className="text-[10px] text-slate-500 font-medium">{user?.name || "Customer"}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* 3. MAIN WORKSPACE CONTAINER */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden min-h-0 bg-[#F8FAFC]">
          
          {/* LEFT AREA: KPI + CHARTS + TABLE */}
          <div className="flex-1 h-full flex flex-col gap-5 overflow-hidden min-w-0">
            
            {/* 4 KPI Cards Row (Removed Overdue stat, smaller size) */}
            <div className="grid grid-cols-4 gap-4 shrink-0">
              {/* Total */}
              <div className="bg-white rounded-xl border border-slate-200/50 p-3 shadow-sm flex items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tổng yêu cầu</span>
                  <p className="text-2xl font-extrabold text-slate-800 leading-none">{totalTickets}</p>
                  <span className="text-[8px] font-bold text-emerald-600">↑ 12% <span className="text-slate-400 font-normal">tháng trước</span></span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <FileText size={15} />
                </div>
              </div>

              {/* Processing */}
              <div className="bg-white rounded-xl border border-slate-200/50 p-3 shadow-sm flex items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Đang xử lý</span>
                  <p className="text-2xl font-extrabold text-slate-800 leading-none">{processingCount}</p>
                  <span className="text-[8px] font-bold text-emerald-600">↑ 5% <span className="text-slate-400 font-normal">tháng trước</span></span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                  <Clock size={15} />
                </div>
              </div>

              {/* Waiting Feedback */}
              <div className="bg-white rounded-xl border border-slate-200/50 p-3 shadow-sm flex items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Chờ phản hồi</span>
                  <p className="text-2xl font-extrabold text-slate-800 leading-none">{holdCount}</p>
                  <span className="text-[8px] font-bold text-rose-500">↓ 25% <span className="text-slate-400 font-normal">tháng trước</span></span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                  <Inbox size={15} />
                </div>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-xl border border-slate-200/50 p-3 shadow-sm flex items-center justify-between gap-3">
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Đã hoàn thành</span>
                  <p className="text-2xl font-extrabold text-slate-800 leading-none">{completedCount}</p>
                  <span className="text-[8px] font-bold text-emerald-600">↑ 21% <span className="text-slate-400 font-normal">tháng trước</span></span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                  <CheckCircle2 size={15} />
                </div>
              </div>
            </div>

            {/* 2 Charts row (height shrunked to fit viewport) */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              {/* Trend Chart */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Xu hướng yêu cầu</h3>
                  <span className="text-[9px] text-slate-400 font-medium">6 tháng gần nhất</span>
                </div>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '6px' }} />
                      <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Categories Donut Chart */}
              <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between">
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2">Phân loại yêu cầu</h3>
                <div className="flex items-center justify-between flex-1 gap-2">
                  <div className="w-[100px] h-[100px] relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={1}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === "Chưa có dữ liệu" ? "#e2e8f0" : DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                      <span className="text-base font-extrabold text-slate-800">{totalCatVal}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Tổng</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1 min-w-0 pl-2">
                    {categoryChartData.slice(0, 4).map((item, index) => {
                      const pct = totalCatVal > 0 ? ((item.value / totalCatVal) * 100).toFixed(1) : "0.0";
                      const isPlaceholder = item.name === "Chưa có dữ liệu";
                      return (
                        <div key={index} className="flex items-center justify-between text-[9px] font-medium min-w-0 gap-1.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isPlaceholder ? "#e2e8f0" : DONUT_COLORS[index % DONUT_COLORS.length] }} />
                            <span className="text-slate-500 truncate">{item.name}</span>
                          </div>
                          <span className="text-slate-800 font-bold shrink-0">
                            {isPlaceholder ? "0" : item.value} ({isPlaceholder ? "0.0" : pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests Table card (fit layout with scrollable tbody) */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 flex flex-col overflow-hidden min-h-0">
              
              {/* Filters Toolbar */}
              <div className="flex flex-wrap gap-2 items-center mb-3 shrink-0">
                <div className="relative flex-1 min-w-[150px]">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo mã, tiêu đề..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded-lg py-1.5 px-2 bg-white text-[10px] outline-none cursor-pointer"
                >
                  <option value="All">Loại yêu cầu: Tất cả</option>
                  <option value="Xử lý lỗi">Xử lý lỗi</option>
                  <option value="Thay đổi cấu hình">Thay đổi cấu hình</option>
                  <option value="Cài đặt - Nâng cấp">Cài đặt - Nâng cấp</option>
                  <option value="Khác">Khác</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded-lg py-1.5 px-2 bg-white text-[10px] outline-none cursor-pointer"
                >
                  <option value="All">Trạng thái: Tất cả</option>
                  <option value="New">Mới tạo</option>
                  <option value="In Progress">Đang xử lý</option>
                  <option value="On Hold">Chờ phản hồi</option>
                  <option value="Resolved">Hoàn thành</option>
                  <option value="Closed">Đã đóng</option>
                </select>

                <div className="border border-slate-200 rounded-lg py-1.5 px-3 bg-white text-[10px] text-slate-500 flex items-center gap-1.5 cursor-pointer">
                  <Calendar size={11} />
                  <span>01/04/2024 - 30/04/2024</span>
                </div>

                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("All");
                    setStatusFilter("All");
                    setPriorityFilter("All");
                    setCurrentPage(1);
                  }}
                  className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Filter size={11} />
                  <span>Bộ lọc</span>
                </button>
              </div>

              {/* TABLE CONTAINER: SCROLLABLE TABLE BODY */}
              <div className="flex-1 overflow-auto border border-slate-100 rounded-lg">
                <table className="w-full text-sm text-left" style={{minWidth:'1280px'}}>
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-150 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 w-32 whitespace-nowrap">Mã yêu cầu</th>
                      <th className="px-3 py-2.5 w-28 whitespace-nowrap">Trạng thái</th>
                      <th className="px-3 py-2.5 min-w-[150px]">Tiêu đề</th>
                      <th className="px-3 py-2.5 min-w-[160px]">Mô tả</th>
                      <th className="px-3 py-2.5 w-36 whitespace-nowrap">Loại yêu cầu</th>
                      <th className="px-3 py-2.5 w-28 whitespace-nowrap">Danh mục</th>
                      <th className="px-3 py-2.5 w-36 whitespace-nowrap">Thời gian sự cố</th>
                      <th className="px-3 py-2.5 min-w-[140px]">Dịch vụ ảnh hưởng</th>
                      <th className="px-3 py-2.5 min-w-[140px]">Hợp đồng</th>
                      <th className="px-3 py-2.5 w-32 whitespace-nowrap">Ticket liên kết</th>
                      <th className="px-3 py-2.5 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedTickets.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-slate-400">
                          <Inbox size={20} className="mx-auto mb-1 opacity-35" />
                          <p className="text-[10px]">Không tìm thấy yêu cầu nào.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedTickets.map((t) => {
                        // Extract contract name from remark "Hợp đồng: XYZ"
                        const contractName = t.remark
                          ? t.remark.replace(/^Hợp đồng:\s*/i, "").split(" | ")[0]
                          : null;
                        return (
                          <tr key={t.id} className="hover:bg-blue-50/20 transition text-[10px]">
                            {/* Mã yêu cầu */}
                            <td className="px-3 py-2.5 font-bold text-blue-600 font-mono whitespace-nowrap">{t.ticket_id}</td>

                            {/* Trạng thái */}
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadge(t.tt_status)}`}>
                                {getStatusLabel(t.tt_status)}
                              </span>
                            </td>

                            {/* Tiêu đề */}
                            <td className="px-3 py-2.5">
                              <p className="font-bold text-slate-800 line-clamp-2 max-w-[150px]">{t.title}</p>
                            </td>

                            {/* Mô tả */}
                            <td className="px-3 py-2.5">
                              <p className="text-slate-500 line-clamp-2 max-w-[160px] text-[9px]">
                                {t.description || "—"}
                              </p>
                            </td>

                            {/* Loại yêu cầu */}
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${
                                t.tt_type === "Xử lý lỗi" ? "bg-red-50 text-red-700 border-red-200" :
                                t.tt_type === "Thay đổi cấu hình" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                t.tt_type === "Cài đặt - Nâng cấp" ? "bg-violet-50 text-violet-700 border-violet-200" :
                                "bg-slate-50 text-slate-600 border-slate-200"
                              }`}>{t.tt_type || "—"}</span>
                            </td>

                            {/* Danh mục */}
                            <td className="px-3 py-2.5 text-slate-600 font-medium whitespace-nowrap">{t.category || "—"}</td>

                            {/* Thời gian sự cố - chỉ hiện khi loại là Xử lý lỗi */}
                            <td className="px-3 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                              {t.tt_type === "Xử lý lỗi" && t.start_time
                                ? formatDate(t.start_time)
                                : <span className="text-slate-300">—</span>}
                            </td>

                            {/* Dịch vụ ảnh hưởng */}
                            <td className="px-3 py-2.5 text-slate-500">
                              <p className="line-clamp-2 max-w-[140px] text-[9px]">
                                {t.hold_reason || <span className="text-slate-300">—</span>}
                              </p>
                            </td>

                            {/* Hợp đồng */}
                            <td className="px-3 py-2.5">
                              {contractName
                                ? <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold whitespace-nowrap">{contractName}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>

                            {/* Ticket liên kết */}
                            <td className="px-3 py-2.5">
                              {t.document_link && t.document_link.startsWith("TK-") ? (
                                <span
                                  title="Ticket hỗ trợ đã được tạo"
                                  className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold font-mono whitespace-nowrap flex items-center gap-1 w-fit"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  {t.document_link}
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-300 italic">Chưa xử lý</span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="px-2 py-2.5 text-center">
                              <button
                                onClick={() => setSelectedRequest(t)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <ChevronRight size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION: FIXED AT BOTTOM */}
              <div className="shrink-0 pt-3 border-t mt-3 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Hiển thị {paginatedTickets.length} / {filteredTickets.length} kết quả</span>
                <div className="flex items-center gap-4">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 rounded p-1 bg-white outline-none cursor-pointer text-[10px]"
                  >
                    <option value={5}>5 / trang</option>
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <span className="font-bold text-slate-700 px-1">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT PANEL: ACTIONS, SLA, NOTIFICATIONS SCROLLABLE LIST */}
          <div className="w-[280px] h-full flex flex-col gap-4 shrink-0 overflow-hidden">
            
            {/* Quick request creation */}
            <div className="space-y-2 shrink-0">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Tạo yêu cầu mới</h3>
              <button
                onClick={() => openCreateModal("Request", "Technical")}
                className="w-full text-left p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-between group shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                    <Wrench size={13} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold leading-tight">Hỗ trợ kỹ thuật</h4>
                    <p className="text-[8px] text-blue-200 leading-none mt-0.5">Sự cố, lỗi, cấu hình hệ thống...</p>
                  </div>
                </div>
                <ChevronRight size={13} className="text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => openCreateModal("Request", "General")}
                className="w-full text-left p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-between group shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                    <Inbox size={13} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-extrabold leading-tight">Yêu cầu tư vấn</h4>
                    <p className="text-[8px] text-emerald-200 leading-none mt-0.5">Tư vấn giải pháp, dịch vụ, báo giá...</p>
                  </div>
                </div>
                <ChevronRight size={13} className="text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* SLA package */}
            <div className="bg-white rounded-xl border border-slate-200/50 p-4 shadow-sm space-y-2.5 shrink-0">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider text-left">SLA của bạn</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-2">
                <p className="text-[10px] font-bold text-slate-700 leading-none">Premium Support</p>
                <div className="space-y-1 text-[9px] text-slate-500 font-medium">
                  <div className="flex justify-between"><span>Phản hồi đầu tiên</span><span className="font-bold text-emerald-600">2 giờ (95%)</span></div>
                  <div className="flex justify-between"><span>Thời gian giải quyết</span><span className="font-bold text-emerald-600">8 giờ (90%)</span></div>
                  <div className="flex justify-between"><span>Uptime hệ thống</span><span className="font-bold text-slate-700">99.9%</span></div>
                </div>
              </div>
            </div>

            {/* Dynamic notifications card (Only scroll list here) */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200/60 p-4 flex flex-col overflow-hidden min-h-0 shadow-sm">
              <div className="flex justify-between items-center shrink-0 border-b pb-2 mb-2.5">
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Thông báo mới</h3>
                <span className="text-[9px] font-bold text-blue-600 cursor-pointer">Xem tất cả</span>
              </div>

              {/* SCROLLABLE NOTIFICATIONS LIST */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 scrollbar-thin">
                <div className="flex items-start gap-2 text-[11px] leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                  <div>
                    <p className="font-bold text-slate-700">Yêu cầu #REQ-2024-0028 đã được cập nhật</p>
                    <p className="text-[10px] text-slate-400">Trạng thái đổi sang &ldquo;Đang xử lý&rdquo;</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5">10 phút trước</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                  <div>
                    <p className="font-bold text-slate-700">Yêu cầu #REQ-2024-0021 đã giải quyết</p>
                    <p className="text-[10px] text-slate-400">Cảm ơn đã phản hồi. Yêu cầu đã đóng.</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5">2 giờ trước</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] leading-snug">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                  <div>
                    <p className="font-bold text-slate-700">Khảo sát mức độ hài lòng</p>
                    <p className="text-[10px] text-slate-400">Vui lòng đánh giá trải nghiệm hỗ trợ.</p>
                    <p className="text-[8px] text-slate-400 font-semibold mt-0.5">1 ngày trước</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* New Request Modal */}
      <NewServiceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerId={user?.customerId || DEMO_CUSTOMER_ID}
        onSuccess={handleModalSuccess}
        defaultType={modalDefaultType}
        defaultCategory={modalDefaultCategory}
      />

      {/* Details View Glassmorphic Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-205 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Inbox size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Chi Tiết Yêu Cầu Dịch Vụ
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Mã số: {selectedRequest.ticket_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tiêu đề yêu cầu</span>
                <p className="text-base font-bold text-slate-900">{selectedRequest.title}</p>
              </div>

              {/* Description */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Mô tả chi tiết</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedRequest.description}
                </p>
              </div>

              {/* Grid 2-cols: Type & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Loại yêu cầu</span>
                  <span className="text-sm font-bold text-slate-750 flex items-center gap-1.5 mt-0.5">
                    <CheckSquare size={13} className="text-slate-450" />
                    {selectedRequest.tt_type === "Bug" ? "Lỗi kỹ thuật (Bug)" : "Yêu cầu dịch vụ (Request)"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Danh mục hỗ trợ</span>
                  <span className="text-sm font-bold text-slate-750 flex items-center gap-1.5 mt-0.5">
                    <Tag size={13} className="text-slate-450" />
                    {selectedRequest.category === "Technical" ? "Hỗ trợ kỹ thuật" : "Tư vấn giải pháp"}
                  </span>
                </div>
              </div>

              {/* Grid 2-cols: Priority & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex flex-col gap-1.5">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Mức độ ưu tiên</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border max-w-max ${getPriorityStyle(selectedRequest.priority)}`}>
                    {getPriorityLabel(selectedRequest.priority)}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex flex-col gap-1.5">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Tình trạng xử lý</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border max-w-max ${getStatusBadge(selectedRequest.tt_status)}`}>
                    {getStatusLabel(selectedRequest.tt_status)}
                  </span>
                </div>
              </div>

              {/* Footer timeline info */}
              <div className="border-t border-slate-100 pt-4 flex items-center gap-1.5 text-[10px] text-slate-400">
                <Calendar size={12} className="text-slate-400" />
                <span>Ghi nhận hệ thống ngày:</span>
                <strong className="text-slate-650">
                  {new Date(selectedRequest.created_at).toLocaleDateString(
                    "vi-VN",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </strong>
              </div>
            </div>
            
            {/* Modal Footer buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

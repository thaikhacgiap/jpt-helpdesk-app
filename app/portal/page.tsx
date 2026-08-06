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
  FileText, 
  User, 
  Search, 
  Bell, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight, 
  Clock, 
  Phone, 
  Mail, 
  CheckCircle2, 
  BarChart2, 
  TrendingUp,
  CalendarDays,
  Layers,
  FileQuestion,
  HelpCircle,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Home,
  Wrench
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  LabelList
} from "recharts";
import { ServiceTicket, fetchCustomerTickets, getCustomerInfo } from "@/lib/portal-operations";
import { getCurrentUser, logout, UserSession } from "@/lib/auth-operations";
import { fetchProjects, Project, ProjectTask } from "@/lib/project-operations";
import NewServiceRequestModal from "@/components/portal/new-service-request-modal";
import { supabase } from "@/lib/supabase";

const DEMO_CUSTOMER_ID = "80c26b95-f7bd-4115-a07b-72748d483ab5"; // BANK-VCB

const TYPE_BAR_COLORS = ["#ef4444", "#f59e0b", "#8b5cf6", "#3b82f6"];
const CAT_BAR_COLORS = ["#3b82f6", "#10b981", "#06b6d4", "#ec4899", "#8b5cf6"];
const STATUS_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#10b981"];

// Notifications Data: Strictly General Announcements & Maintenance Schedule
import { getCustomerNotifications } from "@/lib/notification-operations";

interface NotificationItem {
  id: string;
  title: string;
  category: "General" | "Maintenance"; // Thông báo chung & Thông báo lịch bảo trì
  sender: string;
  senderRole: string;
  createdAt: string;
  dateStr: string;
  isRead: boolean;
  summary: string;
  content: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-gen-1",
    title: "Thông báo Nâng cấp Cổng thông tin Khách hàng Version 4.0",
    category: "General",
    sender: "JPT System Admin",
    senderRole: "Ban Quản trị Hệ thống",
    createdAt: "2026-08-03T09:00:00",
    dateStr: "03/08/2026 - 09:00",
    isRead: false,
    summary: "Hệ thống đã nâng cấp phiên bản 4.0 với tính năng Theo dõi Tiến độ Dự án & Bảng Kế hoạch trực quan.",
    content: `Kính gửi Quý Khách hàng VPBank,

Hệ thống JPT Helpdesk chính thức phát hành phiên bản Cổng thông tin Khách hàng (Customer Portal) Version 4.0 với các điểm cải tiến trọng tâm:

1. Giao diện tối ưu hóa thông minh fit với khung màn hình.
2. Tích hợp phân hệ "Theo dõi tiến độ dự án" bao gồm Bảng kế hoạch chi tiết & Biểu đồ Gantt trực quan 3 cột.
3. Đồng bộ form đăng ký yêu cầu và bảng danh sách yêu cầu với chuẩn dữ liệu chung.
4. Nâng cấp các biểu đồ thống kê xu hướng, loại yêu cầu và danh mục xử lý.

Trân trọng cảm ơn Quý khách đã tin tưởng và đồng hành cùng ABC SERVICES.`,
  },
  {
    id: "notif-maint-1",
    title: "Thông báo Lịch bảo trì Định kỳ Máy chủ & Máy trạm Tháng 8/2026",
    category: "Maintenance",
    sender: "Ban Bảo trì Hạ tầng",
    senderRole: "Infrastructure Team",
    createdAt: "2026-08-01T08:00:00",
    dateStr: "01/08/2026 - 08:00",
    isRead: false,
    summary: "Thực hiện kiểm tra bảo trì định kỳ máy chủ dữ liệu từ 23:00 Chủ Nhật (09/08/2026).",
    content: `Trân trọng gửi Quý khách hàng thông báo lịch bảo trì hệ thống định kỳ:

• Thời gian bảo trì: 23:00 Chủ Nhật (09/08/2026) đến 02:00 Thứ Hai (10/08/2026).
• Mục tiêu bảo trì: Kiểm tra tối ưu hệ thống Database PostgreSQL, nâng cấp chính sách mã hóa dữ liệu Supabase RLS và tối ưu hóa băng thông.
• Ảnh hưởng dịch vụ: Tạm thời gián đoạn kết nối Cổng Portal trong khoảng 15 phút vào rạng sáng.

Mọi yêu cầu hỗ trợ sự cố khẩn cấp trong thời gian này xin vui lòng liên hệ Hotline: 1900 1234.`,
  },
  {
    id: "notif-gen-2",
    title: "Hướng dẫn Quy trình Gửi và Theo dõi Yêu cầu Hỗ trợ Kỹ thuật",
    category: "General",
    sender: "Trung tâm Hỗ trợ Khách hàng",
    senderRole: "Customer Support Center",
    createdAt: "2026-07-28T10:30:00",
    dateStr: "28/07/2026 - 10:30",
    isRead: true,
    summary: "Quy trình gửi yêu cầu hỗ trợ mới giúp rút ngắn thời gian phản hồi SLA.",
    content: `Kính gửi Quý Khách hàng,

Để đảm bảo các sự cố kỹ thuật được tiếp nhận và xử lý nhanh chóng theo đúng cam kết SLA, Quý khách vui lòng lưu ý:

• Sử dụng nút "Tạo yêu cầu hỗ trợ" trên Cổng thông tin để tạo phiếu tự động.
• Chọn đúng "Loại yêu cầu" và "Danh mục" để hệ thống điều phối trực tiếp tới kỹ thuật viên chuyên trách.
• Đối với các sự cố dừng hệ thống, vui lòng nhập chính xác "Thời gian bắt đầu sự cố" và "Dịch vụ bị ảnh hưởng".

Chúng tôi luôn sẵn sàng hỗ trợ Quý khách 24/7.`,
  },
  {
    id: "notif-maint-2",
    title: "Thông báo Hoàn thành Bảo trì Nâng cấp Đường truyền Mạng Trung tâm",
    category: "Maintenance",
    sender: "Ban Bảo trì Hạ tầng",
    senderRole: "Infrastructure Team",
    createdAt: "2026-07-20T06:00:00",
    dateStr: "20/07/2026 - 06:00",
    isRead: true,
    summary: "Công tác nâng cấp băng thông đường truyền kết nối dữ liệu đã hoàn tất 100%.",
    content: `Ban Bảo trì Hạ tầng xin thông báo:

Công tác nâng cấp đường truyền quang dự phòng và tối ưu hóa Firewall kết nối giữa Data Center và VPBank đã hoàn tất đúng kế hoạch.

• Tốc độ truy xuất dữ liệu trung bình tăng 35%.
• Hệ thống hoạt động hoàn toàn ổn định.`,
  }
];

const NOTIF_READ_STORAGE_KEY = "jpt_read_notifications";

const getReadNotifIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(NOTIF_READ_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveReadNotifId = (id: string) => {
  if (typeof window === "undefined") return;
  try {
    const current = getReadNotifIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(NOTIF_READ_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Error saving read notification ID", e);
  }
};

const saveAllReadNotifIds = (ids: string[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIF_READ_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error("Error saving all read notification IDs", e);
  }
};

export default function PortalPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState("Xử lý lỗi");
  const [modalDefaultCategory, setModalDefaultCategory] = useState("Software");
  
  const [user, setUser] = useState<UserSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [customerName, setCustomerName] = useState("Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)");
  const [trendData, setTrendData] = useState<{ name: string; count: number }[]>([]);

  // Navigation View State
  const [activeView, setActiveView] = useState<"dashboard" | "project-progress" | "notifications">("dashboard");
  const [projectTab, setProjectTab] = useState<"plan" | "gantt">("plan");

  // Notifications State (General & Maintenance only)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [selectedNotifId, setSelectedNotifId] = useState<string>(INITIAL_NOTIFICATIONS[0].id);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<string>("All");

  // Project tracking data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Table Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
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

    // Load customer name
    getCustomerInfo(cid)
      .then(cust => {
        if (cust && cust.name) {
          setCustomerName(cust.name);
        }
      })
      .catch(err => console.error("Error fetching customer details:", err));

    // Load projects
    try {
      const allProjects = fetchProjects();
      setProjects(allProjects);
      if (allProjects.length > 0) {
        setSelectedProject(allProjects[0]);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  }, [router]);

  // Generate trend line chart data
  useEffect(() => {
    const monthsData = [
      { name: "Tháng 3", count: 0 },
      { name: "Tháng 4", count: 0 },
      { name: "Tháng 5", count: 0 },
      { name: "Tháng 6", count: 0 },
      { name: "Tháng 7", count: 2 },
      { name: "Tháng 8", count: 1 }
    ];

    if (tickets.length > 0) {
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const y = d.getFullYear();
        const label = `Tháng ${mIdx + 1}`;
        const cnt = tickets.filter(t => {
          const created = new Date(t.created_at);
          return created.getMonth() === mIdx && created.getFullYear() === y;
        }).length;
        months.push({ name: label, count: cnt });
      }
      setTrendData(months);
    } else {
      setTrendData(monthsData);
    }
  }, [tickets]);

  // Realtime Supabase tickets sync
  useEffect(() => {
    const cid = user?.customerId || DEMO_CUSTOMER_ID;
    if (!cid) return;

    const channel = supabase
      .channel("portal-tickets-realtime-v4")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets", filter: `customer_id=eq.${cid}` },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            setTickets((prev) =>
              prev.map((t) => (t.id === (payload.new as ServiceTicket).id ? { ...t, ...(payload.new as ServiceTicket) } : t))
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            setTickets((prev) => [payload.new as ServiceTicket, ...prev]);
          } else if (payload.eventType === "DELETE" && payload.old) {
            setTickets((prev) => prev.filter((t) => t.id !== (payload.old as ServiceTicket).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  // Sync customer notifications & persisted read state on client mount
  useEffect(() => {
    const custNotifs = getCustomerNotifications();
    const readIds = getReadNotifIds();
    
    if (custNotifs && custNotifs.length > 0) {
      const mapped: NotificationItem[] = custNotifs.map(cn => ({
        id: cn.id,
        title: cn.title,
        category: cn.category,
        sender: cn.category === "Maintenance" ? "Ban Bảo trì Hạ tầng" : "Ban Giám Đốc",
        senderRole: cn.category === "Maintenance" ? "Infrastructure Team" : "Board of Directors",
        createdAt: cn.created_at,
        dateStr: cn.dateStr,
        isRead: readIds.includes(cn.id),
        summary: cn.summary,
        content: cn.content
      }));
      setNotifications(mapped);
    }
  }, []);

  // Notification handlers (with localStorage persistence)
  const markNotifRead = (id: string) => {
    setSelectedNotifId(id);
    saveReadNotifId(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    saveAllReadNotifIds(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Helper date formatter
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    if (dateStr.includes("T")) {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
    }
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Status Helpers (5 standard statuses: Chờ tiếp nhận, Đang xử lý, Tạm Dừng, Hủy Bỏ, Hoàn Thành)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Chờ tiếp nhận":
      case "New": 
        return "bg-blue-50 text-blue-700 border border-blue-200/60";
      case "Đang xử lý":
      case "In Progress": 
      case "In progress":
        return "bg-amber-50 text-amber-700 border border-amber-200/60";
      case "Tạm Dừng":
      case "On Hold": 
        return "bg-purple-50 text-purple-700 border border-purple-200/60";
      case "Hủy Bỏ":
      case "Rejected":
      case "Cancelled":
        return "bg-rose-50 text-rose-700 border border-rose-200/60";
      case "Hoàn Thành":
      case "Resolved": 
      case "Closed": 
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/60";
      default: 
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Chờ tiếp nhận":
      case "New": return "Chờ tiếp nhận";
      case "Đang xử lý":
      case "In Progress": 
      case "In progress": return "Đang xử lý";
      case "Tạm Dừng":
      case "On Hold": return "Tạm Dừng";
      case "Hủy Bỏ":
      case "Rejected":
      case "Cancelled": return "Hủy Bỏ";
      case "Hoàn Thành":
      case "Resolved": 
      case "Closed": 
      case "Completed": return "Hoàn Thành";
      default: return status;
    }
  };

  // Stats calculation for 5 statuses
  const totalTickets = tickets.length;
  const newCount = tickets.filter(t => t.tt_status === "New" || t.tt_status === "Chờ tiếp nhận").length;
  const processingCount = tickets.filter(t => t.tt_status === "In Progress" || t.tt_status === "In progress" || t.tt_status === "Đang xử lý").length;
  const holdCount = tickets.filter(t => t.tt_status === "On Hold" || t.tt_status === "Tạm Dừng").length;
  const cancelledCount = tickets.filter(t => t.tt_status === "Rejected" || t.tt_status === "Cancelled" || t.tt_status === "Hủy Bỏ").length;
  const completedCount = tickets.filter(t => t.tt_status === "Resolved" || t.tt_status === "Closed" || t.tt_status === "Completed" || t.tt_status === "Hoàn Thành").length;

  // Chart 1: Request Type Breakdown (Biểu đồ Loại yêu cầu)
  const typeChartData = [
    { name: "Xử lý lỗi", count: tickets.filter(t => t.tt_type === "Xử lý lỗi" || t.tt_type === "Technical support" || !t.tt_type).length || 1 },
    { name: "Cấu hình", count: tickets.filter(t => t.tt_type === "Thay đổi cấu hình").length || 1 },
    { name: "Cài đặt", count: tickets.filter(t => t.tt_type === "Cài đặt - Nâng cấp").length || 1 },
    { name: "Tư vấn", count: tickets.filter(t => t.tt_type === "Yêu cầu tư vấn" || t.tt_type === "Consultant").length || 0 }
  ];

  // Chart 2: Request Category Breakdown (Biểu đồ Danh mục yêu cầu)
  const categoryChartData = [
    { name: "Phần mềm", count: tickets.filter(t => t.category === "Software" || t.category === "Phần mềm").length || 2 },
    { name: "Database", count: tickets.filter(t => t.category === "Database").length || 1 },
    { name: "Network", count: tickets.filter(t => t.category === "Network").length || 1 },
    { name: "Phần cứng", count: tickets.filter(t => t.category === "Hardware" || t.category === "Phần cứng").length || 0 }
  ];

  // Chart 3: Status Distribution for 5 statuses
  const statusChartData = [
    { name: "Chờ tiếp nhận", count: newCount || 1, color: "#3b82f6" },
    { name: "Đang xử lý", count: processingCount || 1, color: "#f59e0b" },
    { name: "Tạm Dừng", count: holdCount || 0, color: "#8b5cf6" },
    { name: "Hủy Bỏ", count: cancelledCount || 0, color: "#f43f5e" },
    { name: "Hoàn Thành", count: completedCount || 1, color: "#10b981" }
  ];

  // Table filtering
  const filteredTickets = tickets.filter(t => {
    const query = searchQuery.toLowerCase();
    const formattedId = t.ticket_id.replace(/^TH-/, "TK-").toLowerCase();
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(query) ||
      formattedId.includes(query) ||
      t.title.toLowerCase().includes(query) ||
      (t.description || "").toLowerCase().includes(query);

    const matchesType = typeFilter === "All" || t.tt_type === typeFilter;
    const matchesStatus = statusFilter === "All" || t.tt_status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filtered Notifications for Master-Detail view (General & Maintenance only)
  const filteredNotifications = notifications.filter(n => {
    if (notifCategoryFilter === "All") return true;
    return n.category === notifCategoryFilter;
  });

  const activeNotification = notifications.find(n => n.id === selectedNotifId) || notifications[0];

  // Helper for Project Progress Tab
  const getSubTasksForHeader = (plan: ProjectTask[], headerIdx: number): ProjectTask[] => {
    const result: ProjectTask[] = [];
    for (let i = headerIdx + 1; i < plan.length; i++) {
      if (plan[i].isHeader) break;
      result.push(plan[i]);
    }
    return result;
  };

  const getPhaseStats = (plan: ProjectTask[], headerIdx: number) => {
    const subs = getSubTasksForHeader(plan, headerIdx);
    const allNames = subs.flatMap(t => t.assignee ? t.assignee.split(',').map(n => n.trim()).filter(Boolean) : []);
    const assignees = [...new Set(allNames)];
    const progress = subs.length > 0 ? Math.round(subs.reduce((s, t) => s + t.progress, 0) / subs.length) : 0;
    const startDates = subs.map(t => t.startDate).filter(Boolean).sort();
    const startDate = startDates[0] || '';
    const allDone = subs.length > 0 && subs.every(t => t.status === 'Completed');
    const actualEndDates = subs.map(t => t.actualEndDate).filter(Boolean).sort();
    const actualEndDate = allDone && actualEndDates.length > 0 ? actualEndDates[actualEndDates.length - 1] : '';
    const endDates = subs.map(t => t.endDate).filter(Boolean).sort();
    const endDate = endDates.length > 0 ? endDates[endDates.length - 1] : '';
    return { assignees, progress, startDate, endDate, actualEndDate };
  };

  const calculateGanttData = (projectPlan: ProjectTask[] = []) => {
    if (!projectPlan || projectPlan.length === 0) return { tasks: [], days: [], monthGroups: [] };

    const oneDay = 24 * 60 * 60 * 1000;
    const allDates = projectPlan.flatMap(t => [t.startDate, t.endDate].filter(Boolean));
    if (allDates.length === 0) return { tasks: [], days: [], monthGroups: [] };

    const minDate = new Date(allDates.reduce((a, b) => a < b ? a : b));
    const maxDate = new Date(allDates.reduce((a, b) => a > b ? a : b));
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 2);

    const days: { date: Date; iso: string; dayName: string; dayNum: number; isToday: boolean; isWeekend: boolean }[] = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const cur = new Date(minDate);
    const todayStr = new Date().toISOString().split('T')[0];
    while (cur <= maxDate) {
      const iso = cur.toISOString().split('T')[0];
      days.push({
        date: new Date(cur),
        iso,
        dayName: dayNames[cur.getDay()],
        dayNum: cur.getDate(),
        isToday: iso === todayStr,
        isWeekend: cur.getDay() === 0 || cur.getDay() === 6
      });
      cur.setDate(cur.getDate() + 1);
    }

    const monthGroups: { label: string; count: number }[] = [];
    let lastMonth = '';
    days.forEach(d => {
      const monthKey = `Tháng ${d.date.getMonth() + 1}, ${d.date.getFullYear()}`;
      if (monthKey !== lastMonth) { monthGroups.push({ label: monthKey, count: 1 }); lastMonth = monthKey; }
      else monthGroups[monthGroups.length - 1].count++;
    });

    const phaseColors = [
      { bg: '#4fc3c3', text: '#fff' },
      { bg: '#f0a500', text: '#fff' },
      { bg: '#7c6fcd', text: '#fff' },
      { bg: '#4caf7d', text: '#fff' },
      { bg: '#e05b7f', text: '#fff' },
    ];

    let phaseColorIdx = -1;
    const tasks = projectPlan.map(t => {
      if (t.isHeader) phaseColorIdx = (phaseColorIdx + 1) % phaseColors.length;
      const color = phaseColors[Math.max(0, phaseColorIdx)];
      const startIdx = days.findIndex(d => d.iso >= (t.startDate || ''));
      const endIdx = days.findLastIndex(d => d.iso <= (t.endDate || ''));
      return { ...t, startIdx: Math.max(0, startIdx), endIdx: Math.max(0, endIdx), color };
    });

    return { tasks, days, monthGroups };
  };

  // Helper for strict customer project matching (e.g. VPBank)
  const isProjectOfCustomer = (pCust?: string) => {
    if (!pCust) return false;
    const pLower = pCust.toLowerCase();
    const cLower = customerName.toLowerCase();

    if (cLower.includes("vpbank") || cLower.includes("thịnh vượng")) {
      return pLower.includes("vpbank") || pLower.includes("thịnh vượng");
    }
    if (cLower.includes("acme")) return pLower.includes("acme");
    if (cLower.includes("thép việt")) return pLower.includes("thép việt");
    if (cLower.includes("jpt")) return pLower.includes("jpt");

    return pLower === cLower;
  };

  const customerProjects = projects.filter(p => isProjectOfCustomer(p.customer));
  const currentProject = selectedProject || (customerProjects.length > 0 ? customerProjects[0] : projects[0]);
  const gantt = calculateGanttData(currentProject?.plan || []);
  const COL_W = 28;
  const unreadNotifCount = notifications.filter(n => !n.isRead).length;

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#071432] text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Đang xác thực Cổng thông tin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] text-slate-800 flex font-sans antialiased w-full">
      
      {/* 1. LEFT SIDEBAR (Dark Navy - Clean layout without old menu section) */}
      <aside className="w-[230px] h-full bg-[#091736] text-slate-200 flex flex-col justify-between shrink-0 select-none shadow-2xl border-r border-slate-800/80 overflow-y-auto">
        <div className="flex flex-col">
          {/* Logo Brand */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/30">
              A
            </div>
            <div>
              <h1 className="text-xs font-bold text-white tracking-wide uppercase">ABC SERVICES</h1>
              <p className="text-[10px] text-slate-400 font-medium">Customer Portal</p>
            </div>
          </div>

          {/* Sidebar Navigation Area */}
          <div className="p-3.5 space-y-6">
            
            {/* 1. NÚT TẠO REQUEST (CÙNG KÍCH CỠ & FONT CHỮ VỚI CÁC NÚT KHÁC) */}
            <div>
              <button 
                onClick={() => openCreateModal("Xử lý lỗi", "Software")}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer text-left border border-blue-400/30 active:scale-[0.98]"
              >
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Plus size={15} />
                </div>
                <span className="truncate">Tạo yêu cầu dịch vụ</span>
              </button>
            </div>

            {/* 2. NHÓM DỊCH VỤ & YÊU CẦU */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 mb-2.5 px-2">
                DỊCH VỤ &amp; YÊU CẦU
              </p>
              <div className="space-y-3">
                {/* Home page / Bảng yêu cầu */}
                <button 
                  onClick={() => setActiveView("dashboard")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all shadow-xs cursor-pointer text-left ${
                    activeView === "dashboard" 
                      ? "bg-blue-600/90 text-white ring-2 ring-blue-400/40 shadow-blue-500/30" 
                      : "bg-[#11244e] hover:bg-blue-900/50 text-slate-200"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-blue-300 shrink-0">
                    <Home size={15} />
                  </div>
                  <span className="truncate">Dashboard</span>
                </button>

                {/* Theo dõi tiến độ dự án */}
                <button 
                  onClick={() => setActiveView("project-progress")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-medium text-xs cursor-pointer text-left shadow-xs ${
                    activeView === "project-progress" 
                      ? "bg-teal-700 text-white ring-2 ring-teal-400/40" 
                      : "bg-[#11244e] hover:bg-teal-950/60 text-slate-200"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-teal-300 shrink-0">
                    <TrendingUp size={15} />
                  </div>
                  <span className="truncate">Theo dõi tiến độ dự án</span>
                </button>
              </div>
            </div>

            {/* 3. NHÓM THÔNG BÁO & BẢO TRÌ */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 mb-2.5 px-2">
                THÔNG BÁO &amp; BẢO TRÌ
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveView("notifications")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all shadow-xs cursor-pointer text-left ${
                    activeView === "notifications" 
                      ? "bg-purple-600 text-white ring-2 ring-purple-400/40" 
                      : "bg-[#11244e] hover:bg-purple-950/60 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-purple-300 shrink-0">
                      <Bell size={15} />
                    </div>
                    <span className="truncate">Thông báo &amp; Lịch bảo trì</span>
                  </div>
                  {unreadNotifCount > 0 && (
                    <span className="w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Contact Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <div className="bg-[#0B1E48] rounded-xl p-2.5 border border-slate-800/80 space-y-1.5 text-[10px]">
            <p className="font-extrabold text-blue-400 uppercase tracking-wider text-[9px]">✦ CẦN HỖ TRỢ NGAY?</p>
            <div className="flex items-center gap-2 text-slate-300 font-bold">
              <Phone size={12} className="text-blue-400 shrink-0" />
              <span>1900 1234</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail size={12} className="text-blue-400 shrink-0" />
              <span className="truncate">support@abc.com</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[9px]">
              <Clock size={11} className="shrink-0" />
              <span>8:00 - 17:30 (T2 – T6)</span>
            </div>
          </div>

          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <LogOut size={13} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA (Full page height split 50% top / 50% bottom) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden w-full">
        
        {/* TOP HEADER BAR */}
        <header className="px-5 py-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-2xs w-full h-[52px]">
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Xin chào, {customerName}!</span>
              <span>👋</span>
            </h1>
            <p className="text-[11px] text-slate-500">Chào mừng bạn đến với Cổng thông tin Khách hàng ABC SERVICES</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Home Page Link */}
            <button
              onClick={() => setActiveView("dashboard")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-blue-500/20"
            >
              <Home size={13} />
              <span>Dashboard</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setActiveView("notifications")}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition cursor-pointer relative"
                title="Xem thông báo"
              >
                <Bell size={16} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-300 text-blue-700 font-bold text-[11px] flex items-center justify-center">
                NG
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[11px] font-bold text-slate-800 leading-tight">{customerName}</p>
                <p className="text-[9px] text-slate-400 font-medium">VPBank Admin</p>
              </div>
              <ChevronDown size={12} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* BODY AREA */}
        {activeView === "dashboard" ? (
          /* ==========================================
             VIEW 1: DASHBOARD SPLIT EXACTLY 50% TOP / 50% BOTTOM
             Top 50%: KPI Cards + Compact Charts Grid
             Bottom 50%: Request Table Container
             ========================================== */
          <div className="h-[calc(100vh-52px)] w-full flex flex-col p-4 gap-3 overflow-hidden">
            
            {/* TOP 50% WINDOW: KPI CARDS & COMPACT CHARTS */}
            <div className="h-1/2 flex flex-col gap-2.5 min-h-0 shrink-0">
              
              {/* 4 COMPACT KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
                <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">TỔNG YÊU CẦU</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{totalTickets}</p>
                    <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span>↑ 12%</span><span className="text-slate-400 font-normal">tháng trước</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CHỜ TIẾP NHẬN</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{newCount}</p>
                    <p className="text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                      <span>Mới tạo</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ĐANG XỬ LÝ</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{processingCount}</p>
                    <p className="text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                      <span>Đang thực hiện</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                    <TrendingUp size={16} />
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">HOÀN THÀNH</p>
                    <p className="text-xl font-black text-slate-900 leading-tight">{completedCount}</p>
                    <p className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span>Đã giải quyết</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
              </div>

              {/* COMPACT CHARTS GRID (Replacing SLA with Request Types & Request Categories) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 flex-1 min-h-0">
                
                {/* Chart 1: XU HƯỚNG YÊU CẦU */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-col justify-between min-h-0">
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <h3 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">XU HƯỚNG YÊU CẦU</h3>
                    <span className="text-[9px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded">6 tháng</span>
                  </div>
                  <div className="flex-1 min-h-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="portalColorTrendCompact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#portalColorTrendCompact)" label={{ position: 'top', fontSize: 10, fontWeight: 'bold', fill: '#2563eb' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: THỐNG KÊ LOẠI YÊU CẦU (Hiển thị số trên biểu đồ) */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-col justify-between min-h-0">
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <h3 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">THỐNG KÊ LOẠI YÊU CẦU</h3>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Loại xử lý</span>
                  </div>
                  <div className="flex-1 min-h-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeChartData} margin={{ top: 18, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 'bold', fill: '#1e293b' }} />
                          {typeChartData.map((_, idx) => (
                            <Cell key={`type-bar-${idx}`} fill={TYPE_BAR_COLORS[idx % TYPE_BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: THỐNG KÊ DANH MỤC YÊU CẦU (Hiển thị số trên biểu đồ) */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-col justify-between min-h-0">
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <h3 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">DANH MỤC YÊU CẦU</h3>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Danh mục</span>
                  </div>
                  <div className="flex-1 min-h-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData} margin={{ top: 18, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 'bold', fill: '#1e293b' }} />
                          {categoryChartData.map((_, idx) => (
                            <Cell key={`cat-bar-${idx}`} fill={CAT_BAR_COLORS[idx % CAT_BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>

            {/* BOTTOM 50% WINDOW: REQUEST TABLE (Fitting exactly the bottom half) */}
            <div className="h-1/2 min-h-0 bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col w-full">
              
              {/* Scrollable Table Container */}
              <div className="flex-1 min-h-0 overflow-auto w-full">
                <table className="w-full text-xs text-left" style={{ minWidth: '1050px' }}>
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 z-10 shadow-2xs">
                    <tr>
                      <th className="px-4 py-2.5 w-40">MÃ YÊU CẦU</th>
                      <th className="px-3 py-2.5 w-28">TRẠNG THÁI</th>
                      <th className="px-4 py-2.5 min-w-[180px]">TIÊU ĐỀ</th>
                      <th className="px-4 py-2.5 min-w-[150px]">MÔ TẢ</th>
                      <th className="px-3 py-2.5 w-32">LOẠI YÊU CẦU</th>
                      <th className="px-3 py-2.5 w-24">DANH MỤC</th>
                      <th className="px-3 py-2.5 w-32">THỜI GIAN SỰ CỐ</th>
                      <th className="px-3 py-2.5 min-w-[140px]">DỊCH VỤ ẢNH HƯỞNG</th>
                      <th className="px-4 py-2.5 min-w-[140px]">HỢP ĐỒNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedTickets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                          <Inbox size={28} className="mx-auto mb-1 opacity-30" />
                          <p>Chưa có yêu cầu hỗ trợ nào.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedTickets.map((t) => {
                        const formattedId = t.ticket_id.replace(/^TH-/, "TK-");
                        return (
                          <tr key={t.id} className="hover:bg-blue-50/20 transition group">
                            <td className="px-4 py-2.5 font-mono font-bold text-blue-600">
                              <span className="hover:underline cursor-pointer">{formattedId}</span>
                            </td>

                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(t.tt_status)}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <span>{getStatusLabel(t.tt_status)}</span>
                              </span>
                            </td>

                            <td className="px-4 py-2.5 font-semibold text-slate-800">
                              <p className="truncate max-w-[200px]" title={t.title}>{t.title}</p>
                            </td>

                            <td className="px-4 py-2.5 text-slate-500">
                              <p className="truncate max-w-[160px]" title={t.description}>{t.description || "dfg"}</p>
                            </td>

                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200/60 text-blue-600 rounded-lg text-[10px] font-medium whitespace-nowrap">
                                {t.tt_type || "Technical support"}
                              </span>
                            </td>

                            <td className="px-3 py-2.5 text-slate-700 font-medium">
                              {t.category || "Software"}
                            </td>

                            <td className="px-3 py-2.5 font-mono text-slate-500 text-[11px]">
                              {t.start_time ? formatDate(t.start_time) : "—"}
                            </td>

                            <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">
                              {t.hold_reason || "{\"holds\":[]}"}
                            </td>

                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 bg-blue-50/80 border border-blue-100 text-blue-700 rounded-lg text-[10px] font-medium block truncate max-w-[150px]" title={t.remark || 'Hợp đồng VPBank'}>
                                {t.remark ? t.remark.replace(/^Hợp đồng:\s*/i, "") : '{"saleRemark":"...", "health..."}'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER PAGINATION */}
              <div className="px-5 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
                <div>
                  Hiển thị {filteredTickets.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} / {filteredTickets.length} kết quả
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="px-2 py-0.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none cursor-pointer"
                    >
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-600"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-700">{currentPage} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-600"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : activeView === "notifications" ? (
          /* ==========================================
             VIEW 2: TRANG THÔNG BÁO - STRICTLY GENERAL & MAINTENANCE ONLY
             Master-Detail Layout (Left: List with dates, Right: Content window)
             ========================================== */
          <div className="p-4 h-[calc(100vh-52px)] w-full flex gap-4 overflow-hidden">
            
            {/* LEFT PANEL: MASTER LIST OF NOTIFICATIONS */}
            <div className="w-[360px] bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col shrink-0 h-full overflow-hidden">
              
              {/* Header & Category Filter (Strictly General vs Maintenance) */}
              <div className="p-3.5 border-b border-slate-200/80 bg-slate-50 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Bell size={14} />
                    </div>
                    <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">THÔNG BÁO</h2>
                  </div>
                  {unreadNotifCount > 0 ? (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[9px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full transition cursor-pointer"
                      title="Đánh dấu tất cả đã đọc"
                    >
                      Đã đọc tất cả ({unreadNotifCount})
                    </button>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Đã đọc hết
                    </span>
                  )}
                </div>

                {/* Filter Selector (General vs Maintenance only) */}
                <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-xl">
                  {[
                    { id: "All", label: "Tất cả" },
                    { id: "General", label: "Thông báo chung" },
                    { id: "Maintenance", label: "Lịch bảo trì" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setNotifCategoryFilter(tab.id)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer text-center ${
                        notifCategoryFilter === tab.id ? "bg-purple-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Notification List */}
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Không có thông báo nào trong mục này.</p>
                  </div>
                ) : (
                  filteredNotifications.map((n) => {
                    const isSelected = n.id === selectedNotifId;
                    return (
                      <div
                        key={n.id}
                        onClick={() => markNotifRead(n.id)}
                        className={`p-3.5 transition cursor-pointer text-left relative ${
                          isSelected
                            ? "bg-purple-50/90 border-l-4 border-purple-600 shadow-xs"
                            : !n.isRead
                            ? "bg-blue-50/80 hover:bg-blue-50 border-l-4 border-blue-600 shadow-2xs"
                            : "bg-white hover:bg-slate-50 border-l-4 border-slate-200 opacity-75"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                              n.category === 'Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                              {n.category === 'Maintenance' ? 'LỊCH BẢO TRÌ' : 'THÔNG BÁO CHUNG'}
                            </span>

                            {!n.isRead ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-rose-500 text-white shadow-2xs animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                MỚI
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
                                ĐÃ XEM
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] font-mono text-slate-400">{n.dateStr}</span>
                        </div>

                        <h4 className={`text-xs leading-snug line-clamp-2 ${
                          !n.isRead ? 'font-black text-blue-950' : 'font-semibold text-slate-700'
                        }`}>
                          {n.title}
                        </h4>

                        <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                          !n.isRead ? 'text-slate-800 font-medium' : 'text-slate-500'
                        }`}>
                          {n.summary}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* RIGHT PANEL: DETAIL WINDOW OF SELECTED NOTIFICATION */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col h-full overflow-hidden">
              {activeNotification ? (
                <div className="flex flex-col h-full">
                  
                  {/* Detail Header */}
                  <div className="p-5 border-b border-slate-200/80 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-100 text-purple-700 border border-purple-200">
                        {activeNotification.category === 'Maintenance' ? 'THÔNG BÁO LỊCH BẢO TRÌ' : 'THÔNG BÁO CHUNG'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-mono text-slate-500">{activeNotification.dateStr}</span>
                    </div>

                    <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                      {activeNotification.title}
                    </h2>

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200/60">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center border border-purple-200">
                        {activeNotification.sender.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{activeNotification.sender}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{activeNotification.senderRole}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detail Content Body Window */}
                  <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700 leading-relaxed font-normal">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-2xs whitespace-pre-line text-slate-800 font-sans leading-relaxed">
                      {activeNotification.content}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Inbox size={40} className="mb-2 opacity-30" />
                  <p className="text-xs font-medium">Chọn một thông báo từ danh sách bên trái để xem nội dung.</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ==========================================
             VIEW 3: THEO DÕI TIẾN ĐỘ DỰ ÁN (Plan & Gantt Chart - Fit container)
             ========================================== */
          <div className="p-4 space-y-4 w-full h-[calc(100vh-52px)] flex flex-col overflow-hidden">
            
            {/* Project Progress Header & Sub-Tabs */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full shrink-0">
              <div className="flex-1 min-w-0 space-y-2">
                
                {/* DÒNG 1: TÊN DỰ ÁN (TO HƠN, MÀU XANH NỔI BẬT) + THANH TIẾN ĐỘ CHUNG NGAY SAU TÊN DỰ ÁN */}
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-black text-[#1E40AF] flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600 shrink-0" />
                    <span>{currentProject?.name || "Triển khai Hệ thống IT Helpdesk JPT v4.0"}</span>
                  </h2>

                  {/* THANH TIẾN ĐỘ CHUNG NGAY SAU TÊN DỰ ÁN */}
                  {(() => {
                    const subs = currentProject?.plan?.filter(t => !t.isHeader) || [];
                    const prog = currentProject?.progress || (subs.length > 0 ? Math.round(subs.reduce((s, t) => s + (t.progress || 0), 0) / subs.length) : 0);
                    return (
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full shrink-0">
                        <span className="text-[10px] font-extrabold text-blue-700 uppercase">Tiến độ chung:</span>
                        <span className="text-xs font-black text-blue-700">{prog}%</span>
                        <div className="w-28 h-2.5 rounded-full bg-blue-200 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${prog}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* DÒNG 2: MÃ DỰ ÁN, THỜI GIAN TRIỂN KHAI, PM */}
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3 flex-wrap">
                  <span>Mã dự án: <strong className="font-mono text-slate-800">{currentProject?.code || "PROJ-2026-001"}</strong></span>
                  <span>•</span>
                  <span>Thời gian triển khai: <strong className="text-slate-800">{formatDate(currentProject?.startDate)} – {formatDate(currentProject?.endDate)}</strong></span>
                  <span>•</span>
                  <span>PM phụ trách: <strong className="text-slate-800">{currentProject?.manager || "John D."}</strong></span>
                </div>

                {/* DÒNG 3 (DƯỚI DÒNG MÃ DỰ ÁN): FILTER CÁC DỰ ÁN CHỈ THUỘC KHÁCH HÀNG NÀY */}
                {(customerProjects.length > 0 ? customerProjects : projects.filter(p => isProjectOfCustomer(p.customer))).length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                    <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Dự án VPBank ({(customerProjects.length > 0 ? customerProjects : projects.filter(p => isProjectOfCustomer(p.customer))).length}):
                    </span>
                    <select
                      value={currentProject?.id}
                      onChange={(e) => {
                        const found = projects.find(p => p.id === e.target.value);
                        if (found) setSelectedProject(found);
                      }}
                      className="px-3 py-1.5 bg-blue-50/50 hover:bg-white border border-blue-300 rounded-xl text-xs font-black text-blue-800 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs transition min-w-[280px]"
                    >
                      {(customerProjects.length > 0 ? customerProjects : projects.filter(p => isProjectOfCustomer(p.customer))).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name} ({p.status === 'Active' ? 'Đang triển khai' : 'Đang lập kế hoạch'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setProjectTab("plan")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    projectTab === "plan" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Layers size={14} />
                  <span>Kế hoạch</span>
                </button>

                <button
                  onClick={() => setProjectTab("gantt")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    projectTab === "gantt" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CalendarDays size={14} />
                  <span>Biểu đồ Gantt</span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: KẾ HOẠCH (PLAN TABLE - Synced) */}
            {projectTab === "plan" && (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden w-full flex-1 min-h-0 flex flex-col">
                <div className="overflow-auto w-full flex-1">
                  <table className="w-full text-xs text-left border-collapse" style={{ minWidth: '1150px' }}>
                    <thead className="bg-[#0B1E48] text-white text-[10px] font-extrabold uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center border-r border-slate-700">No</th>
                        <th className="py-2.5 px-4 min-w-[220px] border-r border-slate-700">Công việc</th>
                        <th className="py-2.5 px-3 w-32 border-r border-slate-700">Thời gian bắt đầu</th>
                        <th className="py-2.5 px-3 w-32 border-r border-slate-700">Thời gian kết thúc</th>
                        <th className="py-2.5 px-3 w-36 border-r border-slate-700">Thời gian BĐ thực tế</th>
                        <th className="py-2.5 px-3 w-36 border-r border-slate-700">Thời gian KT thực tế</th>
                        <th className="py-2.5 px-3 min-w-[150px] border-r border-slate-700">Người thực hiện</th>
                        <th className="py-2.5 px-3 w-24 text-center border-r border-slate-700">% Hoàn thành</th>
                        <th className="py-2.5 px-3 w-32 text-center border-r border-slate-700">Trạng thái</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(currentProject?.plan || []).map((task, idx) => {
                        const isHeader = !!task.isHeader;
                        return (
                          <tr key={task.id || idx} className={`transition ${isHeader ? "bg-[#E8E8E8] font-bold" : "hover:bg-slate-50"}`}>
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500 border border-slate-200">
                              {task.taskIndex}
                            </td>

                            <td className={`py-2.5 px-3 border border-slate-200 ${isHeader ? "text-slate-900 text-xs font-extrabold" : "text-slate-700 font-medium pl-6"}`}>
                              {task.title}
                            </td>

                            <td className="py-2.5 px-2 border border-slate-200 text-slate-600 font-medium">
                              {isHeader
                                ? (() => { const s = getPhaseStats(currentProject.plan, idx); return formatDate(s.startDate) || '—'; })()
                                : (formatDate(task.startDate) || '—')}
                            </td>

                            <td className="py-2.5 px-2 border border-slate-200 text-slate-600 font-medium">
                              {isHeader
                                ? (() => { const s = getPhaseStats(currentProject.plan, idx); return formatDate(s.endDate) || '—'; })()
                                : (formatDate(task.endDate) || '—')}
                            </td>

                            <td className="py-2.5 px-2 border border-slate-200 text-slate-600 font-medium">
                              {isHeader ? '—' : (formatDate(task.actualStartDate) || '—')}
                            </td>

                            <td className="py-2.5 px-2 border border-slate-200 text-slate-600 font-medium">
                              {isHeader
                                ? (() => { const s = getPhaseStats(currentProject.plan, idx); return s.actualEndDate ? <span className="text-emerald-600 font-bold">{formatDate(s.actualEndDate)}</span> : '—'; })()
                                : (formatDate(task.actualEndDate) || '—')}
                            </td>

                            <td className="py-2.5 px-2 border border-slate-200 text-slate-700 font-semibold">
                              {isHeader ? (() => {
                                const { assignees } = getPhaseStats(currentProject.plan, idx);
                                return assignees.length > 0
                                  ? <div className="flex flex-wrap gap-1">{assignees.map(n => <span key={n} className="text-[10px] px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-semibold">{n}</span>)}</div>
                                  : <span className="text-slate-400">—</span>;
                              })() : (
                                task.assignee
                                  ? <div className="flex flex-wrap gap-1">{task.assignee.split(',').map(n => n.trim()).filter(Boolean).map(n => <span key={n} className="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full font-medium">{n}</span>)}</div>
                                  : <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="py-2.5 px-2 border border-slate-200 text-center font-extrabold text-slate-800 text-xs">
                              {isHeader
                                ? `${getPhaseStats(currentProject.plan, idx).progress}%`
                                : `${task.progress}%`}
                            </td>

                            <td className="py-2.5 px-2 border border-slate-200 text-center">
                              <span className={`inline-block w-full py-0.5 text-[10px] font-bold rounded tracking-wide ${
                                task.status === 'Completed' 
                                  ? 'bg-[#2ecc71] text-white' 
                                  : task.status === 'In Progress' 
                                  ? 'bg-[#e67e22] text-white' 
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {task.status === 'Completed' ? 'Hoàn thành' : task.status === 'In Progress' ? 'Đang thực hiện' : 'Chưa thực hiện'}
                              </span>
                            </td>

                            <td className="py-2.5 px-3 border border-slate-200 text-slate-500 italic max-w-[180px] truncate" title={task.notes || ""}>
                              {task.notes || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: BIỂU ĐỒ GANTT (GANTT CHART) */}
            {projectTab === "gantt" && (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden w-full flex-1 min-h-0 flex flex-col">
                <div className="overflow-auto w-full flex-1">
                  <div style={{ minWidth: `${280 + 120 + gantt.days.length * COL_W}px` }}>

                    {/* ===== HEADER ROW ===== */}
                    <div className="flex border-b border-slate-200 bg-slate-50 select-none sticky top-0 z-10">
                      <div className="shrink-0 border-r border-slate-200 bg-slate-100" style={{ width: 280 }}>
                        <div className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tên công việc</div>
                      </div>
                      <div className="shrink-0 border-r border-slate-200 bg-slate-100 flex items-end" style={{ width: 120 }}>
                        <div className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tiến độ</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex border-b border-slate-200">
                          {gantt.monthGroups.map((mg, i) => (
                            <div key={i} className="border-r border-slate-200 last:border-0 text-center text-[10px] font-bold text-slate-600 py-1 bg-slate-50"
                              style={{ width: mg.count * COL_W }}>
                              {mg.label}
                            </div>
                          ))}
                        </div>
                        <div className="flex">
                          {gantt.days.map((d, i) => (
                            <div key={i}
                              className={`border-r border-slate-200 last:border-0 text-center flex flex-col items-center justify-center py-0.5 ${
                                d.isToday ? 'bg-violet-100' : d.isWeekend ? 'bg-slate-100/60' : 'bg-slate-50'
                              }`}
                              style={{ width: COL_W, minWidth: COL_W }}>
                              <span className={`text-[10px] font-bold ${ d.isToday ? 'text-violet-700' : 'text-slate-600' }`}>{d.dayNum}</span>
                              <span className={`text-[9px] ${ d.isToday ? 'text-violet-500' : d.isWeekend ? 'text-rose-400' : 'text-slate-400'}`}>{d.dayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ===== TASK ROWS ===== */}
                    {gantt.tasks.map((task, idx) => {
                      const isHeader = !!task.isHeader;
                      const rowH = isHeader ? 40 : 34;
                      const phaseStats = isHeader ? getPhaseStats(currentProject.plan, currentProject.plan.indexOf(task)) : null;
                      const displayProgress = isHeader ? (phaseStats?.progress ?? task.progress) : task.progress;

                      return (
                        <div key={task.id || idx}
                          className={`flex border-b border-slate-100 group transition-colors ${
                            isHeader ? 'bg-slate-50/80' : 'bg-white hover:bg-blue-50/20'
                          }`}
                          style={{ height: rowH }}
                        >
                          <div className="shrink-0 border-r border-slate-200 flex items-center px-2 overflow-hidden" style={{ width: 280 }}>
                            {isHeader ? (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-slate-400 shrink-0">⊞</span>
                                <span className="text-[11px] font-bold text-slate-800 truncate" title={task.title}>{task.title}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-600 truncate pl-5" title={task.title}>{task.title}</span>
                            )}
                          </div>

                          <div className="shrink-0 border-r border-slate-200 flex items-center px-2 gap-2" style={{ width: 120 }}>
                            <span className="text-[10px] font-bold text-slate-600 w-7 text-right shrink-0">{displayProgress}%</span>
                            <div className="flex-1 relative h-2 rounded-full overflow-hidden bg-amber-200">
                              <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all"
                                style={{ width: `${displayProgress}%` }} />
                            </div>
                            <span className="text-slate-300 text-xs shrink-0">⏰</span>
                          </div>

                          <div className="flex-1 relative flex items-center">
                            <div className="absolute inset-0 flex pointer-events-none">
                              {gantt.days.map((d, di) => (
                                <div key={di}
                                  className={`border-r border-slate-100 h-full ${
                                    d.isToday ? 'bg-violet-100/60' : d.isWeekend ? 'bg-slate-50/60' : ''
                                  }`}
                                  style={{ width: COL_W, minWidth: COL_W }}
                                />
                              ))}
                            </div>

                            {task.startIdx >= 0 && task.endIdx >= task.startIdx && (
                              <div
                                className="absolute flex items-center px-2 rounded-md text-[10px] font-semibold shadow-2xs select-none cursor-help overflow-hidden"
                                style={{
                                  left: task.startIdx * COL_W + 2,
                                  width: Math.max(COL_W - 2, (task.endIdx - task.startIdx + 1) * COL_W - 4),
                                  height: isHeader ? 20 : 18,
                                  backgroundColor: task.color.bg,
                                  color: task.color.text,
                                  opacity: isHeader ? 0.85 : 1
                                }}
                                title={`${task.title}\n${formatDate(task.startDate)} → ${formatDate(task.endDate)}\n${displayProgress}%`}
                              >
                                <span className="truncate drop-shadow-2xs">{task.title}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* NEW SERVICE REQUEST MODAL */}
      <NewServiceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerId={user?.customerId || DEMO_CUSTOMER_ID}
        onSuccess={() => loadTickets(user?.customerId || DEMO_CUSTOMER_ID)}
        defaultType={modalDefaultType}
        defaultCategory={modalDefaultCategory}
      />

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { getCurrentUser, UserSession, fetchUsers, SystemUser } from "@/lib/auth-operations";
import { fetchCustomers, Customer } from "@/lib/customer-operations";
import {
  CustomerNotification,
  InternalNotification,
  getCustomerNotifications,
  createCustomerNotification,
  deleteCustomerNotification,
  getInternalNotifications,
  createInternalNotification,
  deleteInternalNotification,
  markInternalNotificationRead,
  markAllInternalNotificationsRead,
} from "@/lib/notification-operations";
import {
  Bell,
  Globe,
  Users,
  Inbox,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  UserCheck,
  Building2,
  X,
  Eye,
  Megaphone,
} from "lucide-react";

const DEPARTMENTS = [
  "Ban Giám Đốc",
  "Phòng Quản lý dự án",
  "Phòng Kỹ thuật & Support",
  "Khách hàng doanh nghiệp",
];

export default function NotificationsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"customer" | "internal" | "for_me">("customer");

  // Data states
  const [customerNotifs, setCustomerNotifs] = useState<CustomerNotification[]>([]);
  const [internalNotifs, setInternalNotifs] = useState<InternalNotification[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [staffList, setStaffList] = useState<SystemUser[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "General" as "General" | "Maintenance",
    target_customer_id: "All",
  });

  const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
  const [internalForm, setInternalForm] = useState({
    title: "",
    summary: "",
    content: "",
    recipient_type: "department" as "individual" | "department" | "all",
    target_user_id: "",
    target_user_name: "",
    target_department: DEPARTMENTS[2],
    priority: "Normal" as "Normal" | "Urgent" | "Important",
  });

  // Selected Notification Detail Modal
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<InternalNotification | null>(null);

  const reloadData = () => {
    setCustomerNotifs(getCustomerNotifications());
    setInternalNotifs(getInternalNotifications());
  };

  useEffect(() => {
    setUser(getCurrentUser());
    reloadData();
    fetchCustomers().then(setCustomersList);
    fetchUsers().then(setStaffList);
  }, []);

  // Filtered Customer Notifications (Tab 1)
  const filteredCustomerNotifs = customerNotifs.filter((n) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(term) ||
      n.summary.toLowerCase().includes(term) ||
      n.content.toLowerCase().includes(term);
    const matchesCategory = categoryFilter === "All" || n.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Internal Sent Notifications (Tab 2)
  const filteredInternalNotifs = internalNotifs.filter((n) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(term) ||
      n.summary.toLowerCase().includes(term) ||
      n.sender_name.toLowerCase().includes(term);
    const matchesPriority = priorityFilter === "All" || n.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  // Filtered "For Me" Internal Notifications (Tab 3)
  const myInternalNotifs = internalNotifs.filter((n) => {
    if (!user) return true;
    if (n.recipient_type === "all") return true;
    if (n.recipient_type === "department" && n.target_department === user.department) return true;
    if (n.recipient_type === "individual" && (n.target_user_id === user.email || n.target_user_name === user.name)) return true;
    return false;
  });

  const filteredMyNotifs = myInternalNotifs.filter((n) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(term) ||
      n.summary.toLowerCase().includes(term) ||
      n.sender_name.toLowerCase().includes(term);
    const matchesRead =
      readFilter === "all"
        ? true
        : readFilter === "unread"
        ? !n.is_read
        : n.is_read;
    return matchesSearch && matchesRead;
  });

  const unreadCount = myInternalNotifs.filter((n) => !n.is_read).length;

  // Handlers
  const handleCreateCustomerNotif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.title.trim() || !customerForm.summary.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và tóm tắt thông báo.");
      return;
    }
    const targetCust = customersList.find((c) => c.id === customerForm.target_customer_id);
    createCustomerNotification({
      title: customerForm.title.trim(),
      summary: customerForm.summary.trim(),
      content: customerForm.content.trim() || customerForm.summary.trim(),
      category: customerForm.category,
      target_customer_id: customerForm.target_customer_id,
      target_customer_name: customerForm.target_customer_id === "All" ? "Tất cả khách hàng" : targetCust?.name || "Khách hàng",
    });
    setIsCustomerModalOpen(false);
    setCustomerForm({ title: "", summary: "", content: "", category: "General", target_customer_id: "All" });
    reloadData();
  };

  const handleCreateInternalNotif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalForm.title.trim() || !internalForm.summary.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và tóm tắt thông báo.");
      return;
    }
    createInternalNotification({
      title: internalForm.title.trim(),
      summary: internalForm.summary.trim(),
      content: internalForm.content.trim() || internalForm.summary.trim(),
      recipient_type: internalForm.recipient_type,
      target_user_id: internalForm.target_user_id,
      target_user_name: internalForm.target_user_name,
      target_department: internalForm.target_department,
      sender_id: user?.email || "usr-admin",
      sender_name: user?.name ? `${user.name} (${user.roleLabel || user.department || "Admin"})` : "Quản trị viên",
      priority: internalForm.priority,
    });
    setIsInternalModalOpen(false);
    setInternalForm({
      title: "",
      summary: "",
      content: "",
      recipient_type: "department",
      target_user_id: "",
      target_user_name: "",
      target_department: DEPARTMENTS[2],
      priority: "Normal",
    });
    reloadData();
  };

  const handleDeleteCustomerNotif = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thông báo này khỏi Portal Khách hàng?")) {
      deleteCustomerNotification(id);
      reloadData();
    }
  };

  const handleDeleteInternalNotif = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa thông báo nội bộ này?")) {
      deleteInternalNotification(id);
      reloadData();
    }
  };

  const handleOpenDetailModal = (notif: InternalNotification) => {
    setSelectedNotifDetail(notif);
    markInternalNotificationRead(notif.id);
    reloadData();
  };

  const handleMarkAllRead = () => {
    markAllInternalNotificationsRead();
    reloadData();
  };

  return (
    <MainLayout>
      {/* Header with 3 Tabs */}
      <Header
        title="Quản Lý Thông Báo"
        description="Tạo thông báo tin tức đến Portal Khách hàng, phát tín hiệu nội bộ và theo dõi danh sách thông báo cá nhân."
        tabs={[
          { id: "customer", label: "Thông báo khách hàng", icon: Globe },
          { id: "internal", label: "Thông báo nội bộ", icon: Send },
          { id: "for_me", label: `Thông báo cho tôi (${unreadCount})`, icon: Bell },
        ]}
        activeTab={activeTab}
        setActiveTab={(id: any) => setActiveTab(id)}
      />

      {/* ── TAB 1: THÔNG BÁO KHÁCH HÀNG (PORTAL) ────────────────────── */}
      {activeTab === "customer" && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thông báo Portal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
                >
                  <option value="All">Tất cả danh mục</option>
                  <option value="General">Thông báo chung</option>
                  <option value="Maintenance">Lịch bảo trì</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:brightness-110 transition cursor-pointer"
            >
              <Plus size={16} />
              <span>Tạo thông báo Portal</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5 w-24">Mã TB</th>
                    <th className="px-5 py-3.5 w-36">Phân loại</th>
                    <th className="px-5 py-3.5">Tiêu đề & Tóm tắt</th>
                    <th className="px-5 py-3.5 w-48">Đối tượng hiển thị</th>
                    <th className="px-5 py-3.5 w-32">Ngày đăng</th>
                    <th className="px-5 py-3.5 w-24 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCustomerNotifs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-normal">
                        Không tìm thấy thông báo Portal phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerNotifs.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4 font-mono text-blue-600 font-bold">{n.id}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                              n.category === "Maintenance"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            }`}
                          >
                            {n.category === "Maintenance" ? "LỊCH BẢO TRÌ" : "THÔNG BÁO CHUNG"}
                          </span>
                        </td>
                        <td className="px-5 py-4 space-y-1 max-w-md">
                          <h4 className="font-bold text-slate-900 line-clamp-1">{n.title}</h4>
                          <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">{n.summary}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                            <Globe size={13} className="text-blue-500" />
                            {n.target_customer_name || "Tất cả khách hàng"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">{n.dateStr}</td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleDeleteCustomerNotif(n.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Xóa thông báo"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* ── TAB 2: THÔNG BÁO NỘI BỘ (INTERNAL SENT) ─────────────────── */}
      {activeTab === "internal" && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thông báo nội bộ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
                >
                  <option value="All">Mọi mức độ</option>
                  <option value="Urgent">Khẩn cấp</option>
                  <option value="Important">Quan trọng</option>
                  <option value="Normal">Bình thường</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsInternalModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:brightness-110 transition cursor-pointer"
            >
              <Send size={16} />
              <span>Gửi thông báo nội bộ</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5 w-24">Mã TB</th>
                    <th className="px-5 py-3.5 w-28">Mức độ</th>
                    <th className="px-5 py-3.5">Tiêu đề & Nội dung</th>
                    <th className="px-5 py-3.5 w-52">Gửi tới</th>
                    <th className="px-5 py-3.5 w-48">Người gửi</th>
                    <th className="px-5 py-3.5 w-32">Ngày gửi</th>
                    <th className="px-5 py-3.5 w-24 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredInternalNotifs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-normal">
                        Chưa có thông báo nội bộ nào được tạo.
                      </td>
                    </tr>
                  ) : (
                    filteredInternalNotifs.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4 font-mono text-teal-600 font-bold">{n.id}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              n.priority === "Urgent"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : n.priority === "Important"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {n.priority === "Urgent" ? "KHẨN CẤP" : n.priority === "Important" ? "QUAN TRỌNG" : "BÌNH THƯỜNG"}
                          </span>
                        </td>
                        <td className="px-5 py-4 space-y-1 max-w-md">
                          <h4 className="font-bold text-slate-900 line-clamp-1">{n.title}</h4>
                          <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">{n.summary}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-semibold">
                            {n.recipient_type === "all" ? (
                              <>
                                <Users size={13} className="text-indigo-500" />
                                Toàn thể công ty
                              </>
                            ) : n.recipient_type === "department" ? (
                              <>
                                <Building2 size={13} className="text-amber-500" />
                                {n.target_department}
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} className="text-teal-500" />
                                {n.target_user_name || "Cá nhân"}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600 font-medium">{n.sender_name}</td>
                        <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                          {new Date(n.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleDeleteInternalNotif(n.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Xóa thông báo"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* ── TAB 3: THÔNG BÁO CHO TÔI (FOR ME) ────────────────────────── */}
      {activeTab === "for_me" && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thông báo gửi cho tôi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">Tất cả thông báo</option>
                  <option value="unread">Chưa đọc ({unreadCount})</option>
                  <option value="read">Đã đọc</option>
                </select>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
              >
                <CheckCircle2 size={15} className="text-teal-600" />
                <span>Đánh dấu đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {filteredMyNotifs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center text-slate-400">
                <Bell size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-medium">Không có thông báo nào dành cho bạn.</p>
              </div>
            ) : (
              filteredMyNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleOpenDetailModal(n)}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative flex items-start gap-4 ${
                    !n.is_read
                      ? "bg-blue-50/70 border-blue-200/80 shadow-xs hover:bg-blue-50"
                      : "bg-white border-slate-200/70 hover:bg-slate-50/80 opacity-80"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      n.priority === "Urgent"
                        ? "bg-rose-100 text-rose-600 border-rose-200"
                        : n.priority === "Important"
                        ? "bg-amber-100 text-amber-600 border-amber-200"
                        : "bg-teal-100 text-teal-600 border-teal-200"
                    }`}
                  >
                    <Megaphone size={18} />
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            n.priority === "Urgent"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : n.priority === "Important"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {n.priority === "Urgent" ? "KHẨN CẤP" : n.priority === "Important" ? "QUAN TRỌNG" : "THÔNG BÁO"}
                        </span>

                        {!n.is_read ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                            MỚI
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                            ĐÃ XEM
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(n.created_at).toLocaleDateString("vi-VN")}{" "}
                        {new Date(n.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h4 className={`text-sm ${!n.is_read ? "font-extrabold text-slate-900" : "font-bold text-slate-700"}`}>
                      {n.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{n.summary}</p>

                    <div className="pt-1 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                      <span>Người gửi: <strong className="text-slate-700">{n.sender_name}</strong></span>
                      <span>•</span>
                      <span>Gửi tới: <strong className="text-slate-700">{n.recipient_type === "all" ? "Toàn thể" : n.target_department || n.target_user_name}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: TẠO THÔNG BÁO PORTAL KHÁCH HÀNG ───────────────────── */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Globe size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Tạo Thông Báo Portal Khách Hàng</h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerNotif} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phân loại thông báo *</label>
                  <select
                    value={customerForm.category}
                    onChange={(e) => setCustomerForm({ ...customerForm, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="General">THÔNG BÁO CHUNG</option>
                    <option value="Maintenance">LỊCH BẢO TRÌ HẠ TẦNG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Khách hàng áp dụng *</label>
                  <select
                    value={customerForm.target_customer_id}
                    onChange={(e) => setCustomerForm({ ...customerForm, target_customer_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="All">Tất cả khách hàng</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề thông báo hiển thị trên Portal..."
                  value={customerForm.title}
                  onChange={(e) => setCustomerForm({ ...customerForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tóm tắt ngắn *</label>
                <textarea
                  rows={2}
                  placeholder="Nội dung tóm tắt hiển thị trong danh sách thông báo..."
                  value={customerForm.summary}
                  onChange={(e) => setCustomerForm({ ...customerForm, summary: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={5}
                  placeholder="Chi tiết thông báo, mốc thời gian, phạm vi ảnh hưởng..."
                  value={customerForm.content}
                  onChange={(e) => setCustomerForm({ ...customerForm, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-mono text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
                >
                  Đăng thông báo Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GỬI THÔNG BÁO NỘI BỘ ─────────────────────────────── */}
      {isInternalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center font-bold">
                  <Send size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Gửi Thông Báo Nội Bộ</h3>
              </div>
              <button
                onClick={() => setIsInternalModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInternalNotif} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Đối tượng nhận *</label>
                  <select
                    value={internalForm.recipient_type}
                    onChange={(e) => setInternalForm({ ...internalForm, recipient_type: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-semibold"
                  >
                    <option value="department">Phòng ban nội bộ</option>
                    <option value="individual">Cá nhân cụ thể</option>
                    <option value="all">Toàn thể công ty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mức độ ưu tiên *</label>
                  <select
                    value={internalForm.priority}
                    onChange={(e) => setInternalForm({ ...internalForm, priority: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-semibold"
                  >
                    <option value="Normal">Bình thường</option>
                    <option value="Important">Quan trọng</option>
                    <option value="Urgent">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              {internalForm.recipient_type === "department" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chọn phòng ban *</label>
                  <select
                    value={internalForm.target_department}
                    onChange={(e) => setInternalForm({ ...internalForm, target_department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-semibold"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {internalForm.recipient_type === "individual" && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chọn nhân sự nhận *</label>
                  <select
                    value={internalForm.target_user_id}
                    onChange={(e) => {
                      const selected = staffList.find((s) => s.email === e.target.value);
                      setInternalForm({
                        ...internalForm,
                        target_user_id: e.target.value,
                        target_user_name: selected?.name || e.target.value,
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-semibold"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.email}>
                        {s.name} ({s.department || s.roleLabel})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề thông báo nội bộ..."
                  value={internalForm.title}
                  onChange={(e) => setInternalForm({ ...internalForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tóm tắt nội dung *</label>
                <textarea
                  rows={2}
                  placeholder="Tóm tắt ngắn thông báo..."
                  value={internalForm.summary}
                  onChange={(e) => setInternalForm({ ...internalForm, summary: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={4}
                  placeholder="Nội dung thông báo chi tiết..."
                  value={internalForm.content}
                  onChange={(e) => setInternalForm({ ...internalForm, content: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInternalModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
                >
                  Gửi thông báo nội bộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CHI TIẾT THÔNG BÁO CHO TÔI ──────────────────────── */}
      {selectedNotifDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center font-bold">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chi Tiết Thông Báo</h3>
                  <p className="text-[11px] text-slate-400">Mã thông báo: {selectedNotifDetail.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotifDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 text-[10px]">Mức độ ưu tiên</p>
                  <span className="font-bold text-slate-800">{selectedNotifDetail.priority}</span>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Người gửi</p>
                  <span className="font-bold text-slate-800">{selectedNotifDetail.sender_name}</span>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Ngày nhận</p>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedNotifDetail.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-1">{selectedNotifDetail.title}</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedNotifDetail.summary}
                </p>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Nội dung chi tiết:</label>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedNotifDetail.content}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedNotifDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

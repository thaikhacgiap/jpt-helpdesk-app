"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { 
  fetchRequests, 
  createRequest, 
  updateRequest, 
  deleteRequest, 
  RequestTask 
} from "@/lib/request-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";
import { fetchAllTickets, updateServiceTicket, createServiceRequest, ServiceTicket } from "@/lib/portal-operations";
import { fetchCustomers, Customer } from "@/lib/customer-operations";
import { fetchContractsByCustomer } from "@/lib/contract-operations";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Clock, 
  AlertCircle, 
  X, 
  Inbox,
  Filter,
  Users,
  CheckSquare,
  Tag,
  Calendar
} from "lucide-react";

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<"customer" | "internal">("customer");
  
  // Data States
  const [requests, setRequests] = useState<RequestTask[]>([]);
  const [staffList, setStaffList] = useState<NhanSu[]>([]);
  const [customerTickets, setCustomerTickets] = useState<ServiceTicket[]>([]);
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestTask | null>(null);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    type: "Yêu cầu công việc" as RequestTask["type"],
    description: "",
    requester: "",
    assignee: "",
    follower: "",
    startTime: ""
  });

  // Customer On-Behalf Modal States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerContracts, setCustomerContracts] = useState<any[]>([]);
  const [customerFormData, setCustomerFormData] = useState({
    customerId: "",
    title: "",
    description: "",
    tt_type: "",
    category: "",
    priority: "Medium",
    contract_no: "",
    incident_start_time: new Date().toISOString().substring(0, 16),
    affected_service: ""
  });

  // Load contracts when selected customer changes
  useEffect(() => {
    if (customerFormData.customerId) {
      fetchContractsByCustomer(customerFormData.customerId)
        .then(setCustomerContracts)
        .catch(err => console.error("Error loading contracts:", err));
    } else {
      setCustomerContracts([]);
    }
  }, [customerFormData.customerId]);

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerCreateOpen = () => {
    setCustomerFormData({
      customerId: dbCustomers[0]?.id || "",
      title: "",
      description: "",
      tt_type: "",
      category: "",
      priority: "Medium",
      contract_no: "",
      incident_start_time: new Date().toISOString().substring(0, 16),
      affected_service: ""
    });
    setError("");
    setIsCustomerModalOpen(true);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerFormData.customerId) {
      setError("Vui lòng chọn khách hàng.");
      return;
    }
    if (!customerFormData.title.trim()) {
      setError("Vui lòng nhập tiêu đề yêu cầu.");
      return;
    }
    if (!customerFormData.tt_type) {
      setError("Vui lòng chọn loại yêu cầu.");
      return;
    }
    if (!customerFormData.category) {
      setError("Vui lòng chọn danh mục.");
      return;
    }

    try {
      let finalDescription = customerFormData.description.trim();
      if (customerFormData.tt_type === "Xử lý lỗi" && customerFormData.affected_service) {
        finalDescription += `\n\n[Thông tin sự cố]\n- Thời gian bắt đầu sự cố: ${customerFormData.incident_start_time.replace("T", " ")}\n- Dịch vụ bị ảnh hưởng: ${customerFormData.affected_service}`;
      }

      await createServiceRequest(customerFormData.customerId, {
        title: customerFormData.title.trim(),
        description: finalDescription,
        tt_type: customerFormData.tt_type,
        category: customerFormData.category,
        priority: "Medium", // Default
        contract_no: customerFormData.contract_no,
        start_time: customerFormData.tt_type === "Xử lý lỗi"
          ? new Date(customerFormData.incident_start_time).toISOString()
          : new Date().toISOString()
      });
      setIsCustomerModalOpen(false);
      loadCustomerTicketsList();
    } catch (err) {
      setError("Không thể tạo yêu cầu hộ khách hàng: " + String(err));
    }
  };

  // Load Data
  const loadCustomerTicketsList = async () => {
    try {
      const ticketsData = await fetchAllTickets();
      setCustomerTickets(ticketsData || []);
    } catch (err) {
      console.error("Error loading customer tickets:", err);
    }
  };

  useEffect(() => {
    // Internal requests and staff
    setRequests(fetchRequests());
    fetchNhanSu().then(setStaffList).catch(err => console.error("Error loading staff:", err));
    
    // Customer tickets and customers
    loadCustomerTicketsList();
    fetchCustomers().then(setDbCustomers).catch(err => console.error("Error loading customers:", err));
  }, []);

  // Realtime subscription for customer portal tickets
  useEffect(() => {
    const channel = supabase
      .channel("requests-tickets-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
        },
        (payload) => {
          const newTicket = payload.new as ServiceTicket;
          const oldTicket = payload.old as ServiceTicket;
          const ticketId = (newTicket?.ticket_id || oldTicket?.ticket_id || "");
          
          // Only react if the ticket starts with TH- (customer portal requests)
          if (!ticketId.startsWith("TH-")) return;

          if (payload.eventType === "INSERT") {
            setCustomerTickets((prev) => [newTicket, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setCustomerTickets((prev) =>
              prev.map((t) => (t.id === newTicket.id ? { ...t, ...newTicket } : t))
            );
          } else if (payload.eventType === "DELETE") {
            setCustomerTickets((prev) => prev.filter((t) => t.id !== oldTicket.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const refreshRequests = () => {
    setRequests(fetchRequests());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateOpen = () => {
    setEditingRequest(null);
    setFormData({
      code: "",
      title: "",
      type: "Yêu cầu công việc",
      description: "",
      requester: "",
      assignee: "",
      follower: "",
      startTime: new Date().toISOString().split('T')[0]
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleEditOpen = (req: RequestTask) => {
    setEditingRequest(req);
    setFormData({
      code: req.code || "",
      title: req.title || "",
      type: req.type || "Yêu cầu công việc",
      description: req.description || "",
      requester: req.requester || "",
      assignee: req.assignee || "",
      follower: req.follower || "",
      startTime: req.startTime || ""
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa yêu cầu này?")) {
      deleteRequest(id);
      refreshRequests();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Vui lòng nhập tên công việc.");
      return;
    }
    if (!formData.startTime) {
      setError("Vui lòng chọn thời gian bắt đầu.");
      return;
    }

    try {
      if (editingRequest) {
        updateRequest(editingRequest.id, {
          title: formData.title,
          type: formData.type,
          description: formData.description,
          requester: formData.requester,
          assignee: formData.assignee,
          follower: formData.follower,
          startTime: formData.startTime
        });
      } else {
        createRequest({
          code: formData.code,
          title: formData.title,
          type: formData.type,
          description: formData.description,
          requester: formData.requester,
          assignee: formData.assignee,
          follower: formData.follower,
          startTime: formData.startTime,
          status: "New"
        });
      }
      setIsModalOpen(false);
      refreshRequests();
    } catch (err) {
      setError("Không thể lưu yêu cầu: " + String(err));
    }
  };

  const handleQuickStatusChange = (id: string, newStatus: RequestTask["status"]) => {
    updateRequest(id, { status: newStatus });
    refreshRequests();
  };

  const handleCustomerStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateServiceTicket(id, { tt_status: newStatus });
      loadCustomerTicketsList();
    } catch (err) {
      console.error("Error updating customer ticket status:", err);
      alert("Lỗi khi cập nhật trạng thái yêu cầu khách hàng: " + String(err));
    }
  };

  // Helper date formatter
  const formatDate = (dateStr: string) => {
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

  // Status/Priority Helpers for customer tickets
  const getTicketPriorityLabel = (priority: string) => {
    switch (priority) {
      case "Critical": return "Cấp bách";
      case "High": return "Cao";
      case "Medium": return "Trung bình";
      case "Low": return "Thấp";
      default: return priority;
    }
  };

  const getTicketPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Critical":
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
     }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Completed":
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "Rejected":
      case "Closed":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      case "On Hold":
        return "bg-purple-50 text-purple-700 border-purple-200/50";
      default:
        return "bg-slate-50 text-slate-650 border-slate-200";
    }
  };

  const getTypeColor = (type: RequestTask["type"]) => {
    switch (type) {
      case "Yêu cầu triển khai": return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "Yêu cầu hỗ trợ kỹ thuật": return "bg-rose-50 text-rose-700 border-rose-200/50";
      case "Yêu cầu tư vấn": return "bg-cyan-50 text-cyan-700 border-cyan-200/50";
      case "Yêu cầu công việc": return "bg-amber-50 text-amber-700 border-amber-200/50";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // 1. FILTER & SPLIT FOR CUSTOMER TAB
  const filteredCustomerTickets = customerTickets.filter(t => {
    // Only show customer requests from portal (which start with 'TH-')
    if (!t.ticket_id.startsWith("TH-")) return false;

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(query) ||
      t.title.toLowerCase().includes(query) ||
      (t.description || "").toLowerCase().includes(query);

    const matchesStatus = statusFilter === "All" || t.tt_status === statusFilter;
    const matchesType = typeFilter === "All" || t.tt_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCustomerTickets = filteredCustomerTickets.filter(t => t.tt_status === "New");
  const processedCustomerTickets = filteredCustomerTickets.filter(t => t.tt_status !== "New");

  // 2. FILTER & SPLIT FOR INTERNAL TAB
  const filteredInternalRequests = requests.filter(req => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      req.title.toLowerCase().includes(term) || 
      req.code.toLowerCase().includes(term) ||
      (req.description || "").toLowerCase().includes(term) ||
      (req.requester || "").toLowerCase().includes(term) ||
      (req.assignee || "").toLowerCase().includes(term);

    const matchesType = typeFilter === "All" || req.type === typeFilter;
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const pendingInternalRequests = filteredInternalRequests.filter(r => r.status === "New");
  const processedInternalRequests = filteredInternalRequests.filter(r => r.status !== "New");

  // 3. RENDER CUSTOMER TICKETS TABLE (Tab 1)
  const renderCustomerTicketsTable = (title: string, list: ServiceTicket[], emptyMsg: string, isPending: boolean) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden mb-6">
        <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{title}</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPending ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {list.length}
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{minWidth:'1200px'}}>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs text-slate-500 font-semibold text-left">
                <th className="px-4 py-3 w-32 whitespace-nowrap">Mã yêu cầu</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap">Trạng thái</th>
                <th className="px-4 py-3 min-w-[160px]">Tiêu đề</th>
                <th className="px-4 py-3 min-w-[180px]">Mô tả</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap">Loại yêu cầu</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap">Danh mục</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap">Thời gian sự cố</th>
                <th className="px-4 py-3 min-w-[140px]">Dịch vụ ảnh hưởng</th>
                <th className="px-4 py-3 min-w-[130px]">Hợp đồng</th>
                <th className="px-4 py-3 whitespace-nowrap">Khách hàng</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap">Ticket liên kết</th>
                <th className="px-4 py-3 text-center w-24 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{emptyMsg}</p>
                  </td>
                </tr>
              ) : (
                list.map((t) => {
                  const customer = dbCustomers.find(c => c.id === t.customer_id);
                  const customerName = customer ? `${customer.name} (${customer.code})` : "Khách hàng Portal";
                  const hasLinkedTicket = t.document_link && t.document_link.startsWith("TK-");
                  // Extract contract name from remark
                  const contractName = t.remark
                    ? t.remark.replace(/^Hợp đồng:\s*/i, "").split(" | ")[0]
                    : null;

                  return (
                    <tr key={t.id} className="hover:bg-blue-50/20 transition">
                      {/* Mã yêu cầu */}
                      <td className="px-4 py-3.5 font-bold text-blue-600 font-mono text-xs whitespace-nowrap">
                        {t.ticket_id}
                      </td>

                      {/* Trạng thái - dropdown đổi ngược lên đầu */}
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <select
                            value={t.tt_status}
                            onChange={(e) => handleCustomerStatusChange(t.id, e.target.value)}
                            className={`text-[10px] font-bold px-2.5 py-1 border rounded-full outline-none bg-white cursor-pointer appearance-none pr-6 ${getStatusBadge(t.tt_status)}`}
                          >
                            <option value="New">Mới tạo</option>
                            <option value="In Progress">Đang xử lý</option>
                            <option value="Resolved">Hoàn thành</option>
                            <option value="On Hold">Chờ phản hồi</option>
                            <option value="Closed">Đã đóng</option>
                          </select>
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[7px] text-slate-500 pointer-events-none">▼</span>
                        </div>
                      </td>

                      {/* Tiêu đề */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800 text-xs line-clamp-2 max-w-[160px]">{t.title}</p>
                      </td>

                      {/* Mô tả */}
                      <td className="px-4 py-3.5">
                        <p className="text-[11px] text-slate-500 line-clamp-2 max-w-[180px]">
                          {t.description || "—"}
                        </p>
                      </td>

                      {/* Loại yêu cầu */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                          t.tt_type === "Xử lý lỗi" ? "bg-red-50 text-red-700 border-red-200" :
                          t.tt_type === "Thay đổi cấu hình" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          t.tt_type === "Cài đặt - Nâng cấp" ? "bg-violet-50 text-violet-700 border-violet-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>{t.tt_type || "—"}</span>
                      </td>

                      {/* Danh mục */}
                      <td className="px-4 py-3.5 text-slate-600 font-medium text-xs whitespace-nowrap">
                        {t.category || "—"}
                      </td>

                      {/* Thời gian sự cố */}
                      <td className="px-4 py-3.5 font-mono text-slate-500 text-xs whitespace-nowrap">
                        {t.tt_type === "Xử lý lỗi" && t.start_time
                          ? formatDate(t.start_time)
                          : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Dịch vụ ảnh hưởng */}
                      <td className="px-4 py-3.5">
                        <p className="text-[11px] text-slate-500 line-clamp-2 max-w-[140px]">
                          {t.hold_reason || <span className="text-slate-300">—</span>}
                        </p>
                      </td>

                      {/* Hợp đồng */}
                      <td className="px-4 py-3.5">
                        {contractName
                          ? <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold whitespace-nowrap">{contractName}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-3.5 text-slate-700 font-semibold text-xs whitespace-nowrap">
                        {customerName}
                      </td>

                      {/* Ticket liên kết */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs">
                        {hasLinkedTicket ? (
                          <span
                            onClick={() => { window.location.href = `/tickets?search=${t.document_link}`; }}
                            className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200/50 rounded-full text-[10px] font-bold cursor-pointer hover:bg-green-100 transition"
                            title="Bấm để xem chi tiết ticket"
                          >
                            {t.document_link}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3.5 text-center">
                        {!hasLinkedTicket ? (
                          <button
                            onClick={() => {
                              window.location.href = `/tickets?action=create&customerId=${t.customer_id}&title=${encodeURIComponent(t.title)}&description=${encodeURIComponent(t.description)}&priority=${t.priority}&category=${t.category}&requestTicketId=${t.ticket_id}&requestDbId=${t.id}`;
                            }}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition shadow-xs cursor-pointer"
                          >
                            <Plus size={10} />
                            <span>Tạo Ticket</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Đã liên kết</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 4. RENDER INTERNAL TASKS TABLE (Tab 2)
  const renderInternalTasksTable = (title: string, list: RequestTask[], emptyMsg: string, isPending: boolean) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden mb-6">
        <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{title}</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPending ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {list.length}
            </span>
          </h3>
        </div>

        <div className="table-scroll">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs text-slate-500 font-semibold text-left">
                <th className="px-6 py-3 w-32">Mã công việc</th>
                <th className="px-4 py-3 min-w-[200px]">Tên công việc / Yêu cầu</th>
                <th className="px-4 py-3">Loại công việc</th>
                <th className="px-4 py-3">Người yêu cầu</th>
                <th className="px-4 py-3">Người được giao</th>
                <th className="px-4 py-3">Người theo dõi</th>
                <th className="px-4 py-3">Thời gian bắt đầu</th>
                <th className="px-4 py-3 w-40">Tình trạng</th>
                <th className="px-4 py-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{emptyMsg}</p>
                  </td>
                </tr>
              ) : (
                list.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-semibold text-blue-600 font-mono text-xs">
                      {req.code}
                    </td>
                    <td className="px-4 py-3.5 text-left">
                      <p className="font-bold text-slate-800 text-sm line-clamp-1">{req.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-[280px]">
                        {req.description || "Không có mô tả chi tiết."}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-left">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${getTypeColor(req.type)}`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-650 font-medium text-xs text-left">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold flex items-center justify-center text-slate-500">
                          {req.requester ? req.requester.charAt(0) : "U"}
                        </div>
                        <span>{req.requester || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-655 font-medium text-xs text-left">
                      <div className="flex items-center gap-1">
                        {req.assignee ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-blue-50 text-[10px] font-bold flex items-center justify-center text-blue-600">
                              {req.assignee.charAt(0)}
                            </div>
                            <span>{req.assignee}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Chưa giao</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs text-left">
                      {req.follower || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs text-left">
                      {formatDate(req.startTime)}
                    </td>
                    <td className="px-4 py-3.5 text-left">
                      <div className="relative">
                        <select
                          value={req.status}
                          onChange={(e) => handleQuickStatusChange(req.id, e.target.value as RequestTask["status"])}
                          className={`text-[10px] font-bold px-2.5 py-1 border rounded-full outline-none bg-white cursor-pointer appearance-none pr-6 ${getStatusBadge(req.status)}`}
                        >
                          <option value="New">Mới tạo</option>
                          <option value="In Progress">Đang xử lý</option>
                          <option value="Completed">Hoàn thành</option>
                          <option value="Rejected">Từ chối</option>
                        </select>
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[7px] text-slate-500 pointer-events-none">▼</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditOpen(req)}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                          title="Chỉnh sửa yêu cầu"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                          title="Xóa yêu cầu"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <Header 
        title="Quản Lý Yêu Cầu & Công Việc" 
        description="Ghi nhận và điều phối các yêu cầu từ khách hàng trên Portal và các yêu cầu nội bộ của nhân viên." 
      />

      {/* Tabs Selector Bar */}
      <div className="flex border-b border-slate-200 mb-6 bg-white p-1 rounded-xl max-w-max border shadow-xs">
        <button
          onClick={() => {
            setActiveTab("customer");
            setTypeFilter("All");
            setStatusFilter("All");
            setSearchQuery("");
          }}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "customer" 
              ? "bg-blue-600 text-white shadow-sm" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Inbox size={14} />
          <span>Yêu cầu từ khách hàng</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "customer" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
            {customerTickets.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("internal");
            setTypeFilter("All");
            setStatusFilter("All");
            setSearchQuery("");
          }}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === "internal" 
              ? "bg-blue-600 text-white shadow-sm" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Users size={14} />
          <span>Yêu cầu nội bộ (Tasks)</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "internal" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
            {requests.length}
          </span>
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs mb-6">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã, tiêu đề, mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Conditional Type Filter options */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={13} className="text-slate-400" />
            {activeTab === "customer" ? (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
              >
                <option value="All">Tất cả loại yêu cầu</option>
                <option value="Xử lý lỗi">Xử lý lỗi</option>
                <option value="Thay đổi cấu hình">Thay đổi cấu hình</option>
                <option value="Cài đặt - Nâng cấp">Cài đặt - Nâng cấp</option>
                <option value="Khác">Khác</option>
              </select>
            ) : (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
              >
                <option value="All">Tất cả loại công việc</option>
                <option value="Yêu cầu triển khai">Yêu cầu triển khai</option>
                <option value="Yêu cầu hỗ trợ kỹ thuật">Yêu cầu hỗ trợ kỹ thuật</option>
                <option value="Yêu cầu tư vấn">Yêu cầu tư vấn</option>
                <option value="Yêu cầu">Yêu cầu</option>
                <option value="Yêu cầu công việc">Yêu cầu công việc</option>
              </select>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="All">Tất cả tình trạng</option>
              <option value="New">Mới tạo</option>
              <option value="In Progress">Đang xử lý</option>
              {activeTab === "customer" && <option value="On Hold">Chờ phản hồi</option>}
              {activeTab === "customer" ? <option value="Resolved">Hoàn thành</option> : <option value="Completed">Hoàn thành</option>}
              {activeTab === "customer" ? <option value="Closed">Đã đóng</option> : <option value="Rejected">Từ chối</option>}
            </select>
          </div>
        </div>

        {/* Create Button depending on Active Tab */}
        {activeTab === "customer" ? (
          <button
            onClick={handleCustomerCreateOpen}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-sm hover:shadow-md cursor-pointer shrink-0 animate-fade-in"
          >
            <Plus size={14} />
            <span>Tạo Yêu Cầu Hộ Khách Hàng</span>
          </button>
        ) : (
          <button
            onClick={handleCreateOpen}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-sm hover:shadow-md cursor-pointer shrink-0 animate-fade-in"
          >
            <Plus size={14} />
            <span>Tạo Yêu Cầu Nội Bộ</span>
          </button>
        )}
      </div>

      {/* Tabs View Body */}
      <div className="space-y-6">
        {activeTab === "customer" ? (
          <>
            {renderCustomerTicketsTable(
              "Yêu cầu chờ tiếp nhận từ khách hàng", 
              pendingCustomerTickets, 
              "Không có yêu cầu mới nào từ khách hàng đang chờ tiếp nhận.", 
              true
            )}
            {renderCustomerTicketsTable(
              "Yêu cầu khách hàng đang xử lý và hoàn thành", 
              processedCustomerTickets, 
              "Không có yêu cầu khách hàng nào đang trong quá trình xử lý hoặc hoàn thành.", 
              false
            )}
          </>
        ) : (
          <>
            {renderInternalTasksTable(
              "Yêu cầu chờ tiếp nhận nội bộ", 
              pendingInternalRequests, 
              "Hiện tại không có yêu cầu nội bộ nào đang chờ tiếp nhận.", 
              true
            )}
            {renderInternalTasksTable(
              "Yêu cầu nội bộ đang xử lý và hoàn thành", 
              processedInternalRequests, 
              "Hiện tại không có yêu cầu nội bộ nào đang được xử lý hoặc đã hoàn thành.", 
              false
            )}
          </>
        )}
      </div>

      {/* Modal Popup for internal requests creation/editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Inbox size={18} />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-bold text-slate-900">
                    {editingRequest ? "Chỉnh Sửa Yêu Cầu Nội Bộ" : "Tạo Yêu Cầu Công Việc Nội Bộ Mới"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingRequest ? `Cập nhật thông tin công việc: ${editingRequest.code}` : "Lập phiếu ghi nhận yêu cầu mới."}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Row 1: Code & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Mã yêu cầu <span className="text-slate-400 font-normal">(Tự sinh nếu trống)</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="VD: YC-HELP-01"
                    disabled={!!editingRequest}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition font-mono uppercase disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Tên công việc / Yêu cầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập tên tóm tắt yêu cầu..."
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                </div>
              </div>

              {/* Row 2: Type & Start Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Loại yêu cầu <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="Yêu cầu triển khai">Yêu cầu triển khai (Deployment)</option>
                    <option value="Yêu cầu hỗ trợ kỹ thuật">Yêu cầu hỗ trợ kỹ thuật (Technical Support)</option>
                    <option value="Yêu cầu tư vấn">Yêu cầu tư vấn (Consultancy)</option>
                    <option value="Yêu cầu">Yêu cầu (General Request)</option>
                    <option value="Yêu cầu công việc">Yêu cầu công việc (Work Request)</option>
                  </select>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 3: Requester & Assignee */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Người yêu cầu
                  </label>
                  <select
                    name="requester"
                    value={formData.requester}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.ten_nhan_su}>{s.ten_nhan_su}</option>
                    ))}
                    <option value="John D.">John D.</option>
                    <option value="Mike R.">Mike R.</option>
                    <option value="Jane S.">Jane S.</option>
                  </select>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Người được giao
                  </label>
                  <select
                    name="assignee"
                    value={formData.assignee}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.ten_nhan_su}>{s.ten_nhan_su}</option>
                    ))}
                    <option value="John D.">John D.</option>
                    <option value="Mike R.">Mike R.</option>
                    <option value="Tom H.">Tom H.</option>
                  </select>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Người theo dõi
                  </label>
                  <select
                    name="follower"
                    value={formData.follower}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn nhân sự --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.ten_nhan_su}>{s.ten_nhan_su}</option>
                    ))}
                    <option value="Tom H.">Tom H.</option>
                    <option value="Sarah L.">Sarah L.</option>
                    <option value="Mike R.">Mike R.</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Mô tả yêu cầu
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả cụ thể nội dung yêu cầu, mục tiêu cần hỗ trợ..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold text-sm transition cursor-pointer"
                >
                  {editingRequest ? "Cập Nhật" : "Tạo Yêu Cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Popup for Customer On-Behalf Ticket Creation */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Inbox size={18} />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-bold text-slate-900">
                    Tạo Yêu Cầu Hộ Khách Hàng
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ghi nhận sự cố hoặc yêu cầu dịch vụ thay mặt cho khách hàng.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCustomerModalOpen(false)} 
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCustomerSubmit} className="px-6 py-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Customer Selection */}
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <select
                  name="customerId"
                  value={customerFormData.customerId}
                  onChange={handleCustomerInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="">-- Chọn khách hàng nhận yêu cầu --</option>
                  {dbCustomers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Tiêu đề yêu cầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={customerFormData.title}
                  onChange={handleCustomerInputChange}
                  placeholder="Nhập tên tóm tắt sự cố hoặc yêu cầu..."
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                />
              </div>

              {/* Type and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Loại yêu cầu <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tt_type"
                    value={customerFormData.tt_type}
                    onChange={handleCustomerInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn loại yêu cầu --</option>
                    <option value="Xử lý lỗi">Xử lý lỗi</option>
                    <option value="Thay đổi cấu hình">Thay đổi cấu hình</option>
                    <option value="Cài đặt - Nâng cấp">Cài đặt - Nâng cấp</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={customerFormData.category}
                    onChange={handleCustomerInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    <option value="Phần cứng">Phần cứng</option>
                    <option value="Phần mềm">Phần mềm</option>
                    <option value="Database">Database</option>
                    <option value="Network">Network</option>
                    <option value="Security">Security</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              {/* Conditional Incident Fields */}
              {customerFormData.tt_type === "Xử lý lỗi" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                      Thời gian bắt đầu sự cố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="incident_start_time"
                      value={customerFormData.incident_start_time}
                      onChange={handleCustomerInputChange}
                      required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                      Dịch vụ bị ảnh hưởng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="affected_service"
                      value={customerFormData.affected_service}
                      onChange={handleCustomerInputChange}
                      placeholder="ERP, Website, Email..."
                      required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                    />
                  </div>
                </div>
              )}

              {/* Contract Selector */}
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Chọn hợp đồng liên quan
                </label>
                <select
                  name="contract_no"
                  value={customerFormData.contract_no}
                  onChange={handleCustomerInputChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="">-- Không liên kết hợp đồng --</option>
                  {customerContracts.map((c) => (
                    <option key={c.id} value={c.contract_no || c.code}>
                      {c.name} ({c.contract_no || c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Mô tả chi tiết
                </label>
                <textarea
                  name="description"
                  value={customerFormData.description}
                  onChange={handleCustomerInputChange}
                  placeholder="Mô tả cụ thể nội dung sự cố, thông tin máy chủ, mã lỗi, hoặc các hướng dẫn chi tiết..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition resize-none leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold text-sm transition cursor-pointer"
                >
                  Tạo Yêu Cầu Hộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

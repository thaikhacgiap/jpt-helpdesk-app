"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
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
  const [activeTab, setActiveTab] = useState<"customer" | "service" | "task">("customer");
  
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
  const [editingCustomerTicket, setEditingCustomerTicket] = useState<ServiceTicket | null>(null);
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

  const handleCustomerEditOpen = (ticket: ServiceTicket) => {
    setEditingCustomerTicket(ticket);
    
    // Extract contract no from remark
    let contractNo = "";
    if (ticket.remark && ticket.remark.startsWith("Hợp đồng: ")) {
      contractNo = ticket.remark.replace(/^Hợp đồng:\s*/i, "").split(" | ")[0];
    }
    
    // Split description and incident information if present
    let desc = ticket.description || "";
    const incidentInfoIndex = desc.indexOf("\n\n[Thông tin sự cố]");
    if (incidentInfoIndex !== -1) {
      desc = desc.substring(0, incidentInfoIndex);
    }

    setCustomerFormData({
      customerId: ticket.customer_id || "",
      title: ticket.title || "",
      description: desc,
      tt_type: ticket.tt_type || "",
      category: ticket.category || "",
      priority: ticket.priority || "Medium",
      contract_no: contractNo,
      incident_start_time: ticket.start_time 
        ? new Date(ticket.start_time).toISOString().substring(0, 16) 
        : new Date().toISOString().substring(0, 16),
      affected_service: ticket.hold_reason || ""
    });
    setError("");
    setIsCustomerModalOpen(true);
  };

  const handleCustomerCreateOpen = () => {
    setEditingCustomerTicket(null);
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

      const remarkParts: string[] = [];
      if (customerFormData.contract_no) remarkParts.push(`Hợp đồng: ${customerFormData.contract_no}`);

      const updateData = {
        title: customerFormData.title.trim(),
        description: finalDescription,
        tt_type: customerFormData.tt_type,
        category: customerFormData.category,
        priority: customerFormData.priority,
        remark: remarkParts.length > 0 ? remarkParts.join(" | ") : null,
        hold_reason: customerFormData.affected_service || null,
        start_time: customerFormData.tt_type === "Xử lý lỗi"
          ? new Date(customerFormData.incident_start_time).toISOString()
          : new Date().toISOString()
      };

      if (editingCustomerTicket) {
        await updateServiceTicket(editingCustomerTicket.id, {
          ...updateData,
          customer_id: customerFormData.customerId
        });
      } else {
        await createServiceRequest(customerFormData.customerId, {
          title: customerFormData.title.trim(),
          description: finalDescription,
          tt_type: customerFormData.tt_type,
          category: customerFormData.category,
          priority: customerFormData.priority,
          contract_no: customerFormData.contract_no,
          affected_service: customerFormData.affected_service,
          start_time: updateData.start_time
        });
      }
      setIsCustomerModalOpen(false);
      setEditingCustomerTicket(null);
      loadCustomerTicketsList();
    } catch (err) {
      setError("Không thể lưu yêu cầu: " + String(err));
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
    // Migrate old YC- codes to SR-/TR- in local storage
    const stored = localStorage.getItem('jpt_requests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as RequestTask[];
        let changed = false;
        const migrated = parsed.map(r => {
          if (r.code && r.code.startsWith("YC-")) {
            changed = true;
            const prefix = r.type === "Yêu cầu công việc" ? "TR" : "SR";
            const datePart = r.startTime ? r.startTime.replace(/-/g, "") : "20260720";
            const seqPart = r.code.split('-').pop() || "001";
            return {
              ...r,
              code: `${prefix}-${datePart}-${seqPart}`
            };
          }
          return r;
        });
        if (changed) {
          localStorage.setItem('jpt_requests', JSON.stringify(migrated));
          setRequests(migrated);
        } else {
          setRequests(parsed);
        }
      } catch(e) {
        console.error(e);
        setRequests(fetchRequests());
      }
    } else {
      setRequests(fetchRequests());
    }

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
          
          // Only react if the ticket starts with TH- or CR- (customer portal requests)
          if (!ticketId.startsWith("TH-") && !ticketId.startsWith("CR-")) return;

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

  const handleCreateOpen = (defaultType?: RequestTask["type"]) => {
    setEditingRequest(null);
    setFormData({
      code: "",
      title: "",
      type: defaultType || "Yêu cầu công việc",
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
    // Only show customer requests from portal (which start with 'TH-' or 'CR-')
    if (!t.ticket_id.startsWith("TH-") && !t.ticket_id.startsWith("CR-")) return false;

    const query = searchQuery.toLowerCase();
    const formattedId = t.ticket_id.replace(/^TH-/, "CR-").toLowerCase();
    const matchesSearch = 
      t.ticket_id.toLowerCase().includes(query) ||
      formattedId.includes(query) ||
      t.title.toLowerCase().includes(query) ||
      (t.description || "").toLowerCase().includes(query);

    const matchesStatus = statusFilter === "All" || t.tt_status === statusFilter;
    const matchesType = typeFilter === "All" || t.tt_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCustomerTickets = filteredCustomerTickets.filter(t => t.tt_status === "New");
  const processedCustomerTickets = filteredCustomerTickets.filter(t => t.tt_status !== "New");

  // 2. FILTER & SPLIT FOR SERVICE REQUESTS (Tab 2)
  const serviceRequests = requests.filter(req => req.type !== "Yêu cầu công việc");
  const filteredServiceRequests = serviceRequests.filter(req => {
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

  const pendingServiceRequests = filteredServiceRequests.filter(r => r.status === "New");
  const processedServiceRequests = filteredServiceRequests.filter(r => r.status !== "New");

  // 3. FILTER & SPLIT FOR TASK REQUESTS (Tab 3)
  const taskRequests = requests.filter(req => req.type === "Yêu cầu công việc");
  const filteredTaskRequests = taskRequests.filter(req => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      req.title.toLowerCase().includes(term) || 
      req.code.toLowerCase().includes(term) ||
      (req.description || "").toLowerCase().includes(term) ||
      (req.requester || "").toLowerCase().includes(term) ||
      (req.assignee || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "All" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingTaskRequests = filteredTaskRequests.filter(r => r.status === "New");
  const processedTaskRequests = filteredTaskRequests.filter(r => r.status !== "New");

  // 3. RENDER CUSTOMER TICKETS TABLE (Tab 1)
  const renderCustomerTicketsTable = (title: string, list: ServiceTicket[], emptyMsg: string, isPending: boolean) => {
    return (
      <div className={`bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden flex flex-col min-h-0 ${isPending ? 'h-[250px] shrink-0' : 'flex-1'}`}>
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-normal text-slate-700 tracking-wide uppercase flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{title}</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-sm font-normal ${isPending ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {list.length}
            </span>
          </h3>
        </div>

        <div className="table-scroll flex-1 min-h-0 overflow-auto">
          <table className="w-full text-sm" style={{minWidth:'1200px'}}>
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr className="text-sm text-slate-500 font-normal text-left bg-slate-50">
                <th className="px-4 py-1.5 w-44 whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Mã yêu cầu</th>
                <th className="px-4 py-1.5 w-28 whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Trạng thái</th>
                <th className="px-4 py-1.5 min-w-[300px] whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Tiêu đề</th>
                <th className="px-4 py-1.5 min-w-[180px] whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Mô tả</th>
                <th className="px-4 py-1.5 w-36 whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Loại yêu cầu</th>
                <th className="px-4 py-1.5 w-28 whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Danh mục</th>
                <th className="px-4 py-1.5 w-36 whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Thời gian sự cố</th>
                <th className="px-4 py-1.5 min-w-[140px] whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Dịch vụ ảnh hưởng</th>
                <th className="px-4 py-1.5 min-w-[130px] whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Hợp đồng</th>
                <th className="px-4 py-1.5 whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Khách hàng</th>
                <th className="px-4 py-1.5 w-28 whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Ticket liên kết</th>
                <th className="px-4 py-1.5 text-center w-24 whitespace-nowrap sticky top-0 bg-slate-50 z-10 font-normal">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center text-slate-400 text-sm font-normal">
                    <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-normal">{emptyMsg}</p>
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
                    <tr key={t.id} className="hover:bg-blue-50/20 transition text-sm font-normal">
                      {/* Mã yêu cầu */}
                      <td className="px-4 py-1 text-blue-600 font-mono text-sm whitespace-nowrap font-normal">
                        <span
                          onClick={() => handleCustomerEditOpen(t)}
                          className="cursor-pointer hover:underline text-blue-600 font-normal"
                        >
                          {t.ticket_id.replace(/^TH-/, "CR-")}
                        </span>
                      </td>

                      {/* Trạng thái - dropdown đổi ngược lên đầu */}
                      <td className="px-4 py-1">
                        <div className="relative">
                          <select
                            value={t.tt_status}
                            onChange={(e) => handleCustomerStatusChange(t.id, e.target.value)}
                            className={`text-sm font-normal px-2 py-0.5 border rounded-full outline-none bg-white cursor-pointer appearance-none pr-6 ${getStatusBadge(t.tt_status)}`}
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
                      <td className="px-4 py-1">
                        <p className="text-slate-800 text-sm font-normal truncate max-w-[300px]" title={t.title}>{t.title}</p>
                      </td>

                      {/* Mô tả */}
                      <td className="px-4 py-1">
                        <p className="text-slate-500 text-sm font-normal truncate max-w-[180px]" title={t.description}>
                          {t.description || "—"}
                        </p>
                      </td>

                      {/* Loại yêu cầu */}
                      <td className="px-4 py-1">
                        <span className={`px-2 py-0.5 rounded-full text-sm font-normal border whitespace-nowrap ${
                          t.tt_type === "Xử lý lỗi" ? "bg-red-50 text-red-700 border-red-200" :
                          t.tt_type === "Thay đổi cấu hình" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          t.tt_type === "Cài đặt - Nâng cấp" ? "bg-violet-50 text-violet-700 border-violet-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>{t.tt_type || "—"}</span>
                      </td>

                      {/* Danh mục */}
                      <td className="px-4 py-1 text-slate-600 text-sm font-normal whitespace-nowrap">
                        {t.category || "—"}
                      </td>

                      {/* Thời gian sự cố */}
                      <td className="px-4 py-1 font-mono text-slate-500 text-sm font-normal whitespace-nowrap">
                        {t.tt_type === "Xử lý lỗi" && t.start_time
                          ? formatDate(t.start_time)
                          : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Dịch vụ ảnh hưởng */}
                      <td className="px-4 py-1">
                        <p className="text-slate-500 text-sm font-normal truncate max-w-[140px]" title={t.hold_reason}>
                          {t.hold_reason || <span className="text-slate-300">—</span>}
                        </p>
                      </td>

                      {/* Hợp đồng */}
                      <td className="px-4 py-1">
                        {contractName
                          ? <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-sm font-normal whitespace-nowrap">{contractName}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-1 text-slate-700 text-sm font-normal whitespace-nowrap">
                        {customerName}
                      </td>

                      {/* Ticket liên kết */}
                      <td className="px-4 py-1 whitespace-nowrap font-mono text-sm font-normal">
                        {hasLinkedTicket ? (
                          <span
                            onClick={() => { window.location.href = `/tickets?search=${t.document_link}`; }}
                            className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200/50 rounded-full text-sm font-normal cursor-pointer hover:bg-green-100 transition"
                            title="Bấm để xem chi tiết ticket"
                          >
                            {t.document_link}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-1 text-center whitespace-nowrap">
                        {!hasLinkedTicket ? (
                          <button
                            onClick={() => {
                              window.location.href = `/tickets/create?customerId=${t.customer_id}&title=${encodeURIComponent(t.title)}&description=${encodeURIComponent(t.description)}&priority=${t.priority}&category=${t.category}&requestTicketId=${t.ticket_id}&requestDbId=${t.id}`;
                            }}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-normal transition shadow-xs cursor-pointer whitespace-nowrap"
                          >
                            <Plus size={10} />
                            <span>Tạo Ticket</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-sm italic">Đã liên kết</span>
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
      <div className={`bg-white rounded-xl border border-slate-200/60 shadow-xs overflow-hidden flex flex-col min-h-0 ${isPending ? 'h-[250px] shrink-0' : 'flex-1'}`}>
        <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-normal text-slate-700 tracking-wide uppercase flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{title}</span>
            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-sm font-normal ${isPending ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {list.length}
            </span>
          </h3>
        </div>

        <div className="table-scroll flex-1 min-h-0 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr className="text-sm text-slate-500 font-normal text-left bg-slate-50">
                <th className="px-6 py-1.5 w-44 sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Mã công việc</th>
                <th className="px-4 py-1.5 min-w-[350px] sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Tên công việc / Yêu cầu</th>
                <th className="px-4 py-1.5 sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Loại công việc</th>
                <th className="px-4 py-1.5 sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Người yêu cầu</th>
                <th className="px-4 py-1.5 sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Người được giao</th>
                <th className="px-4 py-1.5 sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Người theo dõi</th>
                <th className="px-4 py-1.5 sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Thời gian bắt đầu</th>
                <th className="px-4 py-1.5 w-40 sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Tình trạng</th>
                <th className="px-4 py-1.5 text-center w-24 sticky top-0 bg-slate-50 z-10 font-normal whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400 text-sm font-normal">
                    <Inbox size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-normal">{emptyMsg}</p>
                  </td>
                </tr>
              ) : (
                list.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition text-sm font-normal">
                    <td className="px-6 py-1 text-blue-600 font-mono text-sm font-normal">
                      <span
                        onClick={() => handleEditOpen(req)}
                        className="cursor-pointer hover:underline text-blue-600 font-normal"
                      >
                        {req.code}
                      </span>
                    </td>
                    <td className="px-4 py-1 text-left">
                      <p className="text-slate-800 text-sm font-normal truncate max-w-[450px]" title={req.description || req.title}>
                        {req.title}
                      </p>
                    </td>
                    <td className="px-4 py-1 text-left">
                      <span className={`px-2.5 py-0.5 rounded text-sm font-normal border ${getTypeColor(req.type)}`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-4 py-1 text-slate-655 text-sm font-normal text-left">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-xs font-normal flex items-center justify-center text-slate-500">
                          {req.requester ? req.requester.charAt(0) : "U"}
                        </div>
                        <span>{req.requester || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-1 text-slate-655 text-sm font-normal text-left">
                      <div className="flex items-center gap-1">
                        {req.assignee ? (
                          <>
                            <div className="w-5 h-5 rounded-full bg-blue-50 text-xs font-normal flex items-center justify-center text-blue-600">
                              {req.assignee.charAt(0)}
                            </div>
                            <span>{req.assignee}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 text-sm italic">Chưa giao</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-1 text-slate-500 text-sm font-normal text-left">
                      {req.follower || "—"}
                    </td>
                    <td className="px-4 py-1 text-slate-500 font-mono text-sm font-normal text-left">
                      {formatDate(req.startTime)}
                    </td>
                    <td className="px-4 py-1 text-left">
                      <div className="relative">
                        <select
                          value={req.status}
                          onChange={(e) => handleQuickStatusChange(req.id, e.target.value as RequestTask["status"])}
                          className={`text-sm font-normal px-2.5 py-0.5 border rounded-full outline-none bg-white cursor-pointer appearance-none pr-6 ${getStatusBadge(req.status)}`}
                        >
                          <option value="New">Mới tạo</option>
                          <option value="In Progress">Đang xử lý</option>
                          <option value="Completed">Hoàn thành</option>
                          <option value="Rejected">Từ chối</option>
                        </select>
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[7px] text-slate-500 pointer-events-none">▼</span>
                      </div>
                    </td>
                    <td className="px-4 py-1 text-center">
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
      <div className="flex flex-col h-[calc(100vh-28px)] overflow-hidden gap-3">
        {/* Header Block Banner */}
        <div className="flex items-center justify-between gap-3 mb-0 bg-gradient-to-r from-teal-800/90 via-teal-900/95 to-slate-900/95 backdrop-blur-md border border-teal-700/30 text-white py-3.5 px-5 rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.15)] shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(20,184,166,0.15),transparent_60%)] pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shrink-0">
              <Inbox size={18} className="text-white" />
            </div>
            <div className="space-y-0 text-left">
              <h1 className="text-[18px] font-normal tracking-tight leading-tight text-white">Quản lý Yêu cầu &amp; Công việc</h1>
              <p className="text-sm text-teal-200/70 font-normal leading-normal">Trang chủ &nbsp;/&nbsp; Yêu cầu</p>
            </div>
          </div>

          {/* Tabs Selector Bar inside Header */}
          <div className="flex bg-slate-900/45 p-1 rounded-lg border border-slate-800/10 shadow-inner gap-1 relative z-10">
            <button
              onClick={() => {
                setActiveTab("customer");
                setTypeFilter("All");
                setStatusFilter("All");
                setSearchQuery("");
              }}
              className={`px-3 py-1.5 rounded-md text-sm transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                activeTab === "customer" 
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold border-amber-300/40 shadow-[0_2px_10px_rgba(245,158,11,0.3)]" 
                  : "bg-white/5 text-slate-200 border-white/5 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Inbox size={12} className={activeTab === "customer" ? "text-slate-950" : ""} />
              <span>Customer request</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-normal ${activeTab === "customer" ? "bg-orange-600/20 text-orange-950" : "bg-slate-800 text-slate-300"}`}>
                {customerTickets.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("service");
                setTypeFilter("All");
                setStatusFilter("All");
                setSearchQuery("");
              }}
              className={`px-3 py-1.5 rounded-md text-sm transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                activeTab === "service" 
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold border-amber-300/40 shadow-[0_2px_10px_rgba(245,158,11,0.3)]" 
                  : "bg-white/5 text-slate-200 border-white/5 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Users size={12} className={activeTab === "service" ? "text-slate-950" : ""} />
              <span>Service request</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-normal ${activeTab === "service" ? "bg-orange-600/20 text-orange-950" : "bg-slate-800 text-slate-300"}`}>
                {serviceRequests.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("task");
                setTypeFilter("All");
                setStatusFilter("All");
                setSearchQuery("");
              }}
              className={`px-3 py-1.5 rounded-md text-sm transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                activeTab === "task" 
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold border-amber-300/40 shadow-[0_2px_10px_rgba(245,158,11,0.3)]" 
                  : "bg-white/5 text-slate-200 border-white/5 hover:bg-white/10 hover:text-white"
              }`}
            >
              <CheckSquare size={12} className={activeTab === "task" ? "text-slate-950" : ""} />
              <span>Task request</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-normal ${activeTab === "task" ? "bg-orange-600/20 text-orange-950" : "bg-slate-800 text-slate-300"}`}>
                {taskRequests.length}
              </span>
            </button>
          </div>
        </div>

        {/* Toolbar Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs mb-0 shrink-0">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            {/* Search bar */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mã, tiêu đề, mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm font-normal focus:outline-none focus:ring-1 focus:ring-teal-500 transition bg-white text-slate-800"
              />
            </div>

            {/* Conditional Type Filter options */}
            {activeTab !== "task" && (
              <div className="flex items-center gap-2">
                <Filter size={13} className="text-slate-400" />
                {activeTab === "customer" ? (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-normal bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition cursor-pointer"
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
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-normal bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition cursor-pointer"
                  >
                    <option value="All">Tất cả loại dịch vụ</option>
                    <option value="Yêu cầu triển khai">Yêu cầu triển khai</option>
                    <option value="Yêu cầu hỗ trợ kỹ thuật">Yêu cầu hỗ trợ kỹ thuật</option>
                    <option value="Yêu cầu tư vấn">Yêu cầu tư vấn</option>
                    <option value="Yêu cầu">Yêu cầu</option>
                  </select>
                )}
              </div>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-normal bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition cursor-pointer"
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

          {/* Create Button in Filter Bar */}
          <div>
            {activeTab === "customer" ? (
              <button
                onClick={handleCustomerCreateOpen}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 border border-teal-400/40 text-white text-sm font-semibold flex items-center gap-1.5 transition shadow-[0_2px_8px_rgba(20,184,166,0.2)] cursor-pointer whitespace-nowrap animate-fade-in"
              >
                <Plus size={14} />
                <span>Create Request</span>
              </button>
            ) : activeTab === "service" ? (
              <button
                onClick={() => handleCreateOpen("Yêu cầu triển khai")}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 border border-teal-400/40 text-white text-sm font-semibold flex items-center gap-1.5 transition shadow-[0_2px_8px_rgba(20,184,166,0.2)] cursor-pointer whitespace-nowrap animate-fade-in"
              >
                <Plus size={14} />
                <span>Create Request</span>
              </button>
            ) : (
              <button
                onClick={() => handleCreateOpen("Yêu cầu công việc")}
                className="h-9 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 border border-teal-400/40 text-white text-sm font-semibold flex items-center gap-1.5 transition shadow-[0_2px_8px_rgba(20,184,166,0.2)] cursor-pointer whitespace-nowrap animate-fade-in"
              >
                <Plus size={14} />
                <span>Create Request</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs View Body */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden mb-1">
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
          ) : activeTab === "service" ? (
            <>
              {renderInternalTasksTable(
                "Yêu cầu thực hiện dịch vụ chờ tiếp nhận", 
                pendingServiceRequests, 
                "Hiện tại không có yêu cầu dịch vụ nào đang chờ tiếp nhận.", 
                true
              )}
              {renderInternalTasksTable(
                "Yêu cầu thực hiện dịch vụ đang xử lý và hoàn thành", 
                processedServiceRequests, 
                "Hiện tại không có yêu cầu dịch vụ nào đang được xử lý hoặc đã hoàn thành.", 
                false
              )}
            </>
          ) : (
            <>
              {renderInternalTasksTable(
                "Yêu cầu công việc cá nhân chờ tiếp nhận", 
                pendingTaskRequests, 
                "Hiện tại không có yêu cầu công việc cá nhân nào đang chờ tiếp nhận.", 
                true
              )}
              {renderInternalTasksTable(
                "Yêu cầu công việc cá nhân đang xử lý và hoàn thành", 
                processedTaskRequests, 
                "Hiện tại không có yêu cầu công việc cá nhân nào đang được xử lý hoặc đã hoàn thành.", 
                false
              )}
            </>
          )}
        </div>
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
                    {editingRequest 
                      ? (editingRequest.type === "Yêu cầu công việc" ? "Chỉnh Sửa Yêu Cầu Công Việc" : "Chỉnh Sửa Yêu Cầu Dịch Vụ") 
                      : (activeTab === "task" ? "Tạo Yêu Cầu Công Việc Mới" : "Tạo Yêu Cầu Dịch Vụ Nội Bộ Mới")}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingRequest 
                      ? `Cập nhật thông tin: ${editingRequest.code}` 
                      : (activeTab === "task" ? "Lập phiếu phân công công việc cá nhân mới." : "Lập phiếu ghi nhận yêu cầu dịch vụ nội bộ mới.")}
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
                    {activeTab === "task" ? (
                      <option value="Yêu cầu công việc">Yêu cầu công việc (Work Request)</option>
                    ) : (
                      <>
                        <option value="Yêu cầu triển khai">Yêu cầu triển khai (Deployment)</option>
                        <option value="Yêu cầu hỗ trợ kỹ thuật">Yêu cầu hỗ trợ kỹ thuật (Technical Support)</option>
                        <option value="Yêu cầu tư vấn">Yêu cầu tư vấn (Consultancy)</option>
                        <option value="Yêu cầu">Yêu cầu (General Request)</option>
                      </>
                    )}
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
                    {editingCustomerTicket ? "Chi Tiết & Chỉnh Sửa Yêu Cầu Khách Hàng" : "Tạo Yêu Cầu Hộ Khách Hàng"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingCustomerTicket ? `Đang xem và chỉnh sửa mã yêu cầu ${editingCustomerTicket.ticket_id.replace(/^TH-/, "CR-")}` : "Ghi nhận sự cố hoặc yêu cầu dịch vụ thay mặt cho khách hàng."}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setEditingCustomerTicket(null);
                }} 
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
                  disabled={!!editingCustomerTicket}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                  onClick={() => {
                    setIsCustomerModalOpen(false);
                    setEditingCustomerTicket(null);
                  }}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-sm transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold text-sm transition cursor-pointer"
                >
                  {editingCustomerTicket ? "Cập Nhật Yêu Cầu" : "Tạo Yêu Cầu Hộ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

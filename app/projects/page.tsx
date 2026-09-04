"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { 
  fetchProjects, 
  createProject, 
  deleteProject, 
  Project,
  ProjectType
} from "@/lib/project-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";
import { fetchCustomers, Customer } from "@/lib/customer-operations";
import { fetchContractsByCustomer, Contract } from "@/lib/contract-operations";
import { fetchOpportunitiesByCustomer, Opportunity } from "@/lib/opportunity-operations";
import { 
  Search, 
  Plus, 
  Trash2, 
  User, 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckSquare,
  CheckCircle2, 
  FileText, 
  Flag, 
  MessageSquare, 
  ArrowRight, 
  X, 
  Briefcase,
  AlertTriangle,
  FolderOpen,
  TrendingUp,
  Clock,
  LayoutGrid,
  List,
  Sparkles,
  ShoppingCart,
  Home,
  Target
} from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<NhanSu[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerContracts, setCustomerContracts] = useState<Contract[]>([]);
  const [customerOpportunities, setCustomerOpportunities] = useState<Opportunity[]>([]);
  
  // Tab State: 4 tabs
  const [activeTab, setActiveTab] = useState<ProjectType>("professional");

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    customerId: "",
    customer: "",
    contractId: "",
    contractNo: "",
    opportunityId: "",
    opportunityCode: "",
    opportunityName: "",
    projectType: "professional" as ProjectType,
    manager: "",
    startDate: "",
    endDate: "",
    budget: 0,
    status: "Planning" as Project["status"],
    description: ""
  });

  // Load Initial Data
  useEffect(() => {
    setProjects(fetchProjects());
    fetchNhanSu().then(setStaffList).catch(err => console.error("Error loading staff:", err));
    fetchCustomers().then(setCustomers).catch(err => console.error("Error loading customers:", err));
  }, []);

  const refreshProjects = () => {
    setProjects(fetchProjects());
  };

  const handleOpenCreateModal = () => {
    setFormData({
      code: "",
      name: "",
      customerId: "",
      customer: "",
      contractId: "",
      contractNo: "",
      opportunityId: "",
      opportunityCode: "",
      opportunityName: "",
      projectType: activeTab,
      manager: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      budget: 0,
      status: "Planning",
      description: ""
    });
    setCustomerContracts([]);
    setCustomerOpportunities([]);
    setError("");
    setIsModalOpen(true);
  };

  const handleCustomerChange = async (customerId: string) => {
    const selectedCust = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customerId,
      customer: selectedCust?.name || "",
      contractId: "",
      contractNo: "",
      opportunityId: "",
      opportunityCode: "",
      opportunityName: ""
    }));

    if (customerId) {
      try {
        const [contracts, opportunities] = await Promise.all([
          fetchContractsByCustomer(customerId),
          fetchOpportunitiesByCustomer(customerId)
        ]);
        setCustomerContracts(contracts);
        setCustomerOpportunities(opportunities);
      } catch (err) {
        console.error("Error fetching customer related data:", err);
        setCustomerContracts([]);
        setCustomerOpportunities([]);
      }
    } else {
      setCustomerContracts([]);
      setCustomerOpportunities([]);
    }
  };

  const handleOpportunityChange = (oppId: string) => {
    const selectedOpp = customerOpportunities.find(o => o.id === oppId);
    setFormData(prev => {
      const nextCode = selectedOpp?.code ? selectedOpp.code : prev.code;
      return {
        ...prev,
        opportunityId: oppId,
        opportunityCode: selectedOpp?.code || "",
        opportunityName: selectedOpp?.name || "",
        // Lấy từ "code" trong bảng opportunity nếu chọn "cơ hội"
        code: nextCode || prev.code
      };
    });
  };

  const handleContractChange = (contractId: string) => {
    const selectedContr = customerContracts.find(c => c.id === contractId);
    setFormData(prev => {
      // Lấy từ "PROJECT ID" trong bảng contract nếu chọn hợp đồng
      const nextCode = selectedContr?.project_id || selectedContr?.code || selectedContr?.contract_no;
      return {
        ...prev,
        contractId,
        contractNo: selectedContr?.contract_no || selectedContr?.code || "",
        code: nextCode || prev.code
      };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "budget" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên dự án.");
      return;
    }
    if (!formData.startDate) {
      setError("Vui lòng chọn ngày bắt đầu.");
      return;
    }
    if (!formData.endDate) {
      setError("Vui lòng chọn ngày kết thúc.");
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      return;
    }

    try {
      createProject(formData);
      setIsModalOpen(false);
      refreshProjects();
    } catch (err) {
      setError("Không thể tạo dự án: " + String(err));
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Stop click propagating to Card Link
    e.stopPropagation();
    
    if (window.confirm("Bạn có chắc chắn muốn xóa dự án này? Toàn bộ kế hoạch, tài liệu và nhật ký sẽ bị xóa vĩnh viễn.")) {
      deleteProject(id);
      refreshProjects();
    }
  };

  // Filter projects by activeTab and search/status filters
  const filteredProjects = projects.filter(project => {
    const projType = project.projectType || 'professional';
    if (projType !== activeTab) return false;

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      project.name.toLowerCase().includes(query) || 
      project.code.toLowerCase().includes(query) ||
      (project.customer || "").toLowerCase().includes(query) ||
      (project.contractNo || "").toLowerCase().includes(query) ||
      (project.opportunityCode || "").toLowerCase().includes(query);
      
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate counts for 4 tabs
  const tabCounts = {
    professional: projects.filter(p => !p.projectType || p.projectType === "professional").length,
    poc: projects.filter(p => p.projectType === "poc").length,
    commercial: projects.filter(p => p.projectType === "commercial").length,
    internal: projects.filter(p => p.projectType === "internal").length,
  };

  // Define tabs header
  const PROJECT_TABS = [
    { id: "professional", label: `DA chuyên nghiệp (${tabCounts.professional})`, icon: Briefcase },
    { id: "poc", label: `DA POC (${tabCounts.poc})`, icon: Sparkles },
    { id: "commercial", label: `DA TM đơn thuần (${tabCounts.commercial})`, icon: ShoppingCart },
    { id: "internal", label: `DA nội bộ (${tabCounts.internal})`, icon: Home },
  ];

  // Calculate statistics for currently active tab
  const stats = {
    total: filteredProjects.length,
    active: filteredProjects.filter(p => p.status === "Active").length,
    planning: filteredProjects.filter(p => p.status === "Planning").length,
    completed: filteredProjects.filter(p => p.status === "Completed").length,
    delayed: filteredProjects.filter(p => p.status === "Delayed").length,
    totalBudget: filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0)
  };

  const getStatusBadgeClass = (status: Project["status"]) => {
    switch (status) {
      case "Planning":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Active":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Delayed":
        return "bg-red-50 text-red-700 border-red-200/60";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: Project["status"]) => {
    switch (status) {
      case "Planning": return "Lập kế hoạch";
      case "Active": return "Đang chạy";
      case "On Hold": return "Tạm dừng";
      case "Completed": return "Hoàn thành";
      case "Delayed": return "Trễ hạn";
      default: return status;
    }
  };

  const getProjectTypeLabel = (type?: ProjectType) => {
    switch (type) {
      case "poc": return "DA POC";
      case "commercial": return "DA TM đơn thuần";
      case "internal": return "DA nội bộ";
      case "professional":
      default:
        return "DA chuyên nghiệp";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <MainLayout>
      {/* Header with 4 Tabs in the top-right corner */}
      <Header
        title="Quản Lý Dự Án Triển Khai"
        description="Theo dõi tiến độ, phân bổ nhân sự, mốc công việc và hồ sơ dự án"
        tabs={PROJECT_TABS}
        activeTab={activeTab}
        setActiveTab={(id: any) => setActiveTab(id as ProjectType)}
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng dự án</span>
            <FolderOpen size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{stats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Đang chạy</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{stats.active}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kế hoạch</span>
            <Clock size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-2">{stats.planning}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Hoàn thành</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{stats.completed}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Trễ hạn</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{stats.delayed}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Tổng ngân sách</span>
            <DollarSign size={16} className="text-indigo-500" />
          </div>
          <div className="text-sm font-bold text-indigo-600 mt-3 truncate font-mono" title={`${stats.totalBudget.toLocaleString('vi-VN')} đ`}>
            {stats.totalBudget >= 1000000000 
              ? `${(stats.totalBudget / 1000000000).toFixed(1)} tỷ đ`
              : stats.totalBudget >= 1000000 
              ? `${(stats.totalBudget / 1000000).toFixed(0)} tr đ`
              : `${stats.totalBudget.toLocaleString('vi-VN')} đ`}
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={`Tìm ${getProjectTypeLabel(activeTab)} theo tên, mã, khách hàng, HĐ, cơ hội...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium text-slate-700"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Active">Đang chạy (Active)</option>
              <option value="Planning">Lập kế hoạch (Planning)</option>
              <option value="On Hold">Tạm hoãn (On Hold)</option>
              <option value="Completed">Hoàn thành (Completed)</option>
              <option value="Delayed">Trễ hạn (Delayed)</option>
            </select>
          </div>
        </div>

        {/* View Switcher and Add Button */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Thẻ</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              <List size={14} />
              <span>Bảng</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-sm hover:shadow-md cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Thêm Dự Án Mới</span>
          </button>
        </div>
      </div>

      {/* Projects Grid / Table */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy dự án nào trong mục "{getProjectTypeLabel(activeTab)}"</h3>
          <p className="text-sm text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc nhấn nút "Thêm Dự Án Mới" để khởi tạo.</p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Khởi tạo {getProjectTypeLabel(activeTab)} đầu tiên</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link 
              key={project.id} 
              href={`/projects/${project.id}`}
              className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-blue-300 transition duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                {/* Badge and Code */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {project.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                      {getProjectTypeLabel(project.projectType)}
                    </span>
                  </div>
                  
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition line-clamp-1 mb-2">
                  {project.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                  {project.description || "Dự án triển khai dịch vụ hệ thống công nghệ thông tin."}
                </p>

                {/* Meta details */}
                <div className="space-y-2.5 border-t border-slate-100 pt-4 mb-4">
                  {/* Customer */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">{project.customer || "Chưa chọn khách hàng"}</span>
                  </div>
                  {/* Contract */}
                  {project.contractNo && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText size={14} className="text-indigo-500 shrink-0" />
                      <span className="text-slate-600">Hợp đồng: <span className="font-medium text-indigo-700">{project.contractNo}</span></span>
                    </div>
                  )}
                  {/* Opportunity */}
                  {project.opportunityCode && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Target size={14} className="text-amber-500 shrink-0" />
                      <span className="text-slate-600">Cơ hội: <span className="font-medium text-amber-700">{project.opportunityCode}</span></span>
                    </div>
                  )}
                  {/* Manager */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <User size={14} className="text-slate-400 shrink-0" />
                    <span>PM: <span className="font-medium text-slate-700">{project.manager || "Chưa phân công"}</span></span>
                  </div>
                  {/* Date range */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-slate-500">Tiến độ</span>
                    <span className="text-blue-600">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Statistics */}
              <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1" title="Tác vụ">
                    <CheckSquare size={13} className="text-slate-400" />
                    <span>{project.plan?.length || 0}</span>
                  </span>
                  <span className="flex items-center gap-1" title="Cột mốc">
                    <Flag size={13} className="text-slate-400" />
                    <span>{project.timeline?.length || 0}</span>
                  </span>
                  <span className="flex items-center gap-1" title="Tài liệu">
                    <FileText size={13} className="text-slate-400" />
                    <span>{project.documents?.length || 0}</span>
                  </span>
                  <span className="flex items-center gap-1" title="Nhật ký">
                    <MessageSquare size={13} className="text-slate-400" />
                    <span>{project.diary?.length || 0}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(project.id, e)}
                    className="p-1 hover:text-red-500 hover:bg-red-50 rounded transition duration-150 cursor-pointer"
                    title="Xóa dự án"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-blue-500" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="text-xs text-slate-500 font-semibold bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4">Mã DA</th>
                  <th className="px-6 py-4">Tên dự án</th>
                  <th className="px-6 py-4">Khách hàng, HĐ & Cơ hội</th>
                  <th className="px-6 py-4">Chủ nhiệm (PM)</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4 w-40">Tiến độ</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition duration-150 group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-600 text-xs">
                      {project.code}
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/projects/${project.id}`}
                        className="font-bold text-slate-800 hover:text-blue-600 transition"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{project.customer || "—"}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.contractNo && (
                          <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                            <FileText size={10} />
                            <span>HĐ: {project.contractNo}</span>
                          </span>
                        )}
                        {project.opportunityCode && (
                          <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                            <Target size={10} />
                            <span>Cơ hội: {project.opportunityCode}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-650 mt-0.5">
                      {project.manager || "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{project.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/projects/${project.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Chi tiết"
                        >
                          <ArrowRight size={16} />
                        </Link>
                        <button
                          onClick={(e) => handleDelete(project.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Xóa dự án"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Khởi Tạo Dự Án Mới</h3>
                  <p className="text-xs text-slate-500">Tạo dự án triển khai và liên kết thông tin khách hàng</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Row 1: Tên dự án (người tạo điền) & Loại dự án */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Tên dự án <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên dự án..."
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Loại dự án <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer font-medium text-slate-700"
                  >
                    <option value="professional">DA chuyên nghiệp</option>
                    <option value="poc">DA POC</option>
                    <option value="commercial">DA TM đơn thuần</option>
                    <option value="internal">DA nội bộ</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Khách hàng & Mã dự án */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Khách hàng
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.code}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Mã dự án <span className="text-slate-400 font-normal">(Tự điền từ Cơ hội / Hợp đồng)</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="VD: PROJ-2026-001 hoặc mã từ Cơ hội/HĐ"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition font-mono uppercase bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Row 3: Cơ hội & Hợp đồng (Lọc theo khách hàng đã chọn) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>Cơ hội (Opportunity)</span>
                    {customerOpportunities.length > 0 && (
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                        {customerOpportunities.length} cơ hội
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.opportunityId}
                    onChange={(e) => handleOpportunityChange(e.target.value)}
                    disabled={!formData.customerId || customerOpportunities.length === 0}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {!formData.customerId 
                        ? "-- Vui lòng chọn khách hàng trước --" 
                        : customerOpportunities.length === 0 
                        ? "-- Không có cơ hội liên quan --" 
                        : "-- Chọn cơ hội --"}
                    </option>
                    {customerOpportunities.map((o) => (
                      <option key={o.id} value={o.id}>
                        [{o.code}] {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>Hợp đồng (Contract)</span>
                    {customerContracts.length > 0 && (
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                        {customerContracts.length} hợp đồng
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.contractId}
                    onChange={(e) => handleContractChange(e.target.value)}
                    disabled={!formData.customerId || customerContracts.length === 0}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {!formData.customerId 
                        ? "-- Vui lòng chọn khách hàng trước --" 
                        : customerContracts.length === 0 
                        ? "-- Không có hợp đồng liên quan --" 
                        : "-- Chọn hợp đồng liên quan --"}
                    </option>
                    {customerContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_no || c.code} {c.project_id ? `(Project ID: ${c.project_id})` : ""} - {c.service || c.name || "Hợp đồng"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: PM & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Chủ nhiệm dự án (PM)
                  </label>
                  <select
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn quản trị viên --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.ten_nhan_su}>
                        {s.ten_nhan_su} ({s.bo_phan || "Nhân sự"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Ngân sách dự toán (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget || ""}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full px-3 py-2.5 pl-8 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition font-mono"
                    />
                    <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Row 5: Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                  />
                </div>
              </div>

              {/* Row 6: Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Trạng thái khởi tạo
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
                >
                  <option value="Planning">Lập kế hoạch (Planning)</option>
                  <option value="Active">Đang triển khai (Active)</option>
                  <option value="On Hold">Tạm hoãn (On Hold)</option>
                  <option value="Completed">Hoàn thành (Completed)</option>
                  <option value="Delayed">Trễ hạn (Delayed)</option>
                </select>
              </div>

              {/* Row 7: Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Mô tả dự án
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ghi tóm tắt mục tiêu, phạm vi triển khai của dự án..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm transition resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition text-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition text-sm cursor-pointer"
                >
                  Tạo Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { 
  fetchProjects, 
  createProject, 
  deleteProject, 
  Project 
} from "@/lib/project-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";
import { fetchCustomers, Customer } from "@/lib/customer-operations";
import { fetchContractsByCustomer, Contract } from "@/lib/contract-operations";
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
  List
} from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<NhanSu[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerContracts, setCustomerContracts] = useState<Contract[]>([]);
  
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

  const handleCustomerChange = async (customerId: string) => {
    const selectedCust = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customerId,
      customer: selectedCust?.name || "",
      contractId: "",
      contractNo: ""
    }));

    if (customerId) {
      try {
        const contracts = await fetchContractsByCustomer(customerId);
        setCustomerContracts(contracts);
      } catch (err) {
        console.error("Error fetching contracts for customer:", err);
        setCustomerContracts([]);
      }
    } else {
      setCustomerContracts([]);
    }
  };

  const handleContractChange = (contractId: string) => {
    const selectedContr = customerContracts.find(c => c.id === contractId);
    setFormData(prev => ({
      ...prev,
      contractId,
      contractNo: selectedContr?.contract_no || selectedContr?.code || ""
    }));
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
      // Reset form
      setFormData({
        code: "",
        name: "",
        customerId: "",
        customer: "",
        contractId: "",
        contractNo: "",
        manager: "",
        startDate: "",
        endDate: "",
        budget: 0,
        status: "Planning",
        description: ""
      });
      setCustomerContracts([]);
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

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customer.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === "Active").length,
    planning: projects.filter(p => p.status === "Planning").length,
    completed: projects.filter(p => p.status === "Completed").length,
    delayed: projects.filter(p => p.status === "Delayed").length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0)
  };

  const getStatusBadgeClass = (status: Project["status"]) => {
    switch (status) {
      case "Planning":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Active":
        return "bg-teal-50 text-teal-700 border-teal-200/50";
      case "On Hold":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "Delayed":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: Project["status"]) => {
    switch (status) {
      case "Planning": return "Lập kế hoạch";
      case "Active": return "Đang triển khai";
      case "On Hold": return "Tạm hoãn";
      case "Completed": return "Hoàn thành";
      case "Delayed": return "Trễ hạn";
      default: return status;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <MainLayout>
      <Header 
        title="Triển khai Dự án" 
        description="Quản lý vòng đời dự án, lập kế hoạch, theo dõi tiến độ Gantt, tài liệu và nhật ký thực địa." 
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        {/* Card 1: Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng dự án</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
            <p className="text-xs text-slate-400 mt-1">Dự án trong danh sách</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Briefcase size={22} />
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang triển khai</p>
            <h3 className="text-2xl font-bold text-teal-600 mt-1">{stats.active}</h3>
            <p className="text-xs text-slate-400 mt-1">Dự án đang chạy thực địa</p>
          </div>
          <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Card 3: Delayed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trễ tiến độ</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats.delayed}</h3>
            <p className="text-xs text-slate-400 mt-1">Dự án bị quá hạn dự kiến</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <Clock size={22} />
          </div>
        </div>

        {/* Card 4: Completed Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dự án Hoàn thành</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1.5">{stats.completed}</h3>
            <p className="text-xs text-slate-400 mt-1">Các dự án đã nghiệm thu</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-6">
        {/* Left: Search & Filter */}
        <div className="flex flex-1 flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm dự án, khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="All">Tất cả</option>
              <option value="Planning">Lập kế hoạch</option>
              <option value="Active">Đang triển khai</option>
              <option value="On Hold">Tạm hoãn</option>
              <option value="Completed">Hoàn thành</option>
              <option value="Delayed">Trễ hạn</option>
            </select>
          </div>
        </div>

        {/* Right: View Mode & Add Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 gap-0.5 shrink-0">
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-sm hover:shadow-md cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Thêm Dự Án</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy dự án</h3>
          <p className="text-sm text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc lọc trạng thái khác.</p>
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
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                    {project.code}
                  </span>
                  
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
                  {project.description}
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
                    <span className="text-blue-600">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${project.progress}%` }}
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
                  <th className="px-6 py-4">Mã</th>
                  <th className="px-6 py-4">Tên dự án</th>
                  <th className="px-6 py-4">Khách hàng & HĐ</th>
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
                    <td className="px-6 py-4 font-mono font-bold text-slate-500 text-xs">
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
                      {project.contractNo && (
                        <div className="text-xs text-indigo-600 font-normal mt-0.5 flex items-center gap-1">
                          <FileText size={11} />
                          <span>HĐ: {project.contractNo}</span>
                        </div>
                      )}
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
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{project.progress}%</span>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Khởi Tạo Dự Án Mới</h3>
                  <p className="text-xs text-slate-500">Tạo dự án triển khai và phân công chủ nhiệm</p>
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

              {/* Row 1: Code & Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Mã dự án <span className="text-slate-400 font-normal">(tự sinh)</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="VD: PROJ-HELP-01"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition font-mono uppercase"
                  />
                </div>

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
              </div>

              {/* Row 2: Customer & Contract (Matching) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Khách hàng / Đối tác
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
                    Hợp đồng dịch vụ
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
                        ? "-- Không có hợp đồng tương ứng --" 
                        : "-- Chọn hợp đồng liên quan --"}
                    </option>
                    {customerContracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_no || c.code} - {c.service || c.name || "Hợp đồng"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: PM & Budget */}
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

              {/* Row 4: Dates */}
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

              {/* Row 5: Status */}
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

              {/* Description */}
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

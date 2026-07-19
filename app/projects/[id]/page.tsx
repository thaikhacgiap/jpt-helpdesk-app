"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import {
  getProjectById,
  updateProject,
  addTask,
  updateTask,
  deleteTask,
  addMilestone,
  updateMilestone,
  addDocument,
  addDiaryEntry,
  Project,
  ProjectTask,
  ProjectMilestone,
  ProjectDocument,
  ProjectDiaryEntry
} from "@/lib/project-operations";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Clock,
  Download,
  FileText,
  Flag,
  ListTodo,
  MessageSquare,
  Plus,
  Trash2,
  Upload,
  User,
  X,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Tag,
  MessageCircle,
  BookOpen,
  CalendarDays,
  Building2,
  DollarSign
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [staffList, setStaffList] = useState<NhanSu[]>([]);
  const [activeTab, setActiveTab] = useState<"plan" | "gantt" | "timeline" | "document" | "diary">("plan");

  // Add Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    phase: "Phase 1: Chuẩn bị",
    assignee: "",
    startDate: "",
    endDate: "",
    status: "Todo" as ProjectTask["status"]
  });

  // Add Milestone Form State
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    plannedDate: "",
    type: "Milestone" as ProjectMilestone["type"]
  });

  // Add Document Form State
  const [isDocFormOpen, setIsDocFormOpen] = useState(false);
  const [docForm, setDocForm] = useState({
    name: "",
    category: "Design" as ProjectDocument["category"],
    size: "1.2 MB",
    uploader: "John D."
  });

  // Add Diary Form State
  const [diaryForm, setDiaryForm] = useState({
    author: "John D.",
    content: "",
    category: "Update" as ProjectDiaryEntry["category"]
  });

  // Load project data
  useEffect(() => {
    const loadedProj = getProjectById(projectId);
    if (loadedProj) {
      setProject(loadedProj);
    }
    fetchNhanSu().then(setStaffList).catch(err => console.error("Error loading staff:", err));
  }, [projectId]);

  // Refresh current project from localStorage
  const refreshProjectData = () => {
    const loadedProj = getProjectById(projectId);
    if (loadedProj) {
      setProject(loadedProj);
    }
  };

  if (!project) {
    return (
      <MainLayout>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">Không tìm thấy dự án</h3>
          <p className="text-sm text-slate-500 mt-2">Dự án này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
          <Link href="/projects" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition">
            <ArrowLeft size={16} />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </MainLayout>
    );
  }

  // Handle Project Status Change
  const handleStatusChange = (status: Project["status"]) => {
    const updated = updateProject(project.id, { status });
    if (updated) {
      // Log status change in diary
      addDiaryEntry(project.id, {
        author: "John D.",
        content: `Thay đổi trạng thái dự án thành "${getStatusLabel(status)}"`,
        category: "Milestone"
      });
      refreshProjectData();
    }
  };

  // Task Operations
  const handleToggleTaskStatus = (taskId: string, currentStatus: ProjectTask["status"]) => {
    const nextStatus: ProjectTask["status"] = currentStatus === 'Completed' ? 'Todo' : 'Completed';
    updateTask(project.id, taskId, { status: nextStatus });
    refreshProjectData();
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.startDate || !taskForm.endDate) {
      alert("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }
    addTask(project.id, taskForm);
    
    // Log diary
    addDiaryEntry(project.id, {
      author: "John D.",
      content: `Thêm công việc mới: "${taskForm.title}" giao cho ${taskForm.assignee || 'Chưa phân công'}`,
      category: "Update"
    });

    setIsTaskModalOpen(false);
    setTaskForm({
      title: "",
      phase: "Phase 1: Chuẩn bị",
      assignee: "",
      startDate: "",
      endDate: "",
      status: "Todo"
    });
    refreshProjectData();
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    if (window.confirm(`Xóa công việc "${taskTitle}"?`)) {
      deleteTask(project.id, taskId);
      
      // Log diary
      addDiaryEntry(project.id, {
        author: "John D.",
        content: `Đã xóa công việc: "${taskTitle}"`,
        category: "Update"
      });
      
      refreshProjectData();
    }
  };

  // Milestone Operations
  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneForm.title.trim() || !milestoneForm.plannedDate) {
      alert("Vui lòng nhập đầy đủ các trường.");
      return;
    }
    addMilestone(project.id, {
      ...milestoneForm,
      status: "Pending"
    });

    // Log diary
    addDiaryEntry(project.id, {
      author: "John D.",
      content: `Thêm mốc mốc thời gian quan trọng: "${milestoneForm.title}" vào ngày ${formatDate(milestoneForm.plannedDate)}`,
      category: "Milestone"
    });

    setIsMilestoneFormOpen(false);
    setMilestoneForm({
      title: "",
      description: "",
      plannedDate: "",
      type: "Milestone"
    });
    refreshProjectData();
  };

  const handleReachMilestone = (milestoneId: string, milestoneTitle: string) => {
    updateMilestone(project.id, milestoneId, {
      status: "Reached",
      actualDate: new Date().toISOString().split('T')[0]
    });

    // Log diary
    addDiaryEntry(project.id, {
      author: "John D.",
      content: `Đạt cột mốc quan trọng: "${milestoneTitle}"`,
      category: "Resolve"
    });

    refreshProjectData();
  };

  // Document Operations
  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name.trim()) {
      alert("Vui lòng nhập tên tài liệu.");
      return;
    }
    
    // Add extension if not exists
    let fileName = docForm.name;
    const extension = docForm.category === 'Contract' || docForm.category === 'Report' ? 'pdf' : (docForm.category === 'Design' ? 'xlsx' : 'docx');
    if (!fileName.includes('.')) {
      fileName = `${fileName}.${extension}`;
    }

    addDocument(project.id, {
      name: fileName,
      type: extension,
      size: docForm.size,
      uploader: docForm.uploader,
      category: docForm.category
    });

    // Log diary
    addDiaryEntry(project.id, {
      author: docForm.uploader,
      content: `Đã đăng tải tài liệu mới: "${fileName}" (Loại: ${docForm.category})`,
      category: "Update"
    });

    setIsDocFormOpen(false);
    setDocForm({
      name: "",
      category: "Design",
      size: "1.2 MB",
      uploader: "John D."
    });
    refreshProjectData();
  };

  // Diary Operations
  const handleDiarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaryForm.content.trim()) return;

    addDiaryEntry(project.id, diaryForm);
    setDiaryForm(prev => ({
      ...prev,
      content: ""
    }));
    refreshProjectData();
  };

  // Formatting Helpers
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

  const getStatusBadgeClass = (status: Project["status"]) => {
    switch (status) {
      case "Planning": return "bg-slate-100 text-slate-700 border-slate-200";
      case "Active": return "bg-teal-50 text-teal-700 border-teal-200/50";
      case "On Hold": return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "Delayed": return "bg-rose-50 text-rose-700 border-rose-200/50";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Organize tasks by Phase
  const phases = ["Phase 1: Chuẩn bị", "Phase 2: Triển khai", "Phase 3: Bàn giao"];
  const tasksByPhase = (phaseName: string) => {
    return project.plan.filter(t => t.phase.toLowerCase().includes(phaseName.split(':')[0].toLowerCase().trim()));
  };

  // Calculate Gantt Chart Widths
  const calculateGanttData = () => {
    if (!project.plan || project.plan.length === 0) return { tasks: [], ticks: [] };
    
    // Find min and max dates
    let minTime = new Date(project.startDate).getTime();
    let maxTime = new Date(project.endDate).getTime();

    project.plan.forEach(t => {
      const s = new Date(t.startDate).getTime();
      const e = new Date(t.endDate).getTime();
      if (s < minTime) minTime = s;
      if (e > maxTime) maxTime = e;
    });

    const totalDuration = maxTime - minTime;
    const oneDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.round(totalDuration / oneDay));

    const tasks = project.plan.map(t => {
      const s = new Date(t.startDate).getTime();
      const e = new Date(t.endDate).getTime();
      
      const startOffsetDays = Math.round((s - minTime) / oneDay);
      const durationDays = Math.max(1, Math.round((e - s) / oneDay));
      
      const leftPercent = (startOffsetDays / totalDays) * 100;
      const widthPercent = (durationDays / totalDays) * 100;

      return {
        ...t,
        leftPercent: Math.max(0, Math.min(98, leftPercent)),
        widthPercent: Math.max(2, Math.min(100 - leftPercent, widthPercent))
      };
    });

    // Generate grid ticks (5 equal intervals)
    const ticks = [];
    const step = totalDays / 5;
    for (let i = 0; i <= 5; i++) {
      const t = minTime + (i * step * oneDay);
      ticks.push(new Date(t).toISOString().split('T')[0]);
    }

    return { tasks, ticks };
  };

  const gantt = calculateGanttData();

  return (
    <MainLayout>
      {/* Subheader Back Link */}
      <div className="mb-4">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={16} />
          <span>Danh sách dự án</span>
        </Link>
      </div>

      {/* Project Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                {project.code}
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" />
                {project.customer}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">{project.name}</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">{project.description}</p>
          </div>

          {/* Right Status Controller */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-slate-500 font-medium">Trạng thái:</span>
            <div className="relative">
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as Project["status"])}
                className={`text-xs font-bold px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8 cursor-pointer ${getStatusBadgeClass(project.status)}`}
              >
                <option value="Planning">Lập kế hoạch</option>
                <option value="Active">Đang triển khai</option>
                <option value="On Hold">Tạm hoãn</option>
                <option value="Completed">Hoàn thành</option>
                <option value="Delayed">Trễ hạn</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-[9px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Project Meta Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Chủ nhiệm (PM)</span>
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-600">
                {project.manager ? project.manager.charAt(0) : "U"}
              </div>
              {project.manager || "Chưa phân công"}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Thời gian</span>
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Ngân sách</span>
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
              <DollarSign size={14} className="text-slate-400" />
              <span>{formatCurrency(project.budget)}</span>
            </span>
          </div>

          {/* Progress Section */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Tiến độ tổng thể</span>
              <span className="text-blue-600 font-bold">{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Layout */}
      <div className="flex border-b border-slate-200 mb-6 bg-white px-4 rounded-xl border border-slate-200/60 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab("plan")}
          className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "plan"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListTodo size={16} />
          <span>Kế hoạch (Plan)</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {project.plan.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("gantt")}
          className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "gantt"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarDays size={16} />
          <span>Biểu đồ Gantt</span>
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "timeline"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Flag size={16} />
          <span>Mốc thời gian (Timeline)</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {project.timeline.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("document")}
          className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "document"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={16} />
          <span>Tài liệu (Document)</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {project.documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("diary")}
          className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "diary"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen size={16} />
          <span>Nhật ký (Project Diary)</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
            {project.diary.length}
          </span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        
        {/* TAB 1: PLAN */}
        {activeTab === "plan" && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            {/* Tab Header with Add Button */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Danh mục Công việc Dự án</h3>
                <p className="text-xs text-slate-500">Tích chọn để cập nhật trạng thái hoàn thành nhanh.</p>
              </div>
              
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm công việc</span>
              </button>
            </div>

            {/* Phase Blocks */}
            <div className="p-6 space-y-6">
              {phases.map((phase) => {
                const phaseTasks = tasksByPhase(phase);
                return (
                  <div key={phase} className="space-y-3">
                    <h4 className="font-bold text-slate-700 text-sm border-l-3 border-blue-500 pl-2.5 bg-slate-50 py-1.5 rounded-r">
                      {phase}
                    </h4>

                    {phaseTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-3">Chưa có công việc nào trong giai đoạn này.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                              <th className="w-8 py-2"></th>
                              <th className="py-2">Tên công việc</th>
                              <th className="py-2">Người phụ trách</th>
                              <th className="py-2">Ngày bắt đầu</th>
                              <th className="py-2">Ngày kết thúc</th>
                              <th className="py-2 text-center">Tiến độ</th>
                              <th className="py-2">Trạng thái</th>
                              <th className="py-2 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {phaseTasks.map((task) => (
                              <tr 
                                key={task.id} 
                                className={`border-b border-slate-50 hover:bg-slate-50/50 transition ${
                                  task.status === 'Completed' ? 'opacity-70' : ''
                                }`}
                              >
                                <td className="py-3">
                                  <input
                                    type="checkbox"
                                    checked={task.status === 'Completed'}
                                    onChange={() => handleToggleTaskStatus(task.id, task.status)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                  />
                                </td>
                                <td className="py-3 font-semibold text-slate-800">
                                  <span className={task.status === 'Completed' ? 'line-through text-slate-400' : ''}>
                                    {task.title}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <User size={12} className="text-slate-400" />
                                    <span>{task.assignee || "Chưa giao"}</span>
                                  </div>
                                </td>
                                <td className="py-3 text-slate-500">{formatDate(task.startDate)}</td>
                                <td className="py-3 text-slate-500">{formatDate(task.endDate)}</td>
                                <td className="py-3">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${
                                          task.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-600'
                                        }`} 
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                    <span className="font-semibold text-slate-500 w-6 text-right">{task.progress}%</span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    task.status === 'Completed' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                                      : task.status === 'In Progress' 
                                      ? 'bg-blue-50 text-blue-700 border-blue-200/50' 
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {task.status === 'Completed' ? 'Xong' : task.status === 'In Progress' ? 'Đang chạy' : 'Chưa chạy'}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => handleDeleteTask(task.id, task.title)}
                                    className="p-1 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer text-slate-400"
                                    title="Xóa công việc"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: GANTT CHART */}
        {activeTab === "gantt" && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-bold text-slate-800 text-base">Lộ trình Biểu đồ Gantt</h3>
              <p className="text-xs text-slate-500">Hiển thị trực quan thời gian chạy của các công việc.</p>
            </div>

            {project.plan.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CalendarDays size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Chưa có công việc nào để vẽ biểu đồ Gantt. Hãy thêm công việc ở tab Kế hoạch.</p>
              </div>
            ) : (
              <div className="border border-slate-200/70 rounded-xl overflow-hidden shadow-inner">
                {/* Gantt Timeline Header */}
                <div className="flex border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 select-none">
                  {/* Left task title spacer */}
                  <div className="w-[200px] border-r border-slate-200 p-2.5 shrink-0 bg-slate-100 flex items-center">
                    Công việc
                  </div>
                  {/* Right columns */}
                  <div className="flex-1 grid grid-cols-5 relative h-full">
                    {gantt.ticks.map((tick, i) => (
                      <div key={i} className="p-2.5 border-r border-slate-200/60 last:border-0 text-center truncate">
                        {formatDate(tick)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gantt Task Rows */}
                <div className="divide-y divide-slate-100 bg-white">
                  {gantt.tasks.map((task) => (
                    <div key={task.id} className="flex text-xs group hover:bg-slate-50/40 transition">
                      {/* Left side: Task info */}
                      <div className="w-[200px] border-r border-slate-200 p-3 shrink-0 bg-slate-50/50 flex flex-col justify-center min-w-0">
                        <span className="font-bold text-slate-800 truncate" title={task.title}>{task.title}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                          PM: {task.assignee || 'N/A'} | {formatDate(task.startDate)} - {formatDate(task.endDate)}
                        </span>
                      </div>

                      {/* Right side: Gantt Bar Container */}
                      <div className="flex-1 p-3 relative min-h-[48px] flex items-center">
                        {/* Grid gridlines */}
                        <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
                          <div className="border-r border-slate-100 h-full"></div>
                          <div className="border-r border-slate-100 h-full"></div>
                          <div className="border-r border-slate-100 h-full"></div>
                          <div className="border-r border-slate-100 h-full"></div>
                          <div className="h-full"></div>
                        </div>

                        {/* Gantt Bar representation */}
                        <div 
                          className="relative h-6 rounded-lg shadow-sm border px-2 flex items-center text-[10px] font-bold text-white transition-all cursor-help select-none"
                          style={{ 
                            marginLeft: `${task.leftPercent}%`, 
                            width: `${task.widthPercent}%`,
                            backgroundColor: task.status === 'Completed' 
                              ? '#10b981' // emerald-500
                              : task.status === 'In Progress'
                              ? '#3b82f6' // blue-500
                              : '#64748b', // slate-500
                            borderColor: task.status === 'Completed' 
                              ? '#047857' 
                              : task.status === 'In Progress'
                              ? '#1d4ed8' 
                              : '#475569'
                          }}
                          title={`Công việc: ${task.title}\nNgười phụ trách: ${task.assignee}\nThời gian: ${formatDate(task.startDate)} đến ${formatDate(task.endDate)}\nTiến độ: ${task.progress}%\nTrạng thái: ${task.status}`}
                        >
                          <span className="truncate pr-1 drop-shadow-md">
                            {task.progress}%
                          </span>

                          {/* Hover Tooltip Details */}
                          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 w-48 bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-left font-normal border border-slate-700 pointer-events-none">
                            <p className="font-bold border-b border-slate-700 pb-1 mb-1 truncate">{task.title}</p>
                            <p className="text-[9px]">Giao cho: {task.assignee || 'Chưa giao'}</p>
                            <p className="text-[9px]">Từ: {formatDate(task.startDate)}</p>
                            <p className="text-[9px]">Đến: {formatDate(task.endDate)}</p>
                            <p className="text-[9px] font-bold text-teal-400 mt-1">Trạng thái: {task.status}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TIMELINE */}
        {activeTab === "timeline" && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Cột mốc Lịch trình dự án</h3>
                <p className="text-xs text-slate-500">Các cột mốc kiểm soát chất lượng bàn giao.</p>
              </div>

              <button
                onClick={() => setIsMilestoneFormOpen(!isMilestoneFormOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Plus size={13} />
                <span>Thêm cột mốc</span>
              </button>
            </div>

            {/* Add Milestone Inline Form */}
            {isMilestoneFormOpen && (
              <form onSubmit={handleMilestoneSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs">Thêm mốc quan trọng mới</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tên mốc/Tiêu đề *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tiêu đề mốc..."
                      value={milestoneForm.title}
                      onChange={(e) => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Loại sự kiện</label>
                    <select
                      value={milestoneForm.type}
                      onChange={(e) => setMilestoneForm(prev => ({ ...prev, type: e.target.value as ProjectMilestone["type"] }))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="Milestone">Mốc hoàn thành (Milestone)</option>
                      <option value="Meeting">Hội họp (Meeting)</option>
                      <option value="Review">Đánh giá nghiệm thu (Review)</option>
                      <option value="Release">Bàn giao bản vẽ/Source (Release)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Ngày lập lịch *</label>
                    <input
                      type="date"
                      required
                      value={milestoneForm.plannedDate}
                      onChange={(e) => setMilestoneForm(prev => ({ ...prev, plannedDate: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Mô tả chi tiết</label>
                  <input
                    type="text"
                    placeholder="Mô tả nội dung mốc bàn giao này..."
                    value={milestoneForm.description}
                    onChange={(e) => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsMilestoneFormOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Lưu lại
                  </button>
                </div>
              </form>
            )}

            {/* Vertical Timeline Feed */}
            {project.timeline.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-6">Chưa thiết lập cột mốc nào.</p>
            ) : (
              <div className="relative border-l border-slate-200 ml-4 pl-8 space-y-6 py-2">
                {project.timeline.map((item) => {
                  const isReached = item.status === "Reached";
                  const isOverdue = item.status === "Overdue" || (!isReached && new Date(item.plannedDate) < new Date());
                  
                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-12 top-0.5 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white shadow-sm z-10 transition-transform group-hover:scale-110 ${
                        isReached 
                          ? 'border-emerald-500 text-emerald-500' 
                          : isOverdue 
                          ? 'border-rose-500 text-rose-500 animate-pulse'
                          : 'border-slate-300 text-slate-400'
                      }`}>
                        {isReached ? <CheckCircle2 size={16} /> : isOverdue ? <AlertCircle size={16} /> : <Clock size={16} />}
                      </span>

                      {/* Timeline Content */}
                      <div className="bg-slate-50 hover:bg-slate-100/60 border border-slate-200/60 p-4 rounded-xl transition shadow-sm max-w-xl">
                        <div className="flex items-center justify-between gap-4 mb-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                            <span>{item.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              item.type === 'Release' 
                                ? 'bg-purple-100 text-purple-700' 
                                : item.type === 'Meeting'
                                ? 'bg-orange-100 text-orange-700'
                                : item.type === 'Review'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.type}
                            </span>
                          </h4>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isReached 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                              : isOverdue 
                              ? 'bg-rose-50 text-rose-700 border-rose-200/50'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {isReached ? 'Đạt' : isOverdue ? 'Quá hạn' : 'Đang chờ'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                          {item.description || "Không có mô tả chi tiết."}
                        </p>

                        <div className="flex items-center justify-between border-t border-slate-200/50 pt-2.5 text-[10px] text-slate-400">
                          <div className="flex items-center gap-3">
                            <span>Dự kiến: <strong className="text-slate-500 font-semibold">{formatDate(item.plannedDate)}</strong></span>
                            {item.actualDate && (
                              <span className="text-emerald-600">Đạt ngày: <strong>{formatDate(item.actualDate)}</strong></span>
                            )}
                          </div>

                          {!isReached && (
                            <button
                              onClick={() => handleReachMilestone(item.id, item.title)}
                              className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded font-bold transition cursor-pointer"
                            >
                              Xác nhận đạt mốc
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DOCUMENT */}
        {activeTab === "document" && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Thư viện Hồ sơ Tài liệu</h3>
                <p className="text-xs text-slate-500">Nơi lưu trữ hợp đồng, thiết kế, biên bản bàn giao của dự án.</p>
              </div>

              <button
                onClick={() => setIsDocFormOpen(!isDocFormOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Upload size={13} />
                <span>Tải tài liệu lên</span>
              </button>
            </div>

            {/* Document Upload Form */}
            {isDocFormOpen && (
              <form onSubmit={handleDocSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
                <h4 className="font-bold text-slate-800 text-xs">Tải lên tài liệu giả lập mới</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tên tài liệu *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên tệp (không cần gõ đuôi file)..."
                      value={docForm.name}
                      onChange={(e) => setDocForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Phân loại tài liệu</label>
                    <select
                      value={docForm.category}
                      onChange={(e) => setDocForm(prev => ({ ...prev, category: e.target.value as ProjectDocument["category"] }))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="Contract">Hợp đồng (Contract)</option>
                      <option value="Survey">Khảo sát yêu cầu (Survey)</option>
                      <option value="Design">Bản vẽ/Thiết kế kỹ thuật (Design)</option>
                      <option value="Report">Báo cáo tiến độ (Report)</option>
                      <option value="Minutes">Biên bản họp (Minutes)</option>
                      <option value="Other">Khác (Other)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Dung lượng</label>
                    <input
                      type="text"
                      placeholder="VD: 1.5 MB, 4.2 MB..."
                      value={docForm.size}
                      onChange={(e) => setDocForm(prev => ({ ...prev, size: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDocFormOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Tải lên
                  </button>
                </div>
              </form>
            )}

            {/* Mock Drag Drop zone */}
            <div 
              onClick={() => setIsDocFormOpen(true)}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50 p-6 rounded-2xl text-center mb-6 cursor-pointer transition"
            >
              <FileUp size={32} className="mx-auto text-slate-400 mb-2" />
              <h4 className="font-bold text-slate-700 text-xs">Kéo thả tệp hoặc bấm vào đây để đăng tải tài liệu</h4>
              <p className="text-[10px] text-slate-400 mt-1">Định dạng hỗ trợ: PDF, DOCX, XLSX, ZIP. Kích thước tối đa 50MB.</p>
            </div>

            {/* Document list table */}
            {project.documents.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-6">Chưa có tài liệu nào tải lên dự án.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                      <th className="py-2.5">Tên tài liệu</th>
                      <th className="py-2.5">Phân loại</th>
                      <th className="py-2.5">Dung lượng</th>
                      <th className="py-2.5">Ngày tải</th>
                      <th className="py-2.5">Người tải</th>
                      <th className="py-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {project.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                          <FileText size={15} className="text-blue-500 shrink-0" />
                          <span className="truncate max-w-[280px]" title={doc.name}>{doc.name}</span>
                        </td>
                        <td className="py-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/50 font-medium">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 font-mono">{doc.size}</td>
                        <td className="py-3 text-slate-500">{formatDate(doc.uploadedDate)}</td>
                        <td className="py-3 text-slate-600">{doc.uploader}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => alert(`Bắt đầu tải xuống tệp giả lập: ${doc.name}`)}
                            className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded text-slate-400 cursor-pointer inline-flex items-center gap-1 font-semibold"
                            title="Tải về"
                          >
                            <Download size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DIARY */}
        {activeTab === "diary" && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-bold text-slate-800 text-base">Nhật ký hoạt động Dự án</h3>
              <p className="text-xs text-slate-500">Nhật trình triển khai thực địa, báo cáo sự cố kỹ thuật và ý kiến từ PM.</p>
            </div>

            {/* Add diary entry input */}
            <form onSubmit={handleDiarySubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Tác giả:</span>
                <select
                  value={diaryForm.author}
                  onChange={(e) => setDiaryForm(prev => ({ ...prev, author: e.target.value }))}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.ten_nhan_su}>{s.ten_nhan_su}</option>
                  ))}
                  <option value="John D.">John D.</option>
                  <option value="Mike R.">Mike R.</option>
                  <option value="Jane S.">Jane S.</option>
                </select>

                <span className="text-xs font-semibold text-slate-600 ml-3">Chủ đề:</span>
                <select
                  value={diaryForm.category}
                  onChange={(e) => setDiaryForm(prev => ({ ...prev, category: e.target.value as ProjectDiaryEntry["category"] }))}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                >
                  <option value="Update">Tiến độ (Update)</option>
                  <option value="Issue">Sự cố (Issue)</option>
                  <option value="Resolve">Khắc phục (Resolve)</option>
                  <option value="Comment">Góp ý (Comment)</option>
                  <option value="Milestone">Cột mốc (Milestone)</option>
                </select>
              </div>

              <div>
                <textarea
                  required
                  placeholder="Ghi nội dung nhật ký triển khai hôm nay..."
                  value={diaryForm.content}
                  onChange={(e) => setDiaryForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare size={13} />
                  <span>Đăng nhật ký</span>
                </button>
              </div>
            </form>

            {/* Diary Log List */}
            {project.diary.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-6">Chưa có nhật ký nào được viết.</p>
            ) : (
              <div className="space-y-4">
                {project.diary.map((entry) => (
                  <div key={entry.id} className="border border-slate-100 hover:border-slate-200 p-4 rounded-xl bg-white shadow-sm flex items-start gap-3 transition">
                    {/* Category icon */}
                    <span className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                      entry.category === 'Issue' 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200/50' 
                        : entry.category === 'Resolve'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                        : entry.category === 'Milestone'
                        ? 'bg-purple-50 text-purple-600 border border-purple-200/50'
                        : 'bg-slate-50 text-slate-600 border border-slate-200/50'
                    }`}>
                      {entry.category === 'Issue' 
                        ? <AlertCircle size={15} /> 
                        : entry.category === 'Resolve'
                        ? <CheckCircle2 size={15} />
                        : entry.category === 'Milestone'
                        ? <Flag size={15} />
                        : <MessageCircle size={15} />}
                    </span>

                    {/* Content text */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{entry.author}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            entry.category === 'Issue' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200/30' 
                              : entry.category === 'Resolve'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/30'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {entry.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(entry.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Task Modal Popup Dialog */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-sm font-bold text-slate-800">Thêm công việc kế hoạch mới</h2>
              <button 
                onClick={() => setIsTaskModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleTaskSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Tên công việc *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cấu hình switch trung tâm, Vẽ sơ đồ..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Giai đoạn (Phase)</label>
                <select
                  value={taskForm.phase}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, phase: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="Phase 1: Chuẩn bị">Phase 1: Chuẩn bị</option>
                  <option value="Phase 2: Triển khai">Phase 2: Triển khai</option>
                  <option value="Phase 3: Bàn giao">Phase 3: Bàn giao & Nghiệm thu</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Người đảm nhận</label>
                <select
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    required
                    value={taskForm.startDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Ngày kết thúc *</label>
                  <input
                    type="date"
                    required
                    value={taskForm.endDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Trạng thái ban đầu</label>
                <select
                  value={taskForm.status}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value as ProjectTask["status"] }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="Todo">Chưa chạy (Todo)</option>
                  <option value="In Progress">Đang chạy (In Progress)</option>
                  <option value="Completed">Hoàn thành (Completed)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Thêm công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

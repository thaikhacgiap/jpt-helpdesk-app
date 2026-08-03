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
  updateProjectPlan,
  Project,
  ProjectTask,
  ProjectMilestone,
  ProjectDocument,
  ProjectDiaryEntry,
  ProjectSowItem
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
  DollarSign,
  Info,
  Edit
} from "lucide-react";

// Helper functions for mock SOW data
const getSowData = (project: Project) => {
  if (project.sow && project.sow.length > 0) {
    return project.sow;
  }
  const projectId = project.id;
  switch (projectId) {
    case "proj-1":
      return [
        {
          item: "Khảo sát & thiết kế",
          deliverable: "Tài liệu đặc tả yêu cầu (URD), Thiết kế cơ sở dữ liệu chi tiết, Figma prototype giao diện",
          status: "Đã hoàn thành"
        },
        {
          item: "Module quản lý Ticket",
          deliverable: "Giao diện danh sách ticket, bộ lọc thông minh, form tạo/gửi ticket và quy trình phân phối tự động",
          status: "Đang triển khai"
        },
        {
          item: "Module quản lý SLA",
          deliverable: "Hệ thống theo dõi hạn SLA tự động cho từng mức ưu tiên, gửi cảnh báo qua email khi trễ hạn",
          status: "Đang triển khai"
        },
        {
          item: "Module Nhân sự & Dự án",
          deliverable: "Tích hợp danh sách nhân viên kỹ thuật, phân công công việc và hiển thị biểu đồ Gantt tiến độ",
          status: "Đã hoàn thành"
        },
        {
          item: "Kiểm thử & Bàn giao",
          deliverable: "Kịch bản test UAT, biên bản nghiệm thu người dùng và bàn giao mã nguồn kèm tài liệu hướng dẫn vận hành",
          status: "Chưa triển khai"
        }
      ];
    case "proj-2":
      return [
        {
          item: "Khảo sát hạ tầng mặt bằng",
          deliverable: "Sơ đồ bố trí các nút mạng, đo vẽ đường cáp chính và sơ đồ phòng Server Room",
          status: "Đã hoàn thành"
        },
        {
          item: "Cung cấp vật tư & thiết bị mạng",
          deliverable: "Cisco Switch Catalyst, AP Wifi 6, Firewall ASA, cáp Cat6 AMP và tủ Rack",
          status: "Đang mua sắm"
        },
        {
          item: "Thi công luồn cáp & lắp Rack",
          deliverable: "Đi dây cáp mạng ngầm âm tường/trần cho 5 tầng lầu, bấm đầu mạng, lắp đặt thiết bị vào tủ Rack",
          status: "Chưa triển khai"
        },
        {
          item: "Cấu hình phân tách VLAN & Security",
          deliverable: "Thiết lập VLAN cho các phòng ban, định tuyến IP routing, cấu hình chính sách bảo mật trên Firewall",
          status: "Chưa triển khai"
        },
        {
          item: "Đo kiểm tín hiệu & Bàn giao",
          deliverable: "Đo kiểm băng thông từng node mạng, dán nhãn dây cáp và bàn giao sơ đồ hoàn công hệ thống",
          status: "Chưa triển khai"
        }
      ];
    case "proj-3":
      return [
        {
          item: "Khảo sát và đánh giá DB cũ",
          deliverable: "Bản phân tích cấu trúc dữ liệu Oracle 12c, đánh giá dung lượng và danh sách Procedure/Trigger",
          status: "Đã hoàn thành"
        },
        {
          item: "Chuyển đổi Schema DB",
          deliverable: "Mã nguồn schema tương thích PostgreSQL, xử lý các câu lệnh SQL/Procedure không tương thích",
          status: "Đang xử lý"
        },
        {
          item: "Thiết lập kênh đồng bộ DMS",
          deliverable: "Kênh truyền AWS DMS đồng bộ dữ liệu liên tục từ On-premise Oracle lên AWS Aurora PG",
          status: "Đã hoàn thành"
        },
        {
          item: "Chạy thử (Dry-run migration) 3 lần",
          deliverable: "Biên bản đánh giá thời gian downtime, kiểm tra tính toàn vẹn của dữ liệu sau đồng bộ",
          status: "Chưa triển khai"
        },
        {
          item: "Cắt chuyển chính thức (Go-live)",
          deliverable: "Thực hiện cắt chuyển hệ thống thật sang DB mới, bàn giao tài liệu vận hành và xử lý lỗi phát sinh",
          status: "Chưa triển khai"
        }
      ];
    default:
      return [
        {
          item: "Khảo sát yêu cầu ban đầu",
          deliverable: "Tài liệu khảo sát hiện trạng và định nghĩa phạm vi công việc chi tiết",
          status: "Đã hoàn thành"
        },
        {
          item: "Thực hiện các hạng mục cốt lõi",
          deliverable: "Sản phẩm bàn giao theo các mốc công việc đã cam kết trong hợp đồng",
          status: "Đang triển khai"
        },
        {
          item: "Nghiệm thu bàn giao dự án",
          deliverable: "Biên bản nghiệm thu bàn giao và bàn giao tài liệu vận hành chuyển giao công nghệ",
          status: "Chưa triển khai"
        }
      ];
  }
};

const getImplementationNotes = (project: Project) => {
  if (project.notes && project.notes.length > 0) {
    return project.notes;
  }
  const projectId = project.id;
  switch (projectId) {
    case "proj-1":
      return [
        "Chú ý cấu hình RLS (Row Level Security) trên Supabase cực kỳ nghiêm ngặt để bảo mật thông tin khách hàng và vé hỗ trợ.",
        "Thời gian phản hồi các API xử lý ticket phải dưới 200ms nhằm đảm bảo trải nghiệm mượt mà cho nhân viên tổng đài.",
        "Phối hợp với IT của ACME Corp để lấy thông tin kết nối AD/LDAP phục vụ đồng bộ tài khoản người dùng cuối.",
        "Thực hiện viết Unit Test kỹ càng cho luồng tự động tính toán thời gian phản hồi SLA để tránh sai sót pháp lý."
      ];
    case "proj-2":
      return [
        "Quy trình đi dây cáp âm trần phải phối hợp sát sao với nhà thầu xây dựng/trần thạch cao để tránh xung đột vật lý.",
        "Cần đăng ký làm việc ngoài giờ với ban quản lý tòa nhà đối với các hạng mục đục tường hoặc thi công khu vực hành lang.",
        "Đảm bảo kiểm tra tín hiệu (Fluke Test) và dán nhãn (labelling) ở cả hai đầu cáp mạng trước khi đóng trần thạch cao.",
        "Thiết bị Switch Core và Firewall cần cấu hình chạy High Availability (HA) dự phòng lỗi thiết bị."
      ];
    case "proj-3":
      return [
        "Tập trung rà soát các Store Procedure phức tạp chứa cú pháp Oracle (CONNECT BY PRIOR, MERGE...) chưa được Postgres hỗ trợ.",
        "Thực hiện ít nhất 3 lần Dry-run (di trú thử nghiệm) ngoài giờ giao dịch để xác định chính xác tổng thời gian downtime.",
        "Thời gian downtime tối đa được phép là 30 phút, bắt buộc triển khai vào tối thứ Bảy rạng sáng Chủ Nhật.",
        "Phải chuẩn bị sẵn phương án Rollback chi tiết về DB cũ trong trường hợp di trú chính thức gặp sự cố quá 30 phút."
      ];
    default:
      return [
        "Bám sát tiến độ của các mốc thời gian (Timeline) đã phê duyệt để tránh phạt hợp đồng trễ hạn.",
        "Mọi thay đổi về phạm vi công việc (Scope of Work) phải được sự đồng ý bằng văn bản từ cả PM và Đại diện khách hàng.",
        "Thực hiện lưu trữ tất cả các tài liệu bàn giao lên thư viện tài liệu của dự án phục vụ kiểm toán chất lượng."
      ];
  }
};

const getSowStatusClass = (status: string) => {
  switch (status) {
    case "Đã hoàn thành":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    case "Đang triển khai":
    case "Đang xử lý":
    case "Đang mua sắm":
      return "bg-blue-50 text-blue-700 border-blue-200/50";
    case "Chưa triển khai":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [staffList, setStaffList] = useState<NhanSu[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "plan" | "gantt" | "timeline" | "document" | "diary">("overview");

  // Overview Tab Edit States
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");

  const [isSowModalOpen, setIsSowModalOpen] = useState(false);
  const [editedSows, setEditedSows] = useState<ProjectSowItem[]>([]);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotesRaw, setEditedNotesRaw] = useState("");

  // Plan Edit State
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [tempPlan, setTempPlan] = useState<ProjectTask[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Description Edit Handlers
  const handleStartEditDesc = () => {
    if (!project) return;
    setEditedDesc(project.description || "");
    setIsEditingDesc(true);
  };

  const handleSaveDesc = () => {
    if (!project) return;
    const updated = updateProject(project.id, { description: editedDesc });
    if (updated) {
      addDiaryEntry(project.id, {
        author: "John D.",
        content: `Cập nhật mô tả dự án: "${editedDesc.substring(0, 60)}${editedDesc.length > 60 ? '...' : ''}"`,
        category: "Update"
      });
      setIsEditingDesc(false);
      refreshProjectData();
    }
  };

  // SOW Edit Handlers
  const handleStartEditSow = () => {
    if (!project) return;
    setEditedSows(getSowData(project));
    setIsSowModalOpen(true);
  };

  const handleAddSowRow = () => {
    setEditedSows(prev => [...prev, { item: "", deliverable: "", status: "Chưa triển khai" }]);
  };

  const handleRemoveSowRow = (index: number) => {
    setEditedSows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSowInputChange = (index: number, field: keyof ProjectSowItem, value: string) => {
    setEditedSows(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
  };

  const handleSaveSow = () => {
    if (!project) return;
    // Validate rows
    const validSows = editedSows.filter(s => s.item.trim() !== "");
    const updated = updateProject(project.id, { sow: validSows });
    if (updated) {
      addDiaryEntry(project.id, {
        author: "John D.",
        content: `Cập nhật bảng phạm vi công việc (SOW) dự án`,
        category: "Update"
      });
      setIsSowModalOpen(false);
      refreshProjectData();
    }
  };

  // Notes Edit Handlers
  const handleStartEditNotes = () => {
    if (!project) return;
    const currentNotes = getImplementationNotes(project);
    setEditedNotesRaw(currentNotes.join("\n"));
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    if (!project) return;
    const parsedNotes = editedNotesRaw
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "");
      
    const updated = updateProject(project.id, { notes: parsedNotes });
    if (updated) {
      addDiaryEntry(project.id, {
        author: "John D.",
        content: `Cập nhật ghi chú triển khai dự án`,
        category: "Update"
      });
      setIsEditingNotes(false);
      refreshProjectData();
    }
  };

  // Add Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
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
    const assigneeStr = taskAssignees.join(", ");
    addTask(project.id, { ...taskForm, assignee: assigneeStr });
    
    // Log diary
    addDiaryEntry(project.id, {
      author: "John D.",
      content: `Thêm công việc mới: "${taskForm.title}" giao cho ${assigneeStr || 'Chưa phân công'}`,
      category: "Update"
    });

    setIsTaskModalOpen(false);
    setTaskAssignees([]);
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


  // Re-indexing logic
  const autoAssignTaskIndices = (tasks: ProjectTask[]): ProjectTask[] => {
    let headerCount = 0;
    let subCount = 0;
    return tasks.map(task => {
      if (task.isHeader) {
        headerCount++;
        subCount = 0;
        return { 
          ...task, 
          taskIndex: `${headerCount}`,
          phase: `Phase ${headerCount}: ${task.title}` 
        };
      } else {
        subCount++;
        return { 
          ...task, 
          taskIndex: `${headerCount > 0 ? headerCount : 1}.${subCount}`,
          phase: `Phase ${headerCount > 0 ? headerCount : 1}` 
        };
      }
    });
  };

  const handleStartEditPlan = () => {
    if (!project) return;
    setTempPlan(project.plan || []);
    setIsEditingPlan(true);
  };

  const handleSavePlanEdits = () => {
    if (!project) return;
    const reindexed = autoAssignTaskIndices(tempPlan);
    const updated = updateProjectPlan(project.id, reindexed);
    if (updated) {
      addDiaryEntry(project.id, {
        author: "John D.",
        content: `Cập nhật trực tiếp danh sách công việc dự án và lưu lại`,
        category: "Update"
      });
      setIsEditingPlan(false);
      refreshProjectData();
    }
  };

  const handleCancelPlanEdits = () => {
    setIsEditingPlan(false);
  };

  const handleAppendTempTask = (isHeader: boolean) => {
    setTempPlan(prev => {
      const nextPlan = [
        ...prev,
        {
          id: `new-task-${Date.now()}`,
          title: "",
          phase: "Phase 1: Chuẩn bị",
          assignee: "",
          startDate: project?.startDate || "",
          endDate: project?.endDate || "",
          status: "Todo" as ProjectTask["status"],
          progress: 0,
          isHeader,
          notes: ""
        }
      ];
      return autoAssignTaskIndices(nextPlan);
    });
  };

  const handleAddMainTaskClick = () => {
    if (!isEditingPlan) {
      handleStartEditPlan();
      setTimeout(() => {
        setTempPlan(prev => {
          const nextPlan = [
            ...(project?.plan || []),
            {
              id: `new-task-${Date.now()}`,
              title: "",
              phase: "Phase 1: Chuẩn bị",
              assignee: "",
              startDate: project?.startDate || "",
              endDate: project?.endDate || "",
              status: "Todo" as ProjectTask["status"],
              progress: 0,
              isHeader: true,
              notes: ""
            }
          ];
          return autoAssignTaskIndices(nextPlan);
        });
      }, 50);
    } else {
      handleAppendTempTask(true);
    }
  };

  const handleAddSubTaskClick = () => {
    if (!isEditingPlan) {
      handleStartEditPlan();
      setTimeout(() => {
        setTempPlan(prev => {
          const nextPlan = [
            ...(project?.plan || []),
            {
              id: `new-task-${Date.now()}`,
              title: "",
              phase: "Phase 1: Chuẩn bị",
              assignee: "",
              startDate: project?.startDate || "",
              endDate: project?.endDate || "",
              status: "Todo" as ProjectTask["status"],
              progress: 0,
              isHeader: false,
              notes: ""
            }
          ];
          return autoAssignTaskIndices(nextPlan);
        });
      }, 50);
    } else {
      handleAppendTempTask(false);
    }
  };

  const handleRemoveTempTask = (index: number) => {
    setTempPlan(prev => {
      const nextPlan = prev.filter((_, idx) => idx !== index);
      return autoAssignTaskIndices(nextPlan);
    });
  };

  const handleTempTaskChange = (index: number, field: keyof ProjectTask, value: any) => {
    setTempPlan(prev => {
      const nextPlan = prev.map((task, idx) => {
        if (idx === index) {
          const updated = { ...task, [field]: value };
          if (field === 'status' && value === 'Completed') {
            updated.progress = 100;
          }
          if (field === 'progress') {
            const pVal = Number(value);
            updated.progress = pVal;
            if (pVal === 100) {
              updated.status = 'Completed';
            } else if (pVal === 0) {
              updated.status = 'Todo';
            } else {
              updated.status = 'In Progress';
            }
          }
          return updated;
        }
        return task;
      });
      return autoAssignTaskIndices(nextPlan);
    });
  };

  const moveTaskUp = (index: number) => {
    if (index === 0) return;
    setTempPlan(prev => {
      const nextPlan = [...prev];
      const temp = nextPlan[index];
      nextPlan[index] = nextPlan[index - 1];
      nextPlan[index - 1] = temp;
      return autoAssignTaskIndices(nextPlan);
    });
  };

  const moveTaskDown = (index: number) => {
    setTempPlan(prev => {
      if (index === prev.length - 1) return prev;
      const nextPlan = [...prev];
      const temp = nextPlan[index];
      nextPlan[index] = nextPlan[index + 1];
      nextPlan[index + 1] = temp;
      return autoAssignTaskIndices(nextPlan);
    });
  };

  // Drag-and-drop handlers for plan tasks
  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setTempPlan(prev => {
      const next = [...prev];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(idx, 0, dragged);
      return autoAssignTaskIndices(next);
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleExportPlan = () => {
    if (!project) return;
    const cleanPlan = project.plan.map(({ id, ...rest }) => rest);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanPlan, null, 2));
    const downloadAnchorElement = document.createElement('a');
    downloadAnchorElement.setAttribute("href", dataStr);
    downloadAnchorElement.setAttribute("download", `ke_hoach_${project.code}.json`);
    document.body.appendChild(downloadAnchorElement);
    downloadAnchorElement.click();
    downloadAnchorElement.remove();

    addDiaryEntry(project.id, {
      author: "John D.",
      content: `Xuất dữ liệu kế hoạch dự án ra tệp JSON`,
      category: "Update"
    });
  };

  const handleImportPlanClick = () => {
    document.getElementById('plan-import-file')?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const validated = parsed.map((t, idx) => ({
            id: `imported-task-${idx}-${Date.now()}`,
            title: t.title || "Công việc chưa đặt tên",
            phase: t.phase || "Phase 1: Chuẩn bị",
            assignee: t.assignee || "",
            startDate: t.startDate || project.startDate,
            endDate: t.endDate || project.endDate,
            status: (t.status === 'Completed' || t.status === 'In Progress' || t.status === 'Todo') ? t.status : 'Todo',
            progress: typeof t.progress === 'number' ? t.progress : (t.status === 'Completed' ? 100 : 0),
            taskIndex: t.taskIndex,
            actualStartDate: t.actualStartDate || "",
            actualEndDate: t.actualEndDate || "",
            notes: t.notes || "",
            isHeader: !!t.isHeader
          }));

          const reindexed = autoAssignTaskIndices(validated);
          const updated = updateProjectPlan(project.id, reindexed);
          if (updated) {
            addDiaryEntry(project.id, {
              author: "John D.",
              content: `Nhập dữ liệu kế hoạch dự án từ tệp JSON thành công (${reindexed.length} công việc)`,
              category: "Update"
            });
            refreshProjectData();
            alert(`Đã nhập thành công ${reindexed.length} công việc kế hoạch!`);
          }
        } else {
          alert("Lỗi: File JSON không chứa một danh sách mảng công việc hợp lệ.");
        }
      } catch (err) {
        alert("Lỗi khi đọc file JSON: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Formatting Helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Get sub-tasks belonging to a header by position (reliable — no phase string matching)
  const getSubTasksForHeader = (plan: ProjectTask[], headerIdx: number): ProjectTask[] => {
    const result: ProjectTask[] = [];
    for (let i = headerIdx + 1; i < plan.length; i++) {
      if (plan[i].isHeader) break;
      result.push(plan[i]);
    }
    return result;
  };

  // Compute aggregated stats for a phase header from its sub-tasks
  const getPhaseStats = (plan: ProjectTask[], headerIdx: number) => {
    const subs = getSubTasksForHeader(plan, headerIdx);
    // Assignees: unique union from all sub-tasks
    const allNames = subs.flatMap(t => t.assignee ? t.assignee.split(',').map(n => n.trim()).filter(Boolean) : []);
    const assignees = [...new Set(allNames)];
    // Progress: average of sub-task progress
    const progress = subs.length > 0 ? Math.round(subs.reduce((s, t) => s + t.progress, 0) / subs.length) : 0;
    // Start date: earliest planned start date of sub-tasks
    const startDates = subs.map(t => t.startDate).filter(Boolean).sort();
    const startDate = startDates[0] || '';
    // Actual end date: latest actualEndDate only when ALL sub-tasks are Completed
    const allDone = subs.length > 0 && subs.every(t => t.status === 'Completed');
    const actualEndDates = subs.map(t => t.actualEndDate).filter(Boolean).sort();
    const actualEndDate = allDone && actualEndDates.length > 0 ? actualEndDates[actualEndDates.length - 1] : '';
    // End date: latest planned end date
    const endDates = subs.map(t => t.endDate).filter(Boolean).sort();
    const endDate = endDates.length > 0 ? endDates[endDates.length - 1] : '';
    return { assignees, progress, startDate, endDate, actualEndDate };
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

  // Calculate Gantt Chart day-by-day data
  const calculateGanttData = () => {
    if (!project.plan || project.plan.length === 0) return { tasks: [], days: [], monthGroups: [] };

    const oneDay = 24 * 60 * 60 * 1000;
    // Find overall date range from all tasks
    const allDates = project.plan.flatMap(t => [t.startDate, t.endDate].filter(Boolean));
    if (allDates.length === 0) return { tasks: [], days: [], monthGroups: [] };

    const minDate = new Date(allDates.reduce((a, b) => a < b ? a : b));
    const maxDate = new Date(allDates.reduce((a, b) => a > b ? a : b));
    // Pad by 2 days on each side
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 2);

    // Generate day array
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

    // Group days by month
    const monthGroups: { label: string; count: number }[] = [];
    let lastMonth = '';
    days.forEach(d => {
      const monthKey = `Th\u00e1ng ${d.date.getMonth() + 1}, ${d.date.getFullYear()}`;
      if (monthKey !== lastMonth) { monthGroups.push({ label: monthKey, count: 1 }); lastMonth = monthKey; }
      else monthGroups[monthGroups.length - 1].count++;
    });

    // Phase colors palette
    const phaseColors = [
      { bg: '#4fc3c3', text: '#fff', light: '#e0f7f7' }, // teal
      { bg: '#f0a500', text: '#fff', light: '#fff3cc' }, // amber
      { bg: '#7c6fcd', text: '#fff', light: '#ede9ff' }, // purple
      { bg: '#4caf7d', text: '#fff', light: '#e0f5ea' }, // green
      { bg: '#e05b7f', text: '#fff', light: '#fde8ee' }, // rose
    ];

    // Assign phase color index
    let phaseColorIdx = -1;
    const tasks = project.plan.map(t => {
      if (t.isHeader) phaseColorIdx = (phaseColorIdx + 1) % phaseColors.length;
      const color = phaseColors[Math.max(0, phaseColorIdx)];
      // Calculate bar position as day indices
      const startIdx = days.findIndex(d => d.iso >= (t.startDate || ''));
      const endIdx = days.findLastIndex(d => d.iso <= (t.endDate || ''));
      return { ...t, startIdx: Math.max(0, startIdx), endIdx: Math.max(0, endIdx), color };
    });

    return { tasks, days, monthGroups };
  };

  const gantt = calculateGanttData();
  const COL_W = 28; // px per day column

  return (
    <MainLayout>
      {/* Subheader Back Link */}
      <div className="mb-4">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={16} />
          <span>Danh sách dự án</span>
        </Link>
      </div>

      {/* Project Banner Card with Integrated Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm mb-4 overflow-hidden">
        <div className="px-5 py-2.5 pb-0">
          {/* Row 1: Code, Customer, PM, Time (Upper Row) */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 pb-2.5 border-b border-slate-100 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                {project.code}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" />
                <span>{project.customer}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <User size={13} className="text-slate-400" />
                <span>PM: <strong className="text-slate-700 font-bold">{project.manager || "Chưa phân công"}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" />
                <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
              </span>
            </div>
          </div>

          {/* Row 2: Title, Progress, Status (Middle Row) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2.5">
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4 min-w-0">
              <h1 className="text-xl font-extrabold text-slate-900 truncate" title={project.name}>
                {project.name}
              </h1>
              
              {/* Progress Section (Same row as title) */}
              <div className="flex items-center gap-3 shrink-0 min-w-[200px]">
                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-600 shrink-0">{project.progress}%</span>
              </div>
            </div>

            {/* Right Status Controller */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-semibold">Trạng thái:</span>
              <div className="relative">
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value as Project["status"])}
                  className={`text-[11px] font-bold px-2.5 py-1.5 border rounded-lg outline-none bg-white appearance-none pr-8 cursor-pointer ${getStatusBadgeClass(project.status)}`}
                >
                  <option value="Planning">Lập kế hoạch</option>
                  <option value="Active">Đang triển khai</option>
                  <option value="On Hold">Tạm hoãn</option>
                  <option value="Completed">Hoàn thành</option>
                  <option value="Delayed">Trễ hạn</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-[8px]">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation Layout (Integrated, Compressed) */}
        <div className="flex border-t border-slate-100 bg-slate-50/50 px-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Info size={14} />
            <span>Tổng quan dự án</span>
          </button>

          <button
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "plan"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListTodo size={14} />
            <span>Kế hoạch (Plan)</span>
            <span className="bg-slate-100 text-slate-650 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {project.plan.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("gantt")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "gantt"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarDays size={14} />
            <span>Biểu đồ Gantt</span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "timeline"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Flag size={14} />
            <span>Mốc thời gian (Timeline)</span>
            <span className="bg-slate-100 text-slate-650 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {project.timeline.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("document")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "document"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText size={14} />
            <span>Tài liệu (Document)</span>
            <span className="bg-slate-100 text-slate-650 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {project.documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("diary")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "diary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen size={14} />
            <span>Nhật ký (Project Diary)</span>
            <span className="bg-slate-100 text-slate-650 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {project.diary.length}
            </span>
          </button>
        </div>

      {/* Tabs Content */}
      <div className="space-y-6">

        {/* TAB 0: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Grid for Left: Project Info & Description, Right: Implementation Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Info & Description & SOW */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Project Description Card */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <Info size={18} className="text-blue-500" />
                      <span>Mô tả Dự án</span>
                    </h3>
                    {!isEditingDesc && (
                      <button
                        onClick={handleStartEditDesc}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                      >
                        <Edit size={13} />
                        <span>Sửa</span>
                      </button>
                    )}
                  </div>
                  
                  {isEditingDesc ? (
                    <div className="space-y-3 pt-1">
                      <textarea
                        value={editedDesc}
                        onChange={(e) => setEditedDesc(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white resize-none"
                        placeholder="Nhập mô tả chi tiết của dự án..."
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setIsEditingDesc(false)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveDesc}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer"
                        >
                          Lưu lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {project.description || "Chưa có mô tả chi tiết cho dự án này."}
                    </p>
                  )}
                  
                  {/* Additional Meta Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium block">Khách hàng</span>
                      <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
                        <Building2 size={14} className="text-blue-500" />
                        {project.customer}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium block">Chủ nhiệm (PM)</span>
                      <span className="font-bold text-slate-700 text-sm flex items-center gap-1">
                        <User size={14} className="text-purple-500" />
                        {project.manager || "Chưa phân công"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SOW (Statement of Work) Table Card */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <ListTodo size={18} className="text-blue-500" />
                      <span>Bảng phạm vi công việc (SOW - Statement of Work)</span>
                    </h3>
                    <button
                      onClick={handleStartEditSow}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                    >
                      <Edit size={13} />
                      <span>Cập nhật SOW</span>
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-200/60 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="w-12 py-3 px-4 text-center">STT</th>
                          <th className="py-3 px-4">Hạng mục công việc</th>
                          <th className="py-3 px-4">Mô tả chi tiết bàn giao</th>
                          <th className="py-3 px-4 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {getSowData(project).map((sow, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-4 text-center font-mono font-medium text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">{sow.item}</td>
                            <td className="py-3 px-4 text-slate-600 leading-relaxed">{sow.deliverable}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSowStatusClass(sow.status)}`}>
                                {sow.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right Column: Implementation Notes */}
              <div className="space-y-6">
                
                {/* Implementation Notes Card */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <AlertCircle size={18} className="text-amber-500" />
                      <span>Chú ý khi triển khai</span>
                    </h3>
                    {!isEditingNotes && (
                      <button
                        onClick={handleStartEditNotes}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
                      >
                        <Edit size={13} />
                        <span>Sửa</span>
                      </button>
                    )}
                  </div>
                  
                  {isEditingNotes ? (
                    <div className="space-y-3 pt-1">
                      <textarea
                        value={editedNotesRaw}
                        onChange={(e) => setEditedNotesRaw(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs bg-white resize-none"
                        placeholder="Mỗi dòng nhập vào là một dòng ghi chú khi triển khai..."
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setIsEditingNotes(false)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNotes}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer"
                        >
                          Lưu lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {getImplementationNotes(project).map((note, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start text-xs">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <p className="text-slate-600 leading-relaxed font-medium">{note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 1: PLAN */}
        {activeTab === "plan" && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            {/* Tab Header with Add Button */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Danh mục Công việc Dự án (Kế hoạch)</h3>
                <p className="text-xs text-slate-500">
                  {isEditingPlan 
                    ? "Đang chỉnh sửa kế hoạch. Bấm ▲/▼ để đổi vị trí, hoặc thêm hàng bằng nút trên." 
                    : "Xem tiến độ chi tiết. Bấm 'Chỉnh sửa' hoặc nút 'Sửa' của công việc để điều chỉnh."}
                </p>
              </div>
              
              {isEditingPlan ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleAppendTempTask(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Thêm Phase</span>
                  </button>
                  <button
                    onClick={() => handleAppendTempTask(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Thêm Công việc</span>
                  </button>
                  <button
                    onClick={handleSavePlanEdits}
                    className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm shadow-green-200"
                  >
                    Lưu kế hoạch
                  </button>
                  <button
                    onClick={handleCancelPlanEdits}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleStartEditPlan}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Edit size={14} />
                    <span>Chỉnh sửa</span>
                  </button>
                  <button
                    onClick={handleAddMainTaskClick}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Thêm Phase</span>
                  </button>
                  <button
                    onClick={handleAddSubTaskClick}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Thêm Công việc</span>
                  </button>
                  <button
                    onClick={handleImportPlanClick}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                    title="Nhập tệp kế hoạch JSON"
                  >
                    <Upload size={13} />
                    <span>Nhập</span>
                  </button>
                  <button
                    onClick={handleExportPlan}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                    title="Xuất tệp kế hoạch JSON"
                  >
                    <Download size={13} />
                    <span>Xuất</span>
                  </button>
                  <input
                    id="plan-import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImportFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Plan Spreadsheet Table Container */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-[#E6EEF7] text-slate-700 border-b border-slate-355 select-none">
                    <th className="py-2.5 px-2 text-center font-bold border border-slate-200 w-14">
                      No
                    </th>
                    <th className="py-2.5 px-3 font-bold border border-slate-200">Công việc</th>
                    <th className="py-2.5 px-2 font-bold border border-slate-200 w-28">Thời gian bắt đầu</th>
                    <th className="py-2.5 px-2 font-bold border border-slate-200 w-28">Thời gian kết thúc</th>
                    <th className="py-2.5 px-2 font-bold border border-slate-200 w-32">Thời gian bắt đầu thực tế</th>
                    <th className="py-2.5 px-2 font-bold border border-slate-200 w-32">Thời gian kết thúc thực tế</th>
                    <th className="py-2.5 px-2 font-bold border border-slate-200">Người thực hiện</th>
                    <th className="py-2.5 px-2 font-bold border border-slate-200 text-center w-20">% Hoàn thành</th>
                    <th className="py-2.5 px-2 font-bold border border-slate-200 text-center w-32">Trạng thái</th>
                    <th className="py-2.5 px-3 font-bold border border-slate-200 w-40">Ghi chú</th>
                    <th className="py-2.5 px-2 font-bold border border-slate-200 text-center w-20">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isEditingPlan ? (
                    tempPlan.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 font-medium italic">
                          Chưa có công việc nào. Hãy thêm Phase hoặc Công việc bằng các nút phía trên.
                        </td>
                      </tr>
                    ) : (
                      tempPlan.map((task, idx) => {
                        const isHeader = !!task.isHeader;
                        return (
                          <tr 
                            key={task.id || idx} 
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={() => handleDrop(idx)}
                            onDragEnd={handleDragEnd}
                            className={`border-b transition ${
                              dragOverIndex === idx && dragIndex !== idx
                                ? 'border-blue-400 bg-blue-50/60 ring-1 ring-blue-300'
                                : isHeader ? 'border-slate-200 bg-[#E8E8E8] font-bold' : 'border-slate-200 bg-white hover:bg-slate-50/40'
                            }`}
                          >
                            {/* Drag Handle + Index Cell */}
                            <td className="p-1 text-center border border-slate-200 select-none w-8">
                              <div className="flex flex-col items-center justify-center gap-0.5 cursor-grab active:cursor-grabbing" title="Kéo để di chuyển">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-blue-500 transition">
                                  <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/>
                                  <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/>
                                  <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/>
                                  <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>
                                  <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/>
                                  <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/>
                                </svg>
                                <span className="font-mono text-[10px] font-bold text-slate-500">
                                  {task.taskIndex || (idx + 1)}
                                </span>
                              </div>
                            </td>

                            {/* Công việc Input */}
                            <td className="p-1.5 border border-slate-200">
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={task.title}
                                  onChange={(e) => handleTempTaskChange(idx, "title", e.target.value)}
                                  className={`w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${isHeader ? "font-bold text-slate-900" : "text-slate-700"}`}
                                  placeholder="Nhập tên công việc..."
                                />
                                <label className="flex items-center gap-1.5 text-[9px] text-slate-550 font-bold select-none cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isHeader}
                                    onChange={(e) => handleTempTaskChange(idx, "isHeader", e.target.checked)}
                                    className="w-3 h-3 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                  />
                                  <span>Giai đoạn chính (Header)</span>
                                </label>
                              </div>
                            </td>

                            {/* Start Date */}
                            <td className="p-1 border border-slate-200">
                              {isHeader ? (
                                <span className="text-[10px] px-1.5 py-1 text-slate-500 italic">
                                  {(() => { const s = getPhaseStats(tempPlan, idx); return formatDate(s.startDate) || 'Tự tasks'; })()}
                                </span>
                              ) : (
                                <input type="date" value={task.startDate}
                                  onChange={(e) => handleTempTaskChange(idx, "startDate", e.target.value)}
                                  className="w-full px-1.5 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                                />
                              )}
                            </td>

                            {/* End Date */}
                            <td className="p-1 border border-slate-200">
                              {isHeader ? (
                                <span className="text-[10px] px-1.5 py-1 text-slate-500 italic">
                                  {(() => { const s = getPhaseStats(tempPlan, idx); return formatDate(s.endDate) || 'Tự tasks'; })()}
                                </span>
                              ) : (
                                <input type="date" value={task.endDate}
                                  onChange={(e) => handleTempTaskChange(idx, "endDate", e.target.value)}
                                  className="w-full px-1.5 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                                />
                              )}
                            </td>

                            {/* Actual Start Date */}
                            <td className="p-1 border border-slate-200">
                              {isHeader ? (
                                <span className="text-[10px] px-1.5 text-slate-400">—</span>
                              ) : (
                                <input type="date" value={task.actualStartDate || ""}
                                  onChange={(e) => handleTempTaskChange(idx, "actualStartDate", e.target.value)}
                                  className="w-full px-1.5 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                                />
                              )}
                            </td>

                            {/* Actual End Date */}
                            <td className="p-1 border border-slate-200">
                              {isHeader ? (
                                <span className="text-[10px] px-1.5 py-1 text-emerald-600 font-bold">
                                  {(() => { const s = getPhaseStats(tempPlan, idx); return s.actualEndDate ? formatDate(s.actualEndDate) : '—'; })()}
                                </span>
                              ) : (
                                <input type="date" value={task.actualEndDate || ""}
                                  onChange={(e) => handleTempTaskChange(idx, "actualEndDate", e.target.value)}
                                  className="w-full px-1.5 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                                />
                              )}
                            </td>

                            {/* Assignee - multi select from staff */}
                            <td className="p-1 border border-slate-200">
                              {isHeader ? (
                                <div className="text-[10px] text-blue-600 font-medium px-1 flex flex-wrap gap-1">
                                  {(() => {
                                    const { assignees } = getPhaseStats(tempPlan, idx);
                                    return assignees.length > 0
                                      ? assignees.map(n => <span key={n} className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[9px] font-semibold">{n}</span>)
                                      : <span className="text-slate-400 italic">Tự động từ tasks</span>;
                                  })()}
                                </div>
                              ) : (
                                <div className="relative group/assignee">
                                  <div className="w-full min-h-[28px] px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 cursor-pointer flex flex-wrap gap-1 items-center">
                                    {task.assignee
                                      ? task.assignee.split(',').map(n => n.trim()).filter(Boolean).map(n => (
                                          <span key={n} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[9px] font-semibold">
                                            {n}
                                            <button type="button" onClick={() => {
                                              const cur = task.assignee.split(',').map(x => x.trim()).filter(x => x && x !== n);
                                              handleTempTaskChange(idx, 'assignee', cur.join(', '));
                                            }} className="hover:text-red-500 cursor-pointer">×</button>
                                          </span>
                                        ))
                                      : <span className="text-slate-400">Chọn...</span>
                                    }
                                  </div>
                                  {/* Dropdown on hover */}
                                  <div className="hidden group-hover/assignee:block absolute top-full left-0 z-20 mt-0.5 bg-white border border-slate-200 rounded-xl shadow-lg min-w-[140px] max-h-40 overflow-y-auto">
                                    {staffList.map(s => {
                                      const curNames = task.assignee ? task.assignee.split(',').map(n => n.trim()).filter(Boolean) : [];
                                      const checked = curNames.includes(s.ten_nhan_su);
                                      return (
                                        <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer">
                                          <input type="checkbox" checked={checked}
                                            onChange={(e) => {
                                              const updated = e.target.checked
                                                ? [...curNames, s.ten_nhan_su]
                                                : curNames.filter(n => n !== s.ten_nhan_su);
                                              handleTempTaskChange(idx, 'assignee', updated.join(', '));
                                            }}
                                            className="w-3 h-3 rounded"
                                          />
                                          <span className="text-xs text-slate-700">{s.ten_nhan_su}</span>
                                        </label>
                                      );
                                    })}
                                    {staffList.length === 0 && <p className="px-3 py-2 text-[10px] text-slate-400">Không có nhân sự</p>}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Progress % */}
                            <td className="p-1 border border-slate-200">
                              {isHeader ? (
                                <div className="flex items-center gap-1">
                                  <span className="w-12 px-1 py-1.5 text-xs bg-slate-50 border border-slate-100 rounded-lg font-bold text-right text-blue-700 block">
                                    {(() => {
                                      const subs = tempPlan.filter(t => !t.isHeader && t.phase === task.phase);
                                      if (subs.length === 0) return task.progress;
                                      return Math.round(subs.reduce((s, t) => s + t.progress, 0) / subs.length);
                                    })()}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-450">%</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={task.progress}
                                    onChange={(e) => handleTempTaskChange(idx, "progress", e.target.value)}
                                    className="w-12 px-1 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-semibold text-right outline-none"
                                  />
                                  <span className="text-[10px] font-bold text-slate-450">%</span>
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="p-1 border border-slate-200">
                              <select
                                value={task.status}
                                onChange={(e) => handleTempTaskChange(idx, "status", e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-bold outline-none text-slate-700"
                              >
                                <option value="Todo">Chưa thực hiện</option>
                                <option value="In Progress">Đang thực hiện</option>
                                <option value="Completed">Hoàn thành</option>
                              </select>
                            </td>

                            {/* Notes */}
                            <td className="p-1 border border-slate-200">
                              <input
                                type="text"
                                value={task.notes || ""}
                                onChange={(e) => handleTempTaskChange(idx, "notes", e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 outline-none"
                                placeholder="Ghi chú..."
                              />
                            </td>

                            {/* Delete Button */}
                            <td className="p-1 border border-slate-200 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveTempTask(idx)}
                                className="p-1 text-slate-455 hover:text-red-500 hover:bg-red-50 rounded transition cursor-pointer mx-auto block"
                                title="Xóa hàng này"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )
                  ) : (
                    // READ ONLY VIEW
                    project.plan.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 font-medium italic">
                          Chưa có công việc nào được thiết lập. Hãy bấm Chỉnh sửa hoặc thêm mới để bắt đầu.
                        </td>
                      </tr>
                    ) : (
                      project.plan.map((task, idx) => {
                        const isHeader = !!task.isHeader;
                        return (
                          <tr 
                            key={task.id || idx} 
                            className={`border-b border-slate-200 transition ${isHeader ? "bg-[#E8E8E8] font-bold animate-fade-in" : "bg-white hover:bg-slate-50/40"}`}
                          >
                            {/* STT */}
                            <td className="py-3 px-2 text-center font-mono font-bold text-slate-500 border border-slate-200">
                              {task.taskIndex}
                            </td>

                            {/* Công việc */}
                            <td className={`py-3 px-3 border border-slate-200 ${isHeader ? "text-slate-900 text-xs font-extrabold" : "text-slate-700 font-medium"}`}>
                              {task.title}
                            </td>

                            {/* Start Date */}
                            <td className="py-3 px-2 border border-slate-200 text-slate-650 font-medium">
                              {isHeader
                                ? (() => { const s = getPhaseStats(project.plan, idx); return formatDate(s.startDate) || '—'; })()
                                : (formatDate(task.startDate) || '—')}
                            </td>

                            {/* End Date */}
                            <td className="py-3 px-2 border border-slate-200 text-slate-650 font-medium">
                              {isHeader
                                ? (() => { const s = getPhaseStats(project.plan, idx); return formatDate(s.endDate) || '—'; })()
                                : (formatDate(task.endDate) || '—')}
                            </td>

                            {/* Actual Start Date */}
                            <td className="py-3 px-2 border border-slate-200 text-slate-650 font-medium">
                              {isHeader ? '—' : (formatDate(task.actualStartDate) || '—')}
                            </td>

                            {/* Actual End Date - phase: latest when ALL tasks done */}
                            <td className="py-3 px-2 border border-slate-200 text-slate-650 font-medium">
                              {isHeader
                                ? (() => { const s = getPhaseStats(project.plan, idx); return s.actualEndDate ? <span className="text-emerald-600 font-bold">{formatDate(s.actualEndDate)}</span> : '—'; })()
                                : (formatDate(task.actualEndDate) || '—')}
                            </td>

                            {/* Assignee */}
                            <td className="py-3 px-2 border border-slate-200 text-slate-700 font-semibold">
                              {isHeader ? (() => {
                                const { assignees } = getPhaseStats(project.plan, idx);
                                return assignees.length > 0
                                  ? <div className="flex flex-wrap gap-1">{assignees.map(n => <span key={n} className="text-[10px] px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full font-semibold">{n}</span>)}</div>
                                  : <span className="text-slate-400">—</span>;
                              })() : (
                                task.assignee
                                  ? <div className="flex flex-wrap gap-1">{task.assignee.split(',').map(n => n.trim()).filter(Boolean).map(n => <span key={n} className="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-full font-medium">{n}</span>)}</div>
                                  : <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Progress */}
                            <td className="py-3 px-2 border border-slate-200 text-center font-extrabold text-slate-800 text-xs">
                              {isHeader
                                ? `${getPhaseStats(project.plan, idx).progress}%`
                                : `${task.progress}%`}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-2 border border-slate-200 text-center">
                              <span className={`inline-block w-full py-1 text-[10px] font-bold rounded tracking-wide ${
                                task.status === 'Completed' 
                                  ? 'bg-[#2ecc71] text-white' 
                                  : task.status === 'In Progress' 
                                  ? 'bg-[#e67e22] text-white' 
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {task.status === 'Completed' 
                                  ? 'Hoàn thành' 
                                  : task.status === 'In Progress' 
                                  ? 'Đang thực hiện' 
                                  : 'Chưa thực hiện'}
                              </span>
                            </td>

                            {/* Notes */}
                            <td className="py-3 px-3 border border-slate-200 text-slate-500 italic max-w-[200px] truncate" title={task.notes || ""}>
                              {task.notes || "—"}
                            </td>

                            {/* Action column (Sửa button) */}
                            <td className="py-3 px-2 border border-slate-200 text-center">
                              {!isHeader && (
                                <button
                                  type="button"
                                  onClick={handleStartEditPlan}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-650 hover:text-blue-850 transition cursor-pointer mx-auto"
                                >
                                  <Edit size={12} />
                                  <span>Sửa</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* TAB 2: GANTT CHART */}
        {activeTab === "gantt" && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            {project.plan.length === 0 ? (
              <div className="p-8 text-center bg-slate-50">
                <CalendarDays size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Chưa có công việc nào. Hãy thêm ở tab Kế hoạch.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${280 + 120 + gantt.days.length * COL_W}px` }}>

                  {/* ===== HEADER ROW ===== */}
                  <div className="flex border-b border-slate-200 bg-slate-50 select-none sticky top-0 z-10">
                    {/* Task name col */}
                    <div className="shrink-0 border-r border-slate-200 bg-slate-100" style={{ width: 280 }}>
                      <div className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tên công việc</div>
                    </div>
                    {/* Progress col */}
                    <div className="shrink-0 border-r border-slate-200 bg-slate-100 flex items-end" style={{ width: 120 }}>
                      <div className="px-3 py-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tiến độ</div>
                    </div>
                    {/* Day columns */}
                    <div className="flex-1">
                      {/* Month row */}
                      <div className="flex border-b border-slate-200">
                        {gantt.monthGroups.map((mg, i) => (
                          <div key={i} className="border-r border-slate-200 last:border-0 text-center text-[10px] font-bold text-slate-600 py-1 bg-slate-50"
                            style={{ width: mg.count * COL_W }}>
                            {mg.label}
                          </div>
                        ))}
                      </div>
                      {/* Day number + name row */}
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
                    const rowH = isHeader ? 44 : 36;
                    const phaseStats = isHeader ? getPhaseStats(project.plan, project.plan.indexOf(task)) : null;
                    const displayProgress = isHeader ? (phaseStats?.progress ?? task.progress) : task.progress;

                    return (
                      <div key={task.id || idx}
                        className={`flex border-b border-slate-100 group transition-colors ${
                          isHeader ? 'bg-slate-50/80' : 'bg-white hover:bg-blue-50/20'
                        }`}
                        style={{ height: rowH }}
                      >
                        {/* Task Name */}
                        <div className="shrink-0 border-r border-slate-200 flex items-center px-2 overflow-hidden" style={{ width: 280 }}>
                          {isHeader ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-slate-400 shrink-0">&#x229E;</span>
                              <span className="text-[11px] font-bold text-slate-800 truncate" title={task.title}>{task.title}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-600 truncate pl-5" title={task.title}>{task.title}</span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="shrink-0 border-r border-slate-200 flex items-center px-2 gap-2" style={{ width: 120 }}>
                          <span className="text-[10px] font-bold text-slate-600 w-7 text-right shrink-0">{displayProgress}%</span>
                          <div className="flex-1 relative h-2.5 rounded-full overflow-hidden bg-amber-200">
                            <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${displayProgress}%` }} />
                          </div>
                          <span className="text-slate-300 text-xs shrink-0">&#x23F0;</span>
                        </div>

                        {/* Gantt Day Grid + Bar */}
                        <div className="flex-1 relative flex items-center">
                          {/* Day gridlines */}
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

                          {/* Gantt bar */}
                          {task.startIdx >= 0 && task.endIdx >= task.startIdx && (
                            <div
                              className="absolute flex items-center px-2 rounded-md text-[10px] font-semibold shadow-sm select-none cursor-help overflow-hidden"
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
                              <span className="truncate drop-shadow-sm">{task.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  {project.plan.filter(t => t.isHeader).map(phase => (
                    <option key={phase.id} value={phase.phase}>{phase.phase}</option>
                  ))}
                  {project.plan.filter(t => t.isHeader).length === 0 && (
                    <option value="Phase 1: Chuẩn bị">Phase 1: Chuẩn bị</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Người đảm nhận (chọn nhiều)</label>
                {/* Selected tags */}
                {taskAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {taskAssignees.map(name => (
                      <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[10px] font-semibold">
                        {name}
                        <button type="button" onClick={() => setTaskAssignees(prev => prev.filter(n => n !== name))} className="hover:text-red-500 cursor-pointer font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Checkbox list */}
                <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {staffList.length > 0 ? staffList.map(s => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taskAssignees.includes(s.ten_nhan_su)}
                        onChange={(e) => {
                          if (e.target.checked) setTaskAssignees(prev => [...prev, s.ten_nhan_su]);
                          else setTaskAssignees(prev => prev.filter(n => n !== s.ten_nhan_su));
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span className="text-xs text-slate-700">{s.ten_nhan_su}</span>
                    </label>
                  )) : (
                    <p className="px-3 py-2 text-xs text-slate-400 italic">Chưa có nhân sự. Nhập tên thủ công bên dưới.</p>
                  )}
                </div>
                {/* Manual input fallback */}
                <input
                  type="text"
                  placeholder="Hoặc nhập tên thủ công, nhấn Enter..."
                  className="mt-1.5 w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !taskAssignees.includes(val)) setTaskAssignees(prev => [...prev, val]);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
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

      {/* SOW Modal Popup Dialog */}
      {isSowModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-sm font-bold text-slate-800">Cập nhật phạm vi công việc (SOW)</h2>
              <button 
                onClick={() => setIsSowModalOpen(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                {editedSows.map((sow, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60 relative group">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-4">
                        <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Hạng mục công việc</label>
                        <input
                          type="text"
                          required
                          value={sow.item}
                          onChange={(e) => handleSowInputChange(idx, 'item', e.target.value)}
                          placeholder="Tên hạng mục..."
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-5">
                        <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Mô tả bàn giao chi tiết</label>
                        <input
                          type="text"
                          required
                          value={sow.deliverable}
                          onChange={(e) => handleSowInputChange(idx, 'deliverable', e.target.value)}
                          placeholder="Mô tả sản phẩm bàn giao..."
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">Trạng thái</label>
                        <select
                          value={sow.status}
                          onChange={(e) => handleSowInputChange(idx, 'status', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                        >
                          <option value="Đã hoàn thành">Đã hoàn thành</option>
                          <option value="Đang triển khai">Đang triển khai</option>
                          <option value="Đang xử lý">Đang xử lý</option>
                          <option value="Đang mua sắm">Đang mua sắm</option>
                          <option value="Chưa triển khai">Chưa triển khai</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSowRow(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition mt-4 cursor-pointer"
                      title="Xóa hạng mục"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddSowRow}
                className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-slate-50 text-slate-500 hover:text-blue-600 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Thêm hạng mục công việc</span>
              </button>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSowModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveSow}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition cursor-pointer"
                >
                  Lưu thay đổi SOW
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

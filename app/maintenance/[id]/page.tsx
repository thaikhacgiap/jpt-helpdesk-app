"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/main-layout";
import { 
  ArrowLeft, Plus, Download, Upload, Pencil, Trash2, X, Check,
  CheckCircle2, Clock, RotateCcw, AlertTriangle, Play, HelpCircle,
  Menu, Bell, Calculator, Settings, ClipboardList
} from "lucide-react";

interface Task {
  id: string;
  parentId: string | null; // null for parent task, string parent task ID for subtasks
  name: string;
  assignees: string[];
  department: string;
  startDate: string;
  endDate: string;
  status: string; // 'Chưa bắt đầu', 'Đang thực hiện', 'Hoàn thành', 'Tạm dừng'
  notes: string;
  orderIndex: number;
}

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<string>("1");
  const [cycleTasks, setCycleTasks] = useState<{ [key: string]: Task[] }>({});
  
  const [config, setConfig] = useState({
    interval: "monthly",
    startDate: "",
  });
  const [cycleMeta, setCycleMeta] = useState<{ [key: string]: { startDate: string } }>({});
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: "",
    isSubtask: false,
    parentId: "",
    assignees: [] as string[],
    department: "",
    startDate: "",
    endDate: "",
    status: "Chưa bắt đầu",
    notes: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load plan details from Supabase
  const loadPlanDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, customer:customers(id, name), contract:contracts(id, name)")
        .eq("id", planId)
        .single();

      if (error || !data) {
        console.error("Error fetching plan:", error);
        router.push("/maintenance");
        return;
      }

      setPlan(data);

      // Parse tasks and config from the remark column
      let tasksData: { [key: string]: Task[] } = {};
      let parsedConfig = { 
        interval: "monthly", 
        startDate: data.start_time ? data.start_time.substring(0, 10) : new Date().toISOString().substring(0, 10) 
      };
      let parsedMeta = {};

      if (data.remark) {
        try {
          const parsed = JSON.parse(data.remark);
          if (parsed && parsed.tasks !== undefined) {
            tasksData = parsed.tasks || {};
            parsedConfig = parsed.config || parsedConfig;
            parsedMeta = parsed.cycleMeta || {};
          } else {
            // Legacy structure
            tasksData = parsed || {};
          }
        } catch (e) {
          console.warn("Failed to parse remark JSON, initializing empty:", e);
        }
      }

      if (!parsedConfig.startDate && data.start_time) {
        parsedConfig.startDate = data.start_time.substring(0, 10);
      }

      setCycleTasks(tasksData);
      setConfig(parsedConfig);
      setCycleMeta(parsedMeta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load staff list from nhan_su table
  const loadStaffList = async () => {
    try {
      const { data } = await supabase
        .from("nhan_su")
        .select("id, ten_nhan_su, bo_phan")
        .order("ten_nhan_su", { ascending: true });
      setStaffList(data || []);
    } catch (err) {
      console.error("Error fetching staff list:", err);
    }
  };

  useEffect(() => {
    if (planId) {
      loadPlanDetails();
      loadStaffList();
    }
  }, [planId]);

  // Total periods in the plan
  const totalCycles = plan ? (parseInt(plan.hold_time) || 1) : 1;

  // Filter tasks for the active cycle
  const currentTasks = cycleTasks[activeCycle] || [];

  // Helper: separate and sort tasks hierarchically
  const getSortedTasks = (tasks: Task[]) => {
    const parents = tasks.filter(t => !t.parentId);
    const subtasks = tasks.filter(t => t.parentId);

    parents.sort((a, b) => a.orderIndex - b.orderIndex);

    const sortedList: (Task & { stt: string; isParent: boolean })[] = [];

    parents.forEach((parent, parentIdx) => {
      const parentSTT = String(parentIdx + 1);
      sortedList.push({
        ...parent,
        stt: parentSTT,
        isParent: true,
      });

      const children = subtasks.filter(s => s.parentId === parent.id);
      children.sort((a, b) => a.orderIndex - b.orderIndex);

      children.forEach((child, childIdx) => {
        const childSTT = `${parentSTT}.${childIdx + 1}`;
        sortedList.push({
          ...child,
          stt: childSTT,
          isParent: false,
        });
      });
    });

    return sortedList;
  };

  const sortedTasks = getSortedTasks(currentTasks);

  // Parent progress calculation helper
  const getParentProgress = (parentId: string, tasks: Task[]) => {
    const subs = tasks.filter(t => t.parentId === parentId);
    if (subs.length === 0) return { percent: 0, completed: 0, total: 0 };
    const completed = subs.filter(t => t.status === "Hoàn thành").length;
    return {
      percent: Math.round((completed / subs.length) * 100),
      completed,
      total: subs.length,
    };
  };

  // Helper to add months to a YYYY-MM-DD date string
  const addMonths = (dateStr: string, months: number): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    d.setMonth(d.getMonth() + months);
    return d.toISOString().substring(0, 10);
  };

  // Helper to get resolved start date of any cycle
  const getCycleStartDate = (cycleNum: string) => {
    if (cycleMeta[cycleNum]?.startDate) {
      return cycleMeta[cycleNum].startDate;
    }
    const baseDate = config.startDate || plan?.start_time?.substring(0, 10) || new Date().toISOString().substring(0, 10);
    const monthsToAdd = config.interval === "yearly"
      ? (parseInt(cycleNum) - 1) * 12
      : config.interval === "quarterly" 
      ? (parseInt(cycleNum) - 1) * 3 
      : (parseInt(cycleNum) - 1);
    return addMonths(baseDate, monthsToAdd);
  };

  // Helper to format date into Vietnamese DD/MM/YYYY style
  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper to generate labels and sub-labels matching the mockup status tags
  const getCycleLabel = (cycleNum: string, percent: number) => {
    if (percent === 100) return `Lần ${cycleNum} (Completed):`;
    if (percent > 0) return `Lần ${cycleNum} (Hiện tại):`;
    return `Lần ${cycleNum} (Planned):`;
  };
  
  const getCycleStatusText = (percent: number) => {
    if (percent === 100) return "Hoàn thành";
    if (percent > 0) return "Đang thực hiện";
    return "Chưa bắt đầu";
  };

  // Save all cycles tasks to supabase as stringified JSON in the tickets.remark column
  const saveTasksToDB = async (updatedTasks: { [key: string]: Task[] }) => {
    try {
      const payload = {
        config,
        cycleMeta,
        tasks: updatedTasks
      };
      const remarkJSON = JSON.stringify(payload);
      await supabase
        .from("tickets")
        .update({ remark: remarkJSON })
        .eq("id", planId);
    } catch (e) {
      console.error("Error saving tasks to db:", e);
    }
  };

  // Save changes to database with explicit config/meta payload
  const saveTasksToDBWrapper = async (payload: { config: any; cycleMeta: any; tasks: any }) => {
    try {
      const remarkJSON = JSON.stringify(payload);
      await supabase
        .from("tickets")
        .update({ remark: remarkJSON })
        .eq("id", planId);
    } catch (e) {
      console.error("Error saving payload to db:", e);
    }
  };

  // Handle cycle date manual overrides
  const handleCycleDateChange = async (newDate: string) => {
    const updatedMeta = {
      ...cycleMeta,
      [activeCycle]: {
        ...cycleMeta[activeCycle],
        startDate: newDate
      }
    };
    setCycleMeta(updatedMeta);
    
    await saveTasksToDBWrapper({
      config,
      cycleMeta: updatedMeta,
      tasks: cycleTasks
    });
  };

  // Handle frequency and main start date changes
  const handleConfigChange = async (key: string, value: string) => {
    const updatedConfig = {
      ...config,
      [key]: value
    };
    setConfig(updatedConfig);
    
    await saveTasksToDBWrapper({
      config: updatedConfig,
      cycleMeta,
      tasks: cycleTasks
    });
  };

  // Open modal for adding task
  const handleAddTaskOpen = () => {
    setEditingTask(null);
    setForm({
      name: "",
      isSubtask: false,
      parentId: "",
      assignees: [],
      department: "",
      startDate: getCycleStartDate(activeCycle),
      endDate: getCycleStartDate(activeCycle),
      status: "Chưa bắt đầu",
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for editing task
  const handleEditTaskOpen = (task: Task) => {
    setEditingTask(task);
    setForm({
      name: task.name,
      isSubtask: !!task.parentId,
      parentId: task.parentId || "",
      assignees: task.assignees || [],
      department: task.department || "",
      startDate: task.startDate || "",
      endDate: task.endDate || "",
      status: task.status || "Chưa bắt đầu",
      notes: task.notes || "",
    });
    setIsModalOpen(true);
  };

  // Handle assignee selection change in multi-select dropdown
  const handleAssigneeChange = (selectedNames: string[]) => {
    setForm(f => ({ ...f, assignees: selectedNames }));
  };

  // Create or Update task
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      const updatedCycleTasks = { ...cycleTasks };
      const currentList = updatedCycleTasks[activeCycle] ? [...updatedCycleTasks[activeCycle]] : [];

      if (editingTask) {
        // Edit flow
        const taskIndex = currentList.findIndex(t => t.id === editingTask.id);
        if (taskIndex !== -1) {
          currentList[taskIndex] = {
            ...editingTask,
            name: form.name,
            parentId: form.isSubtask ? form.parentId : null,
            assignees: form.isSubtask ? form.assignees : [],
            department: form.department,
            startDate: form.startDate,
            endDate: form.endDate,
            status: form.isSubtask ? form.status : "Chưa bắt đầu",
            notes: form.notes,
          };
        }
      } else {
        // Add new flow
        const newTask: Task = {
          id: crypto.randomUUID(),
          parentId: form.isSubtask ? form.parentId : null,
          name: form.name,
          assignees: form.isSubtask ? form.assignees : [],
          department: form.department,
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.isSubtask ? form.status : "Chưa bắt đầu",
          notes: form.notes,
          orderIndex: currentList.length,
        };
        currentList.push(newTask);
      }

      updatedCycleTasks[activeCycle] = currentList;
      setCycleTasks(updatedCycleTasks);

      await saveTasksToDB(updatedCycleTasks);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error submitting task form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa công việc này không?")) return;

    try {
      const updatedCycleTasks = { ...cycleTasks };
      let currentList = updatedCycleTasks[activeCycle] ? [...updatedCycleTasks[activeCycle]] : [];

      // If it's a parent, remove all its subtasks too
      currentList = currentList.filter(t => t.id !== taskId && t.parentId !== taskId);

      updatedCycleTasks[activeCycle] = currentList;
      setCycleTasks(updatedCycleTasks);

      await saveTasksToDB(updatedCycleTasks);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // Trigger file dialog
  const triggerImportCSV = () => {
    fileInputRef.current?.click();
  };

  // Import CSV handler
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n");
      const importedTasks: Task[] = [];
      const parentIdMap: { [key: string]: string } = {}; // maps CSV STT to new UUIDs

      let orderIdx = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Custom parser to handle quotes & commas
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
        const cleanFields = matches.map(f => f.replace(/^"|"$/g, "").trim());

        if (cleanFields.length < 8) continue;

        const [stt, name, assigneesStr, department, startDate, endDate, status, notes] = cleanFields;

        const isSub = stt.includes(".");
        const assignees = assigneesStr ? assigneesStr.split(";").map(s => s.trim()).filter(Boolean) : [];

        const newId = crypto.randomUUID();

        let resolvedParentId: string | null = null;
        if (isSub) {
          const parentSTT = stt.split(".")[0];
          resolvedParentId = parentIdMap[parentSTT] || null;
        } else {
          parentIdMap[stt] = newId;
        }

        importedTasks.push({
          id: newId,
          parentId: resolvedParentId,
          name,
          assignees,
          department,
          startDate,
          endDate,
          status: status || "Chưa bắt đầu",
          notes,
          orderIndex: orderIdx++,
        });
      }

      if (importedTasks.length > 0) {
        const updatedCycleTasks = {
          ...cycleTasks,
          [activeCycle]: importedTasks,
        };
        setCycleTasks(updatedCycleTasks);
        await saveTasksToDB(updatedCycleTasks);
        alert(`Đã nhập thành công ${importedTasks.length} công việc từ tệp CSV!`);
      } else {
        alert("Không tìm thấy dữ liệu hợp lệ trong file CSV!");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset file input
  };

  // Export CSV handler
  const handleExportCSV = () => {
    const sorted = getSortedTasks(currentTasks);
    const headers = ["STT", "Công việc", "Người thực hiện", "Bộ phận", "Bắt đầu", "Hoàn thành", "Tình trạng", "Ghi chú"];
    const csvRows = [headers.join(",")];

    if (sorted.length === 0) {
      // Export template
      csvRows.push("1,Tên công việc chính mẫu,,Bộ phận mẫu,2026-07-07,2026-07-08,Chưa bắt đầu,Ghi chú mẫu");
      csvRows.push("1.1,Tên công việc con mẫu,Tên nhân viên mẫu,Bộ phận mẫu,2026-07-07,2026-07-08,Chưa bắt đầu,Ghi chú mẫu");
    } else {
      sorted.forEach(t => {
        const assigneesStr = t.assignees ? t.assignees.join(";") : "";
        const row = [
          t.stt,
          `"${t.name.replace(/"/g, '""')}"`,
          `"${assigneesStr.replace(/"/g, '""')}"`,
          `"${t.department.replace(/"/g, '""')}"`,
          t.startDate || "",
          t.endDate || "",
          t.status || "",
          `"${(t.notes || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });
    }

    const csvContent = "\ufeff" + csvRows.join("\n"); // Include BOM for UTF-8 compatibility
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", sorted.length === 0 ? "Mau_KeHoach_BaoTri.csv" : `BaoTri_Lan_${activeCycle}_PlanID_${planId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badges colors helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hoàn thành":
        return "bg-green-50 text-green-700 border border-green-200";
      case "Đang thực hiện":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Tạm dừng":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Chưa bắt đầu":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-slate-50 text-slate-500 border border-slate-200";
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden">
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
          }
        `}} />

        {/* Breadcrumbs and Title Subheader */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/dashboard")}>Trang chủ</span>
              <span>&gt;</span>
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/maintenance")}>Bảo trì</span>
              <span>&gt;</span>
              <span className="text-slate-500">Kế hoạch chi tiết</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
              {plan?.customer?.name || plan?.customer_name || "Hợp đồng bảo trì"}
            </h1>
          </div>

          <button 
            onClick={() => router.push("/maintenance")}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 shadow-xs transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Split Panels Body (2-Column Layout) */}
        <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Column 1: DANH SÁCH LẦN BẢO TRÌ */}
        <section className="w-80 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-slate-50 px-4 py-3.5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
              <span>DANH SÁCH LẦN BẢO TRÌ</span>
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsConfigModalOpen(true)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-blue-600 transition cursor-pointer"
                title="Cấu hình kế hoạch"
              >
                <Settings size={16} />
              </button>
              <span className="text-slate-400">
                <ClipboardList size={18} />
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {Array.from({ length: totalCycles }).map((_, index) => {
              const cycleNum = String(index + 1);
              const isActive = activeCycle === cycleNum;
              
              // Get tasks stats for cycle
              const cycleTaskList = cycleTasks[cycleNum] || [];
              const subtasks = cycleTaskList.filter(t => t.parentId);
              const totalSubs = subtasks.length;
              const completedSubs = subtasks.filter(t => t.status === "Hoàn thành").length;
              const percent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
              const cycleStartDate = getCycleStartDate(cycleNum);

              const label = getCycleLabel(cycleNum, percent);
              const statusText = getCycleStatusText(percent);

              return (
                <button
                  key={index}
                  onClick={() => setActiveCycle(cycleNum)}
                  className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-2 transition cursor-pointer ${
                    isActive 
                      ? "bg-blue-50/50 border-blue-600 shadow-sm" 
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${isActive ? "text-blue-900" : "text-slate-800"}`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Ngày: {formatDateVN(cycleStartDate)}
                      </span>
                    </div>

                    {percent > 0 ? (
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          percent === 100 
                            ? "bg-green-100 text-green-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {percent}%
                        </span>
                        <span className={`text-[10px] font-bold mt-1 ${
                          percent === 100 ? "text-green-600" : "text-blue-600"
                        }`}>
                          {statusText}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-slate-300">
                          <CheckCircle2 size={14} className="opacity-45" />
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">
                          Chưa bắt đầu
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar inside card */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent === 100 ? "bg-green-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${percent || 0}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Column 2: CHI TIẾT CÔNG VIỆC — LẦN X */}
        <section className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase">CHI TIẾT CÔNG VIỆC — LẦN {activeCycle}</h2>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Thao tác dữ liệu group */}
              <div className="flex items-center border border-slate-200 rounded-lg p-1.5 bg-slate-50/50 gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1 mr-1">Thao tác dữ liệu</span>
                <button 
                  onClick={handleAddTaskOpen}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-3xs cursor-pointer"
                >
                  <Plus size={10} />
                  <span>Thêm công việc</span>
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition shadow-3xs cursor-pointer"
                >
                  <Download size={10} />
                  <span>Export</span>
                </button>
                <button 
                  onClick={triggerImportCSV}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition shadow-3xs cursor-pointer"
                >
                  <Upload size={10} />
                  <span>Import</span>
                </button>
              </div>

              {/* Ngày bắt đầu của kỳ */}
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1.5 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày bắt đầu:</span>
                <input 
                  type="date" 
                  value={getCycleStartDate(activeCycle)}
                  onChange={(e) => handleCycleDateChange(e.target.value)}
                  className="px-2 py-0.5 border border-slate-200 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span>Đang tải dữ liệu kế hoạch...</span>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-12 text-center bg-white shadow-3xs">
              <div className="w-48 h-36 flex items-center justify-center relative mb-4">
                <svg width="150" height="120" viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <path d="M120 15H30C21.7 15 15 21.7 15 30V90C15 98.3 21.7 105 30 105H120C128.3 105 135 98.3 135 90V30C135 21.7 128.3 15 120 15Z" fill="#F1F5F9"/>
                  <rect x="35" y="35" width="80" height="8" rx="4" fill="#CBD5E1"/>
                  <rect x="35" y="55" width="60" height="8" rx="4" fill="#CBD5E1"/>
                  <rect x="35" y="75" width="70" height="8" rx="4" fill="#CBD5E1"/>
                  <circle cx="115" cy="55" r="15" fill="#3B82F6" className="animate-pulse"/>
                  <path d="M111 55L114 58L119 52" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">CHƯA CÓ CÔNG VIỆC NÀO TRONG LẦN BẢO TRÌ NÀY</p>
              <p className="text-xs text-slate-400 mt-1 mb-6">Bắt đầu bằng cách thêm mới kế hoạch bảo trì.</p>
              
              <button 
                onClick={handleAddTaskOpen}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm hover:shadow-md"
              >
                + Thêm công việc đầu tiên
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto border border-slate-100 rounded-lg shadow-2xs custom-scrollbar">
              <table className="w-full text-sm border-collapse text-left">
                <thead className="bg-slate-50 text-xs text-slate-500 font-semibold border-b border-slate-200/60 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">STT</th>
                    <th className="px-4 py-3">Công việc</th>
                    <th className="px-4 py-3">Người thực hiện</th>
                    <th className="px-4 py-3">Bộ phận</th>
                    <th className="px-4 py-3">Bắt đầu</th>
                    <th className="px-4 py-3">Hoàn thành</th>
                    <th className="px-4 py-3 w-48">Tình trạng</th>
                    <th className="px-4 py-3">Ghi chú</th>
                    <th className="px-4 py-3 w-24 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTasks.map((t) => {
                    if (t.isParent) {
                      const progress = getParentProgress(t.id, currentTasks);
                      return (
                        <tr key={t.id} className="bg-slate-50/50 hover:bg-slate-50 transition border-b border-slate-100">
                          <td className="px-4 py-3.5 text-center font-bold text-slate-700">{t.stt}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-800 text-base">{t.name}</td>
                          <td className="px-4 py-3.5 text-slate-400">—</td>
                          <td className="px-4 py-3.5 text-slate-400">—</td>
                          <td className="px-4 py-3.5 text-slate-500 font-medium text-xs">
                            {t.startDate ? new Date(t.startDate).toLocaleDateString("vi-VN", {day: 'numeric', month: 'short'}) : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 font-medium text-xs">
                            {t.endDate ? new Date(t.endDate).toLocaleDateString("vi-VN", {day: 'numeric', month: 'short', year: 'numeric'}) : "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300/30">
                                <div 
                                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                  style={{ width: `${progress.percent}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-blue-600 min-w-[32px]">{progress.percent}%</span>
                              <span className="text-[10px] text-slate-400">({progress.completed}/{progress.total})</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-xs italic">{t.notes || "—"}</td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleEditTaskOpen(t)}
                                className="p-1 hover:bg-white text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(t.id)}
                                className="p-1 hover:bg-white text-slate-500 hover:text-red-600 rounded transition cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/40 transition">
                          <td className="px-4 py-3 text-center text-slate-400 pl-6">{t.stt}</td>
                          <td className="px-4 py-3 text-slate-700 pl-6">{t.name}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium">
                            {t.assignees && t.assignees.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {t.assignees.map((a, aIdx) => (
                                  <span key={aIdx} className="text-blue-600 hover:underline cursor-pointer">
                                    {a}{aIdx < t.assignees.length - 1 ? "," : ""}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">— nhập</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{t.department || "—"}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {t.startDate ? new Date(t.startDate).toLocaleDateString("vi-VN", {day: 'numeric', month: 'short'}) : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {t.endDate ? new Date(t.endDate).toLocaleDateString("vi-VN", {day: 'numeric', month: 'short', year: 'numeric'}) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(t.status)}`}>
                              {t.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{t.notes || "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => handleEditTaskOpen(t)}
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(t.id)}
                                className="p-1 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded transition cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportCSV} 
        accept=".csv" 
        className="hidden" 
      />

      {/* Task Creation/Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {editingTask ? "Cập nhật công việc" : "Thêm công việc mới"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Task Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tên công việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nhập tên công việc..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Task Level Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Loại công việc</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      checked={!form.isSubtask}
                      onChange={() => setForm(f => ({ ...f, isSubtask: false, parentId: "" }))}
                      className="cursor-pointer accent-blue-600"
                    />
                    Công việc chính
                  </label>
                  <label className="flex items-center gap-1.5 text-sm font-medium cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      checked={form.isSubtask}
                      onChange={() => setForm(f => ({ ...f, isSubtask: true }))}
                      className="cursor-pointer accent-blue-600"
                    />
                    Công việc con
                  </label>
                </div>
              </div>

              {/* Parent Selector if it's a subtask */}
              {form.isSubtask && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Thuộc công việc chính <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.parentId}
                    onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    required
                  >
                    <option value="">-- Chọn công việc chính --</option>
                    {currentTasks.filter(t => !t.parentId).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assignees (Multi-select) */}
              {form.isSubtask && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Người thực hiện</label>
                  <select
                    multiple
                    value={form.assignees}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      handleAssigneeChange(selected);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[80px]"
                  >
                    {staffList.map(s => (
                      <option key={s.id} value={s.ten_nhan_su}>
                        {s.ten_nhan_su}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Giữ Ctrl (hoặc Cmd) để chọn nhiều người.</span>
                </div>
              )}

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bộ phận</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Ví dụ: Support, IT..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngày hoàn thành</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Status Select for Subtasks */}
              {form.isSubtask && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tình trạng</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  >
                    <option value="Chưa bắt đầu">CHƯA BẮT ĐẦU</option>
                    <option value="Đang thực hiện">ĐANG THỰC HIỆN</option>
                    <option value="Hoàn thành">HOÀN THÀNH</option>
                    <option value="Tạm dừng">TẠM DỪNG</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Ghi chú thêm về công việc..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 cursor-pointer shadow-2xs"
                >
                  {submitting ? "Đang lưu..." : (editingTask ? "Cập nhật" : "Tạo công việc")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configuration Popup Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <h2 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-1.5">
                <Calculator size={16} className="text-blue-600" />
                <span>CẤU HÌNH KẾ HOẠCH</span>
              </h2>
              <button onClick={() => setIsConfigModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày bắt đầu lần 1:</label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={e => handleConfigChange("startDate", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tần suất bảo trì:</label>
                <select
                  value={config.interval}
                  onChange={e => handleConfigChange("interval", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="monthly">Hàng tháng (Tháng)</option>
                  <option value="quarterly">Hàng quý (Quý)</option>
                  <option value="yearly">Hàng năm (Năm)</option>
                </select>
              </div>
              <div className="text-[10px] text-slate-400 italic">
                * (Tự động tính ngày lần tiếp theo)
              </div>
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-3xs"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </MainLayout>
  );
}

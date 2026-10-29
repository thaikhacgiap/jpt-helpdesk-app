"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/main-layout";
import StaffSearchSelect from "@/components/common/staff-search-select";
import { 
  ArrowLeft, Plus, Download, Upload, Pencil, Trash2, X,
  CheckCircle2, Clock, Calculator, Settings, ClipboardList, Calendar,
  ChevronDown, ChevronRight, ArrowUpDown, Info, Lightbulb, ListOrdered,
  CircleDot, PauseCircle, FileSpreadsheet
} from "lucide-react";
import { 
  generateDefaultTasks, 
  getSortedHierarchicalTasks, 
  MaintenanceTask,
  HierarchicalTask 
} from "@/lib/maintenance-template";

type Task = MaintenanceTask;

interface Recommendation {
  id: string;
  category: string;       // Hardware, Database, Software, Network, Security, Khác
  systemName: string;     // Tên hệ thống
  nodeName: string;       // Tên node
  issue: string;          // Vấn đề
  recommendation: string; // Khuyến nghị
  customerOpinion: string; // Ý kiến khách hàng
  status: string;         // Chưa xử lý, Đang xử lý, Đã xử lý, Bỏ qua
}

const formatVNStart = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} thg ${d.getMonth() + 1}`;
};

const formatVNEnd = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
};

const formatCycleDateInputDisplay = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<string>("1");
  const [cycleTasks, setCycleTasks] = useState<{ [key: string]: Task[] }>({});
  const [cycleRecs, setCycleRecs] = useState<{ [key: string]: Recommendation[] }>({});
  const [collapsedParents, setCollapsedParents] = useState<{ [key: string]: boolean }>({});
  
  const [activeTab, setActiveTab] = useState<"tasks" | "recommendations">("tasks");
  
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

  // Recommendations Modal states
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<Recommendation | null>(null);
  const [recSubmitting, setRecSubmitting] = useState(false);
  const [recForm, setRecForm] = useState({
    category: "Hardware",
    systemName: "",
    nodeName: "",
    issue: "",
    recommendation: "",
    customerOpinion: "",
    status: "Chưa xử lý",
  });

  // Form states
  const [form, setForm] = useState({
    name: "",
    parentId: "",
    assignees: [] as string[],
    department: "",
    startDate: "",
    endDate: "",
    actualStartDate: "",
    actualEndDate: "",
    status: "Chưa bắt đầu",
    progress: 0,
    notes: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load plan details from Supabase
  const loadPlanDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*, customer:customers(id, name)")
        .eq("id", planId)
        .single();

      if (error || !data) {
        console.error("Error fetching plan:", error);
        router.push("/maintenance");
        return;
      }

      setPlan(data);

      // Parse tasks, config, and recommendations from the remark column
      let tasksData: { [key: string]: Task[] } = {};
      let recommendationsData: { [key: string]: Recommendation[] } = {};
      let parsedConfig = { 
        interval: "monthly", 
        startDate: data.start_time ? data.start_time.substring(0, 10) : new Date().toISOString().substring(0, 10) 
      };
      let parsedMeta = {};

      if (data.remark) {
        try {
          const parsed = JSON.parse(data.remark);
          if (parsed && (parsed.tasks !== undefined || parsed.recommendations !== undefined)) {
            tasksData = parsed.tasks || {};
            recommendationsData = parsed.recommendations || {};
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
      setCycleRecs(recommendationsData);
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
  const sortedTasks = getSortedHierarchicalTasks(currentTasks);

  // Helper to determine if a task is visible given collapsed parents
  const isTaskVisible = (task: HierarchicalTask, allTasks: MaintenanceTask[]) => {
    let curr = task.parentId;
    while (curr) {
      if (collapsedParents[curr]) return false;
      const parent = allTasks.find(t => t.id === curr);
      curr = parent ? parent.parentId : null;
    }
    return true;
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

  // Helper to calculate progress of a specific cycle
  const calculateCycleProgress = (tasks: Task[]) => {
    if (!tasks || tasks.length === 0) return 0;
    
    // Find parent tasks with subtasks
    const parentIdsWithChildren = new Set(
      tasks.map(t => t.parentId).filter(Boolean) as string[]
    );
    
    // Leaf tasks are subtasks OR parent tasks with no subtasks
    const leafTasks = tasks.filter(t => !parentIdsWithChildren.has(t.id));
    
    if (leafTasks.length === 0) return 0;
    
    const completed = leafTasks.filter(t => t.status === "Hoàn thành").length;
    return Math.round((completed / leafTasks.length) * 100);
  };

  // Helper to calculate overall plan progress
  // Chỉ tính % nếu lần/kỳ thực hiện hoàn thành (tức calculateCycleProgress(cycleTaskList) === 100) trên tổng số lần thực hiện
  const calculateOverallProgress = (tasksData: { [key: string]: Task[] }, total: number) => {
    if (total <= 0) return 0;
    let completedCycles = 0;
    for (let i = 1; i <= total; i++) {
      const cycleNum = String(i);
      const cycleTaskList = tasksData[cycleNum] || [];
      if (calculateCycleProgress(cycleTaskList) === 100) {
        completedCycles++;
      }
    }
    return Math.min(100, Math.round((completedCycles / total) * 100));
  };

  // Helper to determine the current period based on completed cycles
  const determineCurrentPeriod = (tasksData: { [key: string]: Task[] }, total: number) => {
    for (let i = 1; i <= total; i++) {
      const cycleNum = String(i);
      const cycleTaskList = tasksData[cycleNum] || [];
      const percent = calculateCycleProgress(cycleTaskList);
      if (percent < 100) {
        return i;
      }
    }
    return total; // If all completed, return last period
  };

  // Parent progress calculation helper
  const getParentProgress = (parentId: string, tasks: Task[]) => {
    const subs = tasks.filter(t => t.parentId === parentId);
    if (subs.length === 0) {
      // If a parent has no subtasks, check its own status
      const parentTask = tasks.find(t => t.id === parentId);
      const isCompleted = parentTask?.status === "Hoàn thành";
      return {
        percent: isCompleted ? 100 : 0,
        completed: isCompleted ? 1 : 0,
        total: 1,
        hasSubtasks: false
      };
    }
    const completed = subs.filter(t => t.status === "Hoàn thành").length;
    return {
      percent: Math.round((completed / subs.length) * 100),
      completed,
      total: subs.length,
      hasSubtasks: true
    };
  };

  // Save all plan data to Supabase (remark, progress, sla_time, tt_status)
  const savePlanData = async (
    updatedTasks: { [key: string]: Task[] },
    updatedRecs: { [key: string]: Recommendation[] },
    updatedConfig = config,
    updatedMeta = cycleMeta
  ) => {
    try {
      const payload = {
        config: updatedConfig,
        cycleMeta: updatedMeta,
        tasks: updatedTasks,
        recommendations: updatedRecs
      };
      const remarkJSON = JSON.stringify(payload);
      
      const overallProgress = calculateOverallProgress(updatedTasks, totalCycles);
      const currentPeriodVal = determineCurrentPeriod(updatedTasks, totalCycles);
      
      let newStatus = plan?.tt_status || "New";
      if (overallProgress === 100 && totalCycles > 0 && plan?.tt_status !== "Closed") {
        newStatus = "Completed";
      } else if (plan?.tt_status !== "On Hold" && plan?.tt_status !== "Closed") {
        let hasAnyActivity = overallProgress > 0;
        if (!hasAnyActivity) {
          for (let i = 1; i <= totalCycles; i++) {
            const list = updatedTasks[String(i)] || [];
            if (list.some(t => t.status === "Đang thực hiện" || t.status === "Hoàn thành")) {
              hasAnyActivity = true;
              break;
            }
          }
        }
        newStatus = hasAnyActivity ? "Processing" : (plan?.tt_status || "New");
      }
      
      const updateData: any = {
        remark: remarkJSON,
        progress: `${overallProgress}%`,
        sla_time: String(currentPeriodVal),
        tt_status: newStatus
      };
      
      const { error } = await supabase
        .from("tickets")
        .update(updateData)
        .eq("id", planId);

      if (error) {
        console.error("Error updating ticket in DB:", error);
      } else {
        setPlan((prev: any) => prev ? { ...prev, ...updateData } : null);
      }
    } catch (e) {
      console.error("Error saving plan data:", e);
    }
  };

  // Save all cycles tasks to supabase
  const saveTasksToDB = async (updatedTasks: { [key: string]: Task[] }) => {
    await savePlanData(updatedTasks, cycleRecs);
  };

  // Save changes to database with explicit config/meta payload
  const saveTasksToDBWrapper = async (payload: { config: any; cycleMeta: any; tasks: any }) => {
    await savePlanData(payload.tasks, cycleRecs, payload.config, payload.cycleMeta);
  };

  const saveRecsToDB = async (updatedRecs: { [key: string]: Recommendation[] }) => {
    await savePlanData(cycleTasks, updatedRecs);
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

  // Helper to get all descendant tasks
  const getDescendantsOf = (taskId: string, allTasks: HierarchicalTask[]): HierarchicalTask[] => {
    const result: HierarchicalTask[] = [];
    const queue = [taskId];
    while (queue.length > 0) {
      const currId = queue.shift()!;
      const directChildren = allTasks.filter(t => t.parentId === currId);
      for (const child of directChildren) {
        result.push(child);
        queue.push(child.id);
      }
    }
    return result;
  };

  const getTaskComputedStats = (task: HierarchicalTask, allSortedTasks: HierarchicalTask[]) => {
    if (!task.hasChildren) {
      const progress = task.progress !== undefined 
        ? task.progress 
        : (task.status === "Hoàn thành" ? 100 : (task.status === "Đang Thực Hiện" || task.status === "Đang thực hiện") ? 50 : 0);
      return {
        isAuto: false,
        progress,
        startDate: task.startDate,
        endDate: task.endDate,
        actualStartDate: task.actualStartDate,
        actualEndDate: task.actualEndDate,
        assignees: task.assignees || [],
        status: task.status || "Chưa bắt đầu",
      };
    }

    const descendants = getDescendantsOf(task.id, allSortedTasks);
    // Leaf descendants (tasks without children)
    const leafDescendants = descendants.filter(d => !d.hasChildren);
    const targetList = leafDescendants.length > 0 ? leafDescendants : descendants;

    // Progress
    let progress = 0;
    if (targetList.length > 0) {
      const totalProg = targetList.reduce((sum, item) => {
        const p = item.progress !== undefined 
          ? item.progress 
          : (item.status === "Hoàn thành" ? 100 : (item.status === "Đang Thực Hiện" || item.status === "Đang thực hiện") ? 50 : 0);
        return sum + p;
      }, 0);
      progress = Math.round(totalProg / targetList.length);
    }

    // Start date: earliest start date
    const validStarts = targetList.map(t => t.startDate).filter(Boolean).sort();
    const startDate = validStarts[0] || task.startDate || "";

    // End date: latest end date
    const validEnds = targetList.map(t => t.endDate).filter(Boolean).sort();
    const endDate = validEnds[validEnds.length - 1] || task.endDate || "";

    // Actual end date: latest actual end date only if ALL are completed (progress === 100 or status === 'Hoàn thành')
    const allCompleted = targetList.length > 0 && targetList.every(t => (t.progress === 100 || t.status === "Hoàn thành"));
    const validActualEnds = targetList.map(t => t.actualEndDate).filter(Boolean).sort();
    const actualEndDate = allCompleted && validActualEnds.length > 0 ? validActualEnds[validActualEnds.length - 1] : "";

    // Assignees: unique union of assignees
    const allAssignees = targetList.flatMap(t => t.assignees || []);
    const assignees = [...new Set(allAssignees.map(a => a.trim()).filter(Boolean))];

    // Status
    const status = progress === 100 ? "Hoàn thành" : progress > 0 ? "Đang Thực Hiện" : "Chưa bắt đầu";

    return {
      isAuto: true,
      progress,
      startDate,
      endDate,
      actualStartDate: "",
      actualEndDate,
      assignees,
      status,
    };
  };

  // Fast inline update for any task field directly on table
  const updateTaskField = async (taskId: string, field: keyof Task, value: any) => {
    const currentList = cycleTasks[activeCycle] ? [...cycleTasks[activeCycle]] : [];
    const idx = currentList.findIndex(t => t.id === taskId);
    if (idx === -1) return;

    const currentTask = currentList[idx];
    let updatedTask = {
      ...currentTask,
      [field]: value,
    };

    // Auto sync between progress and status & actualEndDate
    if (field === "progress") {
      const pVal = Number(value) || 0;
      if (pVal === 100) {
        updatedTask.status = "Hoàn thành";
        if (!updatedTask.actualEndDate) {
          updatedTask.actualEndDate = new Date().toISOString().substring(0, 10);
        }
      } else if (pVal > 0) {
        updatedTask.status = "Đang Thực Hiện";
      } else {
        updatedTask.status = "Chưa bắt đầu";
      }
    } else if (field === "status") {
      if (value === "Hoàn thành") {
        updatedTask.progress = 100;
        if (!updatedTask.actualEndDate) {
          updatedTask.actualEndDate = new Date().toISOString().substring(0, 10);
        }
      } else if (value === "Đang Thực Hiện" || value === "Đang thực hiện") {
        if (!updatedTask.progress || updatedTask.progress === 0 || updatedTask.progress === 100) {
          updatedTask.progress = 50;
        }
      } else if (value === "Chưa bắt đầu") {
        updatedTask.progress = 0;
      }
    }

    currentList[idx] = updatedTask;

    const updatedCycleTasks = {
      ...cycleTasks,
      [activeCycle]: currentList,
    };

    setCycleTasks(updatedCycleTasks);

    try {
      await saveTasksToDB(updatedCycleTasks);
    } catch (err) {
      console.error("Error updating task field inline:", err);
    }
  };

  // Quick add helpers for Phase, Main task, Sub task
  const handleQuickAddPhase = () => {
    handleAddTaskOpen("");
  };

  const handleQuickAddMainTask = () => {
    const lastPhase = [...sortedTasks].reverse().find(t => t.level === 1);
    handleAddTaskOpen(lastPhase ? lastPhase.id : "");
  };

  const handleQuickAddSubTask = () => {
    const lastMain = [...sortedTasks].reverse().find(t => t.level === 2);
    handleAddTaskOpen(lastMain ? lastMain.id : "");
  };

  // Open modal for adding task (optional defaultParentId for nesting)
  const handleAddTaskOpen = (defaultParentId: string = "") => {
    setEditingTask(null);
    setForm({
      name: "",
      parentId: defaultParentId || "",
      assignees: [],
      department: "",
      startDate: getCycleStartDate(activeCycle),
      endDate: getCycleStartDate(activeCycle),
      actualStartDate: "",
      actualEndDate: "",
      status: "Chưa bắt đầu",
      progress: 0,
      notes: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for editing task
  const handleEditTaskOpen = (task: Task) => {
    setEditingTask(task);
    setForm({
      name: task.name,
      parentId: task.parentId || "",
      assignees: task.assignees || [],
      department: task.department || "",
      startDate: task.startDate || "",
      endDate: task.endDate || "",
      actualStartDate: task.actualStartDate || "",
      actualEndDate: task.actualEndDate || "",
      status: task.status || "Chưa bắt đầu",
      progress: task.progress !== undefined ? task.progress : (task.status === "Hoàn thành" ? 100 : (task.status === "Đang Thực Hiện" || task.status === "Đang thực hiện") ? 50 : 0),
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
            name: form.name.trim(),
            parentId: form.parentId || null,
            assignees: form.assignees || [],
            department: form.department,
            startDate: form.startDate,
            endDate: form.endDate,
            actualStartDate: form.actualStartDate || "",
            actualEndDate: form.actualEndDate || "",
            status: form.status || "Chưa bắt đầu",
            progress: Number(form.progress) || 0,
            notes: form.notes,
          };
        }
      } else {
        // Add new flow
        const newTask: Task = {
          id: crypto.randomUUID(),
          parentId: form.parentId || null,
          name: form.name.trim(),
          assignees: form.assignees || [],
          department: form.department,
          startDate: form.startDate,
          endDate: form.endDate,
          actualStartDate: form.actualStartDate || "",
          actualEndDate: form.actualEndDate || "",
          status: form.status || "Chưa bắt đầu",
          progress: Number(form.progress) || 0,
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

  // Delete task and all its descendants recursively
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa công việc này không? Tất cả công việc con trực thuộc cũng sẽ bị xóa.")) return;

    try {
      const updatedCycleTasks = { ...cycleTasks };
      let currentList = updatedCycleTasks[activeCycle] ? [...updatedCycleTasks[activeCycle]] : [];

      // Collect all descendant ids
      const toDelete = new Set<string>([taskId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const t of currentList) {
          if (t.parentId && toDelete.has(t.parentId) && !toDelete.has(t.id)) {
            toDelete.add(t.id);
            changed = true;
          }
        }
      }

      currentList = currentList.filter(t => !toDelete.has(t.id));

      updatedCycleTasks[activeCycle] = currentList;
      setCycleTasks(updatedCycleTasks);

      await saveTasksToDB(updatedCycleTasks);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };



  // Open modal for adding recommendation
  const handleRecCreateOpen = () => {
    setEditingRec(null);
    setRecForm({
      category: "Hardware",
      systemName: "",
      nodeName: "",
      issue: "",
      recommendation: "",
      customerOpinion: "",
      status: "Chưa xử lý",
    });
    setIsRecModalOpen(true);
  };

  // Open modal for editing recommendation
  const handleRecEditOpen = (rec: Recommendation) => {
    setEditingRec(rec);
    setRecForm({
      category: rec.category || "Hardware",
      systemName: rec.systemName || "",
      nodeName: rec.nodeName || "",
      issue: rec.issue || "",
      recommendation: rec.recommendation || "",
      customerOpinion: rec.customerOpinion || "",
      status: rec.status || "Chưa xử lý",
    });
    setIsRecModalOpen(true);
  };

  // Delete recommendation
  const handleRecDelete = async (recId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khuyến nghị này không?")) return;
    try {
      const updatedRecs = { ...cycleRecs };
      const currentList = updatedRecs[activeCycle] ? [...updatedRecs[activeCycle]] : [];
      const newList = currentList.filter(r => r.id !== recId);
      
      updatedRecs[activeCycle] = newList;
      setCycleRecs(updatedRecs);
      
      await saveRecsToDB(updatedRecs);
    } catch (err) {
      console.error("Error deleting recommendation:", err);
    }
  };

  // Form submit handler for recommendation
  const handleRecFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecSubmitting(true);
    try {
      const updatedRecs = { ...cycleRecs };
      const currentList = updatedRecs[activeCycle] ? [...updatedRecs[activeCycle]] : [];

      if (editingRec) {
        // Edit flow
        const idx = currentList.findIndex(r => r.id === editingRec.id);
        if (idx !== -1) {
          currentList[idx] = {
            ...editingRec,
            category: recForm.category,
            systemName: recForm.systemName,
            nodeName: recForm.nodeName,
            issue: recForm.issue,
            recommendation: recForm.recommendation,
            customerOpinion: recForm.customerOpinion,
            status: recForm.status,
          };
        }
      } else {
        // Add new flow
        const newRec: Recommendation = {
          id: crypto.randomUUID(),
          category: recForm.category,
          systemName: recForm.systemName,
          nodeName: recForm.nodeName,
          issue: recForm.issue,
          recommendation: recForm.recommendation,
          customerOpinion: recForm.customerOpinion,
          status: recForm.status,
        };
        currentList.push(newRec);
      }

      updatedRecs[activeCycle] = currentList;
      setCycleRecs(updatedRecs);

      await saveRecsToDB(updatedRecs);
      setIsRecModalOpen(false);
    } catch (err) {
      console.error("Error submitting recommendation:", err);
    } finally {
      setRecSubmitting(false);
    }
  };

  const getRecStatusBadge = (status: string) => {
    switch (status) {
      case "Đã xử lý":
        return "bg-green-50 text-green-700 border border-green-200";
      case "Đang xử lý":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Bỏ qua":
        return "bg-slate-50 text-slate-500 border border-slate-200";
      case "Chưa xử lý":
      default:
        return "bg-amber-50 text-amber-700 border border-amber-200";
    }
  };

  // Trigger file dialog for Excel/CSV import
  const triggerImportFile = () => {
    fileInputRef.current?.click();
  };

  // Helper to normalize dates for import
  const normalizeImportDate = (str: string): string => {
    if (!str) return "";
    const clean = str.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.substring(0, 10);
    const parts = clean.split(/[\/\-]/);
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().substring(0, 10);
    return clean;
  };

  // Import file handler (supports .xlsx, .xls, .csv via parse-file API)
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/system/parse-file", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể đọc dữ liệu từ tệp.");
      }

      const rows: Record<string, any>[] = data.rows || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("Tệp không chứa dữ liệu hoặc bảng tính bị trống.");
      }

      const getCell = (row: Record<string, any>, candidateKeys: string[]) => {
        for (const k of Object.keys(row)) {
          const cleanK = k.toLowerCase().trim();
          for (const cand of candidateKeys) {
            if (cleanK === cand || cleanK.includes(cand)) {
              const val = row[k];
              return val !== undefined && val !== null ? String(val).trim() : "";
            }
          }
        }
        return "";
      };

      const importedTasks: MaintenanceTask[] = [];
      const sttToIdMap: Record<string, string> = {};

      rows.forEach((row, idx) => {
        const name = getCell(row, ["công việc", "tên công việc", "nội dung", "hạng mục", "task", "title", "name", "cong viec"]);
        if (!name) return; // Skip empty row

        const rawStt = getCell(row, ["stt", "no", "số tt", "số thứ tự", "index"]);
        const cleanStt = rawStt.replace(/\.+$/, "").trim();
        const assigneesStr = getCell(row, ["người thực hiện", "phụ trách", "nhân sự", "assignee", "owner", "nguoi thuc hien"]);
        const assignees = assigneesStr ? assigneesStr.split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
        const startDate = normalizeImportDate(getCell(row, ["bắt đầu (dự kiến)", "dự kiến bắt đầu", "bắt đầu", "ngày bắt đầu", "start date", "start", "bat dau"]));
        const endDate = normalizeImportDate(getCell(row, ["kết thúc (dự kiến)", "dự kiến kết thúc", "kết thúc", "hoàn thành", "ngày kết thúc", "hạn chót", "end date", "end", "ket thuc"]));
        const actualStartDate = normalizeImportDate(getCell(row, ["bắt đầu (thực tế)", "thực tế bắt đầu", "bắt đầu thực tế", "actual start", "actual start date", "thuc te bat dau"]));
        const actualEndDate = normalizeImportDate(getCell(row, ["kết thúc (thực tế)", "thực tế kết thúc", "kết thúc thực tế", "actual end", "actual end date", "thuc te ket thuc"]));
        const progressRaw = getCell(row, ["% hoàn thành", "tiến độ", "tiến độ (%)", "progress", "%", "tien do"]);
        const progressNum = progressRaw ? parseInt(progressRaw.replace(/[^0-9]/g, ""), 10) : undefined;
        const status = getCell(row, ["tình trạng", "trạng thái", "status", "tinh trang"]);
        const notes = getCell(row, ["ghi chú", "notes", "note", "comment", "ghi chu"]);

        const newId = crypto.randomUUID();
        let resolvedParentId: string | null = null;

        if (cleanStt.includes(".")) {
          const parentStt = cleanStt.substring(0, cleanStt.lastIndexOf("."));
          resolvedParentId = sttToIdMap[parentStt] || null;
        }

        if (cleanStt) {
          sttToIdMap[cleanStt] = newId;
        }

        const calculatedProgress = progressNum !== undefined 
          ? progressNum 
          : (status === "Hoàn thành" ? 100 : (status === "Đang Thực Hiện" || status === "Đang thực hiện" ? 50 : 0));

        importedTasks.push({
          id: newId,
          parentId: resolvedParentId,
          name,
          assignees,
          department: "",
          startDate,
          endDate,
          actualStartDate,
          actualEndDate,
          status: status || "",
          progress: calculatedProgress,
          notes,
          orderIndex: idx,
        });
      });

      if (importedTasks.length === 0) {
        throw new Error("Không tìm thấy dòng công việc hợp lệ nào trong tệp.");
      }

      const updatedCycleTasks = {
        ...cycleTasks,
        [activeCycle]: importedTasks,
      };
      setCycleTasks(updatedCycleTasks);
      await saveTasksToDB(updatedCycleTasks);
      alert(`Đã nhập thành công ${importedTasks.length} công việc từ tệp!`);
    } catch (err: any) {
      console.error("Import file error:", err);
      alert("Lỗi khi nhập tệp: " + (err?.message || "Không xác định"));
    } finally {
      e.target.value = "";
    }
  };

  // Export Excel handler (matching user's template design)
  const handleExportExcel = async (isTemplate = false) => {
    try {
      const res = await fetch("/api/maintenance/export-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTitle: plan?.title || "Kế hoạch bảo trì",
          cycleNum: activeCycle,
          customerName: plan?.customer?.name || plan?.customer_name || "",
          contractNo: plan?.contract_no || "",
          startDate: getCycleStartDate(activeCycle),
          tasks: isTemplate ? [] : currentTasks,
          isTemplate,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Không thể xuất file Excel.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = isTemplate 
        ? "Mau_Ke_Hoach_Bao_Tri.xlsx" 
        : `Ke_Hoach_Bao_Tri_Ky_${activeCycle}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export Excel error:", err);
      alert(err.message || "Lỗi khi xuất file Excel");
    }
  };

  // Export CSV handler matching the 9 columns
  const handleExportCSV = () => {
    const sorted = getSortedHierarchicalTasks(currentTasks);
    const headers = [
      "STT",
      "Công việc",
      "Người thực hiện",
      "Bắt đầu (dự kiến)",
      "Kết thúc (dự kiến)",
      "Bắt đầu (thực tế)",
      "Kết thúc (thực tế)",
      "Tình trạng",
      "Ghi chú",
    ];
    const csvRows = [headers.join(",")];

    if (sorted.length === 0) {
      // Export template
      const templateTasks = getSortedHierarchicalTasks(generateDefaultTasks());
      templateTasks.forEach(t => {
        const row = [
          t.stt,
          `"${t.name.replace(/"/g, '""')}"`,
          `""`,
          t.startDate || "",
          t.endDate || "",
          t.actualStartDate || "",
          t.actualEndDate || "",
          t.status || "",
          `"${(t.notes || "").replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });
    } else {
      sorted.forEach(t => {
        const assigneesStr = t.assignees ? t.assignees.join(";") : "";
        const row = [
          t.stt,
          `"${t.name.replace(/"/g, '""')}"`,
          `"${assigneesStr.replace(/"/g, '""')}"`,
          t.startDate || "",
          t.endDate || "",
          t.actualStartDate || "",
          t.actualEndDate || "",
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
    link.setAttribute("download", sorted.length === 0 ? "Mau_Ke_Hoach_Bao_Tri.csv" : `Bao_Tri_Ky_${activeCycle}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badges colors helper matching template
  const renderTaskStatusBadge = (status: string) => {
    const norm = (status || "").trim().toLowerCase();
    if (norm === "hoàn thành") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
          <span>HOÀN THÀNH</span>
        </span>
      );
    }
    if (norm === "đang thực hiện") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
          <span>Đang Thực Hiện</span>
        </span>
      );
    }
    if (norm === "đang kế hoạch" || norm === "kế hoạch") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
          <Clock size={12} className="text-sky-600 shrink-0" />
          <span>Đang Kế Hoạch</span>
        </span>
      );
    }
    if (norm === "tạm dừng") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
          <PauseCircle size={12} className="text-amber-600 shrink-0" />
          <span>Tạm dừng</span>
        </span>
      );
    }
    if (norm === "chưa bắt đầu") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-500 border border-slate-200 whitespace-nowrap">
          <CircleDot size={12} className="text-slate-400 shrink-0" />
          <span>Chưa bắt đầu</span>
        </span>
      );
    }
    if (!status) {
      return <span className="text-slate-300 text-xs">—</span>;
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
        {status}
      </span>
    );
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
            <div className="flex items-center gap-1.5 text-sm text-slate-400 font-normal uppercase tracking-wider">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/dashboard")}>Trang chủ</span>
              <span>&gt;</span>
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/maintenance")}>Bảo trì</span>
              <span>&gt;</span>
              <span className="text-slate-500">Kế hoạch chi tiết</span>
            </div>
            <h1 className="text-[18px] font-normal text-slate-900 leading-tight">
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
              const percent = calculateCycleProgress(cycleTaskList);
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

        {/* Column 2: CHI TIẾT CÔNG VIỆC/KHUYẾN NGHỊ — LẦN X */}
        <section className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden p-6 space-y-4">
          {/* Header & Controls Toolbar matching screenshot */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  {activeTab === "tasks" ? `CHI TIẾT CÔNG VIỆC — LẦN ${activeCycle}` : `KHUYẾN NGHỊ KỸ THUẬT — LẦN ${activeCycle}`}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Theo dõi tiến độ &nbsp;·&nbsp; Quản lý hiệu quả &nbsp;·&nbsp; Hoàn thành đúng hạn
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {activeTab === "tasks" ? (
                <>
                  {/* + Phase */}
                  <button 
                    onClick={handleQuickAddPhase}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="Thêm giai đoạn mới (Phase)"
                  >
                    <Plus size={13} />
                    <span>+ Phase</span>
                  </button>

                  {/* + Main task */}
                  <button 
                    onClick={handleQuickAddMainTask}
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="Thêm công việc chính (Main task)"
                  >
                    <Plus size={13} />
                    <span>+ Main task</span>
                  </button>

                  {/* + Sub task */}
                  <button 
                    onClick={handleQuickAddSubTask}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm hover:shadow-md"
                    title="Thêm công việc con (Sub task)"
                  >
                    <Plus size={13} />
                    <span>+ Sub task</span>
                  </button>

                  {/* 1. Tải file mẫu */}
                  <button 
                    onClick={() => handleExportExcel(true)}
                    className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Tải file mẫu Excel (.xlsx)"
                  >
                    <Download size={14} className="text-slate-500" />
                    <span>Tải file mẫu</span>
                  </button>

                  {/* 2. Xuất Excel */}
                  <button 
                    onClick={() => handleExportExcel(false)}
                    className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Xuất công việc ra file Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-600" />
                    <span>Xuất Excel</span>
                  </button>

                  {/* 3. Nhập Excel */}
                  <button 
                    onClick={triggerImportFile}
                    className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    title="Nhập dữ liệu công việc từ file Excel / CSV"
                  >
                    <Upload size={14} className="text-blue-600" />
                    <span>Nhập Excel</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleRecCreateOpen}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Tạo khuyến nghị</span>
                </button>
              )}

              {/* NGÀY BẮT ĐẦU */}
              <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 shadow-xs relative">
                <Calendar size={14} className="text-slate-600" />
                <span className="uppercase text-[11px] text-slate-500 font-bold">NGÀY BẮT ĐẦU:</span>
                <span className="text-xs font-bold text-slate-800">
                  {formatCycleDateInputDisplay(getCycleStartDate(activeCycle))}
                </span>
                <input 
                  type="date" 
                  value={getCycleStartDate(activeCycle)}
                  onChange={(e) => handleCycleDateChange(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  title="Nhấp để thay đổi ngày bắt đầu"
                />
                <Calendar size={14} className="text-slate-400 ml-0.5" />
              </div>
            </div>
          </div>

          {/* Tabs switcher */}
          <div className="flex border-b border-slate-200 shrink-0 gap-8">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`pb-3 text-xs font-bold uppercase flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
                activeTab === "tasks"
                  ? "border-blue-600 text-blue-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <ListOrdered size={16} />
              <span>DANH SÁCH CÔNG VIỆC ({currentTasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`pb-3 text-xs font-bold uppercase flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
                activeTab === "recommendations"
                  ? "border-blue-600 text-blue-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Lightbulb size={16} />
              <span>KHUYẾN NGHỊ KỸ THUẬT ({(cycleRecs[activeCycle] || []).length})</span>
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span>Đang tải dữ liệu...</span>
            </div>
          ) : activeTab === "tasks" ? (
            sortedTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-10 text-center bg-white shadow-3xs">
                <div className="w-48 h-32 flex items-center justify-center relative mb-4">
                  <svg width="140" height="110" viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                    <path d="M120 15H30C21.7 15 15 21.7 15 30V90C15 98.3 21.7 105 30 105H120C128.3 105 135 98.3 135 90V30C135 21.7 128.3 15 120 15Z" fill="#F1F5F9"/>
                    <rect x="35" y="35" width="80" height="8" rx="4" fill="#CBD5E1"/>
                    <rect x="35" y="55" width="60" height="8" rx="4" fill="#CBD5E1"/>
                    <rect x="35" y="75" width="70" height="8" rx="4" fill="#CBD5E1"/>
                    <circle cx="115" cy="55" r="15" fill="#3B82F6" className="animate-pulse"/>
                    <path d="M111 55L114 58L119 52" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">CHƯA CÓ CÔNG VIỆC NÀO TRONG LẦN BẢO TRÌ NÀY</p>
                <p className="text-xs text-slate-400 mt-1 mb-5">Bạn có thể tải file mẫu để nhập dữ liệu hoặc thêm công việc mới.</p>
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button 
                    onClick={() => handleExportExcel(true)}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Download size={14} className="text-slate-500" />
                    <span>Tải file mẫu Excel</span>
                  </button>
                  <button 
                    onClick={triggerImportFile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    <span>Nhập từ file Excel</span>
                  </button>
                  <button 
                    onClick={() => handleAddTaskOpen("")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1.5"
                  >
                    <Plus size={15} />
                    <span>Thêm công việc</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[460px] relative custom-scrollbar">
                  <table className="w-full text-left border-separate border-spacing-0 text-xs border-l border-slate-200">
                  <thead className="select-none">
                    <tr className="bg-[#1E40AF] text-white">
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-16 whitespace-nowrap shadow-sm">
                        Hàng
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-14 whitespace-nowrap shadow-sm">
                        No
                      </th>
                      <th className="py-2.5 px-4 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 min-w-[280px] whitespace-nowrap shadow-sm">
                        Công việc
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-28 whitespace-nowrap shadow-sm">
                        Thời gian bắt đầu
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-28 whitespace-nowrap shadow-sm">
                        Thời gian kết thúc
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-32 whitespace-nowrap shadow-sm">
                        Thời gian bắt đầu thực tế
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-32 whitespace-nowrap shadow-sm">
                        Thời gian kết thúc thực tế
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 min-w-[140px] whitespace-nowrap shadow-sm">
                        Người thực hiện
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-24 whitespace-nowrap shadow-sm">
                        % Hoàn thành
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-32 whitespace-nowrap shadow-sm">
                        Trạng thái
                      </th>
                      <th className="py-2.5 px-3 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 min-w-[160px] whitespace-nowrap shadow-sm">
                        Ghi chú
                      </th>
                      <th className="py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm bg-[#1E40AF] text-white sticky top-0 z-20 w-24 whitespace-nowrap shadow-sm">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map((t, rowIdx) => {
                      if (!isTaskVisible(t, currentTasks)) {
                        return null;
                      }

                      const isPhase = t.level === 1;
                      const isMain = t.level === 2;
                      const isSub = t.level > 2 || (!isPhase && !isMain);
                      const stats = getTaskComputedStats(t, sortedTasks);
                      const isCollapsed = collapsedParents[t.id];

                      return (
                        <tr 
                          key={t.id} 
                          className={`border-b border-slate-200 transition ${
                            isPhase
                              ? "bg-[#BFDBFE] font-black text-blue-950"
                              : isMain
                              ? "bg-[#E2EAF4] font-bold text-slate-900 hover:bg-[#D7E3F1]"
                              : "bg-white hover:bg-slate-50/40 text-slate-700"
                          }`}
                        >
                          {/* Cột Hàng (1, 2, 3...) */}
                          <td className="py-1 px-2 text-center font-mono font-bold text-slate-500 border-b border-r border-slate-200 whitespace-nowrap text-xs bg-slate-50/40 w-16">
                            {rowIdx + 1}
                          </td>

                          {/* Cột No (1, 1.1, 1.1.1...) */}
                          <td className="py-1 px-2 text-center font-mono font-bold text-slate-700 border-b border-r border-slate-200 whitespace-nowrap w-14">
                            <div className="flex items-center justify-center gap-1">
                              {t.hasChildren && (
                                <button
                                  type="button"
                                  onClick={() => setCollapsedParents(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                                  className="p-0.5 hover:bg-slate-200/80 rounded text-slate-600 cursor-pointer"
                                  title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                                >
                                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                </button>
                              )}
                              <span>{t.stt}</span>
                            </div>
                          </td>

                          {/* Công việc */}
                          <td className="py-1 px-3 border-b border-r border-slate-200 whitespace-nowrap">
                            {isPhase ? (
                              <span className="text-slate-900 text-xs font-black uppercase tracking-wide whitespace-nowrap" title={t.name}>
                                {t.name}
                              </span>
                            ) : isMain ? (
                              <div className="pl-3 font-bold text-slate-800 text-xs whitespace-nowrap" title={t.name}>
                                {t.name}
                              </div>
                            ) : (
                              <div className="pl-7 flex items-center gap-1.5 text-slate-650 font-medium text-xs whitespace-nowrap" title={t.name}>
                                <span className="text-slate-400 font-mono">↳</span>
                                <span className="whitespace-nowrap">{t.name}</span>
                              </div>
                            )}
                          </td>

                          {/* Thời gian bắt đầu */}
                          <td className="p-1 border-b border-r border-slate-200 text-center whitespace-nowrap">
                            {stats.isAuto ? (
                              <span className="text-[11px] font-semibold text-blue-900">
                                {stats.startDate ? formatDateVN(stats.startDate) : "—"}
                              </span>
                            ) : (
                              <input
                                type="date"
                                value={t.startDate || ""}
                                onChange={(e) => updateTaskField(t.id, "startDate", e.target.value)}
                                className="w-full text-center text-xs py-1 px-1 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg outline-none cursor-pointer transition text-slate-700"
                                title="Nhấp để sửa ngày bắt đầu (dự kiến)"
                              />
                            )}
                          </td>

                          {/* Thời gian kết thúc */}
                          <td className="p-1 border-b border-r border-slate-200 text-center whitespace-nowrap">
                            {stats.isAuto ? (
                              <span className="text-[11px] font-semibold text-blue-900">
                                {stats.endDate ? formatDateVN(stats.endDate) : "—"}
                              </span>
                            ) : (
                              <input
                                type="date"
                                value={t.endDate || ""}
                                onChange={(e) => updateTaskField(t.id, "endDate", e.target.value)}
                                className="w-full text-center text-xs py-1 px-1 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg outline-none cursor-pointer transition text-slate-700"
                                title="Nhấp để sửa ngày kết thúc (dự kiến)"
                              />
                            )}
                          </td>

                          {/* Thời gian bắt đầu thực tế */}
                          <td className="p-1 border-b border-r border-slate-200 text-center whitespace-nowrap">
                            {stats.isAuto ? (
                              <span className="text-slate-400 text-xs">—</span>
                            ) : (
                              <input
                                type="date"
                                value={t.actualStartDate || ""}
                                onChange={(e) => updateTaskField(t.id, "actualStartDate", e.target.value)}
                                className="w-full text-center text-xs py-1 px-1 text-blue-700 font-semibold bg-transparent hover:bg-blue-50/50 focus:bg-white border border-transparent hover:border-blue-300 focus:border-blue-500 rounded-lg outline-none cursor-pointer transition"
                                title="Nhấp để sửa ngày bắt đầu (thực tế)"
                              />
                            )}
                          </td>

                          {/* Thời gian kết thúc thực tế */}
                          <td className="p-1 border-b border-r border-slate-200 text-center whitespace-nowrap">
                            {stats.isAuto ? (
                              stats.actualEndDate ? (
                                <span className="text-emerald-700 font-bold text-xs">{formatDateVN(stats.actualEndDate)}</span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )
                            ) : (
                              <input
                                type="date"
                                value={t.actualEndDate || ""}
                                onChange={(e) => updateTaskField(t.id, "actualEndDate", e.target.value)}
                                className="w-full text-center text-xs py-1 px-1 text-blue-700 font-semibold bg-transparent hover:bg-blue-50/50 focus:bg-white border border-transparent hover:border-blue-300 focus:border-blue-500 rounded-lg outline-none cursor-pointer transition"
                                title="Nhấp để sửa ngày kết thúc (thực tế)"
                              />
                            )}
                          </td>

                          {/* Người thực hiện */}
                          <td className="p-1 border-b border-r border-slate-200 text-center whitespace-nowrap">
                            {stats.isAuto ? (
                              stats.assignees.length > 0 ? (
                                <div className="flex items-center justify-center">
                                  <span 
                                    className="inline-block max-w-[140px] truncate text-[11px] px-2 py-0.5 bg-blue-100/80 border border-blue-300 text-blue-900 rounded-full font-bold align-middle"
                                    title={stats.assignees.join(', ')}
                                  >
                                    {stats.assignees.join(', ')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">Tự động từ tasks</span>
                              )
                            ) : (
                              <div className="w-full min-w-[130px] max-w-[200px] mx-auto py-0.5">
                                <StaffSearchSelect
                                  size="sm"
                                  mode="multiple"
                                  outputFormat="array"
                                  value={t.assignees || []}
                                  onChange={(val) => {
                                    const arr = Array.isArray(val) ? val : [val].filter(Boolean);
                                    updateTaskField(t.id, "assignees", arr);
                                  }}
                                  staffList={staffList}
                                  placeholder="+ Chọn..."
                                  dropdownPosition="fixed"
                                  className="w-full text-xs"
                                />
                              </div>
                            )}
                          </td>

                          {/* % Hoàn thành */}
                          <td className="py-0.5 px-1 border-b border-r border-slate-200 text-center whitespace-nowrap">
                            {stats.isAuto ? (
                              <div className="flex items-center justify-center gap-0.5" title={isPhase ? "Tự động tính từ các công việc con" : "Tự động tính từ các công việc con"}>
                                <span className={`font-black text-xs ${isPhase ? 'text-blue-900' : 'text-slate-800'}`}>
                                  {stats.progress}%
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold select-none">⚙</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center gap-0.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded px-1.5 py-0.5 transition focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:bg-white">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={t.progress !== undefined ? t.progress : (t.status === "Hoàn thành" ? 100 : (t.status === "Đang Thực Hiện" || t.status === "Đang thực hiện") ? 50 : 0)}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                    updateTaskField(t.id, "progress", val);
                                  }}
                                  className="w-7 text-right font-extrabold text-slate-800 text-xs bg-transparent outline-none p-0"
                                  title="Nhấp để đổi % hoàn thành"
                                />
                                <span className="text-[10px] font-bold text-slate-400 select-none">%</span>
                              </div>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="p-1 border-b border-r border-slate-200 text-center whitespace-nowrap">
                            {stats.isAuto ? (
                              <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border tracking-wide whitespace-nowrap shadow-2xs ${
                                stats.progress === 100
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : stats.progress > 0
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-slate-50 text-slate-600 border-slate-300'
                              }`}>
                                {stats.progress === 100 ? 'Hoàn thành' : stats.progress > 0 ? 'Đang thực hiện' : 'Chưa thực hiện'}
                              </span>
                            ) : (
                              <select
                                value={t.status || "Chưa bắt đầu"}
                                onChange={(e) => updateTaskField(t.id, "status", e.target.value)}
                                className={`w-full max-w-[125px] text-[11px] font-bold py-1 px-2 rounded-full border outline-none cursor-pointer transition shadow-2xs ${
                                  t.status === "Hoàn thành"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                    : t.status === "Đang Thực Hiện" || t.status === "Đang thực hiện"
                                    ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                                    : t.status === "Đang Kế Hoạch" || t.status === "Đang kế hoạch"
                                    ? "bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100"
                                    : t.status === "Tạm dừng"
                                    ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                                    : "bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100"
                                }`}
                                title="Bấm để chọn trạng thái"
                              >
                                <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                <option value="Đang Kế Hoạch">Đang Kế Hoạch</option>
                                <option value="Đang Thực Hiện">Đang Thực Hiện</option>
                                <option value="Hoàn thành">Hoàn thành</option>
                                <option value="Tạm dừng">Tạm dừng</option>
                              </select>
                            )}
                          </td>

                          {/* Ghi chú */}
                          <td className="p-1 border-b border-r border-slate-200 whitespace-nowrap min-w-[140px] max-w-[200px]">
                            <input
                              type="text"
                              defaultValue={t.notes || ""}
                              key={`${t.id}-${t.notes || ""}`}
                              onBlur={(e) => {
                                if (e.target.value !== (t.notes || "")) {
                                  updateTaskField(t.id, "notes", e.target.value.trim());
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              placeholder="Ghi chú..."
                              className="w-full text-xs text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg outline-none transition placeholder:text-slate-300"
                              title={t.notes ? t.notes : "Nhấp để nhập ghi chú..."}
                            />
                          </td>

                          {/* Thao tác */}
                          <td className="py-1 px-2 border-b border-r border-slate-200 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleAddTaskOpen(t.id)}
                                className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition cursor-pointer"
                                title="Thêm công việc con vào mục này"
                              >
                                <Plus size={12} />
                                <span>Thêm</span>
                              </button>
                              <span className="text-slate-300 select-none">|</span>
                              <button 
                                type="button"
                                onClick={() => handleEditTaskOpen(t)}
                                className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                                title="Sửa công việc này"
                              >
                                <Pencil size={12} />
                                <span>Sửa</span>
                              </button>
                              <span className="text-slate-300 select-none">|</span>
                              <button 
                                type="button"
                                onClick={() => handleDeleteTask(t.id)}
                                className="flex items-center gap-0.5 text-[11px] font-semibold text-red-500 hover:text-red-700 transition cursor-pointer"
                                title="Xóa công việc này"
                              >
                                <Trash2 size={12} />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

                {/* Footer summary bar matching screenshot */}
                {(() => {
                  const currentParentIdsWithChildren = new Set(
                    currentTasks.map(t => t.parentId).filter(Boolean) as string[]
                  );
                  const currentLeafTasks = currentTasks.filter(t => !currentParentIdsWithChildren.has(t.id));
                  const totalTasksCount = currentTasks.length;
                  const completedTasksCount = currentLeafTasks.filter(t => t.status === "Hoàn thành").length;
                  const inProgressTasksCount = currentLeafTasks.filter(t => t.status === "Đang Thực Hiện" || t.status === "Đang thực hiện").length;
                  const plannedTasksCount = currentLeafTasks.filter(t => t.status === "Đang Kế Hoạch" || t.status === "Đang kế hoạch").length;
                  const notStartedTasksCount = currentLeafTasks.filter(t => t.status === "Chưa bắt đầu" || !t.status).length;

                  return (
                    <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Info size={14} className="text-blue-500 shrink-0" />
                        <span>
                          Tổng: <strong className="text-slate-700">{totalTasksCount} công việc</strong>
                          &nbsp;|&nbsp; Hoàn thành: <strong className="text-emerald-600">{completedTasksCount}</strong>
                          &nbsp;|&nbsp; Đang làm: <strong className="text-blue-600">{inProgressTasksCount}</strong>
                          &nbsp;|&nbsp; Kế hoạch: <strong className="text-sky-600">{plannedTasksCount}</strong>
                          &nbsp;|&nbsp; Chưa bắt đầu: <strong className="text-slate-600">{notStartedTasksCount}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-600">Hoàn thành</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-slate-600">Đang thực hiện</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          <span className="text-slate-600">Đang kế hoạch</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span className="text-slate-600">Chưa bắt đầu</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )
          ) : (
            // RECOMMENDATIONS TAB VIEW
            !(cycleRecs[activeCycle] || []).length ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-12 text-center bg-white shadow-3xs">
                <div className="w-48 h-36 flex items-center justify-center relative mb-4">
                  <svg width="150" height="120" viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                    <path d="M120 15H30C21.7 15 15 21.7 15 30V90C15 98.3 21.7 105 30 105H120C128.3 105 135 98.3 135 90V30C135 21.7 128.3 15 120 15Z" fill="#F1F5F9"/>
                    <path d="M45 45H105" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M45 65H90" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round"/>
                    <circle cx="115" cy="80" r="15" fill="#3B82F6" className="animate-pulse"/>
                    <path d="M115 72V82M115 86H115.01" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">CHƯA CÓ KHUYẾN NGHỊ NÀO</p>
                <p className="text-xs text-slate-400 mt-1 mb-6">Tạo khuyến nghị kỹ thuật (hardware, database...) cho lần bảo trì này.</p>
                
                <button 
                  onClick={handleRecCreateOpen}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-sm hover:shadow-md"
                >
                  + Tạo khuyến nghị đầu tiên
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-auto border border-slate-200 rounded-xl shadow-xs custom-scrollbar">
                <table className="w-full text-sm border-collapse text-left">
                  <thead className="bg-[#1e293b] text-xs text-white font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3.5 w-16 text-center">STT</th>
                      <th className="px-4 py-3.5 w-28">Danh mục</th>
                      <th className="px-4 py-3.5">Hệ thống</th>
                      <th className="px-4 py-3.5">Node</th>
                      <th className="px-4 py-3.5">Vấn đề</th>
                      <th className="px-4 py-3.5">Khuyến nghị</th>
                      <th className="px-4 py-3.5">Ý kiến khách hàng</th>
                      <th className="px-4 py-3.5 w-32">Tình trạng</th>
                      <th className="px-4 py-3.5 w-24 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(cycleRecs[activeCycle] || []).map((r, rIdx) => (
                      <tr key={r.id} className="hover:bg-slate-50/40 transition border-b border-slate-100/50">
                        <td className="px-4 py-3.5 text-center text-slate-400 font-medium">{rIdx + 1}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 font-bold text-xs">{r.systemName || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium text-xs">{r.nodeName || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-700 text-xs whitespace-pre-line max-w-[200px]">{r.issue || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-700 text-xs whitespace-pre-line max-w-[200px]">{r.recommendation || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-600 text-xs italic whitespace-pre-line max-w-[200px]">{r.customerOpinion || "—"}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRecStatusBadge(r.status)}`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => handleRecEditOpen(r)}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded transition cursor-pointer"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleRecDelete(r.id)}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded transition cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      </div>

      {/* Hidden file input for Excel / CSV import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportFile} 
        accept=".xlsx,.xls,.csv" 
        className="hidden" 
      />

      {/* Task Creation/Editing Modal with Fields matching screenshot */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
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

              {/* Parent Selector / Hierarchy Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Thuộc công việc / Phân cấp
                </label>
                <select
                  value={form.parentId}
                  onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="">-- Không có (Là công việc chính - Cấp 1) --</option>
                  {sortedTasks
                    .filter(t => !editingTask || t.id !== editingTask.id)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {"\u00A0\u00A0\u00A0".repeat(p.level - 1) + p.stt + ". " + p.name}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Chọn công việc cha để xếp mục này thành công việc con (Cấp 2, Cấp 3...)
                </p>
              </div>

              {/* Assignees (Multi-select with Search) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Người thực hiện (chọn nhiều có tìm kiếm)
                </label>
                <StaffSearchSelect
                  mode="multiple"
                  outputFormat="array"
                  value={form.assignees}
                  onChange={selected => handleAssigneeChange(Array.isArray(selected) ? selected : [selected].filter(Boolean))}
                  staffList={staffList}
                  placeholder="-- Tìm kiếm và chọn người thực hiện --"
                />
              </div>

              {/* Date Fields: Bắt đầu & Kết thúc (dự kiến) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Bắt đầu (dự kiến)
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Kết thúc (dự kiến)
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Date Fields: Bắt đầu & Kết thúc (thực tế) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Bắt đầu (thực tế)
                  </label>
                  <input
                    type="date"
                    value={form.actualStartDate}
                    onChange={e => setForm(f => ({ ...f, actualStartDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Kết thúc (thực tế)
                  </label>
                  <input
                    type="date"
                    value={form.actualEndDate}
                    onChange={e => setForm(f => ({ ...f, actualEndDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Status and Progress */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">% Hoàn thành</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.progress ?? 0}
                      onChange={e => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setForm(f => ({
                          ...f,
                          progress: val,
                          status: val === 100 ? "Hoàn thành" : (val > 0 ? "Đang Thực Hiện" : f.status)
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-bold text-slate-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tình trạng</label>
                  <select
                    value={form.status}
                    onChange={e => {
                      const newStatus = e.target.value;
                      setForm(f => ({
                        ...f,
                        status: newStatus,
                        progress: newStatus === "Hoàn thành" ? 100 : (newStatus === "Chưa bắt đầu" ? 0 : f.progress)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  >
                    <option value="Đang Thực Hiện">Đang Thực Hiện</option>
                    <option value="Đang Kế Hoạch">Đang Kế Hoạch</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                  </select>
                </div>
              </div>

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

      {/* Recommendation Creation/Editing Modal */}
      {isRecModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-fade-in max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {editingRec ? "Cập nhật khuyến nghị" : "Tạo khuyến nghị mới"}
              </h2>
              <button onClick={() => setIsRecModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleRecFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  value={recForm.category}
                  onChange={e => setRecForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  required
                >
                  <option value="Hardware">Hardware (Phần cứng)</option>
                  <option value="Database">Database (Cơ sở dữ liệu)</option>
                  <option value="OS / Software">OS / Software (Hệ điều hành / Phần mềm)</option>
                  <option value="Network / Security">Network / Security (Mạng / Bảo mật)</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              {/* System Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tên hệ thống <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recForm.systemName}
                  onChange={e => setRecForm(f => ({ ...f, systemName: e.target.value }))}
                  placeholder="Nhập tên hệ thống..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Node Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Tên Node / Máy chủ
                </label>
                <input
                  type="text"
                  value={recForm.nodeName}
                  onChange={e => setRecForm(f => ({ ...f, nodeName: e.target.value }))}
                  placeholder="Nhập tên node / IP máy chủ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Issue */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Vấn đề phát hiện <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={recForm.issue}
                  onChange={e => setRecForm(f => ({ ...f, issue: e.target.value }))}
                  rows={3}
                  placeholder="Mô tả vấn đề kỹ thuật phát hiện được..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Khuyến nghị đề xuất <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={recForm.recommendation}
                  onChange={e => setRecForm(f => ({ ...f, recommendation: e.target.value }))}
                  rows={3}
                  placeholder="Giải pháp hoặc khuyến nghị kỹ thuật đề xuất..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              {/* Customer Opinion */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Ý kiến khách hàng
                </label>
                <textarea
                  value={recForm.customerOpinion}
                  onChange={e => setRecForm(f => ({ ...f, customerOpinion: e.target.value }))}
                  rows={2}
                  placeholder="Ý kiến, phản hồi từ phía khách hàng..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tình trạng xử lý</label>
                <select
                  value={recForm.status}
                  onChange={e => setRecForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="Chưa xử lý">CHƯA XỬ LÝ</option>
                  <option value="Đang xử lý">ĐANG XỬ LÝ</option>
                  <option value="Đã xử lý">ĐÃ XỬ LÝ</option>
                  <option value="Bỏ qua">BỎ QUA / KHÔNG XỬ LÝ</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={recSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 cursor-pointer shadow-2xs"
                >
                  {recSubmitting ? "Đang lưu..." : (editingRec ? "Cập nhật" : "Tạo khuyến nghị")}
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

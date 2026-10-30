"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/main-layout";
import StaffSearchSelect from "@/components/common/staff-search-select";
import { 
  ArrowLeft, Plus, Minus, Download, Upload, Pencil, Trash2, X,
  CheckCircle2, Clock, Calculator, Settings, ClipboardList, Calendar,
  ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, GripVertical,
  Info, Lightbulb, ListOrdered, CircleDot, PauseCircle, FileSpreadsheet,
  Check, Lock, Unlock
} from "lucide-react";
import { 
  generateDefaultTasks, 
  getSortedHierarchicalTasks, 
  MaintenanceTask,
  HierarchicalTask 
} from "@/lib/maintenance-template";

type Task = MaintenanceTask;

export interface TaskListTab {
  id: string;
  name: string;
  tasks: Task[];
}

const TABLE_COLUMNS = [
  { key: "row", label: "Hàng", width: 64 },
  { key: "no", label: "No", width: 56 },
  { key: "name", label: "Công việc", width: 300 },
  { key: "startDate", label: "Bắt đầu", width: 112 },
  { key: "endDate", label: "Kết thúc", width: 112 },
  { key: "actualStartDate", label: "Bắt đầu TT", width: 128 },
  { key: "actualEndDate", label: "Kết thúc TT", width: 128 },
  { key: "assignees", label: "Người thực hiện", width: 140 },
  { key: "progress", label: "% Hoàn thành", width: 96 },
  { key: "status", label: "Trạng thái", width: 128 },
  { key: "notes", label: "Ghi chú", width: 160 },
  { key: "actions", label: "Thao tác", width: 96 },
] as const;

type ColumnKey = typeof TABLE_COLUMNS[number]["key"];

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

// Dedicated component for moving rows by direct number input — giống triển khai dự án
function MoveRowInput({
  rowIndex,
  totalRows,
  onMoveToRow,
}: {
  rowIndex: number;
  totalRows: number;
  onMoveToRow: (fromIdx: number, targetRow: number) => void;
}) {
  const currentNum = rowIndex + 1;
  const [val, setVal] = useState<string>(String(currentNum));

  useEffect(() => {
    setVal(String(rowIndex + 1));
  }, [rowIndex]);

  const submitChange = (newValStr: string) => {
    const num = parseInt(newValStr.trim(), 10);
    if (isNaN(num) || num < 1 || num > totalRows || num === currentNum) {
      setVal(String(currentNum));
      return;
    }
    onMoveToRow(rowIndex, num);
  };

  return (
    <input
      type="number"
      min={1}
      max={totalRows}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitChange(val);
          (e.target as HTMLInputElement).blur();
        }
      }}
      onBlur={() => {
        submitChange(val);
      }}
      className="w-10 text-center font-mono text-xs font-black bg-white border border-indigo-400 text-indigo-850 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
      title="Nhập số hàng và nhấn Enter để chuyển đến vị trí cần"
    />
  );
}

// Click-to-edit Date Cell — giống hệt triển khai dự án
function InlineDateCell({
  value,
  onChange,
  disabled = false,
}: {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      try {
        if (typeof inputRef.current.showPicker === 'function') {
          inputRef.current.showPicker();
        }
      } catch (e) {}
    }
  }, [isEditing]);

  const formatDisplay = (valStr?: string) => {
    if (!valStr) return "";
    const clean = valStr.substring(0, 10);
    const parts = clean.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return clean;
  };

  if (disabled) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={value ? value.substring(0, 10) : ""}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onBlur={(e) => {
          onChange(e.target.value);
          setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            setIsEditing(false);
          }
        }}
        className="w-full px-1.5 py-0.5 border border-blue-500 rounded text-xs text-slate-800 bg-white outline-none cursor-pointer text-center shadow-xs"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer py-1 px-1.5 rounded hover:bg-blue-50/80 border border-transparent hover:border-blue-300 transition text-center select-none"
      title="Bấm vào để thay đổi thời gian"
    >
      <span className={value ? "text-slate-700 font-medium text-xs" : "text-slate-400 text-xs"}>
        {value ? formatDisplay(value) : "—"}
      </span>
    </div>
  );
}

// Click-to-edit Staff Assignee Cell (Array mode) — giống InlineStaffCell của triển khai dự án
function InlineStaffCellArray({
  value,
  staffList,
  onChange,
}: {
  value: string[];
  staffList: any[];
  onChange: (val: string[]) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('.staff-search-dropdown') || target.closest('[data-staff-select-portal]')) {
          return;
        }
        setIsEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={containerRef} className="w-full min-w-[150px] max-w-[220px] mx-auto py-0.5">
        <StaffSearchSelect
          mode="multiple"
          size="sm"
          staffList={staffList}
          value={value}
          outputFormat="array"
          onChange={(newVal) => {
            const arr = Array.isArray(newVal) ? newVal : [newVal].filter(Boolean);
            onChange(arr as string[]);
          }}
          placeholder="Chọn nhân sự..."
          dropdownPosition="fixed"
        />
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold px-1.5 py-0.5 hover:bg-blue-50 rounded cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="flex flex-wrap items-center justify-center gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-blue-50/80 border border-transparent hover:border-blue-300 transition min-h-[28px]"
      title="Bấm vào để thay đổi người thực hiện"
    >
      {value && value.length > 0 ? (
        value.map((name) => (
          <span
            key={name}
            className="inline-block max-w-[130px] truncate text-[11px] px-2.5 py-0.5 bg-slate-100 hover:bg-blue-100 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-800 rounded-full font-semibold align-middle transition"
            title={name}
          >
            {name}
          </span>
        ))
      ) : (
        <span className="text-slate-400 text-xs italic">—</span>
      )}
    </div>
  );
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
  const [cycleRecs, setCycleRecs] = useState<{ [key: string]: Recommendation[] }>({});
  const [collapsedParents, setCollapsedParents] = useState<{ [key: string]: boolean }>({});
  
  const [activeTab, setActiveTab] = useState<"tasks" | "recommendations">("tasks");
  const [cycleTaskLists, setCycleTaskLists] = useState<{ [key: string]: TaskListTab[] }>({});
  const [activeTaskListId, setActiveTaskListId] = useState<string>("default");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState<string>("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState({
    interval: "monthly",
    startDate: "",
  });
  const [cycleMeta, setCycleMeta] = useState<{ [key: string]: { startDate: string } }>({});
  
  // Move mode states (giống triển khai dự án)
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [moveModeDragIdx, setMoveModeDragIdx] = useState<number | null>(null);
  const [moveModeOverIdx, setMoveModeOverIdx] = useState<number | null>(null);

  // Selected task row highlight state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Column freeze & highlight states
  const [selectedColKey, setSelectedColKey] = useState<ColumnKey>("name");
  const [lockedColKey, setLockedColKey] = useState<ColumnKey | null>("name");

  // Helper functions for column freezing & positioning
  const getColIndex = (key: ColumnKey) => TABLE_COLUMNS.findIndex(c => c.key === key);

  const getColLeftOffset = (key: ColumnKey): number => {
    let left = 0;
    for (const c of TABLE_COLUMNS) {
      if (c.key === key) break;
      left += c.width;
    }
    return left;
  };

  const isColFrozen = (key: ColumnKey): boolean => {
    if (!lockedColKey) return false;
    return getColIndex(key) <= getColIndex(lockedColKey);
  };

  const isLastFrozenCol = (key: ColumnKey): boolean => {
    return lockedColKey === key;
  };

  const getColumnLabel = (key: ColumnKey | null): string => {
    if (!key) return "";
    const found = TABLE_COLUMNS.find(c => c.key === key);
    return found ? found.label : "";
  };

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
  const cycleDateInputRef = useRef<HTMLInputElement>(null);
  const [configTotalCycles, setConfigTotalCycles] = useState<number>(1);

  // Helper to sanitize task percentage and status consistency
  const sanitizeTask = (t: Task): Task => {
    let prog = t.progress !== undefined ? Number(t.progress) : undefined;
    const status = (t.status || "").trim();
    const isCompleted = status === "Hoàn thành";

    if (isCompleted) {
      if (prog === undefined || prog <= 1) {
        prog = 100;
      }
    } else if (prog !== undefined) {
      if (prog > 0 && prog <= 1) {
        // Excel decimal fractional percentage: 0.28 -> 28, 1 -> 100
        prog = Math.round(prog * 100);
      }
    } else {
      prog = status.toLowerCase().includes("thực hiện") ? 50 : 0;
    }

    return {
      ...t,
      progress: prog !== undefined ? Math.min(100, Math.max(0, prog)) : 0,
    };
  };

  const sanitizeTaskList = (tasks: Task[]): Task[] => {
    return (tasks || []).map(sanitizeTask);
  };

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
      setConfigTotalCycles(parseInt(data.hold_time) || 1);

      // Parse tasks, config, and recommendations from the remark column
      let tasksData: { [key: string]: Task[] } = {};
      let taskListsData: { [key: string]: TaskListTab[] } = {};
      let recommendationsData: { [key: string]: Recommendation[] } = {};
      let parsedConfig = { 
        interval: "monthly", 
        startDate: data.start_time ? data.start_time.substring(0, 10) : new Date().toISOString().substring(0, 10) 
      };
      let parsedMeta = {};

      if (data.remark) {
        try {
          const parsed = JSON.parse(data.remark);
          if (parsed && (parsed.tasks !== undefined || parsed.recommendations !== undefined || parsed.taskLists !== undefined)) {
            tasksData = parsed.tasks || {};
            taskListsData = parsed.taskLists || {};
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

      // Sanitize all loaded tasks to auto-correct Excel fractional progress errors (e.g. 1 -> 100, 0.28 -> 28)
      Object.keys(tasksData).forEach((cKey) => {
        tasksData[cKey] = sanitizeTaskList(tasksData[cKey]);
      });
      Object.keys(taskListsData).forEach((cKey) => {
        taskListsData[cKey] = (taskListsData[cKey] || []).map((tab) => ({
          ...tab,
          tasks: sanitizeTaskList(tab.tasks),
        }));
      });

      // If taskListsData is empty but tasksData has items, migrate legacy tasks into default task list per cycle
      if (Object.keys(taskListsData).length === 0 && Object.keys(tasksData).length > 0) {
        Object.keys(tasksData).forEach((cKey) => {
          taskListsData[cKey] = [
            {
              id: "default",
              name: "Danh sách công việc",
              tasks: tasksData[cKey] || []
            }
          ];
        });
      }

      if (!parsedConfig.startDate && data.start_time) {
        parsedConfig.startDate = data.start_time.substring(0, 10);
      }

      setCycleTasks(tasksData);
      setCycleTaskLists(taskListsData);
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

  // Filter tasks for the active cycle and active task list
  const currentTaskLists: TaskListTab[] = (cycleTaskLists[activeCycle] && cycleTaskLists[activeCycle].length > 0)
    ? cycleTaskLists[activeCycle]
    : [
        {
          id: "default",
          name: "Danh sách công việc",
          tasks: cycleTasks[activeCycle] || []
        }
      ];

  const currentTaskList = currentTaskLists.find(l => l.id === activeTaskListId) || currentTaskLists[0];
  const currentTasks = currentTaskList ? currentTaskList.tasks : [];
  const sortedTasks = getSortedHierarchicalTasks(currentTasks);

  // Sync activeTaskListId when activeCycle or cycleTaskLists changes
  useEffect(() => {
    const lists = cycleTaskLists[activeCycle] || [];
    if (lists.length > 0) {
      if (!lists.some(l => l.id === activeTaskListId)) {
        setActiveTaskListId(lists[0].id);
      }
    } else {
      setActiveTaskListId("default");
    }
  }, [activeCycle, cycleTaskLists]);

  // Autofocus input when renaming a task list tab
  useEffect(() => {
    if (editingListId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingListId]);

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
    updatedTaskLists: { [key: string]: TaskListTab[] },
    updatedRecs: { [key: string]: Recommendation[] },
    updatedConfig = config,
    updatedMeta = cycleMeta
  ) => {
    try {
      const flattenedTasks: { [key: string]: Task[] } = {};
      Object.keys(updatedTaskLists).forEach((cKey) => {
        const lists = updatedTaskLists[cKey] || [];
        const all: Task[] = [];
        lists.forEach((l) => all.push(...l.tasks));
        flattenedTasks[cKey] = all;
      });

      const payload = {
        config: updatedConfig,
        cycleMeta: updatedMeta,
        taskLists: updatedTaskLists,
        tasks: flattenedTasks,
        recommendations: updatedRecs
      };
      const remarkJSON = JSON.stringify(payload);
      
      const overallProgress = calculateOverallProgress(flattenedTasks, totalCycles);
      const currentPeriodVal = determineCurrentPeriod(flattenedTasks, totalCycles);
      
      let newStatus = plan?.tt_status || "New";
      if (overallProgress === 100 && totalCycles > 0 && plan?.tt_status !== "Closed") {
        newStatus = "Completed";
      } else if (plan?.tt_status !== "On Hold" && plan?.tt_status !== "Closed") {
        let hasAnyActivity = overallProgress > 0;
        if (!hasAnyActivity) {
          for (let i = 1; i <= totalCycles; i++) {
            const list = flattenedTasks[String(i)] || [];
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

  // Helper to save tasks of the currently active task list
  const saveCurrentListTasks = async (newTasks: Task[]) => {
    const currentLists = (cycleTaskLists[activeCycle] && cycleTaskLists[activeCycle].length > 0)
      ? cycleTaskLists[activeCycle].map(l => ({ ...l, tasks: [...l.tasks] }))
      : [{ id: "default", name: "Danh sách công việc", tasks: [] }];
    
    const targetIdx = currentLists.findIndex(l => l.id === activeTaskListId);
    if (targetIdx >= 0) {
      currentLists[targetIdx].tasks = newTasks;
    } else if (currentLists.length > 0) {
      currentLists[0].tasks = newTasks;
    }
    
    const updatedAll = {
      ...cycleTaskLists,
      [activeCycle]: currentLists
    };
    setCycleTaskLists(updatedAll);
    
    const allCycleTasks: Task[] = [];
    currentLists.forEach(l => allCycleTasks.push(...l.tasks));
    setCycleTasks(prev => ({
      ...prev,
      [activeCycle]: allCycleTasks
    }));

    await savePlanData(updatedAll, cycleRecs);
  };

  // Save changes to database with explicit config/meta payload
  const saveTasksToDBWrapper = async (payload: { config?: any; cycleMeta?: any; tasks?: any; taskLists?: any; recommendations?: any }) => {
    await savePlanData(
      payload.taskLists || cycleTaskLists,
      payload.recommendations || cycleRecs,
      payload.config || config,
      payload.cycleMeta || cycleMeta
    );
  };

  const saveRecsToDB = async (updatedRecs: { [key: string]: Recommendation[] }) => {
    await savePlanData(cycleTaskLists, updatedRecs);
  };

  // Thêm danh sách công việc mới (tạo tab mới)
  const handleCreateTaskList = async () => {
    const currentLists = (cycleTaskLists[activeCycle] && cycleTaskLists[activeCycle].length > 0)
      ? [...cycleTaskLists[activeCycle]]
      : [{ id: "default", name: "Danh sách công việc", tasks: cycleTasks[activeCycle] || [] }];
    
    const nextNum = currentLists.length + 1;
    const newListId = "tl_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    const newListName = `Danh sách công việc ${nextNum}`;
    
    const newList: TaskListTab = {
      id: newListId,
      name: newListName,
      tasks: []
    };

    const updatedLists = [...currentLists, newList];
    const updatedAll = {
      ...cycleTaskLists,
      [activeCycle]: updatedLists
    };

    setCycleTaskLists(updatedAll);
    setActiveTab("tasks");
    setActiveTaskListId(newListId);
    setEditingListId(newListId);
    setEditingListName(newListName);
    await savePlanData(updatedAll, cycleRecs);
  };

  // Xóa danh sách công việc (tab)
  const handleDeleteTaskList = async (listId: string, listName: string) => {
    const currentLists = cycleTaskLists[activeCycle] || [];
    if (currentLists.length <= 1) {
      alert("Mỗi lần bảo trì phải có ít nhất 1 danh sách công việc.");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh sách công việc "${listName}"? Toàn bộ công việc trong danh sách này sẽ bị xóa.`)) {
      return;
    }

    const updatedLists = currentLists.filter(l => l.id !== listId);
    const updatedAll = {
      ...cycleTaskLists,
      [activeCycle]: updatedLists
    };

    setCycleTaskLists(updatedAll);
    if (activeTaskListId === listId) {
      setActiveTaskListId(updatedLists[0]?.id || "default");
    }
    await savePlanData(updatedAll, cycleRecs);
  };

  // Bắt đầu đổi tên danh sách công việc
  const handleStartRename = (list: TaskListTab) => {
    setEditingListId(list.id);
    setEditingListName(list.name);
  };

  // Lưu tên danh sách công việc sau khi sửa
  const handleSaveRename = async () => {
    if (!editingListId) return;
    const trimmed = editingListName.trim();
    if (!trimmed) {
      setEditingListId(null);
      return;
    }

    const currentLists = cycleTaskLists[activeCycle] ? [...cycleTaskLists[activeCycle]] : [];
    const targetIdx = currentLists.findIndex(l => l.id === editingListId);
    if (targetIdx >= 0 && currentLists[targetIdx].name !== trimmed) {
      currentLists[targetIdx] = {
        ...currentLists[targetIdx],
        name: trimmed
      };
      const updatedAll = {
        ...cycleTaskLists,
        [activeCycle]: currentLists
      };
      setCycleTaskLists(updatedAll);
      await savePlanData(updatedAll, cycleRecs);
    }
    setEditingListId(null);
  };

  const handleCancelRename = () => {
    setEditingListId(null);
  };

  // Khởi tạo nhanh bảng mẫu mặc định vào danh sách hiện tại
  const handlePopulateDefaultTemplate = async () => {
    const defaultTasks = generateDefaultTasks(getCycleStartDate(activeCycle));
    await saveCurrentListTasks(defaultTasks);
  };

  // Handle cycle date manual overrides
  const handleCycleDateChange = async (newDate: string) => {
    if (!newDate) return;
    const updatedMeta = {
      ...cycleMeta,
      [activeCycle]: {
        ...cycleMeta[activeCycle],
        startDate: newDate
      }
    };
    let updatedConfig = { ...config };
    if (activeCycle === "1") {
      updatedConfig.startDate = newDate;
      setConfig(updatedConfig);
    }
    setCycleMeta(updatedMeta);
    
    await savePlanData(cycleTaskLists, cycleRecs, updatedConfig, updatedMeta);

    if (activeCycle === "1" && planId) {
      await supabase.from("tickets").update({ start_time: newDate }).eq("id", planId);
      setPlan((prev: any) => prev ? { ...prev, start_time: newDate } : null);
    }
  };

  // Handle frequency and main start date changes
  const handleConfigChange = async (key: string, value: string) => {
    const updatedConfig = {
      ...config,
      [key]: value
    };
    setConfig(updatedConfig);
    
    await savePlanData(cycleTaskLists, cycleRecs, updatedConfig, cycleMeta);
  };

  // Thêm lần bảo trì mới
  const handleAddCycle = async () => {
    const newTotal = totalCycles + 1;
    const newCycleNum = String(newTotal);

    // Copy template or clone task lists from cycle 1 if cycle 1 has lists
    const updatedTaskLists = { ...cycleTaskLists };
    if (!updatedTaskLists[newCycleNum]) {
      const cycle1Lists = updatedTaskLists["1"] || [
        {
          id: "default",
          name: "Danh sách công việc",
          tasks: cycleTasks["1"] || []
        }
      ];

      updatedTaskLists[newCycleNum] = cycle1Lists.map((l) => ({
        ...l,
        id: "tl_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
        tasks: l.tasks.map((t) => ({
          ...t,
          id: "t_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
          progress: 0,
          status: "Chưa bắt đầu",
          actualStartDate: "",
          actualEndDate: "",
        }))
      }));
      setCycleTaskLists(updatedTaskLists);
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .update({ hold_time: String(newTotal) })
        .eq("id", planId);

      if (error) {
        alert("Lỗi khi thêm lần bảo trì: " + error.message);
        return;
      }

      setPlan((prev: any) => prev ? { ...prev, hold_time: String(newTotal) } : null);
      setConfigTotalCycles(newTotal);
      setActiveCycle(newCycleNum);

      await savePlanData(updatedTaskLists, cycleRecs, config, cycleMeta);
    } catch (err) {
      console.error("Error adding cycle:", err);
    }
  };

  // Bớt / xóa lần bảo trì
  const handleRemoveCycle = async (cycleNumToRemove?: string) => {
    if (totalCycles <= 1) {
      alert("Kế hoạch bảo trì phải có ít nhất 1 lần.");
      return;
    }

    const targetCycle = cycleNumToRemove || String(totalCycles);
    const confirmMsg = `Bạn có chắc chắn muốn xóa Lần bảo trì ${targetCycle} không? Toàn bộ công việc và dữ liệu của lần này sẽ bị xóa.`;
    if (!window.confirm(confirmMsg)) return;

    const newTotal = totalCycles - 1;
    const updatedTaskLists = { ...cycleTaskLists };
    const updatedRecs = { ...cycleRecs };
    const updatedMeta = { ...cycleMeta };

    // Delete target cycle data
    delete updatedTaskLists[targetCycle];
    delete updatedRecs[targetCycle];
    delete updatedMeta[targetCycle];

    // If targetCycle was in the middle, re-index higher cycles down by 1
    const targetNum = parseInt(targetCycle, 10);
    for (let i = targetNum + 1; i <= totalCycles; i++) {
      const oldKey = String(i);
      const newKey = String(i - 1);
      if (updatedTaskLists[oldKey]) {
        updatedTaskLists[newKey] = updatedTaskLists[oldKey];
        delete updatedTaskLists[oldKey];
      }
      if (updatedRecs[oldKey]) {
        updatedRecs[newKey] = updatedRecs[oldKey];
        delete updatedRecs[oldKey];
      }
      if (updatedMeta[oldKey]) {
        updatedMeta[newKey] = updatedMeta[oldKey];
        delete updatedMeta[oldKey];
      }
    }

    try {
      const { error } = await supabase
        .from("tickets")
        .update({ hold_time: String(newTotal) })
        .eq("id", planId);

      if (error) {
        alert("Lỗi khi bớt lần bảo trì: " + error.message);
        return;
      }

      setPlan((prev: any) => prev ? { ...prev, hold_time: String(newTotal) } : null);
      setConfigTotalCycles(newTotal);
      setCycleTaskLists(updatedTaskLists);
      setCycleRecs(updatedRecs);
      setCycleMeta(updatedMeta);

      if (parseInt(activeCycle, 10) > newTotal) {
        setActiveCycle(String(newTotal));
      } else if (activeCycle === targetCycle) {
        setActiveCycle(String(Math.min(targetNum, newTotal)));
      }

      await savePlanData(updatedTaskLists, updatedRecs, config, updatedMeta);
    } catch (err) {
      console.error("Error removing cycle:", err);
    }
  };

  const handleSaveConfigModal = async () => {
    if (configTotalCycles !== totalCycles && configTotalCycles >= 1) {
      try {
        const { error } = await supabase
          .from("tickets")
          .update({ hold_time: String(configTotalCycles) })
          .eq("id", planId);
        if (!error) {
          setPlan((prev: any) => prev ? { ...prev, hold_time: String(configTotalCycles) } : null);
          if (parseInt(activeCycle) > configTotalCycles) {
            setActiveCycle(String(configTotalCycles));
          }
        }
      } catch (err) {
        console.error("Error updating total cycles in config modal:", err);
      }
    }
    setIsConfigModalOpen(false);
  };

  // Move mode operations for current cycle tasks — giống hệt triển khai dự án
  const handleMovePlanRow = async (fromIdx: number, toIdx: number) => {
    const currentList = [...currentTasks];
    if (currentList.length === 0) return;
    const currentSorted = getSortedHierarchicalTasks(currentList);
    const total = currentSorted.length;
    if (fromIdx < 0 || fromIdx >= total || toIdx < 0 || toIdx >= total || fromIdx === toIdx) return;

    // Sắp xếp lại thứ tự của các task trong sortedTasks
    const newSorted = [...currentSorted];
    const [movedItem] = newSorted.splice(fromIdx, 1);
    newSorted.splice(toIdx, 0, movedItem);

    // Gán lại orderIndex dựa theo thứ tự mới
    const orderMap = new Map<string, number>();
    newSorted.forEach((t, i) => {
      orderMap.set(t.id, i);
    });

    const updatedList = currentList.map(t => ({
      ...t,
      orderIndex: orderMap.has(t.id) ? orderMap.get(t.id)! : t.orderIndex,
    })).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    await saveCurrentListTasks(updatedList);
  };

  const handleMovePlanRowToPosition = (fromIdx: number, targetRowVal: string | number) => {
    const targetRow = typeof targetRowVal === "number" ? targetRowVal : parseInt(String(targetRowVal).trim(), 10);
    const currentList = currentTasks;
    const currentSorted = getSortedHierarchicalTasks(currentList);
    const total = currentSorted.length;
    if (isNaN(targetRow) || targetRow < 1 || targetRow > total) return;
    const toIdx = targetRow - 1;
    if (toIdx === fromIdx) return;
    handleMovePlanRow(fromIdx, toIdx);
  };

  const handleMoveModeDragStart = (idx: number) => {
    setMoveModeDragIdx(idx);
  };

  const handleMoveModeDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (moveModeOverIdx !== idx) {
      setMoveModeOverIdx(idx);
    }
  };

  const handleMoveModeDrop = (idx: number) => {
    if (moveModeDragIdx === null || moveModeDragIdx === idx) {
      setMoveModeDragIdx(null);
      setMoveModeOverIdx(null);
      return;
    }
    handleMovePlanRow(moveModeDragIdx, idx);
    setMoveModeDragIdx(null);
    setMoveModeOverIdx(null);
  };

  const handleMoveModeDragEnd = () => {
    setMoveModeDragIdx(null);
    setMoveModeOverIdx(null);
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
      let progress = task.progress !== undefined 
        ? Number(task.progress) 
        : (task.status === "Hoàn thành" ? 100 : (task.status === "Đang Thực Hiện" || task.status === "Đang thực hiện") ? 50 : 0);
      if (task.status === "Hoàn thành" && progress <= 1) {
        progress = 100;
      } else if (progress > 0 && progress <= 1 && task.status !== "Hoàn thành") {
        progress = Math.round(progress * 100);
      }
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
        let p = item.progress !== undefined 
          ? Number(item.progress) 
          : (item.status === "Hoàn thành" ? 100 : (item.status === "Đang Thực Hiện" || item.status === "Đang thực hiện") ? 50 : 0);
        if (item.status === "Hoàn thành" && p <= 1) {
          p = 100;
        } else if (p > 0 && p <= 1 && item.status !== "Hoàn thành") {
          p = Math.round(p * 100);
        }
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
    const allCompleted = targetList.length > 0 && targetList.every(t => (t.progress === 100 || t.status === "Hoàn thành" || (t.status === "Hoàn thành" && (t.progress === undefined || t.progress <= 1))));
    const validActualEnds = targetList.map(t => t.actualEndDate).filter(Boolean).sort();
    const actualEndDate = allCompleted && validActualEnds.length > 0 ? validActualEnds[validActualEnds.length - 1] : "";

    // Assignees: unique union of assignees
    const allAssignees = targetList.flatMap(t => t.assignees || []);
    const assignees = [...new Set(allAssignees.map(a => a.trim()).filter(Boolean))];

    // Status
    const status = progress === 100 ? "Hoàn thành" : progress > 0 ? "Đang thực hiện" : "Chưa bắt đầu";

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
    const currentList = [...currentTasks];
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
        updatedTask.status = "Đang thực hiện";
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

    try {
      await saveCurrentListTasks(currentList);
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
    const initialProg = task.progress !== undefined 
      ? Number(task.progress) 
      : (task.status === "Hoàn thành" ? 100 : (task.status === "Đang Thực Hiện" || task.status === "Đang thực hiện") ? 50 : 0);
    const resolvedProg = task.status === "Hoàn thành" && initialProg <= 1 
      ? 100 
      : (initialProg > 0 && initialProg <= 1 ? Math.round(initialProg * 100) : initialProg);

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
      progress: resolvedProg,
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
      const currentList = [...currentTasks];

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

      await saveCurrentListTasks(currentList);
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
      let currentList = [...currentTasks];

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
      await saveCurrentListTasks(currentList);
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

        let calculatedProgress: number;
        const cleanProg = (progressRaw || "").trim();
        const isCompleted = status === "Hoàn thành";

        if (!cleanProg) {
          calculatedProgress = isCompleted ? 100 : (status.toLowerCase().includes("thực hiện") ? 50 : 0);
        } else if (cleanProg.includes("%")) {
          const num = parseFloat(cleanProg.replace("%", "").replace(",", "."));
          calculatedProgress = isNaN(num) ? (isCompleted ? 100 : 0) : Math.min(100, Math.max(0, Math.round(num)));
        } else {
          const parsedFloat = parseFloat(cleanProg.replace(",", "."));
          if (!isNaN(parsedFloat)) {
            // In Excel, percentage cells often store decimal numbers: 1 = 100%, 0.28 = 28%, 0.5 = 50%
            if (parsedFloat > 0 && parsedFloat <= 1) {
              calculatedProgress = Math.min(100, Math.max(0, Math.round(parsedFloat * 100)));
            } else {
              calculatedProgress = Math.min(100, Math.max(0, Math.round(parsedFloat)));
            }
          } else {
            calculatedProgress = isCompleted ? 100 : (status.toLowerCase().includes("thực hiện") ? 50 : 0);
          }
        }

        if (isCompleted && calculatedProgress <= 1) {
          calculatedProgress = 100;
        }

        const resolvedStatus = calculatedProgress === 100 
          ? "Hoàn thành" 
          : (status || (calculatedProgress > 0 ? "Đang thực hiện" : "Chưa bắt đầu"));

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
          status: resolvedStatus,
          progress: calculatedProgress,
          notes,
          orderIndex: idx,
        });
      });

      if (importedTasks.length === 0) {
        throw new Error("Không tìm thấy dòng công việc hợp lệ nào trong tệp.");
      }

      await saveCurrentListTasks(importedTasks);
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
          <div className="bg-slate-50 px-3.5 py-3 border-b border-slate-200 flex justify-between items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5 min-w-0 truncate">
              <ClipboardList size={15} className="text-blue-600 shrink-0" />
              <span className="truncate">LẦN BẢO TRÌ ({totalCycles})</span>
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                type="button"
                onClick={handleAddCycle}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition shadow-3xs cursor-pointer"
                title="Thêm 1 lần bảo trì mới"
              >
                <Plus size={12} />
                <span>Thêm</span>
              </button>
              {totalCycles > 1 && (
                <button 
                  type="button"
                  onClick={() => handleRemoveCycle(String(totalCycles))}
                  className="flex items-center gap-0.5 px-1.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                  title={`Bớt lần ${totalCycles}`}
                >
                  <Minus size={12} />
                  <span>Bớt</span>
                </button>
              )}
              <button 
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-blue-600 transition cursor-pointer"
                title="Cấu hình kế hoạch"
              >
                <Settings size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
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
                <div
                  key={index}
                  onClick={() => setActiveCycle(cycleNum)}
                  className={`w-full text-left p-3 rounded-xl border flex flex-col gap-2 transition cursor-pointer group relative ${
                    isActive 
                      ? "bg-blue-50/50 border-blue-600 shadow-sm" 
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className={`text-xs font-bold truncate ${isActive ? "text-blue-900" : "text-slate-800"}`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Ngày: {formatDateVN(cycleStartDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {percent > 0 ? (
                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            percent === 100 
                              ? "bg-green-100 text-green-700" 
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {percent}%
                          </span>
                          <span className={`text-[10px] font-bold mt-0.5 ${
                            percent === 100 ? "text-green-600" : "text-blue-600"
                          }`}>
                            {statusText}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-slate-300">
                            <CheckCircle2 size={13} className="opacity-45" />
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                            Chưa bắt đầu
                          </span>
                        </div>
                      )}

                      {totalCycles > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCycle(cycleNum);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition ml-0.5 cursor-pointer"
                          title={`Xóa Lần ${cycleNum}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
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
                </div>
              );
            })}

            {/* Quick add cycle button at the bottom of the list */}
            <button
              type="button"
              onClick={handleAddCycle}
              className="w-full py-2 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-3xs"
            >
              <Plus size={13} />
              <span>Thêm lần bảo trì ({totalCycles + 1})</span>
            </button>
          </div>
        </section>

        {/* Column 2: CHI TIẾT CÔNG VIỆC/KHUYẾN NGHỊ — LẦN X */}
        <section className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden p-4 space-y-3">
          {/* Header & Controls Toolbar (Compact & Optimized) */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-1 border-b border-slate-100/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-tight">
                  {activeTab === "tasks" ? `CHI TIẾT CÔNG VIỆC — LẦN ${activeCycle} (${currentTaskList?.name || "DANH SÁCH CÔNG VIỆC"})` : `KHUYẾN NGHỊ KỸ THUẬT — LẦN ${activeCycle}`}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Theo dõi tiến độ &nbsp;·&nbsp; Quản lý hiệu quả &nbsp;·&nbsp; Hoàn thành đúng hạn
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "tasks" ? (
                <>
                  {/* Nút Di chuyển (giống triển khai dự án) */}
                  <button
                    type="button"
                    onClick={() => setIsMoveMode(!isMoveMode)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-3xs ${
                      isMoveMode
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-200"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    }`}
                    title={isMoveMode ? "Thoát chế độ di chuyển hàng" : "Bật chế độ di chuyển hàng"}
                  >
                    <ArrowUpDown size={13} className={isMoveMode ? "text-white" : "text-slate-600"} />
                    <span>{isMoveMode ? "Xong di chuyển" : "Di chuyển"}</span>
                  </button>

                  {/* + Phase */}
                  <button 
                    onClick={handleQuickAddPhase}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-3xs"
                    title="Thêm giai đoạn mới (Phase)"
                  >
                    <Plus size={13} />
                    <span>Phase</span>
                  </button>

                  {/* 1. Tải file mẫu */}
                  <button 
                    onClick={() => handleExportExcel(true)}
                    className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-3xs transition cursor-pointer"
                    title="Tải file mẫu Excel (.xlsx)"
                  >
                    <Download size={13} className="text-slate-500" />
                    <span>Tải mẫu</span>
                  </button>

                  {/* 2. Xuất Excel */}
                  <button 
                    onClick={() => handleExportExcel(false)}
                    className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-3xs transition cursor-pointer"
                    title="Xuất công việc ra file Excel (.xlsx)"
                  >
                    <FileSpreadsheet size={13} className="text-emerald-600" />
                    <span>Xuất Excel</span>
                  </button>

                  {/* 3. Nhập Excel */}
                  <button 
                    onClick={triggerImportFile}
                    className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-3xs transition cursor-pointer"
                    title="Nhập dữ liệu công việc từ file Excel / CSV"
                  >
                    <Upload size={13} className="text-blue-600" />
                    <span>Nhập Excel</span>
                  </button>

                  {/* 4. Nút Khóa / Mở khóa cột */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (lockedColKey === selectedColKey) {
                          setLockedColKey(null);
                        } else {
                          setLockedColKey(selectedColKey);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-3xs ${
                        lockedColKey === selectedColKey
                          ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-200"
                          : "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs"
                      }`}
                      title={
                        lockedColKey === selectedColKey
                          ? `Đang khóa đến cột "${getColumnLabel(selectedColKey)}". Bấm để mở khóa`
                          : `Bấm để khóa từ bên trái đến cột "${getColumnLabel(selectedColKey)}"`
                      }
                    >
                      {lockedColKey === selectedColKey ? <Unlock size={13} /> : <Lock size={13} />}
                      <span>
                        {lockedColKey === selectedColKey
                          ? `Mở khóa (${getColumnLabel(selectedColKey)})`
                          : `Khóa cột: ${getColumnLabel(selectedColKey)}`}
                      </span>
                    </button>

                    {lockedColKey && lockedColKey !== selectedColKey && (
                      <button
                        type="button"
                        onClick={() => setLockedColKey(null)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition cursor-pointer shadow-3xs"
                        title={`Hủy khóa các cột đang cố định (${getColumnLabel(lockedColKey)})`}
                      >
                        <Unlock size={12} className="text-red-500" />
                        <span>Mở khóa ({getColumnLabel(lockedColKey)})</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <button 
                  onClick={handleRecCreateOpen}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Tạo khuyến nghị</span>
                </button>
              )}

              {/* NGÀY BẮT ĐẦU */}
              <div 
                onClick={() => {
                  try {
                    cycleDateInputRef.current?.showPicker();
                  } catch {
                    cycleDateInputRef.current?.focus();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/30 rounded-lg text-xs font-semibold text-slate-700 shadow-3xs transition cursor-pointer select-none group"
                title="Bấm để chọn và thay đổi ngày bắt đầu"
              >
                <Calendar size={13} className="text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="uppercase text-[10px] text-slate-500 font-bold shrink-0">NGÀY BẮT ĐẦU:</span>
                <input 
                  ref={cycleDateInputRef}
                  type="date" 
                  value={getCycleStartDate(activeCycle) || ""}
                  onChange={(e) => handleCycleDateChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-bold text-blue-700 bg-transparent border-none outline-none p-0 cursor-pointer focus:ring-0 w-[115px]"
                  title="Nhấp để thay đổi ngày bắt đầu"
                />
              </div>
            </div>
          </div>

          {/* Tabs switcher */}
          <div className="flex items-center border-b border-slate-200 shrink-0 gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
            {/* Task Lists Tabs */}
            {currentTaskLists.map((taskList, idx) => {
              const isSelected = activeTab === "tasks" && activeTaskListId === taskList.id;
              const isEditing = editingListId === taskList.id;

              return (
                <div
                  key={taskList.id}
                  className={`group relative flex items-center gap-1.5 pb-2.5 pt-1 border-b-2 transition-all cursor-pointer select-none whitespace-nowrap ${
                    isSelected
                      ? "border-blue-600 text-blue-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800 font-semibold"
                  }`}
                  onClick={() => {
                    setActiveTab("tasks");
                    setActiveTaskListId(taskList.id);
                  }}
                >
                  <ListOrdered size={15} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={editingListName}
                        onChange={(e) => setEditingListName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename();
                          if (e.key === "Escape") handleCancelRename();
                        }}
                        onBlur={handleSaveRename}
                        className="px-2 py-0.5 text-xs font-bold text-slate-900 bg-white border-2 border-blue-500 rounded-md outline-none shadow-xs min-w-[140px] max-w-[240px]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveRename}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        title="Lưu tên"
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1.5"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(taskList);
                      }}
                      title="Nhấp đúp hoặc bấm icon bút chì để đổi tên"
                    >
                      <span className="text-xs uppercase">
                        {taskList.name || `Danh sách ${idx + 1}`} ({taskList.tasks.length})
                      </span>

                      {/* Rename Icon button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(taskList);
                        }}
                        className={`p-1 rounded hover:bg-slate-100 transition opacity-0 group-hover:opacity-100 cursor-pointer ${
                          isSelected ? "text-blue-500" : "text-slate-400"
                        }`}
                        title="Đổi tên danh sách công việc"
                      >
                        <Pencil size={11} />
                      </button>

                      {/* Delete Icon button (only if > 1 task list) */}
                      {currentTaskLists.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTaskList(taskList.id, taskList.name);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Xóa danh sách công việc này"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Button Thêm Danh sách công việc */}
            <button
              type="button"
              onClick={handleCreateTaskList}
              className="mb-1.5 flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-100 border border-dashed border-blue-300 rounded-lg transition cursor-pointer shadow-3xs shrink-0"
              title="Thêm danh sách công việc mới (tạo tab mới)"
            >
              <Plus size={13} />
              <span>Thêm danh sách</span>
            </button>

            {/* Separator */}
            <div className="h-4 w-[1px] bg-slate-200 mb-1.5 mx-1 shrink-0" />

            {/* Recommendations Tab */}
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`pb-2.5 pt-1 text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer border-b-2 shrink-0 ${
                activeTab === "recommendations"
                  ? "border-blue-600 text-blue-600 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700 font-semibold"
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
                <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">CHƯA CÓ CÔNG VIỆC NÀO TRONG DANH SÁCH NÀY</p>
                <p className="text-xs text-slate-400 mt-1 mb-5">Bạn có thể khởi tạo mẫu bảo trì chuẩn, tải file mẫu để nhập dữ liệu hoặc thêm công việc mới.</p>
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button 
                    type="button"
                    onClick={handlePopulateDefaultTemplate}
                    className="border border-blue-200 hover:bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                    title="Khởi tạo 24 đầu việc mẫu bảo trì chuẩn"
                  >
                    <FileSpreadsheet size={14} className="text-blue-600" />
                    <span>Khởi tạo mẫu bảo trì chuẩn (24 mục)</span>
                  </button>
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
                {/* Move Mode Notice Banner (giống triển khai dự án) */}
                {isMoveMode && (
                  <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between gap-3 text-xs text-indigo-900 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                      </span>
                      <span>
                        <strong>Chế độ Di chuyển hàng đang bật:</strong> Bạn có thể nhập số hàng mới vào ô tại cột <strong>"Hàng"</strong> rồi nhấn <strong>Enter</strong> để chuyển ngay đến vị trí đó, hoặc dùng nút <strong>▲ / ▼</strong>, hoặc kéo thả hàng.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMoveMode(false)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0"
                    >
                      Xong di chuyển
                    </button>
                  </div>
                )}

                <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[460px] relative custom-scrollbar">
                  <table className="w-full text-left border-separate border-spacing-0 text-xs border-l border-slate-200">
                  <thead className="select-none">
                    <tr className="bg-[#1E40AF] text-white">
                      {/* Cột Hàng */}
                      <th 
                        onClick={() => setSelectedColKey("row")}
                        style={{ 
                          width: "64px", 
                          minWidth: "64px", 
                          maxWidth: "64px",
                          left: isColFrozen("row") ? `${getColLeftOffset("row")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("row") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "row" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("row") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Hàng${isColFrozen("row") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("row") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Hàng</span>
                          {selectedColKey === "row" && !isColFrozen("row") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột No */}
                      <th 
                        onClick={() => setSelectedColKey("no")}
                        style={{ 
                          width: "56px", 
                          minWidth: "56px", 
                          maxWidth: "56px",
                          left: isColFrozen("no") ? `${getColLeftOffset("no")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("no") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "no" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("no") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột No${isColFrozen("no") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("no") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>No</span>
                          {selectedColKey === "no" && !isColFrozen("no") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Công việc */}
                      <th 
                        onClick={() => setSelectedColKey("name")}
                        style={{ 
                          minWidth: "280px",
                          left: isColFrozen("name") ? `${getColLeftOffset("name")}px` : undefined 
                        }}
                        className={`py-2.5 px-4 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("name") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "name" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("name") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Công việc${isColFrozen("name") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {isColFrozen("name") && <Lock size={12} className="text-amber-300 shrink-0" />}
                          <span>Công việc</span>
                          {selectedColKey === "name" && !isColFrozen("name") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Thời gian bắt đầu */}
                      <th 
                        onClick={() => setSelectedColKey("startDate")}
                        style={{ 
                          width: "112px",
                          left: isColFrozen("startDate") ? `${getColLeftOffset("startDate")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("startDate") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "startDate" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("startDate") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Thời gian bắt đầu${isColFrozen("startDate") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("startDate") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Thời gian bắt đầu</span>
                          {selectedColKey === "startDate" && !isColFrozen("startDate") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Thời gian kết thúc */}
                      <th 
                        onClick={() => setSelectedColKey("endDate")}
                        style={{ 
                          width: "112px",
                          left: isColFrozen("endDate") ? `${getColLeftOffset("endDate")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("endDate") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "endDate" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("endDate") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Thời gian kết thúc${isColFrozen("endDate") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("endDate") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Thời gian kết thúc</span>
                          {selectedColKey === "endDate" && !isColFrozen("endDate") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Thời gian bắt đầu thực tế */}
                      <th 
                        onClick={() => setSelectedColKey("actualStartDate")}
                        style={{ 
                          width: "128px",
                          left: isColFrozen("actualStartDate") ? `${getColLeftOffset("actualStartDate")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("actualStartDate") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "actualStartDate" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("actualStartDate") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Thời gian bắt đầu thực tế${isColFrozen("actualStartDate") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("actualStartDate") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Thời gian bắt đầu thực tế</span>
                          {selectedColKey === "actualStartDate" && !isColFrozen("actualStartDate") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Thời gian kết thúc thực tế */}
                      <th 
                        onClick={() => setSelectedColKey("actualEndDate")}
                        style={{ 
                          width: "128px",
                          left: isColFrozen("actualEndDate") ? `${getColLeftOffset("actualEndDate")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("actualEndDate") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "actualEndDate" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("actualEndDate") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Thời gian kết thúc thực tế${isColFrozen("actualEndDate") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("actualEndDate") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Thời gian kết thúc thực tế</span>
                          {selectedColKey === "actualEndDate" && !isColFrozen("actualEndDate") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Người thực hiện */}
                      <th 
                        onClick={() => setSelectedColKey("assignees")}
                        style={{ 
                          minWidth: "140px",
                          left: isColFrozen("assignees") ? `${getColLeftOffset("assignees")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("assignees") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "assignees" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("assignees") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Người thực hiện${isColFrozen("assignees") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("assignees") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Người thực hiện</span>
                          {selectedColKey === "assignees" && !isColFrozen("assignees") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột % Hoàn thành */}
                      <th 
                        onClick={() => setSelectedColKey("progress")}
                        style={{ 
                          width: "96px",
                          left: isColFrozen("progress") ? `${getColLeftOffset("progress")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("progress") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "progress" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("progress") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột % Hoàn thành${isColFrozen("progress") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("progress") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>% Hoàn thành</span>
                          {selectedColKey === "progress" && !isColFrozen("progress") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Trạng thái */}
                      <th 
                        onClick={() => setSelectedColKey("status")}
                        style={{ 
                          width: "128px",
                          left: isColFrozen("status") ? `${getColLeftOffset("status")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("status") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "status" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("status") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Trạng thái${isColFrozen("status") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("status") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Trạng thái</span>
                          {selectedColKey === "status" && !isColFrozen("status") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Ghi chú */}
                      <th 
                        onClick={() => setSelectedColKey("notes")}
                        style={{ 
                          minWidth: "160px",
                          left: isColFrozen("notes") ? `${getColLeftOffset("notes")}px` : undefined 
                        }}
                        className={`py-2.5 px-3 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("notes") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "notes" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("notes") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Ghi chú${isColFrozen("notes") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("notes") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Ghi chú</span>
                          {selectedColKey === "notes" && !isColFrozen("notes") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>

                      {/* Cột Thao tác */}
                      <th 
                        onClick={() => setSelectedColKey("actions")}
                        style={{ 
                          width: "96px",
                          left: isColFrozen("actions") ? `${getColLeftOffset("actions")}px` : undefined 
                        }}
                        className={`py-2.5 px-2 text-center font-bold border-b-2 border-blue-950 border-r border-blue-800/80 text-xs sm:text-sm whitespace-nowrap cursor-pointer transition select-none ${
                          isColFrozen("actions") ? "sticky top-0 z-30" : "sticky top-0 z-20"
                        } ${
                          selectedColKey === "actions" 
                            ? "bg-[#172554] text-amber-300 ring-2 ring-inset ring-amber-400" 
                            : "bg-[#1E40AF] text-white hover:bg-blue-800"
                        } ${
                          isLastFrozenCol("actions") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.25)] border-r-2 border-blue-950" : ""
                        }`}
                        title={`Nhấp để chọn cột Thao tác${isColFrozen("actions") ? " (Đang khóa)" : ""}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isColFrozen("actions") && <Lock size={11} className="text-amber-300 shrink-0" />}
                          <span>Thao tác</span>
                          {selectedColKey === "actions" && !isColFrozen("actions") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.map((t, rowIdx) => {
                      if (!isTaskVisible(t, currentTasks)) {
                        return null;
                      }

                      const isPhase = t.level === 1;
                      const isMain = t.hasChildren && t.level > 1;
                      const isSub = !isPhase && !isMain;
                      const stats = getTaskComputedStats(t, sortedTasks);
                      const isCollapsed = collapsedParents[t.id];
                      const isSelected = selectedTaskId === t.id;

                      // Backgrounds for row and sticky frozen cells
                      let rowBg = "bg-white hover:bg-slate-50/70 text-slate-700";
                      let stickyBg = "bg-white group-hover:bg-slate-50/70";

                      if (isMoveMode && moveModeOverIdx === rowIdx && moveModeDragIdx !== rowIdx) {
                        rowBg = "border-t-2 border-t-indigo-600 bg-indigo-100/80 shadow-xs";
                        stickyBg = "bg-indigo-100/80";
                      } else if (isMoveMode && moveModeDragIdx === rowIdx) {
                        rowBg = "opacity-40 bg-indigo-50/50";
                        stickyBg = "bg-indigo-50/50";
                      } else if (isSelected) {
                        if (isPhase) {
                          rowBg = "bg-[#93C5FD] font-black text-blue-950 shadow-sm ring-1 ring-inset ring-blue-600";
                          stickyBg = "bg-[#93C5FD]";
                        } else {
                          rowBg = "bg-[#FEF3C7] font-medium text-amber-950 hover:bg-[#FDE68A] shadow-sm ring-1 ring-inset ring-amber-500";
                          stickyBg = "bg-[#FEF3C7] group-hover:bg-[#FDE68A]";
                        }
                      } else if (isPhase) {
                        rowBg = "bg-[#BFDBFE] font-black text-blue-950 animate-fade-in";
                        stickyBg = "bg-[#BFDBFE]";
                      } else if (isMain) {
                        rowBg = "bg-[#E2EAF4] font-bold text-slate-900 hover:bg-[#D7E3F1]";
                        stickyBg = "bg-[#E2EAF4] group-hover:bg-[#D7E3F1]";
                      }

                      return (
                        <tr 
                          key={t.id} 
                          onClick={() => setSelectedTaskId(t.id)}
                          onDragOver={(e) => isMoveMode && handleMoveModeDragOver(e, rowIdx)}
                          onDrop={(e) => isMoveMode && handleMoveModeDrop(rowIdx)}
                          className={`border-b border-slate-200 transition group cursor-pointer ${rowBg}`}
                        >
                          {/* Cột Hàng (1, 2, 3...) */}
                          {isMoveMode ? (
                            <td 
                              style={{ 
                                width: "64px", 
                                minWidth: "64px", 
                                maxWidth: "64px",
                                left: isColFrozen("row") ? `${getColLeftOffset("row")}px` : undefined 
                              }}
                              className={`py-0.5 px-1 text-center border-b border-r border-slate-200 whitespace-nowrap bg-indigo-50/70 select-none ${
                                isColFrozen("row") ? "sticky left-0 z-10 bg-indigo-50/70" : ""
                              } ${
                                isLastFrozenCol("row") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                              }`}
                            >
                              <div className="inline-flex items-center justify-center gap-0.5">
                                <MoveRowInput
                                  rowIndex={rowIdx}
                                  totalRows={sortedTasks.length}
                                  onMoveToRow={handleMovePlanRowToPosition}
                                />
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    disabled={rowIdx === 0}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleMovePlanRow(rowIdx, rowIdx - 1);
                                    }}
                                    className="p-1 hover:bg-indigo-200 active:bg-indigo-300 text-indigo-700 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed leading-none transition"
                                    title="Chuyển lên 1 hàng"
                                  >
                                    <ArrowUp size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={rowIdx === sortedTasks.length - 1}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleMovePlanRow(rowIdx, rowIdx + 1);
                                    }}
                                    className="p-1 hover:bg-indigo-200 active:bg-indigo-300 text-indigo-700 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed leading-none transition"
                                    title="Chuyển xuống 1 hàng"
                                  >
                                    <ArrowDown size={11} />
                                  </button>
                                </div>
                              </div>
                            </td>
                          ) : (
                            <td 
                              style={{ 
                                width: "64px", 
                                minWidth: "64px", 
                                maxWidth: "64px",
                                left: isColFrozen("row") ? `${getColLeftOffset("row")}px` : undefined 
                              }}
                              className={`py-1 px-2 text-center font-mono font-bold border-b border-r border-slate-200 whitespace-nowrap text-xs ${
                                isSelected 
                                  ? (isPhase ? "border-l-4 border-l-blue-700 text-blue-950 font-black" : "border-l-4 border-l-amber-600 text-amber-950 font-black") 
                                  : "text-slate-500"
                              } ${
                                isColFrozen("row") ? `sticky z-10 ${stickyBg}` : (isSelected ? stickyBg : "bg-slate-50/40")
                              } ${
                                isLastFrozenCol("row") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                              }`}
                            >
                              {rowIdx + 1}
                            </td>
                          )}

                          {/* Cột No (1, 1.1, 1.1.1...) */}
                          <td 
                            style={{ 
                              width: "56px", 
                              minWidth: "56px", 
                              maxWidth: "56px",
                              left: isColFrozen("no") ? `${getColLeftOffset("no")}px` : undefined 
                            }}
                            className={`py-1 px-2 text-center font-mono font-bold border-b border-r border-slate-200 whitespace-nowrap ${
                              isSelected ? "text-amber-950" : "text-slate-700"
                            } ${
                              isColFrozen("no") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("no") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            {isMoveMode ? (
                              <div 
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = "move";
                                  e.dataTransfer.setData("text/plain", `${rowIdx}`);
                                  handleMoveModeDragStart(rowIdx);
                                }}
                                onDragEnd={handleMoveModeDragEnd}
                                className="flex items-center justify-center gap-1 cursor-grab active:cursor-grabbing text-indigo-700 font-bold select-none px-1 py-0.5 rounded hover:bg-indigo-100 active:bg-indigo-200 transition"
                                title="Giữ chuột vào đây để kéo hàng đến vị trí mong muốn"
                              >
                                <GripVertical size={14} className="text-indigo-500 shrink-0" />
                                <span>{t.stt}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                {(isPhase || isMain) && t.hasChildren && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCollapsedParents(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                                    }}
                                    className="p-0.5 hover:bg-slate-200/80 rounded text-slate-600 cursor-pointer"
                                    title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                                  >
                                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                  </button>
                                )}
                                <span>{t.stt}</span>
                              </div>
                            )}
                          </td>

                          {/* Công việc */}
                          <td 
                            style={{ 
                              minWidth: "280px",
                              left: isColFrozen("name") ? `${getColLeftOffset("name")}px` : undefined 
                            }}
                            className={`py-1 px-3 border-b border-r border-slate-200 whitespace-nowrap ${
                              isColFrozen("name") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("name") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            {isPhase ? (
                              <span className="text-slate-900 text-xs font-black uppercase tracking-wide whitespace-nowrap" title={t.name}>
                                {t.name}
                              </span>
                            ) : isMain ? (
                              <div className="pl-3 font-bold text-slate-800 text-xs whitespace-nowrap" title={t.name}>
                                {t.name}
                              </div>
                            ) : t.level > 2 ? (
                              <div className="pl-7 flex items-center gap-1.5 text-slate-650 font-medium text-xs whitespace-nowrap" title={t.name}>
                                <span className="text-slate-400 font-mono">↳</span>
                                <span className="whitespace-nowrap">{t.name}</span>
                              </div>
                            ) : (
                              <div className="pl-3 text-slate-700 font-medium text-xs whitespace-nowrap" title={t.name}>
                                <span>{t.name}</span>
                              </div>
                            )}
                          </td>

                          {/* Thời gian bắt đầu */}
                          <td 
                            style={{ 
                              left: isColFrozen("startDate") ? `${getColLeftOffset("startDate")}px` : undefined 
                            }}
                            className={`py-1 px-1.5 border-b border-r border-slate-200 text-slate-650 font-medium text-center whitespace-nowrap ${
                              isColFrozen("startDate") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("startDate") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            {stats.isAuto ? (
                              <span className="text-[11px] font-semibold text-blue-900">
                                {stats.startDate ? formatDateVN(stats.startDate) : "—"}
                              </span>
                            ) : (
                              <InlineDateCell
                                value={t.startDate}
                                onChange={(val) => updateTaskField(t.id, "startDate", val)}
                              />
                            )}
                          </td>

                          {/* Thời gian kết thúc */}
                          <td 
                            style={{ 
                              left: isColFrozen("endDate") ? `${getColLeftOffset("endDate")}px` : undefined 
                            }}
                            className={`py-1 px-1.5 border-b border-r border-slate-200 text-slate-650 font-medium text-center whitespace-nowrap ${
                              isColFrozen("endDate") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("endDate") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            {stats.isAuto ? (
                              <span className="text-[11px] font-semibold text-blue-900">
                                {stats.endDate ? formatDateVN(stats.endDate) : "—"}
                              </span>
                            ) : (
                              <InlineDateCell
                                value={t.endDate}
                                onChange={(val) => updateTaskField(t.id, "endDate", val)}
                              />
                            )}
                          </td>

                          {/* Thời gian bắt đầu thực tế */}
                          <td 
                            style={{ 
                              left: isColFrozen("actualStartDate") ? `${getColLeftOffset("actualStartDate")}px` : undefined 
                            }}
                            className={`py-1 px-1.5 border-b border-r border-slate-200 text-slate-650 font-medium text-center whitespace-nowrap ${
                              isColFrozen("actualStartDate") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("actualStartDate") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            {stats.isAuto ? (
                              <span className="text-slate-400 text-xs">—</span>
                            ) : (
                              <InlineDateCell
                                value={t.actualStartDate}
                                onChange={(val) => updateTaskField(t.id, "actualStartDate", val)}
                              />
                            )}
                          </td>

                          {/* Thời gian kết thúc thực tế */}
                          <td 
                            style={{ 
                              left: isColFrozen("actualEndDate") ? `${getColLeftOffset("actualEndDate")}px` : undefined 
                            }}
                            className={`py-1 px-1.5 border-b border-r border-slate-200 text-slate-650 font-medium text-center whitespace-nowrap ${
                              isColFrozen("actualEndDate") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("actualEndDate") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            {stats.isAuto ? (
                              stats.actualEndDate ? (
                                <span className="text-emerald-700 font-bold text-xs">{formatDateVN(stats.actualEndDate)}</span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )
                            ) : (
                              <InlineDateCell
                                value={t.actualEndDate}
                                onChange={(val) => updateTaskField(t.id, "actualEndDate", val)}
                              />
                            )}
                          </td>

                          {/* Người thực hiện */}
                          <td 
                            style={{ 
                              left: isColFrozen("assignees") ? `${getColLeftOffset("assignees")}px` : undefined 
                            }}
                            className={`py-0.5 px-1.5 border-b border-r border-slate-200 text-center whitespace-nowrap ${
                              isColFrozen("assignees") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("assignees") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
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
                              <InlineStaffCellArray
                                value={t.assignees || []}
                                staffList={staffList}
                                onChange={(arr) => updateTaskField(t.id, "assignees", arr)}
                              />
                            )}
                          </td>

                          {/* % Hoàn thành */}
                          <td 
                            style={{ 
                              left: isColFrozen("progress") ? `${getColLeftOffset("progress")}px` : undefined 
                            }}
                            className={`py-0.5 px-1 border-b border-r border-slate-200 text-center whitespace-nowrap ${
                              isColFrozen("progress") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("progress") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            {stats.isAuto ? (
                              <div className="flex items-center justify-center gap-0.5" title="Tự động tính từ các công việc con">
                                <span className={`font-black text-xs ${isPhase ? 'text-blue-900' : 'text-slate-800'}`}>
                                  {stats.progress}%
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold select-none">⚙</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center gap-0.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded-md px-1.5 py-0.5 transition focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:bg-white shadow-2xs">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={
                                    t.status === "Hoàn thành" && (t.progress === undefined || t.progress <= 1)
                                      ? 100
                                      : (t.progress !== undefined 
                                          ? (t.progress > 0 && t.progress <= 1 ? Math.round(t.progress * 100) : t.progress)
                                          : (t.status === "Hoàn thành" ? 100 : (t.status === "Đang Thực Hiện" || t.status === "Đang thực hiện") ? 50 : 0))
                                  }
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
                                    updateTaskField(t.id, "progress", val);
                                  }}
                                  className="w-10 text-right font-extrabold text-slate-800 text-xs bg-transparent outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  title="Nhấp để đổi % hoàn thành"
                                />
                                <span className="text-[10px] font-bold text-slate-400 select-none shrink-0">%</span>
                              </div>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td 
                            style={{ 
                              left: isColFrozen("status") ? `${getColLeftOffset("status")}px` : undefined 
                            }}
                            className={`py-0.5 px-1 border-b border-r border-slate-200 text-center whitespace-nowrap ${
                              isColFrozen("status") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("status") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            {stats.isAuto ? (
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded tracking-wide whitespace-nowrap ${
                                stats.progress === 100
                                  ? 'bg-[#2ecc71] text-white'
                                  : stats.progress > 0
                                  ? 'bg-[#e67e22] text-white'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {stats.progress === 100 ? 'Hoàn thành' : stats.progress > 0 ? 'Đang thực hiện' : 'Chưa thực hiện'}
                              </span>
                            ) : (
                              <select
                                value={t.status || "Chưa bắt đầu"}
                                onChange={(e) => updateTaskField(t.id, "status", e.target.value)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded tracking-wide border cursor-pointer outline-none transition ${
                                  t.status === 'Hoàn thành'
                                    ? "bg-[#2ecc71] text-white border-emerald-600"
                                    : t.status === 'Đang Thực Hiện' || t.status === 'Đang thực hiện'
                                    ? "bg-[#e67e22] text-white border-amber-600"
                                    : t.status === 'Đang Kế Hoạch' || t.status === 'Đang kế hoạch'
                                    ? "bg-sky-500 text-white border-sky-600"
                                    : "bg-slate-100 text-slate-700 border-slate-300"
                                }`}
                                title="Bấm để chọn trạng thái"
                              >
                                <option value="Chưa bắt đầu" className="bg-white text-slate-800">Chưa thực hiện</option>
                                <option value="Đang Kế Hoạch" className="bg-white text-slate-800">Đang Kế Hoạch</option>
                                <option value="Đang Thực Hiện" className="bg-white text-slate-800">Đang thực hiện</option>
                                <option value="Hoàn thành" className="bg-white text-slate-800">Hoàn thành</option>
                                <option value="Tạm dừng" className="bg-white text-slate-800">Tạm dừng</option>
                              </select>
                            )}
                          </td>

                          {/* Ghi chú */}
                          <td 
                            style={{ 
                              left: isColFrozen("notes") ? `${getColLeftOffset("notes")}px` : undefined 
                            }}
                            className={`py-0.5 px-2 border-b border-r border-slate-200 whitespace-nowrap min-w-[140px] max-w-[200px] ${
                              isColFrozen("notes") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("notes") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
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
                              placeholder="Bấm để ghi chú..."
                              className="w-full px-1.5 py-0.5 text-xs text-slate-650 italic bg-transparent hover:bg-slate-50 focus:bg-white focus:not-italic focus:text-slate-800 focus:ring-1 focus:ring-blue-400 border border-transparent focus:border-blue-400 rounded outline-none transition truncate focus:overflow-visible"
                              title={t.notes ? t.notes : "Bấm vào đây để viết ghi chú"}
                            />
                          </td>

                          {/* Thao tác */}
                          <td 
                            style={{ 
                              left: isColFrozen("actions") ? `${getColLeftOffset("actions")}px` : undefined 
                            }}
                            className={`py-1 px-2 border-b border-r border-slate-200 text-center whitespace-nowrap ${
                              isColFrozen("actions") ? `sticky z-10 ${stickyBg}` : ""
                            } ${
                              isLastFrozenCol("actions") ? "shadow-[3px_0_6px_-2px_rgba(0,0,0,0.15)] border-r-2 border-slate-300" : ""
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddTaskOpen(t.id);
                                }}
                                className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition cursor-pointer"
                                title="Thêm công việc con vào mục này"
                              >
                                <Plus size={12} />
                                <span>Thêm</span>
                              </button>
                              <span className="text-slate-300 select-none">|</span>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTaskOpen(t);
                                }}
                                className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                                title="Sửa công việc này"
                              >
                                <Pencil size={12} />
                                <span>Sửa</span>
                              </button>
                              <span className="text-slate-300 select-none">|</span>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(t.id);
                                }}
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
                          status: val === 100 ? "Hoàn thành" : (val > 0 ? "Đang thực hiện" : (f.status === "Hoàn thành" ? "Chưa bắt đầu" : f.status))
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
                        progress: newStatus === "Hoàn thành" ? 100 : (newStatus === "Chưa bắt đầu" ? 0 : (f.progress === 100 ? 50 : f.progress))
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
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tổng số lần bảo trì:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={configTotalCycles}
                    onChange={e => setConfigTotalCycles(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfigTotalCycles(prev => Math.max(1, prev - 1))}
                      className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfigTotalCycles(prev => prev + 1)}
                      className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
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
                  onClick={handleSaveConfigModal}
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

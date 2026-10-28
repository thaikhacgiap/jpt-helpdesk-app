// Template definition and helper functions for Maintenance Plan

export interface MaintenanceTask {
  id: string;
  parentId: string | null;
  name: string;
  assignees: string[];
  department?: string;
  startDate: string;
  endDate: string;
  status: string; // 'Chưa bắt đầu' | 'Đang Kế Hoạch' | 'Đang Thực Hiện' | 'Hoàn thành' | 'Tạm dừng'
  notes: string;
  orderIndex: number;
}

export interface TemplateDefinitionItem {
  tempId: string;
  parentTempId: string | null;
  name: string;
  status: string;
  isBold?: boolean;
}

// Exact template structure from user image:
export const DEFAULT_MAINTENANCE_TEMPLATE: TemplateDefinitionItem[] = [
  // Phase 1
  {
    tempId: "1",
    parentTempId: null,
    name: "Lên kế hoạch, chuẩn bị tài liệu trước khi thực hiện",
    status: "Đang Thực Hiện",
    isBold: true,
  },
  {
    tempId: "1.1",
    parentTempId: "1",
    name: "Lên kế hoạch thực hiện chi tiết",
    status: "",
  },
  {
    tempId: "1.2",
    parentTempId: "1",
    name: "Thống nhất thời gian thực hiện với khách hàng",
    status: "",
  },
  {
    tempId: "1.3",
    parentTempId: "1",
    name: "Chuẩn bị các tài liệu báo cáo, hướng dẫn cần thiết",
    status: "",
  },

  // Phase 2
  {
    tempId: "2",
    parentTempId: null,
    name: "Thực hiện kiểm tra & thu thập và phân tích log CSDL",
    status: "Đang Kế Hoạch",
    isBold: true,
  },
  {
    tempId: "2.1",
    parentTempId: "2",
    name: "Kiểm tra cơ bản",
    status: "",
    isBold: true,
  },
  {
    tempId: "2.1.1",
    parentTempId: "2.1",
    name: "Kiểm tra mục 1",
    status: "",
  },
  {
    tempId: "2.1.2",
    parentTempId: "2.1",
    name: "Kiểm tra mục 2",
    status: "",
  },
  {
    tempId: "2.1.3",
    parentTempId: "2.1",
    name: "Kiểm tra mục 3",
    status: "",
  },
  {
    tempId: "2.1.4",
    parentTempId: "2.1",
    name: "Kiểm tra mục 4",
    status: "",
  },
  {
    tempId: "2.1.5",
    parentTempId: "2.1",
    name: "Kiểm tra mục 5",
    status: "",
  },

  // Phase 3
  {
    tempId: "3",
    parentTempId: null,
    name: "Thực hiện phân tích đánh giá và đưa ra khuyến nghị",
    status: "Đang Kế Hoạch",
    isBold: true,
  },
  {
    tempId: "3.1",
    parentTempId: "3",
    name: "Phân tích, đánh giá mục 1",
    status: "",
  },
  {
    tempId: "3.2",
    parentTempId: "3",
    name: "Phân tích, đánh giá mục 2",
    status: "",
  },
  {
    tempId: "3.3",
    parentTempId: "3",
    name: "Phân tích, đánh giá mục 3",
    status: "",
  },
  {
    tempId: "3.4",
    parentTempId: "3",
    name: "Phân tích, đánh giá mục 4",
    status: "",
  },

  // Phase 4
  {
    tempId: "4",
    parentTempId: null,
    name: "Báo cáo/đề xuất",
    status: "Đang Kế Hoạch",
    isBold: true,
  },
  {
    tempId: "4.1",
    parentTempId: "4",
    name: "Gửi báo cáo",
    status: "",
  },
  {
    tempId: "4.2",
    parentTempId: "4",
    name: "Trình bày báo cáo",
    status: "",
  },

  // Phase 5
  {
    tempId: "5",
    parentTempId: null,
    name: "Thực hiện triển khai bảo trì (nếu có)",
    status: "",
    isBold: true,
  },
  {
    tempId: "5.1",
    parentTempId: "5",
    name: "Thông báo KH về kế hoạch thực hiện bảo trì",
    status: "",
  },
  {
    tempId: "5.2",
    parentTempId: "5",
    name: "Thực hiện các công việc bảo trì",
    status: "",
  },
  {
    tempId: "5.3",
    parentTempId: "5",
    name: "Lấy xác nhận báo cáo/biên bản thực hiện",
    status: "",
  },
  {
    tempId: "5.4",
    parentTempId: "5",
    name: "Hoàn thiện hồ sơ, gửi KH",
    status: "",
  },
];

/**
 * Generate a full set of tasks with UUIDs from the default template
 */
export function generateDefaultTasks(startDate = ""): MaintenanceTask[] {
  const idMap: Record<string, string> = {};
  
  // First pass: assign UUIDs
  DEFAULT_MAINTENANCE_TEMPLATE.forEach(item => {
    idMap[item.tempId] = crypto.randomUUID();
  });

  // Second pass: build tasks
  return DEFAULT_MAINTENANCE_TEMPLATE.map((item, idx) => ({
    id: idMap[item.tempId],
    parentId: item.parentTempId ? (idMap[item.parentTempId] || null) : null,
    name: item.name,
    assignees: [],
    department: "",
    startDate: startDate || "",
    endDate: startDate || "",
    status: item.status || "",
    notes: "",
    orderIndex: idx,
  }));
}

export interface HierarchicalTask extends MaintenanceTask {
  stt: string;
  level: number;
  hasChildren: boolean;
  isParent: boolean;
}

/**
 * Traverse tasks hierarchically and calculate STT ("1", "1.1", "2.1.1", etc.), level, and children info
 */
export function getSortedHierarchicalTasks(tasks: MaintenanceTask[]): HierarchicalTask[] {
  const result: HierarchicalTask[] = [];
  if (!tasks || tasks.length === 0) return result;

  const validIds = new Set(tasks.map(t => t.id));

  // Find root tasks (parentId is null or parentId not in existing tasks)
  const getChildrenOf = (parentId: string | null) => {
    return tasks
      .filter(t => parentId ? t.parentId === parentId : (!t.parentId || !validIds.has(t.parentId)))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const traverse = (parentId: string | null, prefix = "", level = 1) => {
    const children = getChildrenOf(parentId);
    children.forEach((task, idx) => {
      const stt = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
      const subChildren = tasks.filter(t => t.parentId === task.id);
      const hasChildren = subChildren.length > 0;

      result.push({
        ...task,
        stt,
        level,
        hasChildren,
        isParent: level === 1,
      });

      if (hasChildren) {
        traverse(task.id, stt, level + 1);
      }
    });
  };

  traverse(null);
  return result;
}

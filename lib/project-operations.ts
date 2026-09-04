export interface ProjectTask {
  id: string;
  title: string;
  phase: string; // e.g., "Phase 1: Chuẩn bị", "Phase 2: Triển khai", "Phase 3: Nghiệm thu"
  assignee: string;
  startDate: string;
  endDate: string;
  status: 'Todo' | 'In Progress' | 'Completed';
  progress: number; // 0 - 100
  // New fields for hierarchical excel-like plan
  taskIndex?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  notes?: string;
  isHeader?: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  plannedDate: string;
  actualDate?: string;
  status: 'Pending' | 'Reached' | 'Overdue';
  type: 'Milestone' | 'Meeting' | 'Review' | 'Release';
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: string; // e.g., "pdf", "docx", "xlsx", "zip", etc.
  size: string;
  uploadedDate: string;
  uploader: string;
  category: 'Contract' | 'Survey' | 'Design' | 'Report' | 'Minutes' | 'Other';
}

export interface ProjectDiaryEntry {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  category: 'Update' | 'Issue' | 'Resolve' | 'Comment' | 'Milestone';
}

export interface ProjectSowItem {
  item: string;
  deliverable: string;
  status: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  customer: string;
  customerId?: string;
  contractId?: string;
  contractNo?: string;
  manager: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Delayed';
  description: string;
  progress: number; // calculated from tasks
  plan: ProjectTask[];
  timeline: ProjectMilestone[];
  documents: ProjectDocument[];
  diary: ProjectDiaryEntry[];
  sow?: ProjectSowItem[];
  notes?: string[];
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-1",
    code: "PROJ-2026-001",
    name: "Triển khai Hệ thống IT Helpdesk JPT v4.0",
    customer: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)",
    manager: "John D.",
    startDate: "2026-06-01",
    endDate: "2026-08-30",
    budget: 350000000,
    status: "Active",
    description: "Nâng cấp hệ thống Helpdesk nội bộ lên phiên bản v4.0. Module mới tích hợp quản lý Ticket, kiểm soát thời gian SLA tự động, danh sách nhân viên và hệ thống triển khai dự án.",
    progress: 45,
    plan: [
      {
        id: "task-1-0",
        title: "Chuẩn bị",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Hiếu, Dũng",
        startDate: "2026-07-05",
        endDate: "2026-07-05",
        actualStartDate: "2026-07-07",
        actualEndDate: "2026-07-09",
        status: "In Progress",
        progress: 84,
        taskIndex: "1",
        isHeader: true
      },
      {
        id: "task-1-1",
        title: "Khảo sát yêu cầu triển khai hệ thống AVDF",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Hiếu",
        startDate: "2026-07-05",
        endDate: "2026-07-08",
        actualStartDate: "2026-07-08",
        actualEndDate: "2026-07-10",
        status: "Completed",
        progress: 100,
        taskIndex: "1.1",
        isHeader: false
      },
      {
        id: "task-1-2",
        title: "Khảo sát hiện trạng CSDL và cơ chế sao lưu",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Hiếu",
        startDate: "2026-07-05",
        endDate: "2026-07-08",
        actualStartDate: "2026-07-09",
        actualEndDate: "2026-07-11",
        status: "Completed",
        progress: 100,
        taskIndex: "1.2",
        isHeader: false
      },
      {
        id: "task-1-3",
        title: "Khảo sát nguồn truy cập CSDL và các dữ liệu cần thu thập, bảo vệ",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Hiếu",
        startDate: "2026-07-06",
        endDate: "2026-07-10",
        actualStartDate: "2026-07-10",
        actualEndDate: "2026-07-12",
        status: "In Progress",
        progress: 90,
        taskIndex: "1.3",
        isHeader: false
      },
      {
        id: "task-1-4",
        title: "Khảo sát yêu cầu triển khai các tính năng tường lửa CSDL, kiểm toán log",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Hiếu",
        startDate: "2026-07-07",
        endDate: "2026-07-11",
        actualStartDate: "2026-07-11",
        actualEndDate: "2026-07-13",
        status: "Completed",
        progress: 100,
        taskIndex: "1.4",
        isHeader: false
      },
      {
        id: "task-1-5",
        title: "Khảo sát hệ thống mạng",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Hiếu",
        startDate: "2026-07-08",
        endDate: "2026-07-12",
        actualStartDate: "2026-07-12",
        actualEndDate: "2026-07-14",
        status: "In Progress",
        progress: 50,
        taskIndex: "1.5",
        isHeader: false
      },
      {
        id: "task-1-6",
        title: "Khảo sát hạ tầng triển khai",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Dũng",
        startDate: "2026-07-09",
        endDate: "2026-07-13",
        actualStartDate: "2026-07-13",
        actualEndDate: "2026-07-15",
        status: "Completed",
        progress: 100,
        taskIndex: "1.6",
        isHeader: false
      },
      {
        id: "task-1-7",
        title: "Đề xuất và thống nhất kế hoạch triển khai",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Dũng",
        startDate: "2026-07-10",
        endDate: "2026-07-14",
        actualStartDate: "2026-07-14",
        actualEndDate: "2026-07-16",
        status: "Completed",
        progress: 100,
        taskIndex: "1.7",
        isHeader: false
      },
      {
        id: "task-2-0",
        title: "Triển khai cài đặt Oracle AVDF",
        phase: "Phase 2: Triển khai",
        assignee: "Hiếu, Dũng",
        startDate: "2026-07-13",
        endDate: "2026-07-13",
        actualStartDate: "2026-07-15",
        actualEndDate: "2026-07-17",
        status: "Completed",
        progress: 100,
        taskIndex: "2",
        isHeader: true
      },
      {
        id: "task-2-1",
        title: "Cài đặt máy chủ Audit Vault Server",
        phase: "Phase 2: Triển khai",
        assignee: "Dũng",
        startDate: "2026-07-13",
        endDate: "2026-07-16",
        actualStartDate: "2026-07-15",
        actualEndDate: "2026-07-17",
        status: "Completed",
        progress: 100,
        taskIndex: "2.1",
        isHeader: false
      },
      {
        id: "task-2-2",
        title: "Cài đặt máy chủ Database Firewall Server",
        phase: "Phase 2: Triển khai",
        assignee: "Dũng",
        startDate: "2026-07-13",
        endDate: "2026-07-16",
        actualStartDate: "2026-07-15",
        actualEndDate: "2026-07-17",
        status: "Completed",
        progress: 100,
        taskIndex: "2.2",
        isHeader: false
      },
      {
        id: "task-2-3",
        title: "Cấu hình tích hợp máy chủ Database Firewall Server vào máy chủ quản trị tập trung Audit Vault Server",
        phase: "Phase 2: Triển khai",
        assignee: "Dũng",
        startDate: "2026-07-17",
        endDate: "2026-07-20",
        actualStartDate: "2026-07-20",
        actualEndDate: "2026-07-20",
        status: "Completed",
        progress: 100,
        taskIndex: "2.3",
        isHeader: false
      }
    ],
    timeline: [
      {
        id: "ms-1-1",
        title: "Họp Kick-off Dự án",
        description: "Họp triển khai và thống nhất kế hoạch làm việc với khách hàng ACME Corp.",
        plannedDate: "2026-06-01",
        actualDate: "2026-06-01",
        status: "Reached",
        type: "Meeting"
      },
      {
        id: "ms-1-2",
        title: "Phê duyệt Thiết kế DB & UI",
        description: "Hoàn tất ký biên bản phê duyệt thiết kế kỹ thuật của dự án.",
        plannedDate: "2026-06-25",
        actualDate: "2026-06-26",
        status: "Reached",
        type: "Milestone"
      },
      {
        id: "ms-1-3",
        title: "Bàn giao Bản thử nghiệm Beta (UAT)",
        description: "Mở hệ thống chạy thử nghiệm cho khách hàng đánh giá lần 1.",
        plannedDate: "2026-07-28",
        status: "Pending",
        type: "Release"
      },
      {
        id: "ms-1-4",
        title: "Nghiệm thu toàn bộ Dự án",
        description: "Bàn giao mã nguồn và nghiệm thu thanh lý hợp đồng triển khai.",
        plannedDate: "2026-08-30",
        status: "Pending",
        type: "Milestone"
      }
    ],
    documents: [
      {
        id: "doc-1-1",
        name: "Hop_Dong_Dich_Vu_Trien_Khai_Helpdesk.pdf",
        type: "pdf",
        size: "2.4 MB",
        uploadedDate: "2026-06-02",
        uploader: "John D.",
        category: "Contract"
      },
      {
        id: "doc-1-2",
        name: "Bien_Ban_Khao_Sat_Yeu_Cau_ACME.docx",
        type: "docx",
        size: "1.1 MB",
        uploadedDate: "2026-06-10",
        uploader: "Jane S.",
        category: "Survey"
      },
      {
        id: "doc-1-3",
        name: "Ban_Thiet_Ke_DB_Chi_Tiet_v1.xlsx",
        type: "xlsx",
        size: "850 KB",
        uploadedDate: "2026-06-21",
        uploader: "Mike R.",
        category: "Design"
      }
    ],
    diary: [
      {
        id: "diary-1-1",
        author: "John D.",
        timestamp: "2026-06-01T09:30:00Z",
        content: "Khởi động dự án triển khai Helpdesk v4.0. Khách hàng cam kết hỗ trợ tối đa về đầu mối cung cấp yêu cầu.",
        category: "Milestone"
      },
      {
        id: "diary-1-2",
        author: "Mike R.",
        timestamp: "2026-06-18T16:45:00Z",
        content: "Đã hoàn thành thiết kế DB. Đang chuyển giao bản vẽ thiết kế để các bạn Frontend code mock trước giao diện.",
        category: "Update"
      },
      {
        id: "diary-1-3",
        author: "Jane S.",
        timestamp: "2026-07-06T10:15:00Z",
        content: "Gặp sự cố với phân quyền RLS Policies của Supabase trên bảng ticket_assigned. Sẽ tạo ticket nội bộ hỗ trợ xử lý.",
        category: "Issue"
      },
      {
        id: "diary-1-4",
        author: "Mike R.",
        timestamp: "2026-07-07T08:30:00Z",
        content: "Đã fix xong lỗi RLS policy cho ticket_assigned bằng cách cập nhật quy tắc check uuid staff. Đã test hoạt động tốt.",
        category: "Resolve"
      }
    ]
  },
  {
    id: "proj-2",
    code: "PROJ-2026-002",
    name: "Nâng cấp Hạ tầng Mạng Chi nhánh phía Nam",
    customer: "Công ty Cổ phần Thép Việt",
    manager: "Mike R.",
    startDate: "2026-08-01",
    endDate: "2026-10-15",
    budget: 750000000,
    status: "Planning",
    description: "Cải tạo phòng server room, đi lại dây mạng cat6 và lắp đặt hệ thống Cisco Switch/Firewall mới cho tòa nhà 5 tầng chi nhánh mới tại Bình Dương.",
    progress: 0,
    plan: [
      {
        id: "task-2-1-1",
        title: "Khảo sát mặt bằng & Sơ đồ đi dây cáp",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Mike R.",
        startDate: "2026-08-01",
        endDate: "2026-08-05",
        status: "Todo",
        progress: 0
      },
      {
        id: "task-2-1-2",
        title: "Đặt hàng thiết bị mạng Cisco (Switch, AP, Firewall)",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Tom H.",
        startDate: "2026-08-03",
        endDate: "2026-08-15",
        status: "Todo",
        progress: 0
      }
    ],
    timeline: [
      {
        id: "ms-2-1",
        title: "Duyệt Dự toán Thiết bị",
        description: "Bên khách hàng phê duyệt danh sách thiết bị cần nhập khẩu.",
        plannedDate: "2026-08-02",
        status: "Pending",
        type: "Review"
      }
    ],
    documents: [
      {
        id: "doc-2-1",
        name: "Bao_Gia_Thiet_Bi_Cisco_Chinh_Hang.xlsx",
        type: "xlsx",
        size: "340 KB",
        uploadedDate: "2026-07-05",
        uploader: "Tom H.",
        category: "Report"
      }
    ],
    diary: [
      {
        id: "diary-2-1",
        author: "Mike R.",
        timestamp: "2026-07-07T11:00:00Z",
        content: "Đã liên hệ NCC thiết bị để lấy báo giá chiết khấu dự án. Dự kiến tuần sau sẽ trình ký khách hàng.",
        category: "Comment"
      }
    ]
  },
  {
    id: "proj-3",
    code: "PROJ-2026-003",
    name: "Di trú Cơ sở Dữ liệu Sang PostgreSQL Cloud",
    customer: "Ngân hàng Thương mại JPT",
    manager: "Tom H.",
    startDate: "2026-05-10",
    endDate: "2026-07-10",
    budget: 1200000000,
    status: "Delayed",
    description: "Di chuyển cơ sở dữ liệu giao dịch cũ từ Oracle Database 12c sang PostgreSQL trên AWS Aurora RDS. Đảm bảo downtime tối đa dưới 30 phút.",
    progress: 65,
    plan: [
      {
        id: "task-3-1-1",
        title: "Thiết lập cấu hình mạng AWS VPC & VPN kết nối",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Tom H.",
        startDate: "2026-05-10",
        endDate: "2026-05-20",
        status: "Completed",
        progress: 100
      },
      {
        id: "task-3-1-2",
        title: "Sử dụng AWS SCT để chuyển đổi schema Oracle sang PG",
        phase: "Phase 1: Chuẩn bị",
        assignee: "Mike R.",
        startDate: "2026-05-21",
        endDate: "2026-06-05",
        status: "Completed",
        progress: 100
      },
      {
        id: "task-3-2-1",
        title: "Đồng bộ dữ liệu ban đầu bằng AWS DMS",
        phase: "Phase 2: Triển khai",
        assignee: "Tom H.",
        startDate: "2026-06-06",
        endDate: "2026-06-25",
        status: "Completed",
        progress: 100
      },
      {
        id: "task-3-2-2",
        title: "Xử lý lỗi SQL không tương thích (Store Procedures, Views)",
        phase: "Phase 2: Triển khai",
        assignee: "Mike R.",
        startDate: "2026-06-26",
        endDate: "2026-07-05",
        status: "In Progress",
        progress: 80
      },
      {
        id: "task-3-2-3",
        title: "Di trú chạy thử (Dry-run migration) & Kiểm tra hiệu năng",
        phase: "Phase 2: Triển khai",
        assignee: "Emily R.",
        startDate: "2026-07-06",
        endDate: "2026-07-12",
        status: "In Progress",
        progress: 10
      },
      {
        id: "task-3-3-1",
        title: "Bàn giao hệ thống mới & Ký nghiệm thu",
        phase: "Phase 3: Bàn giao",
        assignee: "Tom H.",
        startDate: "2026-07-15",
        endDate: "2026-07-20",
        status: "Todo",
        progress: 0
      }
    ],
    timeline: [
      {
        id: "ms-3-1",
        title: "Đồng bộ hóa Schema DB thành công",
        description: "Schema PostgreSQL được tối ưu trên môi trường Staging.",
        plannedDate: "2026-06-05",
        actualDate: "2026-06-07",
        status: "Reached",
        type: "Milestone"
      },
      {
        id: "ms-3-2",
        title: "Bắt đầu UAT Dry-run",
        description: "Thực hiện di chuyển thử nghiệm để ước tính thời gian downtime.",
        plannedDate: "2026-07-06",
        status: "Overdue",
        type: "Review"
      }
    ],
    documents: [
      {
        id: "doc-3-1",
        name: "Ke_Hoach_Migration_Postgres_JPT_Bank.pdf",
        type: "pdf",
        size: "3.8 MB",
        uploadedDate: "2026-05-11",
        uploader: "Tom H.",
        category: "Design"
      },
      {
        id: "doc-3-2",
        name: "Bao_Cao_Chuyen_Doi_Schema_AWS_SCT.pdf",
        type: "pdf",
        size: "1.5 MB",
        uploadedDate: "2026-06-07",
        uploader: "Mike R.",
        category: "Report"
      }
    ],
    diary: [
      {
        id: "diary-3-1",
        author: "Tom H.",
        timestamp: "2026-06-08T09:10:00Z",
        content: "Dữ liệu ban đầu đã đồng bộ qua DMS. Đang kiểm tra checksum số dòng khớp 100% giữa Oracle và PG.",
        category: "Update"
      },
      {
        id: "diary-3-2",
        author: "Mike R.",
        timestamp: "2026-07-06T15:20:00Z",
        content: "Phát hiện một số Store Procedure sử dụng Oracle-specific syntax (CONNECT BY PRIOR) chưa chạy đúng trên Postgres. Đang phải rewrite lại dùng Recursive CTE. Việc này làm trễ lịch Dry-run.",
        category: "Issue"
      }
    ]
  },
  {
    id: "proj-4",
    code: "PROJ-2026-004",
    name: "Nâng cấp Hạ tầng & Bảo mật Ngân hàng Số VPBank",
    customer: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)",
    manager: "Mike R.",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    budget: 620000000,
    status: "Active",
    description: "Nâng cấp hệ thống bảo mật SSL/TLS 1.3 và triển khai giám sát an ninh mạng định kỳ cho ứng dụng ngân hàng số VPBank.",
    progress: 75,
    plan: [
      {
        id: "task-4-1",
        title: "Phase 1: Khảo sát & Đánh giá an ninh",
        phase: "Phase 1: Khảo sát",
        assignee: "Mike R.",
        startDate: "2026-07-01",
        endDate: "2026-07-15",
        actualStartDate: "2026-07-01",
        actualEndDate: "2026-07-15",
        status: "Completed",
        progress: 100,
        taskIndex: "1",
        isHeader: true
      },
      {
        id: "task-4-1-1",
        title: "Đánh giá lỗ hổng bảo mật ứng dụng",
        phase: "Phase 1: Khảo sát",
        assignee: "Mike R.",
        startDate: "2026-07-01",
        endDate: "2026-07-15",
        actualStartDate: "2026-07-01",
        actualEndDate: "2026-07-15",
        status: "Completed",
        progress: 100,
        taskIndex: "1.1",
        isHeader: false
      },
      {
        id: "task-4-2",
        title: "Phase 2: Triển khai Cấu hình & Nâng cấp",
        phase: "Phase 2: Triển khai",
        assignee: "Mike R., Tom H.",
        startDate: "2026-07-16",
        endDate: "2026-08-25",
        actualStartDate: "2026-07-16",
        status: "In Progress",
        progress: 60,
        taskIndex: "2",
        isHeader: true
      },
      {
        id: "task-4-2-1",
        title: "Cấu hình chứng chỉ SSL & Tối ưu hóa WAF Firewall",
        phase: "Phase 2: Triển khai",
        assignee: "Tom H.",
        startDate: "2026-07-16",
        endDate: "2026-08-25",
        actualStartDate: "2026-07-16",
        status: "In Progress",
        progress: 60,
        taskIndex: "2.1",
        isHeader: false
      }
    ],
    timeline: [],
    documents: [],
    diary: []
  },
  {
    id: "proj-5",
    code: "PROJ-2026-005",
    name: "Triển khai Tích hợp Hệ thống F5 BIG-IP & Bảo mật WAF Multi-Site",
    customer: "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
    manager: "Phạm Văn Hùng",
    startDate: "2026-08-01",
    endDate: "2026-10-31",
    budget: 850000000,
    status: "Active",
    description: "Dự án triển khai tích hợp cụm cân bằng tải F5 BIG-IP iSeries kết hợp tường lửa ứng dụng web F5 Advanced WAF (ASM) và DNS Load Balancing (GTM) đa trung tâm dữ liệu (DC & DR) cho toàn bộ hệ thống Ngân hàng điện tử Sacombank.",
    progress: 54,
    sow: [
      { item: "Khảo sát & Thiết kế", deliverable: "Tài liệu HLD, LLD & MOP đã được phê duyệt", status: "Đã hoàn thành" },
      { item: "Lắp đặt & HA Cluster", deliverable: "Cụm thiết bị F5 BIG-IP tại DC và DR hoạt động HA", status: "Đã hoàn thành" },
      { item: "Cấu hình LTM & WAF", deliverable: "Chính sách LTM, SSL Offloading, iRules & WAF Policy OWASP", status: "Đang thực hiện" },
      { item: "Kiểm thử & Nghiệm thu", deliverable: "Biên bản Stress Test, Di chuyển lưu lượng & PAC", status: "Chưa bắt đầu" }
    ],
    plan: [
      {
        id: "task-5-1",
        title: "Phase 1: Khảo sát & Thiết kế Kiến trúc",
        phase: "Phase 1: Khảo sát & Thiết kế",
        assignee: "Phạm Văn Hùng, Lê Văn C",
        startDate: "2026-08-01",
        endDate: "2026-08-12",
        actualStartDate: "2026-08-01",
        actualEndDate: "2026-08-12",
        status: "Completed",
        progress: 100,
        taskIndex: "1",
        isHeader: true
      },
      {
        id: "task-5-1-1",
        title: "Khảo sát hiện trạng hạ tầng mạng & hệ thống máy chủ DC / DR",
        phase: "Phase 1: Khảo sát & Thiết kế",
        assignee: "Lê Văn C",
        startDate: "2026-08-01",
        endDate: "2026-08-03",
        actualStartDate: "2026-08-01",
        actualEndDate: "2026-08-03",
        status: "Completed",
        progress: 100,
        taskIndex: "1.1",
        isHeader: false
      },
      {
        id: "task-5-1-2",
        title: "Xây dựng tài liệu thiết kế kiến trúc tổng thể High-Level Design (HLD)",
        phase: "Phase 1: Khảo sát & Thiết kế",
        assignee: "Phạm Văn Hùng",
        startDate: "2026-08-04",
        endDate: "2026-08-06",
        actualStartDate: "2026-08-04",
        actualEndDate: "2026-08-06",
        status: "Completed",
        progress: 100,
        taskIndex: "1.2",
        isHeader: false
      },
      {
        id: "task-5-1-3",
        title: "Thiết kế chi tiết cấu hình mạng, VLAN, IP và Dynamic Routing BGP/OSPF",
        phase: "Phase 1: Khảo sát & Thiết kế",
        assignee: "Lê Văn C",
        startDate: "2026-08-06",
        endDate: "2026-08-08",
        actualStartDate: "2026-08-06",
        actualEndDate: "2026-08-08",
        status: "Completed",
        progress: 100,
        taskIndex: "1.3",
        isHeader: false
      },
      {
        id: "task-5-1-4",
        title: "Họp rà soát giải pháp an ninh mạng & tuân thủ bảo mật với Khối CNTT",
        phase: "Phase 1: Khảo sát & Thiết kế",
        assignee: "Phạm Văn Hùng, Nguyễn Văn A",
        startDate: "2026-08-09",
        endDate: "2026-08-10",
        actualStartDate: "2026-08-09",
        actualEndDate: "2026-08-10",
        status: "Completed",
        progress: 100,
        taskIndex: "1.4",
        isHeader: false
      },
      {
        id: "task-5-1-5",
        title: "Phê duyệt phương án kỹ thuật chi tiết (LLD) và kế hoạch chuyển đổi (MOP)",
        phase: "Phase 1: Khảo sát & Thiết kế",
        assignee: "Phạm Văn Hùng",
        startDate: "2026-08-11",
        endDate: "2026-08-12",
        actualStartDate: "2026-08-11",
        actualEndDate: "2026-08-12",
        status: "Completed",
        progress: 100,
        taskIndex: "1.5",
        isHeader: false
      },
      {
        id: "task-5-2",
        title: "Phase 2: Lắp đặt Phần cứng & Cấu hình Cơ bản",
        phase: "Phase 2: Lắp đặt & Cấu hình HA",
        assignee: "Lê Văn C, Phạm Minh D",
        startDate: "2026-08-13",
        endDate: "2026-08-22",
        actualStartDate: "2026-08-13",
        status: "In Progress",
        progress: 96,
        taskIndex: "2",
        isHeader: true
      },
      {
        id: "task-5-2-1",
        title: "Kiểm tra nghiệm thu thiết bị vật lý F5 BIG-IP tại DC chính và DC dự phòng",
        phase: "Phase 2: Lắp đặt & Cấu hình HA",
        assignee: "Phạm Minh D",
        startDate: "2026-08-13",
        endDate: "2026-08-14",
        actualStartDate: "2026-08-13",
        actualEndDate: "2026-08-14",
        status: "Completed",
        progress: 100,
        taskIndex: "2.1",
        isHeader: false
      },
      {
        id: "task-5-2-2",
        title: "Lắp đặt thiết bị vào rack tủ mạng, kết nối nguồn điện kép và đấu nối cáp quang",
        phase: "Phase 2: Lắp đặt & Cấu hình HA",
        assignee: "Phạm Minh D",
        startDate: "2026-08-15",
        endDate: "2026-08-16",
        actualStartDate: "2026-08-15",
        actualEndDate: "2026-08-16",
        status: "Completed",
        progress: 100,
        taskIndex: "2.2",
        isHeader: false
      },
      {
        id: "task-5-2-3",
        title: "Cấu hình Management IP, kích hoạt License Enterprise và cập nhật TMOS firmware",
        phase: "Phase 2: Lắp đặt & Cấu hình HA",
        assignee: "Lê Văn C",
        startDate: "2026-08-17",
        endDate: "2026-08-18",
        actualStartDate: "2026-08-17",
        actualEndDate: "2026-08-18",
        status: "Completed",
        progress: 100,
        taskIndex: "2.3",
        isHeader: false
      },
      {
        id: "task-5-2-4",
        title: "Thiết lập cụm dự phòng độ sẵn sàng cao High Availability (HA Sync-Failover)",
        phase: "Phase 2: Lắp đặt & Cấu hình HA",
        assignee: "Lê Văn C",
        startDate: "2026-08-19",
        endDate: "2026-08-20",
        actualStartDate: "2026-08-19",
        actualEndDate: "2026-08-20",
        status: "Completed",
        progress: 100,
        taskIndex: "2.4",
        isHeader: false
      },
      {
        id: "task-5-2-5",
        title: "Kiểm tra đồng bộ trạng thái ConfigSync và kiểm thử chuyển mạch Failover",
        phase: "Phase 2: Lắp đặt & Cấu hình HA",
        assignee: "Lê Văn C, Phạm Minh D",
        startDate: "2026-08-21",
        endDate: "2026-08-22",
        actualStartDate: "2026-08-21",
        status: "In Progress",
        progress: 80,
        taskIndex: "2.5",
        isHeader: false
      },
      {
        id: "task-5-3",
        title: "Phase 3: Triển khai Cấu hình Dịch vụ & WAF",
        phase: "Phase 3: Dịch vụ & WAF Policy",
        assignee: "Lê Văn C, Phạm Văn Hùng",
        startDate: "2026-08-23",
        endDate: "2026-09-18",
        actualStartDate: "2026-08-23",
        status: "In Progress",
        progress: 38,
        taskIndex: "3",
        isHeader: true
      },
      {
        id: "task-5-3-1",
        title: "Cấu hình LTM: Khởi tạo Virtual Servers, Backend Pools, Nodes & Health Monitors",
        phase: "Phase 3: Dịch vụ & WAF Policy",
        assignee: "Lê Văn C",
        startDate: "2026-08-23",
        endDate: "2026-08-27",
        actualStartDate: "2026-08-23",
        status: "In Progress",
        progress: 75,
        taskIndex: "3.1",
        isHeader: false
      },
      {
        id: "task-5-3-2",
        title: "Cấu hình SSL/TLS Offloading, Cipher Suites bảo mật cao & import SSL Certificate",
        phase: "Phase 3: Dịch vụ & WAF Policy",
        assignee: "Lê Văn C",
        startDate: "2026-08-28",
        endDate: "2026-08-31",
        actualStartDate: "2026-08-28",
        status: "In Progress",
        progress: 60,
        taskIndex: "3.2",
        isHeader: false
      },
      {
        id: "task-5-3-3",
        title: "Viết và tối ưu kịch bản iRules tùy biến điều phối luồng HTTP Header / URI",
        phase: "Phase 3: Dịch vụ & WAF Policy",
        assignee: "Phạm Văn Hùng",
        startDate: "2026-09-01",
        endDate: "2026-09-05",
        status: "In Progress",
        progress: 50,
        taskIndex: "3.3",
        isHeader: false
      },
      {
        id: "task-5-3-4",
        title: "Kích hoạt Module Advanced WAF (ASM) và triển khai bộ Policy phòng chống OWASP Top 10",
        phase: "Phase 3: Dịch vụ & WAF Policy",
        assignee: "Lê Văn C, Phạm Văn Hùng",
        startDate: "2026-09-06",
        endDate: "2026-09-10",
        status: "In Progress",
        progress: 40,
        taskIndex: "3.4",
        isHeader: false
      },
      {
        id: "task-5-3-5",
        title: "Cấu hình Layer 7 DoS / DDoS Mitigation, Rate Limiting và Bot Defense",
        phase: "Phase 3: Dịch vụ & WAF Policy",
        assignee: "Phạm Văn Hùng",
        startDate: "2026-09-11",
        endDate: "2026-09-14",
        status: "Todo",
        progress: 0,
        taskIndex: "3.5",
        isHeader: false
      },
      {
        id: "task-5-3-6",
        title: "Cấu hình DNS Global Server Load Balancing (GTM) điều phối tải đa điểm DC-DR",
        phase: "Phase 3: Dịch vụ & WAF Policy",
        assignee: "Lê Văn C",
        startDate: "2026-09-15",
        endDate: "2026-09-18",
        status: "Todo",
        progress: 0,
        taskIndex: "3.6",
        isHeader: false
      },
      {
        id: "task-5-4",
        title: "Phase 4: Kiểm thử, Nghiệm thu & Chuyển giao",
        phase: "Phase 4: Kiểm thử & Nghiệm thu",
        assignee: "Phạm Văn Hùng, Lê Văn C, Phạm Minh D",
        startDate: "2026-09-19",
        endDate: "2026-10-31",
        status: "Todo",
        progress: 0,
        taskIndex: "4",
        isHeader: true
      },
      {
        id: "task-5-4-1",
        title: "Thực hiện kiểm thử tải Stress Test & Penetration Test kịch bản 50,000 CCU",
        phase: "Phase 4: Kiểm thử & Nghiệm thu",
        assignee: "Phạm Minh D, Lê Văn C",
        startDate: "2026-09-19",
        endDate: "2026-09-25",
        status: "Todo",
        progress: 0,
        taskIndex: "4.1",
        isHeader: false
      },
      {
        id: "task-5-4-2",
        title: "Thực hiện di chuyển luồng dịch vụ thực tế ngoài giờ cao điểm (Traffic Cutover)",
        phase: "Phase 4: Kiểm thử & Nghiệm thu",
        assignee: "Lê Văn C, Phạm Văn Hùng",
        startDate: "2026-09-26",
        endDate: "2026-10-05",
        status: "Todo",
        progress: 0,
        taskIndex: "4.2",
        isHeader: false
      },
      {
        id: "task-5-4-3",
        title: "Tổ chức đào tạo chuyển giao công nghệ và hướng dẫn vận hành cho kỹ sư IT Ops",
        phase: "Phase 4: Kiểm thử & Nghiệm thu",
        assignee: "Phạm Văn Hùng",
        startDate: "2026-10-06",
        endDate: "2026-10-15",
        status: "Todo",
        progress: 0,
        taskIndex: "4.3",
        isHeader: false
      },
      {
        id: "task-5-4-4",
        title: "Bàn giao bộ tài liệu hoàn công As-Built và ký biên bản nghiệm thu kỹ thuật (PAC)",
        phase: "Phase 4: Kiểm thử & Nghiệm thu",
        assignee: "Phạm Văn Hùng, Nguyễn Văn A",
        startDate: "2026-10-16",
        endDate: "2026-10-31",
        status: "Todo",
        progress: 0,
        taskIndex: "4.4",
        isHeader: false
      }
    ],
    timeline: [
      {
        id: "ms-5-1",
        title: "Phê duyệt LLD & Kế hoạch MOP",
        description: "Hoàn tất giai đoạn khảo sát, ký duyệt tài liệu thiết kế kỹ thuật thi công.",
        plannedDate: "2026-08-12",
        actualDate: "2026-08-12",
        status: "Reached",
        type: "Milestone"
      },
      {
        id: "ms-5-2",
        title: "Hoàn tất Lắp đặt & Cấu hình HA Cluster",
        description: "Thiết bị F5 BIG-IP tại DC và DR sẵn sàng ở trạng thái High Availability.",
        plannedDate: "2026-08-22",
        status: "Pending",
        type: "Milestone"
      },
      {
        id: "ms-5-3",
        title: "Hoàn thành Cấu hình WAF & GTM Policy",
        description: "Cấu hình Virtual Servers, SSL Offload, WAF OWASP Top 10 và GTM Sync.",
        plannedDate: "2026-09-18",
        status: "Pending",
        type: "Review"
      },
      {
        id: "ms-5-4",
        title: "Nghiệm thu Dự án (PAC Signing)",
        description: "Hoàn tất cutover, đào tạo vận hành và ký biên bản nghiệm thu đưa vào sản xuất.",
        plannedDate: "2026-10-31",
        status: "Pending",
        type: "Release"
      }
    ],
    documents: [
      {
        id: "doc-5-1",
        name: "Tai_Lieu_Thiet_Ke_LLD_F5_BIGIP_Sacombank.pdf",
        type: "pdf",
        size: "5.4 MB",
        uploadedDate: "2026-08-12",
        uploader: "Phạm Văn Hùng",
        category: "Design"
      },
      {
        id: "doc-5-2",
        name: "Ke_Hoach_Chuyen_Doi_MOP_Cutover_F5.docx",
        type: "docx",
        size: "2.1 MB",
        uploadedDate: "2026-08-12",
        uploader: "Lê Văn C",
        category: "Survey"
      },
      {
        id: "doc-5-3",
        name: "Hop_Dong_Trien_Khai_F5_WAF_Sacombank.pdf",
        type: "pdf",
        size: "4.2 MB",
        uploadedDate: "2026-08-01",
        uploader: "Nguyễn Văn Quang",
        category: "Contract"
      }
    ],
    diary: [
      {
        id: "diary-5-1",
        author: "Phạm Văn Hùng",
        timestamp: "2026-08-12T16:30:00Z",
        content: "Đã hoàn thành buổi bảo vệ tài liệu LLD với Ban Giám đốc Khối CNTT Sacombank. Phương án kiến trúc HA và WAF Policy được duyệt 100%.",
        category: "Milestone"
      },
      {
        id: "diary-5-2",
        author: "Lê Văn C",
        timestamp: "2026-08-20T14:15:00Z",
        content: "Đã hoàn tất lắp đặt phần cứng tại cả 2 site DC Tân Bình và DR Bình Dương. Cụm HA đã sync cấu hình TMOS thành công.",
        category: "Update"
      },
      {
        id: "diary-5-3",
        author: "Phạm Minh D",
        timestamp: "2026-08-24T10:00:00Z",
        content: "Bắt đầu cấu hình Virtual Servers cho phân hệ Internet Banking và Mobile Banking API gateway.",
        category: "Update"
      }
    ]
  }
];

// Helper functions for localStorage wrapper (only run in browser)
function isClient() {
  return typeof window !== 'undefined';
}

function getStoredProjects(): Project[] {
  if (!isClient()) return DEFAULT_PROJECTS;
  const stored = localStorage.getItem('jpt_projects');
  if (!stored) {
    localStorage.setItem('jpt_projects', JSON.stringify(DEFAULT_PROJECTS));
    return DEFAULT_PROJECTS;
  }
  try {
    const list: Project[] = JSON.parse(stored);
    let updated = false;
    list.forEach(p => {
      if (p.id === "proj-1" && p.customer !== "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)") {
        p.customer = "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)";
        updated = true;
      }
    });
    if (!list.some(p => p.id === "proj-4")) {
      const proj4 = DEFAULT_PROJECTS.find(p => p.id === "proj-4");
      if (proj4) { list.push(proj4); updated = true; }
    }
    if (!list.some(p => p.id === "proj-5")) {
      const proj5 = DEFAULT_PROJECTS.find(p => p.id === "proj-5");
      if (proj5) { list.push(proj5); updated = true; }
    }
    if (updated) {
      localStorage.setItem('jpt_projects', JSON.stringify(list));
    }
    return list;
  } catch (e) {
    console.error("Error parsing stored projects", e);
    return DEFAULT_PROJECTS;
  }
}

function setStoredProjects(projects: Project[]) {
  if (!isClient()) return;
  localStorage.setItem('jpt_projects', JSON.stringify(projects));
}

// Recalculate project progress based on plan task completion
function recalculateProgress(project: Project): Project {
  if (!project.plan || project.plan.length === 0) {
    project.progress = 0;
    return project;
  }
  const totalTasks = project.plan.length;
  const totalTaskProgress = project.plan.reduce((sum, task) => sum + task.progress, 0);
  project.progress = Math.round(totalTaskProgress / totalTasks);
  return project;
}

export function fetchProjects(): Project[] {
  return getStoredProjects();
}

export function getProjectById(id: string): Project | undefined {
  const projects = getStoredProjects();
  return projects.find(p => p.id === id);
}

export function createProject(formData: Omit<Project, 'id' | 'progress' | 'plan' | 'timeline' | 'documents' | 'diary'>): Project {
  const projects = getStoredProjects();
  
  // Auto-generate code if empty
  const code = formData.code || `PROJ-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`;
  
  const newProject: Project = {
    ...formData,
    id: `proj-${Date.now()}`,
    code,
    progress: 0,
    plan: [],
    timeline: [
      {
        id: `ms-new-${Date.now()}`,
        title: "Bắt đầu dự án",
        description: "Dự án chính thức được tạo trên hệ thống.",
        plannedDate: formData.startDate,
        status: "Pending",
        type: "Milestone"
      }
    ],
    documents: [],
    diary: [
      {
        id: `diary-new-${Date.now()}`,
        author: formData.manager || "Admin",
        timestamp: new Date().toISOString(),
        content: `Dự án "${formData.name}" được khởi tạo thành công trên hệ thống.`,
        category: "Milestone"
      }
    ]
  };

  projects.push(newProject);
  setStoredProjects(projects);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'plan' | 'timeline' | 'documents' | 'diary'>>): Project | undefined {
  const projects = getStoredProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return undefined;

  projects[index] = {
    ...projects[index],
    ...updates
  } as Project;

  setStoredProjects(projects);
  return projects[index];
}

export function deleteProject(id: string): boolean {
  const projects = getStoredProjects();
  const filtered = projects.filter(p => p.id !== id);
  if (filtered.length === projects.length) return false;
  setStoredProjects(filtered);
  return true;
}

// Plan / Task Operations
export function addTask(projectId: string, task: Omit<ProjectTask, 'id' | 'progress'>): ProjectTask | undefined {
  const projects = getStoredProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return undefined;

  const newTask: ProjectTask = {
    ...task,
    id: `task-${Date.now()}`,
    progress: task.status === 'Completed' ? 100 : (task.status === 'In Progress' ? 50 : 0)
  };

  projects[index].plan.push(newTask);
  recalculateProgress(projects[index]);
  setStoredProjects(projects);
  return newTask;
}

export function updateTask(projectId: string, taskId: string, updates: Partial<ProjectTask>): ProjectTask | undefined {
  const projects = getStoredProjects();
  const pIndex = projects.findIndex(p => p.id === projectId);
  if (pIndex === -1) return undefined;

  const taskIndex = projects[pIndex].plan.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return undefined;

  // If status changes, update progress if it wasn't explicitly changed
  let progress = updates.progress !== undefined ? updates.progress : projects[pIndex].plan[taskIndex].progress;
  if (updates.status && updates.progress === undefined) {
    if (updates.status === 'Completed') progress = 100;
    else if (updates.status === 'In Progress' && progress === 0) progress = 50;
    else if (updates.status === 'Todo') progress = 0;
  }

  // If progress is changed to 100, set Completed. If progress > 0 and < 100, In Progress. If progress = 0, Todo.
  let status = updates.status || projects[pIndex].plan[taskIndex].status;
  if (updates.progress !== undefined && updates.status === undefined) {
    if (updates.progress === 100) status = 'Completed';
    else if (updates.progress > 0) status = 'In Progress';
    else status = 'Todo';
  }

  projects[pIndex].plan[taskIndex] = {
    ...projects[pIndex].plan[taskIndex],
    ...updates,
    progress,
    status
  };

  recalculateProgress(projects[pIndex]);
  setStoredProjects(projects);
  return projects[pIndex].plan[taskIndex];
}

export function deleteTask(projectId: string, taskId: string): boolean {
  const projects = getStoredProjects();
  const pIndex = projects.findIndex(p => p.id === projectId);
  if (pIndex === -1) return false;

  const initialLength = projects[pIndex].plan.length;
  projects[pIndex].plan = projects[pIndex].plan.filter(t => t.id !== taskId);
  if (projects[pIndex].plan.length === initialLength) return false;

  recalculateProgress(projects[pIndex]);
  setStoredProjects(projects);
  return true;
}

// Milestone / Timeline Operations
export function addMilestone(projectId: string, milestone: Omit<ProjectMilestone, 'id'>): ProjectMilestone | undefined {
  const projects = getStoredProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return undefined;

  const newMilestone: ProjectMilestone = {
    ...milestone,
    id: `ms-${Date.now()}`
  };

  projects[index].timeline.push(newMilestone);
  setStoredProjects(projects);
  return newMilestone;
}

export function updateMilestone(projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>): ProjectMilestone | undefined {
  const projects = getStoredProjects();
  const pIndex = projects.findIndex(p => p.id === projectId);
  if (pIndex === -1) return undefined;

  const msIndex = projects[pIndex].timeline.findIndex(m => m.id === milestoneId);
  if (msIndex === -1) return undefined;

  projects[pIndex].timeline[msIndex] = {
    ...projects[pIndex].timeline[msIndex],
    ...updates
  };

  setStoredProjects(projects);
  return projects[pIndex].timeline[msIndex];
}

// Document Operations
export function addDocument(projectId: string, doc: Omit<ProjectDocument, 'id' | 'uploadedDate'>): ProjectDocument | undefined {
  const projects = getStoredProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return undefined;

  const newDoc: ProjectDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    uploadedDate: new Date().toISOString().split('T')[0]
  };

  projects[index].documents.push(newDoc);
  setStoredProjects(projects);
  return newDoc;
}

// Diary Operations
export function addDiaryEntry(projectId: string, entry: Omit<ProjectDiaryEntry, 'id' | 'timestamp'>): ProjectDiaryEntry | undefined {
  const projects = getStoredProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return undefined;

  const newEntry: ProjectDiaryEntry = {
    ...entry,
    id: `diary-${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  projects[index].diary.unshift(newEntry); // new entries at top
  setStoredProjects(projects);
  return newEntry;
}

export function updateProjectPlan(projectId: string, plan: ProjectTask[]): Project | undefined {
  const projects = getStoredProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return undefined;

  projects[index].plan = plan;
  recalculateProgress(projects[index]);
  setStoredProjects(projects);
  return projects[index];
}

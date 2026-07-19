export interface RequestTask {
  id: string;
  code: string;
  title: string;
  type: 'Yêu cầu triển khai' | 'Yêu cầu hỗ trợ kỹ thuật' | 'Yêu cầu tư vấn' | 'Yêu cầu' | 'Yêu cầu công việc';
  description: string;
  requester: string;  // Người yêu cầu
  assignee: string;   // Người được giao
  follower: string;   // Người theo dõi
  startTime: string;  // Thời gian bắt đầu
  status: 'New' | 'In Progress' | 'Completed' | 'Rejected'; // Tình trạng
}

const DEFAULT_REQUESTS: RequestTask[] = [
  {
    id: "req-1",
    code: "YC-2026-001",
    title: "Cài đặt VPN client cho chi nhánh Quận 3",
    type: "Yêu cầu hỗ trợ kỹ thuật",
    description: "Cần cấu hình tài liệu hướng dẫn và tài khoản VPN FortiClient cho 5 nhân viên mới của phòng Kế toán tại chi nhánh Quận 3 để làm việc từ xa.",
    requester: "Jane S.",
    assignee: "John D.",
    follower: "Tom H.",
    startTime: "2026-07-01",
    status: "Completed"
  },
  {
    id: "req-2",
    code: "YC-2026-002",
    title: "Khảo sát và tư vấn giải pháp WiFi Aruba cho kho bãi",
    type: "Yêu cầu tư vấn",
    description: "Khảo sát vị trí và lập giải pháp sơ đồ phủ sóng WiFi Aruba AP-303 cho khu vực kho chứa nguyên liệu mới diện tích 2000m2 tại Bình Dương.",
    requester: "Mike R.",
    assignee: "Tom H.",
    follower: "Sarah L.",
    startTime: "2026-07-05",
    status: "In Progress"
  },
  {
    id: "req-3",
    code: "YC-2026-003",
    title: "Triển khai phần mềm Antivirus Kaspersky tập trung",
    type: "Yêu cầu triển khai",
    description: "Cài đặt đại lý Kaspersky Endpoint Security và kết nối về máy chủ Kaspersky Security Center cho toàn bộ 50 máy trạm văn phòng đại diện.",
    requester: "Tom H.",
    assignee: "Mike R.",
    follower: "John D.",
    startTime: "2026-07-10",
    status: "New"
  },
  {
    id: "req-4",
    code: "YC-2026-004",
    title: "Cấp phát bản quyền và tạo tài khoản Microsoft 365",
    type: "Yêu cầu công việc",
    description: "Tạo tài khoản email tên miền công ty và phân quyền bản quyền Microsoft 365 Business Premium cho 3 kỹ sư thuộc ban quản lý dự án mới.",
    requester: "Jane S.",
    assignee: "Sarah L.",
    follower: "Mike R.",
    startTime: "2026-07-06",
    status: "New"
  }
];

function isClient() {
  return typeof window !== 'undefined';
}

function getStoredRequests(): RequestTask[] {
  if (!isClient()) return DEFAULT_REQUESTS;
  const stored = localStorage.getItem('jpt_requests');
  if (!stored) {
    localStorage.setItem('jpt_requests', JSON.stringify(DEFAULT_REQUESTS));
    return DEFAULT_REQUESTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Error parsing stored requests", e);
    return DEFAULT_REQUESTS;
  }
}

function setStoredRequests(requests: RequestTask[]) {
  if (!isClient()) return;
  localStorage.setItem('jpt_requests', JSON.stringify(requests));
}

export function fetchRequests(): RequestTask[] {
  return getStoredRequests();
}

export function getRequestById(id: string): RequestTask | undefined {
  const requests = getStoredRequests();
  return requests.find(r => r.id === id);
}

export function createRequest(formData: Omit<RequestTask, 'id' | 'code'> & { code?: string }): RequestTask {
  const requests = getStoredRequests();
  
  // Auto-generate code: YC-2026-001, YC-2026-002...
  const nextSeq = requests.length + 1;
  const code = formData.code || `YC-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;
  
  const newRequest: RequestTask = {
    ...formData,
    id: `req-${Date.now()}`,
    code,
  };

  requests.push(newRequest);
  setStoredRequests(requests);
  return newRequest;
}

export function updateRequest(id: string, updates: Partial<RequestTask>): RequestTask | undefined {
  const requests = getStoredRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return undefined;

  requests[index] = {
    ...requests[index],
    ...updates
  };

  setStoredRequests(requests);
  return requests[index];
}

export function deleteRequest(id: string): boolean {
  const requests = getStoredRequests();
  const filtered = requests.filter(r => r.id !== id);
  if (filtered.length === requests.length) return false;
  setStoredRequests(filtered);
  return true;
}

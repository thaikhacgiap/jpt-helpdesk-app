import { supabase } from "@/lib/supabase";

export interface RequestTask {
  id: string;
  code: string;
  title: string;
  type: 'Triển khai dịch vụ' | 'Xem xét hồ sơ' | 'Yêu cầu triển khai' | 'Yêu cầu hỗ trợ kỹ thuật' | 'Yêu cầu tư vấn' | 'Yêu cầu' | 'Yêu cầu công việc' | string;
  description: string;
  requester: string;  // Người yêu cầu
  assignee: string;   // Người được giao / Người tiếp nhận
  follower: string;   // Người theo dõi
  startTime: string;  // Thời gian bắt đầu
  createdAt?: string; // Thời gian tạo
  receiveTime?: string; // Thời gian tiếp nhận
  completeTime?: string; // Thời gian hoàn thành
  requestTime?: string; // Thời gian yêu cầu (tự động điền khi tạo task)
  deadlineTime?: string; // Thời gian yêu cầu hoàn thành
  actualCompleteTime?: string; // Thời gian hoàn thành thực tế
  taskCategory?: string; // 'Mã ticket' | 'Mã dự án' | 'Mã bảo trì' | 'Yêu cầu khác'
  taskRefCode?: string; // Mã ticket (TT ID) / Mã dự án / Mã bảo trì liên kết
  taskRefTitle?: string; // Tiêu đề Trouble Ticket (TT title) liên kết
  soKy?: string | number; // Số kỳ (khi chọn Mã bảo trì)
  status: 'New' | 'In Progress' | 'Completed' | 'Rejected' | 'On Hold'; // Tình trạng
  customerId?: string; // ID khách hàng liên kết
  customerName?: string; // Tên khách hàng
  projectId?: string; // ID dự án liên kết
  projectName?: string; // Tên dự án
  contractLink?: string; // Link lưu trữ hợp đồng
  attachedFiles?: any[]; // Danh sách file đính kèm / phiếu yêu cầu triển khai
}

const DEFAULT_REQUESTS: RequestTask[] = [
  {
    id: "req-1",
    code: "SR-20260701-001",
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
    code: "SR-20260705-001",
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
    code: "SR-20260710-001",
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
    code: "TR-20260706-001",
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

const DELETED_KEY = 'jpt_deleted_request_ids';

export function getDeletedRequestIds(): Set<string> {
  if (!isClient()) return new Set();
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function addDeletedRequestId(idOrCode: string) {
  if (!isClient() || !idOrCode) return;
  const current = getDeletedRequestIds();
  current.add(idOrCode);
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error("Error saving deleted request id", e);
  }
}

// ─── Data conversion helpers: Supabase tickets row <-> RequestTask ───────

export function ticketRowToRequest(row: any): RequestTask {
  let meta: any = {};
  if (row.remark && typeof row.remark === 'string') {
    if (row.remark.trim().startsWith('{')) {
      try {
        meta = JSON.parse(row.remark);
      } catch {
        meta = { remarkText: row.remark };
      }
    } else {
      meta = { remarkText: row.remark };
    }
  }

  const isTask = row.ticket_id?.startsWith('TR-') || row.tt_type === 'Yêu cầu công việc';

  return {
    id: row.id,
    code: row.ticket_id,
    title: row.title || '',
    type: row.tt_type || (isTask ? 'Yêu cầu công việc' : 'Triển khai dịch vụ'),
    description: row.description || '',
    requester: row.creator_name || meta.requester || '',
    assignee: row.assigned || meta.assignee || '',
    follower: row.following || meta.follower || '',
    startTime: row.start_time || '',
    createdAt: row.created_at,
    receiveTime: meta.receiveTime || '',
    completeTime: row.end_time || row.close_time || meta.completeTime || '',
    requestTime: row.request_time || meta.requestTime || '',
    deadlineTime: row.close_time || meta.deadlineTime || '',
    actualCompleteTime: row.tt_close_time || meta.actualCompleteTime || '',
    taskCategory: row.category || meta.taskCategory || '',
    taskRefCode: row.request_code || meta.taskRefCode || '',
    taskRefTitle: meta.taskRefTitle || '',
    soKy: meta.soKy,
    status: (row.tt_status as any) || 'New',
    customerId: row.customer_id || meta.customerId || undefined,
    customerName: row.customer_name || meta.customerName || undefined,
    projectId: meta.projectId || undefined,
    projectName: meta.projectName || undefined,
    contractLink: row.document_link || meta.contractLink || undefined,
    attachedFiles: meta.attachedFiles || []
  };
}

export function requestToTicketRow(req: RequestTask): any {
  const meta = {
    receiveTime: req.receiveTime || null,
    completeTime: req.completeTime || null,
    actualCompleteTime: req.actualCompleteTime || null,
    deadlineTime: req.deadlineTime || null,
    requestTime: req.requestTime || null,
    taskCategory: req.taskCategory || null,
    taskRefCode: req.taskRefCode || null,
    taskRefTitle: req.taskRefTitle || null,
    soKy: req.soKy || null,
    customerId: req.customerId || null,
    customerName: req.customerName || null,
    projectId: req.projectId || null,
    projectName: req.projectName || null,
    contractLink: req.contractLink || null,
    attachedFiles: req.attachedFiles || [],
    requester: req.requester || null,
    assignee: req.assignee || null,
    follower: req.follower || null
  };

  const payload: any = {
    ticket_id: req.code,
    title: req.title,
    description: req.description || '',
    tt_type: req.type || (req.code.startsWith('TR-') ? 'Yêu cầu công việc' : 'Triển khai dịch vụ'),
    category: req.taskCategory || (req.code.startsWith('TR-') ? 'Yêu cầu công việc' : 'Triển khai dịch vụ'),
    priority: 'L3(Minor)',
    tt_status: req.status || 'New',
    start_time: req.startTime || new Date().toISOString(),
    request_time: req.requestTime || null,
    end_time: req.completeTime || req.deadlineTime || null,
    close_time: req.deadlineTime || null,
    tt_close_time: req.actualCompleteTime || null,
    creator_name: req.requester || null,
    assigned: req.assignee || null,
    following: req.follower || null,
    request_code: req.taskRefCode || null,
    document_link: req.contractLink || req.taskRefTitle || null,
    remark: JSON.stringify(meta),
    customer_name: req.customerName || null
  };

  if (req.customerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.customerId)) {
    payload.customer_id = req.customerId;
  }

  if (req.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.id)) {
    payload.id = req.id;
  }

  return payload;
}

export function getStoredRequests(): RequestTask[] {
  if (!isClient()) return [];
  const deletedIds = getDeletedRequestIds();
  const stored = localStorage.getItem('jpt_requests');
  if (!stored) {
    const isInitialized = localStorage.getItem('jpt_requests_initialized');
    if (isInitialized || deletedIds.size > 0) {
      return [];
    }
    return DEFAULT_REQUESTS.filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.code));
  }
  try {
    const parsed: RequestTask[] = JSON.parse(stored);
    return parsed.filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.code));
  } catch (e) {
    console.error("Error parsing stored requests", e);
    return [];
  }
}

export function setStoredRequests(requests: RequestTask[]) {
  if (!isClient()) return;
  const deletedIds = getDeletedRequestIds();
  const clean = requests.filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.code));
  localStorage.setItem('jpt_requests', JSON.stringify(clean));
}

// ─── Fetch requests: Supabase as single source of truth ───────

export async function fetchRequests(): Promise<RequestTask[]> {
  const deletedIds = getDeletedRequestIds();

  if (isClient()) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or('ticket_id.ilike.SR-%,ticket_id.ilike.TR-%')
        .order('created_at', { ascending: false });

      if (!error && data !== null) {
        // Clean up any records in Supabase that were deleted locally
        const deletedInDb = data.filter(r => deletedIds.has(r.id) || deletedIds.has(r.ticket_id));
        if (deletedInDb.length > 0) {
          deletedInDb.forEach(r => {
            supabase.from('tickets').delete().or(`id.eq.${r.id},ticket_id.eq.${r.ticket_id}`).then(() => {});
          });
        }

        const validDbRows = data.filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.ticket_id));
        const dbRequests = validDbRows.map(ticketRowToRequest);

        // Mark initialized so empty table is respected
        localStorage.setItem('jpt_requests_initialized', 'true');
        setStoredRequests(dbRequests);
        return dbRequests;
      } else if (error) {
        console.warn("Supabase fetchRequests error:", error.message);
      }
    } catch (e) {
      console.warn("fetchRequests Supabase connection warning:", e);
    }
  }

  return getStoredRequests().filter(r => !deletedIds.has(r.id) && !deletedIds.has(r.code));
}

export function getRequestById(id: string): RequestTask | undefined {
  const requests = getStoredRequests();
  return requests.find(r => r.id === id || r.code === id);
}

export async function createRequest(formData: Omit<RequestTask, 'id' | 'code'> & { code?: string }): Promise<RequestTask> {
  const requests = getStoredRequests();
  
  const today = new Date();
  const dateStr = today.getFullYear().toString()
    + String(today.getMonth() + 1).padStart(2, '0')
    + String(today.getDate()).padStart(2, '0');

  const isTask = formData.type === 'Yêu cầu công việc' || 
                 Boolean(formData.code && formData.code.startsWith('TR-')) ||
                 Boolean(formData.taskCategory && ['Mã ticket', 'Mã dự án', 'Mã bảo trì', 'Yêu cầu khác'].includes(formData.taskCategory)) ||
                 ['Mã ticket', 'Mã dự án', 'Mã bảo trì', 'Yêu cầu khác'].includes(formData.type || '');
  const prefix = isTask ? `TR-${dateStr}-` : `SR-${dateStr}-`;
  
  // Find highest sequence number from Supabase to prevent collisions across different browsers
  let maxSeq = 0;
  if (isClient()) {
    try {
      const { data: existingToday } = await supabase
        .from('tickets')
        .select('ticket_id')
        .ilike('ticket_id', `${prefix}%`);
      if (existingToday) {
        existingToday.forEach((r: any) => {
          const seqPart = (r.ticket_id || '').split('-').pop();
          if (seqPart) {
            const seqNum = parseInt(seqPart, 10);
            if (!isNaN(seqNum) && seqNum > maxSeq) {
              maxSeq = seqNum;
            }
          }
        });
      }
    } catch (e) {
      console.warn("Error querying existing today tickets:", e);
    }
  }

  // Also check local cache
  const todayRequests = requests.filter(r => r.code && r.code.startsWith(prefix));
  todayRequests.forEach(r => {
    const seqPart = r.code.split('-').pop();
    if (seqPart) {
      const seqNum = parseInt(seqPart, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });
  
  const nextSeq = maxSeq + 1;
  const code = formData.code?.trim() ? formData.code.trim() : `${prefix}${String(nextSeq).padStart(3, '0')}`;
  
  const newRequest: RequestTask = {
    ...formData,
    type: isTask ? 'Yêu cầu công việc' : formData.type,
    id: `req-${Date.now()}`,
    code,
    createdAt: formData.createdAt || new Date().toISOString(),
  };

  // Insert into Supabase tickets table
  if (isClient()) {
    try {
      const payload = requestToTicketRow(newRequest);
      const { data, error } = await supabase
        .from('tickets')
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        newRequest.id = data.id;
        newRequest.createdAt = data.created_at || newRequest.createdAt;
      } else if (error) {
        console.error("Error creating request in Supabase:", error);
      }
    } catch (err) {
      console.error("Supabase insert request error:", err);
    }
  }

  const currentList = getStoredRequests().filter(r => r.id !== newRequest.id && r.code !== newRequest.code);
  currentList.unshift(newRequest);
  setStoredRequests(currentList);
  if (isClient()) {
    localStorage.setItem('jpt_requests_initialized', 'true');
  }

  return newRequest;
}

export async function updateRequest(id: string, updates: Partial<RequestTask>): Promise<RequestTask | undefined> {
  const requests = getStoredRequests();
  const index = requests.findIndex(r => r.id === id || r.code === id);
  let updatedItem: RequestTask;

  if (index === -1) {
    updatedItem = {
      id,
      code: updates.code || id,
      title: updates.title || '',
      type: updates.type || 'Triển khai dịch vụ',
      description: updates.description || '',
      requester: updates.requester || '',
      assignee: updates.assignee || '',
      follower: updates.follower || '',
      startTime: updates.startTime || new Date().toISOString(),
      status: updates.status || 'New',
      ...updates
    } as RequestTask;
    requests.unshift(updatedItem);
  } else {
    requests[index] = {
      ...requests[index],
      ...updates
    };
    updatedItem = requests[index];
  }

  setStoredRequests(requests);

  // Sync update to Supabase
  if (isClient()) {
    try {
      const payload = requestToTicketRow(updatedItem);
      delete payload.id; // Do not overwrite primary key id

      let query = supabase.from('tickets').update(payload);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        query = query.eq('id', id);
      } else {
        query = query.eq('ticket_id', updatedItem.code || id);
      }
      const { error } = await query;
      if (error) {
        console.error("Error updating request in Supabase:", error);
      }
    } catch (err) {
      console.error("Supabase update request error:", err);
    }
  }

  return updatedItem;
}

export async function deleteRequest(id: string, code?: string): Promise<boolean> {
  addDeletedRequestId(id);
  if (code) addDeletedRequestId(code);

  const requests = getStoredRequests();
  const target = requests.find(r => r.id === id || r.code === id || (code && r.code === code));
  if (target?.code) {
    addDeletedRequestId(target.code);
  }
  if (target?.id) {
    addDeletedRequestId(target.id);
  }

  const filtered = requests.filter(r => r.id !== id && r.code !== id && (!code || r.code !== code));
  setStoredRequests(filtered);

  if (isClient()) {
    try {
      let query = supabase.from('tickets').delete();
      const codeToDel = code || target?.code;
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        if (codeToDel) {
          query = query.or(`id.eq.${id},ticket_id.eq.${codeToDel}`);
        } else {
          query = query.eq('id', id);
        }
      } else {
        query = query.or(`ticket_id.eq.${id},ticket_id.eq.${codeToDel || id}`);
      }
      const { error } = await query;
      if (error) {
        console.error("Error deleting request in Supabase:", error);
      }
    } catch (err) {
      console.error("Supabase delete request error:", err);
    }
  }

  return true;
}

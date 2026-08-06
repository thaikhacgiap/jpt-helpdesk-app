import { supabase } from "@/lib/supabase";

export interface CustomerNotification {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "General" | "Maintenance";
  target_customer_id: string; // "All" or customer_id
  target_customer_name?: string;
  dateStr: string;
  created_at: string;
  isRead?: boolean;
}

export interface InternalNotification {
  id: string;
  title: string;
  summary: string;
  content: string;
  recipient_type: "individual" | "department" | "all";
  target_user_id?: string;
  target_user_name?: string;
  target_department?: string;
  sender_id: string;
  sender_name: string;
  priority: "Normal" | "Urgent" | "Important";
  created_at: string;
  is_read?: boolean;
}

const STORAGE_CUSTOMER_NOTIFS = "jpt_customer_notifications_v1";
const STORAGE_INTERNAL_NOTIFS = "jpt_internal_notifications_v1";

export const INITIAL_CUSTOMER_NOTIFS: CustomerNotification[] = [
  {
    id: "CN-001",
    category: "Maintenance",
    dateStr: "02/08/2026",
    created_at: "2026-08-02T08:00:00Z",
    target_customer_id: "All",
    target_customer_name: "Tất cả khách hàng",
    title: "Thông báo bảo trì hệ thống máy chủ định kỳ Tháng 8/2026",
    summary: "Hệ thống sẽ tạm gián đoạn dịch vụ trong khoảng thời gian từ 23:00 - 02:00 để nâng cấp Core Switch.",
    content: `Kính gửi Quý Khách hàng,

Để đảm bảo hệ thống vận hành an toàn và tối ưu hiệu năng, JPROTECH xin thông báo kế hoạch bảo trì định kỳ:

• Thời gian bắt đầu: 23:00 ngày 05/08/2026
• Thời gian kết thúc dự kiến: 02:00 ngày 06/08/2026
• Phạm vi ảnh hưởng: Các kết nối API v4 và Cổng Portal Khách hàng.

Trân trọng cảm ơn sự hỗ trợ của Quý khách hàng!`,
  },
  {
    id: "CN-002",
    category: "General",
    dateStr: "28/07/2026",
    created_at: "2026-07-28T14:30:00Z",
    target_customer_id: "All",
    target_customer_name: "Tất cả khách hàng",
    title: "Hoàn tất nâng cấp băng thông đường truyền kết nối Data Center VPBank",
    summary: "Công tác nâng cấp băng thông đường truyền kết nối dữ liệu đã hoàn tất 100%. Tốc độ truy xuất tăng 35%.",
    content: `Ban Bảo trì Hạ tầng xin thông báo:

Công tác nâng cấp đường truyền quang dự phòng và tối ưu hóa Firewall kết nối giữa Data Center và VPBank đã hoàn tất đúng kế hoạch.

• Tốc độ truy xuất dữ liệu trung bình tăng 35%.
• Hệ thống hoạt động hoàn toàn ổn định.`,
  }
];

export const INITIAL_INTERNAL_NOTIFS: InternalNotification[] = [
  {
    id: "IN-001",
    title: "Triển khai cuộc họp giao ban tuần 32 và rà soát tiến độ dự án VPBank",
    summary: "Yêu cầu tất cả PM chuẩn bị báo cáo tiến độ và bảng khối lượng công việc.",
    content: "Kính gửi toàn thể Anh/Chị PM và Trưởng bộ phận,\n\nCuộc họp giao ban tuần 32 sẽ diễn ra vào lúc 09:00 sáng Thứ Hai tại Phòng họp 3. Yêu cầu chuẩn bị slide báo cáo chi tiết các công việc hoàn thành và tồn đọng.",
    recipient_type: "department",
    target_department: "Phòng Quản lý dự án",
    sender_id: "usr-001",
    sender_name: "Thái Khắc Giáp (Ban Giám Đốc)",
    priority: "Important",
    created_at: "2026-08-01T09:00:00Z",
    is_read: false
  },
  {
    id: "IN-002",
    title: "Thông báo cập nhật quy trình bàn giao Ticket kỹ thuật v4.0",
    summary: "Đề nghị bộ phận kỹ thuật áp dụng đúng quy trình xác nhận thời gian khắc phục SLA.",
    content: "Các kỹ thuật viên lưu ý:\n\nTất cả Ticket yêu cầu chuyển trạng thái 'Đang xử lý' phải đính kèm ghi chú thời gian xử lý dự kiến cho khách hàng.",
    recipient_type: "department",
    target_department: "Phòng Kỹ thuật & Support",
    sender_id: "usr-001",
    sender_name: "Thái Khắc Giáp (Ban Giám Đốc)",
    priority: "Urgent",
    created_at: "2026-08-02T11:20:00Z",
    is_read: false
  },
  {
    id: "IN-003",
    title: "Lịch nghỉ lễ Quốc Khánh 02/09/2026 và phân công trực kỹ thuật",
    summary: "Thông báo thời gian nghỉ lễ và danh sách nhân sự trực On-call 24/7.",
    content: "Công ty xin thông báo lịch nghỉ lễ Quốc Khánh 02/09 từ ngày 01/09 đến hết ngày 03/09/2026.\n\nNhân sự trực kíp On-call sẽ nhận phụ cấp 300% theo quy định công ty.",
    recipient_type: "all",
    sender_id: "usr-001",
    sender_name: "Ban Giám Đốc",
    priority: "Normal",
    created_at: "2026-07-30T16:00:00Z",
    is_read: true
  }
];

// ── CUSTOMER NOTIFICATIONS HANDLERS ──────────────────────────
export const getCustomerNotifications = (): CustomerNotification[] => {
  if (typeof window === "undefined") return INITIAL_CUSTOMER_NOTIFS;
  try {
    const data = localStorage.getItem(STORAGE_CUSTOMER_NOTIFS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_CUSTOMER_NOTIFS, JSON.stringify(INITIAL_CUSTOMER_NOTIFS));
    return INITIAL_CUSTOMER_NOTIFS;
  } catch (e) {
    return INITIAL_CUSTOMER_NOTIFS;
  }
};

export const createCustomerNotification = (notif: Omit<CustomerNotification, "id" | "dateStr" | "created_at">): CustomerNotification => {
  const current = getCustomerNotifications();
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN");
  const newNotif: CustomerNotification = {
    ...notif,
    id: `CN-${String(current.length + 1).padStart(3, "0")}`,
    dateStr,
    created_at: now.toISOString(),
  };
  const updated = [newNotif, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_CUSTOMER_NOTIFS, JSON.stringify(updated));
  }
  return newNotif;
};

export const deleteCustomerNotification = (id: string): boolean => {
  const current = getCustomerNotifications();
  const updated = current.filter(n => n.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_CUSTOMER_NOTIFS, JSON.stringify(updated));
  }
  return true;
};

// ── INTERNAL NOTIFICATIONS HANDLERS ──────────────────────────
export const getInternalNotifications = (): InternalNotification[] => {
  if (typeof window === "undefined") return INITIAL_INTERNAL_NOTIFS;
  try {
    const data = localStorage.getItem(STORAGE_INTERNAL_NOTIFS);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_INTERNAL_NOTIFS, JSON.stringify(INITIAL_INTERNAL_NOTIFS));
    return INITIAL_INTERNAL_NOTIFS;
  } catch (e) {
    return INITIAL_INTERNAL_NOTIFS;
  }
};

export const createInternalNotification = (notif: Omit<InternalNotification, "id" | "created_at" | "is_read">): InternalNotification => {
  const current = getInternalNotifications();
  const now = new Date();
  const newNotif: InternalNotification = {
    ...notif,
    id: `IN-${String(current.length + 1).padStart(3, "0")}`,
    created_at: now.toISOString(),
    is_read: false,
  };
  const updated = [newNotif, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_INTERNAL_NOTIFS, JSON.stringify(updated));
  }
  return newNotif;
};

export const deleteInternalNotification = (id: string): boolean => {
  const current = getInternalNotifications();
  const updated = current.filter(n => n.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_INTERNAL_NOTIFS, JSON.stringify(updated));
  }
  return true;
};

export const markInternalNotificationRead = (id: string): void => {
  const current = getInternalNotifications();
  const updated = current.map(n => n.id === id ? { ...n, is_read: true } : n);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_INTERNAL_NOTIFS, JSON.stringify(updated));
  }
};

export const markAllInternalNotificationsRead = (): void => {
  const current = getInternalNotifications();
  const updated = current.map(n => ({ ...n, is_read: true }));
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_INTERNAL_NOTIFS, JSON.stringify(updated));
  }
};

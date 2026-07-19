import { supabase } from "./supabase";
import { logOperation } from "./logger";

export interface UserSession {
  email: string;
  name: string;
  role: 'Admin' | 'PM' | 'Technical' | 'Customer';
  roleLabel: string;
  department?: string;
  phone?: string;
  customerId?: string; // Associated customer ID from customers table
  permissions?: string[]; // Paths authorized, e.g., ["/dashboard", "/requests"]
}

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'Admin' | 'PM' | 'Technical' | 'Customer';
  roleLabel: string;
  department?: string;
  active: boolean; // true = unlocked, false = locked
  password?: string;
  created_at: string;
  groupId: string; // Group association ID
  customerId?: string; // Associated customer ID from customers table
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  role: 'Admin' | 'PM' | 'Technical' | 'Customer';
  permissions: string[]; // Paths authorized, e.g., ["/dashboard", "/requests"]
}

const SEED_GROUPS: UserGroup[] = [
  {
    id: "g-1",
    name: "Ban Giám Đốc",
    description: "Quyền quản lý toàn diện hệ thống IT Helpdesk",
    role: "Admin",
    permissions: ["/dashboard", "/requests", "/tickets", "/maintenance", "/projects", "/customers", "/contacts", "/nhan-su", "/contracts", "/sla", "/users", "/settings"]
  },
  {
    id: "g-2",
    name: "Quản lý Dự án (PM)",
    description: "Cấp độ quản lý phân phối dự án và theo dõi hợp đồng",
    role: "PM",
    permissions: ["/dashboard", "/requests", "/tickets", "/projects", "/customers", "/contracts"]
  },
  {
    id: "g-3",
    name: "Đội Kỹ thuật & Support",
    description: "Nhóm kỹ thuật tiếp nhận vé hỗ trợ và triển khai bảo trì",
    role: "Technical",
    permissions: ["/dashboard", "/requests", "/tickets", "/maintenance"]
  },
  {
    id: "g-4",
    name: "Khách hàng Doanh nghiệp",
    description: "Cổng thông tin tự phục vụ dành cho đối tác, khách hàng",
    role: "Customer",
    permissions: ["/portal"]
  }
];

const SEED_USERS: SystemUser[] = [
  {
    id: "u-1",
    email: "admin@jpt.vn",
    name: "Nguyễn Văn Q.Trị",
    role: "Admin",
    roleLabel: "Quản trị viên",
    department: "Ban Giám Đốc",
    phone: "0901234567",
    active: true,
    password: "123",
    groupId: "g-1",
    created_at: new Date().toISOString()
  },
  {
    id: "u-2",
    email: "pm@jpt.vn",
    name: "Trần Thị Q.Lý",
    role: "PM",
    roleLabel: "Quản lý Dự án (PM)",
    department: "Phòng Quản lý dự án",
    phone: "0902345678",
    active: true,
    password: "123",
    groupId: "g-2",
    created_at: new Date().toISOString()
  },
  {
    id: "u-3",
    email: "technical@jpt.vn",
    name: "Lê Văn K.Thuật",
    role: "Technical",
    roleLabel: "Kỹ sư Kỹ thuật",
    department: "Phòng Kỹ thuật & Support",
    phone: "0903456789",
    active: true,
    password: "123",
    groupId: "g-3",
    created_at: new Date().toISOString()
  },
  {
    id: "u-4",
    email: "customer@jpt.vn",
    name: "Công ty TNHH J-TECH",
    role: "Customer",
    roleLabel: "Đại diện Khách hàng",
    department: "Khách hàng doanh nghiệp",
    phone: "0904567890",
    active: true,
    password: "123",
    groupId: "g-4",
    customerId: "80c26b95-f7bd-4115-a07b-72748d483ab5",
    created_at: new Date().toISOString()
  }
];

function isClient() {
  return typeof window !== 'undefined';
}

// Group Fetch/Save operations
export async function fetchGroups(): Promise<UserGroup[]> {
  const { data, error } = await supabase
    .from("user_groups")
    .select("*")
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching user groups:", error);
    return SEED_GROUPS;
  }
  return data || [];
}

export function setStoredGroups(groups: UserGroup[]) {
  // Deprecated - groups now saved directly to Supabase via createGroup/updateGroup/deleteGroup
}

// User Fetch/Save operations
export async function fetchUsers(): Promise<SystemUser[]> {
  const { data, error } = await supabase
    .from("system_users")
    .select("*")
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("Error fetching system users:", error);
    return SEED_USERS;
  }

  return (data || []).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    roleLabel: u.role_label,
    department: u.department,
    active: u.active,
    password: u.password,
    groupId: u.group_id,
    customerId: u.customer_id,
    created_at: u.created_at
  }));
}

export function setStoredUsers(users: SystemUser[]) {
  // Deprecated - users now saved directly to Supabase via createUser/deleteUser/toggleUserLock/resetUserPassword
}

export function getCurrentUser(): UserSession | null {
  if (!isClient()) return null;
  const stored = localStorage.getItem("jpt_auth_session");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserSession;
  } catch (e) {
    return null;
  }
}

export async function login(email: string, password?: string): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  const { data: userData, error: userError } = await supabase
    .from("system_users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (userError || !userData) {
    return { success: false, error: "Tài khoản không chính xác hoặc chưa được đăng ký." };
  }
  
  if (!userData.active) {
    return { success: false, error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên." };
  }

  if (password && password !== "••••••••" && userData.password && userData.password !== password) {
    return { success: false, error: "Mật khẩu đăng nhập không chính xác." };
  }

  // Load user's group to get the latest role/label & permissions
  const { data: groupData } = await supabase
    .from("user_groups")
    .select("*")
    .eq("id", userData.group_id)
    .maybeSingle();
  
  const session: UserSession = {
    email: userData.email,
    name: userData.name,
    role: groupData ? groupData.role : userData.role,
    roleLabel: groupData ? groupData.name : userData.role_label,
    department: userData.department,
    phone: userData.phone,
    customerId: userData.customer_id,
    permissions: groupData ? groupData.permissions : []
  };

  if (isClient()) {
    localStorage.setItem("jpt_auth_session", JSON.stringify(session));
  }
  
  // Log successful login
  logOperation("Đăng nhập", `Người dùng ${session.name} (${session.email}) đăng nhập hệ thống.`);
  return { success: true, user: session };
}

export function logout(): void {
  if (isClient()) {
    localStorage.removeItem("jpt_auth_session");
  }
}

export function hasAccess(role: UserSession["role"], pathname: string): boolean {
  if (role === "Admin") return true;

  const path = pathname.toLowerCase();
  const session = getCurrentUser();
  if (!session) return false;

  if (session.permissions && session.permissions.length > 0) {
    return session.permissions.some(p => {
      const cleanP = p.toLowerCase();
      return path === cleanP || path.startsWith(cleanP + "/");
    });
  }

  // Static Fallback
  if (role === "PM") {
    const pmAllowedPaths = ["/dashboard", "/requests", "/tickets", "/projects", "/customers", "/contracts"];
    return pmAllowedPaths.some(p => path === p || path.startsWith(p + "/"));
  }

  if (role === "Technical") {
    const techAllowedPaths = ["/dashboard", "/requests", "/tickets", "/maintenance"];
    return techAllowedPaths.some(p => path === p || path.startsWith(p + "/"));
  }

  if (role === "Customer") {
    return path === "/portal" || path.startsWith("/portal/");
  }

  return false;
}

// User CRUD Helpers
export async function createUser(data: Omit<SystemUser, 'id' | 'role' | 'roleLabel' | 'created_at'> & { role?: SystemUser["role"], roleLabel?: string }): Promise<{ success: boolean; error?: string }> {
  // Check duplicate email
  const { data: duplicate, error: checkError } = await supabase
    .from("system_users")
    .select("id")
    .eq("email", data.email.toLowerCase().trim())
    .maybeSingle();

  if (checkError) {
    console.error("Error checking duplicate email:", checkError);
    return { success: false, error: "Lỗi hệ thống khi kiểm tra email." };
  }

  if (duplicate) {
    return { success: false, error: "Email này đã được đăng ký tài khoản khác." };
  }

  // Derive role and label from group
  const { data: groupData } = await supabase
    .from("user_groups")
    .select("*")
    .eq("id", data.groupId)
    .maybeSingle();

  const role = groupData ? groupData.role : (data.role || "Technical");
  const roleLabel = groupData ? groupData.name : (data.roleLabel || "Kỹ sư Kỹ thuật");

  const newUser = {
    id: `u-${Date.now()}`,
    email: data.email.toLowerCase().trim(),
    name: data.name,
    phone: data.phone,
    role: role,
    role_label: roleLabel,
    department: data.department,
    active: data.active,
    password: data.password,
    group_id: data.groupId,
    customer_id: data.customerId
  };

  const { error } = await supabase
    .from("system_users")
    .insert([newUser]);

  if (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Lỗi hệ thống khi tạo tài khoản." };
  }

  logOperation("Tạo người dùng", `Đã tạo tài khoản ${newUser.name} (${newUser.email}) với vai trò ${roleLabel}.`);
  return { success: true };
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("system_users")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Lỗi hệ thống khi xóa tài khoản." };
  }
  
  logOperation("Xóa người dùng", `Đã xóa người dùng có ID ${id}.`);
  return { success: true };
}

export async function toggleUserLock(id: string): Promise<{ success: boolean; error?: string }> {
  const { data, error: fetchError } = await supabase
    .from("system_users")
    .select("active")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !data) {
    return { success: false, error: "Không tìm thấy người dùng." };
  }

  const { error: updateError } = await supabase
    .from("system_users")
    .update({ active: !data.active })
    .eq("id", id);

  if (updateError) {
    console.error("Error toggling user lock:", updateError);
    return { success: false, error: "Lỗi hệ thống khi thay đổi trạng thái tài khoản." };
  }
  
  logOperation(
    !data.active ? "Mở khóa người dùng" : "Khóa người dùng",
    `Đã ${!data.active ? "mở khóa" : "khóa"} tài khoản người dùng ID ${id}.`
  );
  return { success: true };
}

export async function resetUserPassword(id: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("system_users")
    .update({ password: newPassword })
    .eq("id", id);

  if (error) {
    console.error("Error resetting user password:", error);
    return { success: false, error: "Lỗi hệ thống khi đặt lại mật khẩu." };
  }
  
  logOperation("Đặt lại mật khẩu", `Đã đặt lại mật khẩu của người dùng ID ${id}.`);
  return { success: true };
}

// Group CRUD Helpers
export async function createGroup(data: Omit<UserGroup, 'id'>): Promise<{ success: boolean; group?: UserGroup; error?: string }> {
  const { data: duplicate } = await supabase
    .from("user_groups")
    .select("id")
    .eq("name", data.name.toLowerCase().trim())
    .maybeSingle();

  if (duplicate) {
    return { success: false, error: "Tên nhóm này đã tồn tại." };
  }

  const newGroup = {
    id: `g-${Date.now()}`,
    name: data.name.trim(),
    description: data.description.trim(),
    role: data.role,
    permissions: data.permissions
  };

  const { error } = await supabase
    .from("user_groups")
    .insert([newGroup]);

  if (error) {
    console.error("Error creating group:", error);
    return { success: false, error: "Lỗi hệ thống khi tạo nhóm phân quyền." };
  }

  logOperation("Tạo nhóm phân quyền", `Đã tạo nhóm phân quyền mới "${newGroup.name}".`);
  return { success: true, group: newGroup };
}

export async function updateGroup(id: string, updates: Partial<UserGroup>): Promise<{ success: boolean; group?: UserGroup; error?: string }> {
  const { error } = await supabase
    .from("user_groups")
    .update(updates)
    .eq("id", id);

  if (error) {
    console.error("Error updating group:", error);
    return { success: false, error: "Lỗi hệ thống khi cập nhật nhóm." };
  }

  logOperation("Cập nhật nhóm phân quyền", `Đã cấu hình lại quyền hạn cho nhóm ID ${id}.`);
  const { data: updatedGroup } = await supabase
    .from("user_groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { success: true, group: updatedGroup || undefined };
}

export async function deleteGroup(id: string): Promise<{ success: boolean; error?: string }> {
  if (["g-1", "g-2", "g-3", "g-4"].includes(id)) {
    return { success: false, error: "Không thể xóa các nhóm mặc định của hệ thống." };
  }

  const { data: hasMembers, error: checkError } = await supabase
    .from("system_users")
    .select("id")
    .eq("group_id", id)
    .limit(1);

  if (checkError) {
    return { success: false, error: "Lỗi hệ thống khi kiểm tra thành viên nhóm." };
  }

  if (hasMembers && hasMembers.length > 0) {
    return { success: false, error: "Không thể xóa nhóm đang có thành viên. Vui lòng chuyển thành viên sang nhóm khác trước." };
  }

  const { error } = await supabase
    .from("user_groups")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting group:", error);
    return { success: false, error: "Lỗi hệ thống khi xóa nhóm." };
  }

  logOperation("Xóa nhóm phân quyền", `Đã xóa nhóm phân quyền ID ${id}.`);
  return { success: true };
}

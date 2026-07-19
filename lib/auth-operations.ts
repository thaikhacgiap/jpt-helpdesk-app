export interface UserSession {
  email: string;
  name: string;
  role: 'Admin' | 'PM' | 'Technical' | 'Customer';
  roleLabel: string;
  department?: string;
  phone?: string;
  customerId?: string; // Associated customer ID from customers table
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
    customerId: "80c26b95-f7bd-4115-a07b-72748d483ab5", // BANK-VCB UUID from Supabase DB
    created_at: new Date().toISOString()
  }
];

function isClient() {
  return typeof window !== 'undefined';
}

// Group Fetch/Save operations
export function fetchGroups(): UserGroup[] {
  if (!isClient()) return SEED_GROUPS;
  const stored = localStorage.getItem("jpt_user_groups");
  if (!stored) {
    localStorage.setItem("jpt_user_groups", JSON.stringify(SEED_GROUPS));
    return SEED_GROUPS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return SEED_GROUPS;
  }
}

export function setStoredGroups(groups: UserGroup[]) {
  if (!isClient()) return;
  localStorage.setItem("jpt_user_groups", JSON.stringify(groups));
}

// User Fetch/Save operations
export function fetchUsers(): SystemUser[] {
  if (!isClient()) return SEED_USERS;
  const stored = localStorage.getItem("jpt_users");
  if (!stored) {
    localStorage.setItem("jpt_users", JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  try {
    const list = JSON.parse(stored) as SystemUser[];
    let migrated = false;
    const updated = list.map(u => {
      if (u.email === "customer@jpt.vn" && u.customerId === "45a3c7b5-1234-5678-9abc-def012345678") {
        u.customerId = "80c26b95-f7bd-4115-a07b-72748d483ab5";
        migrated = true;
      }
      return u;
    });
    if (migrated) {
      localStorage.setItem("jpt_users", JSON.stringify(updated));
      return updated;
    }
    return list;
  } catch (e) {
    return SEED_USERS;
  }
}

export function setStoredUsers(users: SystemUser[]) {
  if (!isClient()) return;
  localStorage.setItem("jpt_users", JSON.stringify(users));
}

export function getCurrentUser(): UserSession | null {
  if (!isClient()) return null;
  const stored = localStorage.getItem("jpt_auth_session");
  if (!stored) return null;
  try {
    const session = JSON.parse(stored) as UserSession;
    if (session.email === "customer@jpt.vn" && session.customerId === "45a3c7b5-1234-5678-9abc-def012345678") {
      session.customerId = "80c26b95-f7bd-4115-a07b-72748d483ab5";
      localStorage.setItem("jpt_auth_session", JSON.stringify(session));
    }
    return session;
  } catch (e) {
    return null;
  }
}

export function login(email: string, password?: string): { success: boolean; user?: UserSession; error?: string } {
  const users = fetchUsers();
  const user = users.find(acc => acc.email.toLowerCase() === email.toLowerCase().trim());
  
  if (!user) {
    return { success: false, error: "Tài khoản không chính xác hoặc chưa được đăng ký." };
  }
  
  if (!user.active) {
    return { success: false, error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên." };
  }

  if (password && password !== "••••••••" && user.password && user.password !== password) {
    return { success: false, error: "Mật khẩu đăng nhập không chính xác." };
  }

  // Load user's group to get the latest role/label
  const groups = fetchGroups();
  const group = groups.find(g => g.id === user.groupId);
  
  const session: UserSession = {
    email: user.email,
    name: user.name,
    role: group ? group.role : user.role,
    roleLabel: group ? group.name : user.roleLabel,
    department: user.department,
    phone: user.phone,
    customerId: user.customerId // Pass linked customer ID
  };

  if (isClient()) {
    localStorage.setItem("jpt_auth_session", JSON.stringify(session));
  }
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

  const users = fetchUsers();
  const dbUser = users.find(u => u.email.toLowerCase() === session.email.toLowerCase());
  
  if (dbUser && dbUser.groupId) {
    const groups = fetchGroups();
    const group = groups.find(g => g.id === dbUser.groupId);
    if (group) {
      return group.permissions.some(p => {
        const cleanP = p.toLowerCase();
        return path === cleanP || path.startsWith(cleanP + "/");
      });
    }
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
export function createUser(data: Omit<SystemUser, 'id' | 'role' | 'roleLabel' | 'created_at'> & { role?: SystemUser["role"], roleLabel?: string }): { success: boolean; error?: string } {
  const users = fetchUsers();
  
  const duplicate = users.find(u => u.email.toLowerCase() === data.email.toLowerCase().trim());
  if (duplicate) {
    return { success: false, error: "Email này đã được đăng ký tài khoản khác." };
  }

  // Derive role and label from group
  const groups = fetchGroups();
  const group = groups.find(g => g.id === data.groupId);
  const role = group ? group.role : (data.role || "Technical");
  const roleLabel = group ? group.name : (data.roleLabel || "Kỹ sư Kỹ thuật");

  const newUser: SystemUser = {
    ...data,
    role,
    roleLabel,
    id: `u-${Date.now()}`,
    created_at: new Date().toISOString()
  };

  users.push(newUser);
  setStoredUsers(users);
  return { success: true };
}

export function deleteUser(id: string): { success: boolean; error?: string } {
  const users = fetchUsers();
  const filtered = users.filter(u => u.id !== id);
  
  if (filtered.length === users.length) {
    return { success: false, error: "Không tìm thấy người dùng." };
  }

  setStoredUsers(filtered);
  return { success: true };
}

export function toggleUserLock(id: string): { success: boolean; error?: string } {
  const users = fetchUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { success: false, error: "Không tìm thấy người dùng." };
  }

  users[index].active = !users[index].active;
  setStoredUsers(users);
  return { success: true };
}

export function resetUserPassword(id: string, newPassword: string): { success: boolean; error?: string } {
  const users = fetchUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { success: false, error: "Không tìm thấy người dùng." };
  }

  users[index].password = newPassword;
  setStoredUsers(users);
  return { success: true };
}

// Group CRUD Helpers
export function createGroup(data: Omit<UserGroup, 'id'>): { success: boolean; group?: UserGroup; error?: string } {
  const groups = fetchGroups();
  const duplicate = groups.find(g => g.name.toLowerCase() === data.name.toLowerCase().trim());
  if (duplicate) {
    return { success: false, error: "Tên nhóm này đã tồn tại." };
  }

  const newGroup: UserGroup = {
    ...data,
    id: `g-${Date.now()}`
  };

  groups.push(newGroup);
  setStoredGroups(groups);
  return { success: true, group: newGroup };
}

export function updateGroup(id: string, updates: Partial<UserGroup>): { success: boolean; group?: UserGroup; error?: string } {
  const groups = fetchGroups();
  const index = groups.findIndex(g => g.id === id);
  if (index === -1) {
    return { success: false, error: "Không tìm thấy nhóm." };
  }

  const role = groups[index].role;

  groups[index] = {
    ...groups[index],
    ...updates,
    id, // lock ID
    role // lock Role
  };

  setStoredGroups(groups);
  return { success: true, group: groups[index] };
}

export function deleteGroup(id: string): { success: boolean; error?: string } {
  if (["g-1", "g-2", "g-3", "g-4"].includes(id)) {
    return { success: false, error: "Không thể xóa các nhóm mặc định của hệ thống." };
  }

  const groups = fetchGroups();
  const filtered = groups.filter(g => g.id !== id);
  if (filtered.length === groups.length) {
    return { success: false, error: "Không tìm thấy nhóm." };
  }

  const users = fetchUsers();
  const hasMembers = users.some(u => u.groupId === id);
  if (hasMembers) {
    return { success: false, error: "Không thể xóa nhóm đang có thành viên. Vui lòng chuyển thành viên sang nhóm khác trước." };
  }

  setStoredGroups(filtered);
  return { success: true };
}

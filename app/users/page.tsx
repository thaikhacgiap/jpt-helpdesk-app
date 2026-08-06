"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { 
  fetchUsers, 
  createUser, 
  deleteUser, 
  toggleUserLock, 
  resetUserPassword, 
  fetchGroups,
  UserGroup,
  SystemUser 
} from "@/lib/auth-operations";
import { fetchCustomers, Customer } from "@/lib/customer-operations";
import { 
  Plus, 
  Search, 
  Trash2, 
  Lock, 
  Unlock, 
  Key, 
  X, 
  Users, 
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { User, Settings, Server } from "lucide-react";

const SYSTEM_NAV_TABS = [
  { href: "/users", label: "Người dùng", icon: User },
  { href: "/settings", label: "Phân quyền nhóm", icon: Settings },
  { href: "/system", label: "Cấu hình & Sao lưu", icon: Server }
];

const DEPARTMENTS = ["Ban Giám Đốc", "Phòng Quản lý dự án", "Phòng Kỹ thuật & Support", "Khách hàng doanh nghiệp"];

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [dbCustomers, setDbCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    groupId: "",
    department: "Phòng Kỹ thuật & Support",
    password: "",
    customerId: ""
  });
  const [createError, setCreateError] = useState("");

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");
  const [resetError, setResetError] = useState("");

  // Load Data
  const loadUsersList = async () => {
    try {
      const [fetchedUsers, fetchedGroups] = await Promise.all([
        fetchUsers(),
        fetchGroups()
      ]);
      setUsers(fetchedUsers);
      setGroups(fetchedGroups);
    } catch (err) {
      console.error("Error loading users and groups:", err);
    }
  };

  useEffect(() => {
    loadUsersList();
    fetchCustomers()
      .then(data => setDbCustomers(data || []))
      .catch(err => console.error("Error fetching db customers:", err));
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!createForm.name.trim() || !createForm.email.trim()) {
      setCreateError("Vui lòng điền đầy đủ họ tên và email.");
      return;
    }
    if (!createForm.groupId) {
      setCreateError("Vui lòng lựa chọn nhóm phân quyền.");
      return;
    }
    
    const selectedGroup = groups.find(g => g.id === createForm.groupId);
    if (selectedGroup?.role === "Customer" && !createForm.customerId) {
      setCreateError("Vui lòng lựa chọn khách hàng liên kết.");
      return;
    }

    if (!createForm.password.trim()) {
      setCreateError("Vui lòng thiết lập mật khẩu đăng nhập.");
      return;
    }

    try {
      const result = await createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        groupId: createForm.groupId,
        department: createForm.department,
        active: true,
        password: createForm.password.trim(),
        customerId: selectedGroup?.role === "Customer" ? createForm.customerId : undefined
      });

      if (result.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          name: "",
          email: "",
          phone: "",
          groupId: "",
          department: "Phòng Kỹ thuật & Support",
          password: "",
          customerId: ""
        });
        await loadUsersList();
      } else {
        setCreateError(result.error || "Có lỗi xảy ra khi tạo tài khoản.");
      }
    } catch (err) {
      setCreateError("Lỗi hệ thống khi tạo tài khoản.");
    }
  };

  const handleCreateOpen = () => {
    setCreateError("");
    
    // Select default Technical group if exists
    const techGroup = groups.find(g => g.role === "Technical");
    const defaultGroupId = techGroup ? techGroup.id : (groups[0]?.id || "");
    
    setCreateForm({
      name: "",
      email: "",
      phone: "",
      groupId: defaultGroupId,
      department: "Phòng Kỹ thuật & Support",
      password: "",
      customerId: ""
    });
    setIsCreateModalOpen(true);
  };

  const handleToggleLock = async (id: string, name: string, active: boolean) => {
    const actionText = active ? "Khóa" : "Mở khóa";
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản "${name}"?`)) {
      try {
        const result = await toggleUserLock(id);
        if (result.success) {
          await loadUsersList();
        } else {
          alert(result.error);
        }
      } catch (err) {
        alert("Lỗi hệ thống khi thay đổi trạng thái tài khoản.");
      }
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Xóa tài khoản người dùng "${name}"? Thao tác này không thể hoàn tác.`)) {
      try {
        const result = await deleteUser(id);
        if (result.success) {
          await loadUsersList();
        } else {
          alert(result.error);
        }
      } catch (err) {
        alert("Lỗi hệ thống khi xóa tài khoản.");
      }
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccessMsg("");

    if (!resetTargetUser) return;
    if (!newPassword.trim()) {
      setResetError("Mật khẩu không được để trống.");
      return;
    }

    try {
      const result = await resetUserPassword(resetTargetUser.id, newPassword.trim());
      if (result.success) {
        setResetSuccessMsg(`Đặt lại mật khẩu thành công cho tài khoản ${resetTargetUser.email}! Mật khẩu mới: ${newPassword}`);
        setNewPassword("");
        await loadUsersList();
      } else {
        setResetError(result.error || "Lỗi khi đặt lại mật khẩu.");
      }
    } catch (err) {
      setResetError("Lỗi hệ thống khi đặt lại mật khẩu.");
    }
  };

  // Filters
  const filteredUsers = users.filter(user => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.phone || "").toLowerCase().includes(term) ||
      (user.department || "").toLowerCase().includes(term);

    // Find group associated to check filter
    const userGroup = groups.find(g => g.id === user.groupId);
    const matchesRole = roleFilter === "All" || (userGroup && userGroup.role === roleFilter) || user.role === roleFilter;
    
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "active" && user.active) || 
      (statusFilter === "locked" && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: SystemUser["role"]) => {
    switch (role) {
      case "Admin": return "bg-rose-50 text-rose-700 border-rose-200/50";
      case "PM": return "bg-purple-50 text-purple-700 border-purple-200/50";
      case "Technical": return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "Customer": return "bg-blue-50 text-blue-700 border-blue-200/50";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadgeColor = (active: boolean) => {
    return active 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" 
      : "bg-rose-50 text-rose-700 border-rose-200/50";
  };

  return (
    <MainLayout>
      <Header 
        title="Quản Lý Hệ Thống" 
        description="Quản lý tài khoản đăng nhập hệ thống, gán nhóm người dùng, khóa và mở khóa tài khoản." 
        navTabs={SYSTEM_NAV_TABS}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số tài khoản</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{users.length}</h3>
          </div>
          <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{users.filter(u => u.active).length}</h3>
          </div>
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tài khoản bị khóa</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{users.filter(u => !u.active).length}</h3>
          </div>
          <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <Lock size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khách hàng truy cập</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{users.filter(u => u.role === "Customer").length}</h3>
          </div>
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs mb-6">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Role Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="All">Tất cả vai trò hệ thống</option>
              <option value="Admin">Quản trị viên (Admin)</option>
              <option value="PM">Quản lý Dự án (PM)</option>
              <option value="Technical">Kỹ sư Kỹ thuật (Technical)</option>
              <option value="Customer">Đại diện Khách hàng (Customer)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateOpen}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-sm hover:shadow-md cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Thêm Người Dùng</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs text-slate-500 font-semibold text-left">
                <th className="px-6 py-3.5">Họ và tên</th>
                <th className="px-4 py-3.5">Email tài khoản</th>
                <th className="px-4 py-3.5">Điện thoại</th>
                <th className="px-4 py-3.5">Nhóm phân quyền</th>
                <th className="px-4 py-3.5">Phòng ban</th>
                <th className="px-4 py-3.5 w-36 text-center">Trạng thái</th>
                <th className="px-6 py-3.5 w-40 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Không tìm thấy tài khoản người dùng nào.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const userGroup = groups.find(g => g.id === u.groupId);
                  const groupName = userGroup ? userGroup.name : u.roleLabel;
                  const role = userGroup ? userGroup.role : u.role;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase select-none">
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 text-slate-600 text-xs font-medium">
                        {u.email}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-4 text-slate-500 text-xs">
                        {u.phone || "—"}
                      </td>

                      {/* Group Role label */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-800 font-bold text-xs">{groupName}</span>
                          {u.customerId && (
                            <span className="text-[10px] text-blue-600 font-semibold truncate max-w-[150px]" title={u.department}>
                              • {u.department || "Khách hàng"}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border max-w-max uppercase tracking-wider ${getRoleBadgeColor(role)}`}>
                            {role}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-4 text-slate-500 text-xs font-medium">
                        {u.department || "—"}
                      </td>

                      {/* Lock Status */}
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeColor(u.active)}`}>
                          {u.active ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {/* Lock / Unlock */}
                          <button
                            onClick={() => handleToggleLock(u.id, u.name, u.active)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              u.active 
                                ? "bg-rose-50 border-rose-200/50 text-rose-500 hover:bg-rose-100" 
                                : "bg-emerald-50 border-emerald-200/50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                            title={u.active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {u.active ? <Lock size={13} /> : <Unlock size={13} />}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetTargetUser(u);
                              setNewPassword("");
                              setResetError("");
                              setResetSuccessMsg("");
                            }}
                            className="p-1.5 bg-blue-50 border border-blue-200/50 text-blue-600 hover:bg-blue-100 rounded-lg transition cursor-pointer"
                            title="Đặt lại mật khẩu"
                          >
                            <Key size={13} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Thêm Người Dùng Hệ Thống</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Nguyễn Văn B"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Email tài khoản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="VD: user@jpt.vn"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Điện thoại</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="VD: 090xxxxxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Nhóm phân quyền <span className="text-red-500">*</span></label>
                  <select
                    value={createForm.groupId}
                    onChange={e => {
                      const selectedGroupId = e.target.value;
                      const selectedGroup = groups.find(g => g.id === selectedGroupId);
                      
                      let dept = "Phòng Kỹ thuật & Support";
                      if (selectedGroup?.role === "Admin") dept = "Ban Giám Đốc";
                      if (selectedGroup?.role === "PM") dept = "Phòng Quản lý dự án";
                      if (selectedGroup?.role === "Customer") dept = "Khách hàng doanh nghiệp";
                      
                      setCreateForm(f => ({ 
                        ...f, 
                        groupId: selectedGroupId,
                        department: dept
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                  >
                    <option value="">-- Chọn nhóm phân quyền --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Linkage Dropdown Selector */}
              {(() => {
                const selectedGroup = groups.find(g => g.id === createForm.groupId);
                if (selectedGroup?.role === "Customer") {
                  return (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                        Chọn khách hàng liên kết <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={createForm.customerId}
                        onChange={e => {
                          const cid = e.target.value;
                          const cust = dbCustomers.find(c => c.id === cid);
                          setCreateForm(f => ({
                            ...f,
                            customerId: cid,
                            department: cust ? cust.name : "Khách hàng doanh nghiệp"
                          }));
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                      >
                        <option value="">-- Chọn khách hàng --</option>
                        {dbCustomers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Phòng ban</label>
                  <select
                    value={createForm.department}
                    onChange={e => setCreateForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Mật khẩu khởi tạo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Đặt mật khẩu khởi tạo..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Thêm người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetTargetUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Đặt Lại Mật Khẩu</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Tài khoản: {resetTargetUser.email}</p>
              </div>
              <button 
                onClick={() => setResetTargetUser(null)} 
                className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert size={15} />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccessMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span className="flex-1">{resetSuccessMsg}</span>
                </div>
              )}

              {!resetSuccessMsg && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <InfoIcon /> Mật khẩu mới sẽ áp dụng ngay khi lưu.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {resetSuccessMsg ? "Đóng" : "Hủy"}
                </button>
                {!resetSuccessMsg && (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Lưu mật khẩu
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function InfoIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

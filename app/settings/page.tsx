"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import { 
  fetchGroups, 
  createGroup, 
  updateGroup, 
  deleteGroup, 
  fetchUsers, 
  UserGroup 
} from "@/lib/auth-operations";
import { 
  Plus, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert, 
  Users, 
  X, 
  Save, 
  Info,
  Edit2
} from "lucide-react";

const SYSTEM_MENUS = [
  { path: "/dashboard", label: "Dashboard (Bảng điều khiển)" },
  { path: "/requests", label: "Yêu cầu (Danh sách & Phân công)" },
  { path: "/tickets", label: "Quản lý Ticket (Xử lý vé hỗ trợ)" },
  { path: "/maintenance", label: "Dịch vụ Bảo trì (Kế hoạch định kỳ)" },
  { path: "/projects", label: "Triển khai Dự án (Plan & Gantt)" },
  { path: "/customers", label: "Khách hàng (Danh sách đối tác)" },
  { path: "/contacts", label: "Liên hệ (Danh bạ khách hàng)" },
  { path: "/nhan-su", label: "Nhân sự (Quản lý nội bộ)" },
  { path: "/contracts", label: "Hợp đồng (Hồ sơ pháp lý)" },
  { path: "/sla", label: "Quản lý SLA (Mức độ cam kết dịch vụ)" },
  { path: "/users", label: "Người dùng (Quản trị tài khoản & Khóa)" },
  { path: "/settings", label: "Phân quyền nhóm (Cấu hình phân quyền)" },
  { path: "/system", label: "Quản lý hệ thống (Backup/Restore & Logs)" },
  { path: "/portal", label: "Cổng dịch vụ Khách hàng (Portal)" }
];

const ROLES = [
  { value: "Admin", label: "Quản trị viên" },
  { value: "PM", label: "Quản lý Dự án (PM)" },
  { value: "Technical", label: "Kỹ sư Kỹ thuật" },
  { value: "Customer", label: "Đại diện Khách hàng" }
];

export default function SettingsPage() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<UserGroup | null>(null);
  
  // Selected Group Permissions
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Group Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalForm, setModalForm] = useState({
    id: "",
    name: "",
    description: "",
    role: "Technical" as UserGroup["role"]
  });
  const [modalError, setModalError] = useState("");

  // Load Data
  const loadData = async () => {
    try {
      const [loadedGroups, loadedUsers] = await Promise.all([
        fetchGroups(),
        fetchUsers()
      ]);
      setGroups(loadedGroups);
      setUsers(loadedUsers);
      
      // Maintain active group selection or default to first
      if (loadedGroups.length > 0) {
        if (activeGroup) {
          const found = loadedGroups.find(g => g.id === activeGroup.id);
          if (found) {
            setActiveGroup(found);
            setSelectedPermissions(found.permissions);
            return;
          }
        }
        setActiveGroup(loadedGroups[0]);
        setSelectedPermissions(loadedGroups[0].permissions);
      }
    } catch (err) {
      console.error("Error loading settings data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectGroup = (group: UserGroup) => {
    setActiveGroup(group);
    setSelectedPermissions(group.permissions);
    setSaveSuccess(false);
  };

  const handlePermissionToggle = (path: string) => {
    setSaveSuccess(false);
    setSelectedPermissions(prev => {
      if (prev.includes(path)) {
        return prev.filter(p => p !== path);
      } else {
        return [...prev, path];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!activeGroup) return;
    
    try {
      const result = await updateGroup(activeGroup.id, {
        permissions: selectedPermissions
      });

      if (result.success) {
        setSaveSuccess(true);
        await loadData();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Lỗi hệ thống khi lưu cấu hình quyền.");
    }
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    setModalForm({
      id: "",
      name: "",
      description: "",
      role: "Technical"
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: UserGroup, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting group in background
    setModalMode("edit");
    setModalForm({
      id: group.id,
      name: group.name,
      description: group.description,
      role: group.role
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!modalForm.name.trim()) {
      setModalError("Vui lòng nhập tên nhóm phân quyền.");
      return;
    }

    try {
      if (modalMode === "create") {
        // Default permissions preset based on role
        let defaultPerms: string[] = ["/dashboard", "/requests", "/tickets"];
        if (modalForm.role === "Admin") defaultPerms = SYSTEM_MENUS.map(m => m.path);
        if (modalForm.role === "PM") defaultPerms = ["/dashboard", "/requests", "/tickets", "/projects", "/customers", "/contracts"];
        if (modalForm.role === "Technical") defaultPerms = ["/dashboard", "/requests", "/tickets", "/maintenance"];
        if (modalForm.role === "Customer") defaultPerms = ["/portal"];

        const result = await createGroup({
          name: modalForm.name.trim(),
          description: modalForm.description.trim(),
          role: modalForm.role,
          permissions: defaultPerms
        });

        if (result.success && result.group) {
          setIsModalOpen(false);
          await loadData();
          handleSelectGroup(result.group);
        } else {
          setModalError(result.error || "Có lỗi xảy ra.");
        }
      } else {
        const result = await updateGroup(modalForm.id, {
          name: modalForm.name.trim(),
          description: modalForm.description.trim()
        });

        if (result.success) {
          setIsModalOpen(false);
          await loadData();
        } else {
          setModalError(result.error || "Có lỗi xảy ra.");
        }
      }
    } catch (err) {
      setModalError("Lỗi hệ thống khi thao tác với nhóm phân quyền.");
    }
  };

  const handleDeleteGroup = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Xóa nhóm phân quyền "${name}"? Thao tác này không thể hoàn tác.`)) {
      try {
        const result = await deleteGroup(id);
        if (result.success) {
          await loadData();
        } else {
          alert(result.error);
        }
      } catch (err) {
        alert("Lỗi hệ thống khi xóa nhóm phân quyền.");
      }
    }
  };

  const getMemberCount = (groupId: string) => {
    return users.filter(u => u.groupId === groupId).length;
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  return (
    <MainLayout>
      <Header title="Phân Quyền Nhóm" description="Quản lý các nhóm người dùng, thiết lập danh mục menu được phép truy cập của từng nhóm." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: GROUPS LIST */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Danh sách nhóm người dùng</h2>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus size={13} />
                <span>Thêm nhóm</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {groups.map((group) => {
                const isActive = activeGroup?.id === group.id;
                const members = getMemberCount(group.id);
                const isSystemDefault = ["g-1", "g-2", "g-3", "g-4"].includes(group.id);
                
                return (
                  <div
                    key={group.id}
                    onClick={() => handleSelectGroup(group)}
                    className={`p-4 border rounded-xl transition cursor-pointer flex justify-between items-start group ${
                      isActive 
                        ? "bg-blue-50/40 border-blue-500 shadow-sm" 
                        : "bg-white border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                          {group.name}
                        </h3>
                        {isSystemDefault && (
                          <span className="text-[8px] font-bold bg-slate-100 text-slate-500 border border-slate-200/50 px-1 rounded uppercase select-none">Hệ thống</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">{getRoleLabel(group.role)}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-normal">{group.description || "Không có mô tả."}</p>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-medium">
                        <Users size={12} className="text-slate-500" />
                        <span>{members} thành viên</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEdit(group, e)}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                        title="Sửa tên/mô tả"
                      >
                        <Edit2 size={13} />
                      </button>
                      {!isSystemDefault && (
                        <button
                          onClick={(e) => handleDeleteGroup(group.id, group.name, e)}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                          title="Xóa nhóm"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PERMISSIONS EDITOR */}
        <div className="lg:col-span-7">
          {activeGroup ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-6">
              {/* Header Info */}
              <div className="pb-4 border-b border-slate-100 flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800">{activeGroup.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold border bg-blue-50 text-blue-700 border-blue-200/50">
                      Vai trò liên kết: {getRoleLabel(activeGroup.role)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {activeGroup.description || "Không có mô tả chi tiết."}
                  </p>
                </div>

                <button
                  onClick={handleSavePermissions}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                >
                  <Save size={13} />
                  <span>Lưu cấu hình quyền</span>
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 size={15} />
                  <span>Cấu hình quyền hạn đã được áp dụng và đồng bộ thành công!</span>
                </div>
              )}

              {/* Checkbox Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                  <Settings size={14} className="text-slate-500" />
                  <span>Danh mục menu được phép xem</span>
                </div>

                {activeGroup.role === "Admin" ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs flex items-center gap-2">
                    <Info size={16} />
                    <span>Nhóm có vai trò Admin mặc định được quyền xem tất cả các danh mục để tránh lỗi cấu trị viên.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {SYSTEM_MENUS.filter(menu => menu.path !== "/portal").map((menu) => {
                      const isChecked = selectedPermissions.includes(menu.path);
                      return (
                        <label 
                          key={menu.path} 
                          className={`flex items-center gap-3 p-3 border rounded-xl text-xs font-medium cursor-pointer transition select-none ${
                            isChecked 
                              ? "bg-blue-50/20 border-blue-200 text-slate-800" 
                              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePermissionToggle(menu.path)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 focus:ring-1 cursor-pointer"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span>{menu.label}</span>
                            <span className="text-[9px] font-mono text-slate-400 font-normal">{menu.path}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-12 text-center text-slate-400">
              <ShieldAlert size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Chưa chọn nhóm phân quyền</p>
              <p className="text-xs text-slate-500 mt-1">Vui lòng nhấp chọn nhóm người dùng ở cột bên trái để thiết lập quyền.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE / EDIT GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {modalMode === "create" ? "Thêm Nhóm Phân Quyền" : "Chỉnh Sửa Nhóm"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert size={15} />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Tên nhóm người dùng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.name}
                  onChange={e => setModalForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Đội Hỗ Trợ Đêm"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Mô tả nhóm</label>
                <textarea
                  value={modalForm.description}
                  onChange={e => setModalForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả tóm tắt nhiệm vụ/quyền hạn nhóm..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Vai trò hệ thống liên kết</label>
                <select
                  value={modalForm.role}
                  onChange={e => setModalForm(f => ({ ...f, role: e.target.value as UserGroup["role"] }))}
                  disabled={modalMode === "edit"}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {modalMode === "edit" && (
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Info size={12} /> Không thể thay đổi vai trò hệ thống liên kết của nhóm sau khi tạo.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {modalMode === "create" ? "Thêm nhóm" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

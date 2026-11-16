"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Layers,
  Sparkles,
  Save,
} from "lucide-react";
import {
  UserSession,
  getCurrentUser,
  changeCurrentUserPassword,
  updateCurrentUserProfile,
} from "@/lib/auth-operations";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updatedUser: UserSession) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  onUserUpdated,
}: UserProfileModalProps) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "password" | "permissions">("info");

  // Profile form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getCurrentUser();
      setUser(current);
      if (current) {
        setName(current.name || "");
        setPhone(current.phone || "");
        setDepartment(current.department || "");
      }
      setProfileMsg(null);
      setPassMsg(null);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Vui lòng nhập họ và tên." });
      return;
    }

    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await updateCurrentUserProfile(user.email, {
        name: name.trim(),
        phone: phone.trim(),
        department: department.trim(),
      });

      if (res.success && res.updatedUser) {
        setUser(res.updatedUser);
        onUserUpdated?.(res.updatedUser);
        setProfileMsg({ type: "success", text: "Cập nhật thông tin tài khoản thành công!" });
        setTimeout(() => setProfileMsg(null), 4000);
      } else {
        setProfileMsg({ type: "error", text: res.error || "Không thể cập nhật thông tin." });
      }
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Lỗi hệ thống khi lưu thông tin." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!oldPassword) {
      setPassMsg({ type: "error", text: "Vui lòng nhập mật khẩu hiện tại." });
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setPassMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 3 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "Mật khẩu xác nhận không khớp với mật khẩu mới." });
      return;
    }
    if (oldPassword === newPassword) {
      setPassMsg({ type: "error", text: "Mật khẩu mới không được trùng với mật khẩu cũ." });
      return;
    }

    setChangingPass(true);
    try {
      const res = await changeCurrentUserPassword(user.email, oldPassword, newPassword);
      if (res.success) {
        setPassMsg({ type: "success", text: "Đổi mật khẩu thành công! Hãy sử dụng mật khẩu mới trong các lần đăng nhập tiếp theo." });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPassMsg(null), 5000);
      } else {
        setPassMsg({ type: "error", text: res.error || "Đổi mật khẩu thất bại." });
      }
    } catch (err: any) {
      setPassMsg({ type: "error", text: err.message || "Lỗi hệ thống khi đổi mật khẩu." });
    } finally {
      setChangingPass(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "PM":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "Technical":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">{user.name || "Thông Tin Tài Khoản"}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleColor(user.role)}`}>
                  {user.roleLabel || user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Đóng (ESC)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "info"
                ? "border-teal-600 text-teal-700 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User size={14} />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "password"
                ? "border-teal-600 text-teal-700 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <KeyRound size={14} />
            <span>Đổi mật khẩu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === "permissions"
                ? "border-teal-600 text-teal-700 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Shield size={14} />
            <span>Phân quyền & Phân hệ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === "info" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                    profileMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {profileMsg.type === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Họ và tên */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User size={13} className="text-teal-600" />
                    <span>Họ và tên</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nhập họ và tên..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden bg-white font-medium"
                  />
                </div>

                {/* Email đăng nhập (Readonly) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-500" />
                    <span>Email đăng nhập</span>
                    <Lock size={11} className="text-slate-400" />
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Email dùng để định danh tài khoản và nhận thông báo.</p>
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone size={13} className="text-teal-600" />
                    <span>Số điện thoại</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden bg-white font-mono"
                  />
                </div>

                {/* Phòng ban */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building size={13} className="text-teal-600" />
                    <span>Phòng ban</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Phòng Kỹ thuật, Ban Giám Đốc..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden bg-white"
                  />
                </div>

                {/* Vai trò & Nhóm quyền */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Shield size={13} className="text-slate-500" />
                    <span>Nhóm quyền / Vai trò</span>
                  </label>
                  <div className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{user.roleLabel || user.role}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-mono">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status info banner */}
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex items-center justify-between text-xs text-teal-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold">Trạng thái: Hoạt động (Active)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Đang đăng nhập trên phiên làm việc hiện tại
                </span>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      <span>Lưu thông tin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ĐỔI MẬT KHẨU */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                    passMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {passMsg.type === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                  )}
                  <span>{passMsg.text}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound size={13} className="text-slate-600" />
                  <span>Mật khẩu hiện tại</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="Nhập mật khẩu đang sử dụng..."
                    className="w-full px-3 py-2 pr-10 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock size={13} className="text-teal-600" />
                  <span>Mật khẩu mới</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={3}
                    placeholder="Nhập mật khẩu mới (ít nhất 3 ký tự)..."
                    className="w-full px-3 py-2 pr-10 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-teal-600" />
                  <span>Xác nhận mật khẩu mới</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full px-3 py-2 pr-10 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 space-y-1">
                <p className="font-bold flex items-center gap-1 text-slate-700">
                  <Sparkles size={12} className="text-amber-500" />
                  Lưu ý bảo mật:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                  <li>Nên sử dụng mật khẩu dễ nhớ nhưng không trùng với thông tin cá nhân công khai.</li>
                  <li>Sau khi đổi thành công, hệ thống sẽ tự động cập nhật ngay trên máy chủ.</li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  {changingPass ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={13} />
                      <span>Xác nhận đổi mật khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PHÂN QUYỀN TRUY CẬP */}
          {activeTab === "permissions" && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">Nhóm phân quyền áp dụng:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getRoleColor(user.role)}`}>
                    {user.roleLabel || user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Tài khoản của bạn được cấp quyền truy cập dựa trên nhóm quyền được quản trị viên thiết lập trong hệ thống.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Layers size={13} className="text-teal-600" />
                  <span>Các phân hệ được phép truy cập:</span>
                </label>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { path: "/dashboard", label: "Dashboard (Tổng quan)" },
                    { path: "/requests", label: "Quản lý Yêu cầu" },
                    { path: "/tickets", label: "Quản lý Ticket" },
                    { path: "/maintenance", label: "Dịch vụ Bảo trì" },
                    { path: "/projects", label: "Triển khai Dự án" },
                    { path: "/notifications", label: "Thông báo hệ thống" },
                    { path: "/customers", label: "Khách hàng & Hợp đồng" },
                    { path: "/sla", label: "Quản lý SLA" },
                    { path: "/users", label: "Người dùng & Phân quyền" },
                    { path: "/settings", label: "Cấu hình Hệ thống" },
                    { path: "/guide", label: "Hướng dẫn sử dụng" },
                  ].map((item) => {
                    const hasPerm =
                      user.role === "Admin" ||
                      item.path === "/guide" ||
                      Boolean(user.permissions?.some((p) => item.path === p || item.path.startsWith(p + "/")));
                    return (
                      <div
                        key={item.path}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                          hasPerm
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            hasPerm ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                        <span className="truncate font-medium">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

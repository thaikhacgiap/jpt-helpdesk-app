"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, logout, hasAccess, UserSession } from "@/lib/auth-operations";

import {
  LayoutDashboard,
  Wrench,
  FolderOpen,
  FileText,
  Users,
  Settings,
  LogOut,
  AlertCircle,
  User,
  UsersRound,
  UserCheck,
  Inbox,
} from "lucide-react";

interface MenuItemProps {
  isActive: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [ongoingCount, setOngoingCount] = useState<number>(0);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    const fetchOngoingCount = async () => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select("tt_status");
        if (!error && data) {
          const ongoing = data.filter((t) =>
            ["In progress", "On Hold", "Reporting"].includes(t.tt_status || "")
          ).length;
          setOngoingCount(ongoing);
        }
      } catch (err) {
        console.error("Error fetching ongoing count:", err);
      }
    };

    fetchOngoingCount();
    const interval = setInterval(fetchOngoingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const menuItemClass = ({ isActive }: MenuItemProps) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium relative group ${
      isActive
        ? "bg-teal-500/20 text-teal-400"
        : "text-gray-300 hover:text-white hover:bg-white/5"
    }`;

  const handleLogoutClick = () => {
    logout();
    router.push("/login");
  };

  const showLink = (path: string) => {
    if (!user) return false;
    return hasAccess(user.role, path);
  };

  // Section visibility checks
  const showServiceSection = showLink("/dashboard") || showLink("/requests") || showLink("/tickets") || showLink("/maintenance") || showLink("/projects");
  const showInfoSection = showLink("/customers") || showLink("/contacts") || showLink("/nhan-su") || showLink("/contracts");
  const showSystemSection = showLink("/sla") || showLink("/users") || showLink("/settings");

  return (
    <aside className="w-[205px] min-h-screen bg-slate-900 border-r border-slate-700 flex flex-col justify-between px-4 py-6 shrink-0">
      <div>
        {/* LOGO */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-teal-500 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚙</span>
            </div>
            <h1 className="text-lg font-bold text-white">IT Helpdesk</h1>
          </div>
          <p className="text-xs text-gray-400 ml-8">v4.0</p>
        </div>

        {/* DỊCH VỤ */}
        {showServiceSection && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-2">
              DỊCH VỤ
            </p>

            <div className="space-y-1">
              {showLink("/dashboard") && (
                <Link
                  href="/dashboard"
                  className={menuItemClass({ isActive: pathname === "/dashboard" })}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
              )}

              {showLink("/requests") && (
                <Link
                  href="/requests"
                  className={menuItemClass({ isActive: pathname.startsWith("/requests") })}
                >
                  <Inbox size={18} />
                  <span>Yêu cầu</span>
                </Link>
              )}

              {showLink("/tickets") && (
                <div className="relative group">
                  <Link
                    href="/tickets"
                    className={menuItemClass({
                      isActive: pathname.startsWith("/tickets"),
                    })}
                  >
                    <span className="relative">
                      <AlertCircle size={18} />
                    </span>
                    <span>Quản Lý Ticket</span>
                    {ongoingCount > 0 && (
                      <span className="absolute right-3 top-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {ongoingCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {showLink("/maintenance") && (
                <Link
                  href="/maintenance"
                  className={menuItemClass({
                    isActive: pathname === "/maintenance" || pathname.startsWith("/maintenance/"),
                  })}
                >
                  <Wrench size={18} />
                  <span>Dịch Vụ Bảo Trì</span>
                </Link>
              )}

              {showLink("/projects") && (
                <Link
                  href="/projects"
                  className={menuItemClass({ isActive: pathname.startsWith("/projects") })}
                >
                  <FolderOpen size={18} />
                  <span>Triển khai dự án</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* QUẢN LÝ THÔNG TIN */}
        {showInfoSection && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-2">
              QUẢN LÝ THÔNG TIN
            </p>

            <div className="space-y-1">
              {showLink("/customers") && (
                <Link
                  href="/customers"
                  className={menuItemClass({
                    isActive: pathname === "/customers",
                  })}
                >
                  <Users size={18} />
                  <span>Khách hàng</span>
                </Link>
              )}

              {showLink("/contacts") && (
                <Link
                  href="/contacts"
                  className={menuItemClass({
                    isActive: pathname === "/contacts",
                  })}
                >
                  <UsersRound size={18} />
                  <span>Liên hệ</span>
                </Link>
              )}

              {showLink("/nhan-su") && (
                <Link
                  href="/nhan-su"
                  className={menuItemClass({
                    isActive: pathname === "/nhan-su",
                  })}
                >
                  <UserCheck size={18} />
                  <span>Nhân sự</span>
                </Link>
              )}

              {showLink("/contracts") && (
                <Link
                  href="/contracts"
                  className={menuItemClass({
                    isActive: pathname === "/contracts",
                  })}
                >
                  <FileText size={18} />
                  <span>Hợp đồng</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* HỆ THỐNG */}
        {showSystemSection && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-2">
              HỆ THỐNG
            </p>

            <div className="space-y-1">
              {showLink("/sla") && (
                <Link
                  href="/sla"
                  className={menuItemClass({
                    isActive: pathname === "/sla",
                  })}
                >
                  <AlertCircle size={18} />
                  <span>Quản lý SLA</span>
                </Link>
              )}

              {showLink("/users") && (
                <Link
                  href="/users"
                  className={menuItemClass({
                    isActive: pathname === "/users",
                  })}
                >
                  <User size={18} />
                  <span>Người dùng</span>
                </Link>
              )}

              {showLink("/settings") && (
                <Link
                  href="/settings"
                  className={menuItemClass({
                    isActive: pathname === "/settings",
                  })}
                >
                  <Settings size={18} />
                  <span>Phân quyền nhóm</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LOGOUT */}
      <div className="pt-4 border-t border-slate-700">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium cursor-pointer"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
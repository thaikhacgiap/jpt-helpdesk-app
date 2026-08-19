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
  Server,
  Bell,
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
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap overflow-hidden relative group ${
      isActive
        ? "bg-teal-500/20 text-teal-400 font-semibold"
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
  const showServiceSection = showLink("/requests") || showLink("/tickets") || showLink("/maintenance") || showLink("/projects") || showLink("/notifications");
  const showInfoSection = showLink("/customers") || showLink("/contacts") || showLink("/nhan-su") || showLink("/contracts") || showLink("/sla");
  const showSystemSection = showLink("/users") || showLink("/settings") || showLink("/system");

  return (
    <aside className="w-[230px] min-h-screen bg-slate-900 border-r border-slate-700/80 flex flex-col justify-between px-3.5 py-6 shrink-0">
      <div>
        {/* LOGO */}
        <div className="mb-6 px-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-teal-500 rounded-md flex items-center justify-center shadow-xs">
              <span className="text-white text-xs font-bold">⚙</span>
            </div>
            <h1 className="text-lg font-extrabold text-white tracking-tight">IT Helpdesk</h1>
          </div>
          <p className="text-xs text-gray-400 ml-8 font-mono">v4.0</p>
        </div>

        {/* DASHBOARD (STANDALONE AT TOP OUTSIDE DỊCH VỤ) */}
        {showLink("/dashboard") && (
          <div className="mb-5">
            <Link
              href="/dashboard"
              className={menuItemClass({ isActive: pathname === "/dashboard" })}
            >
              <LayoutDashboard size={18} className="shrink-0" />
              <span className="truncate">Dashboard</span>
            </Link>
          </div>
        )}

        {/* SECTION 1: DỊCH VỤ */}
        {showServiceSection && (
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-widest text-cyan-400 font-extrabold mb-2.5 px-2">
              DỊCH VỤ
            </p>

            <div className="space-y-1">
              {showLink("/requests") && (
                <Link
                  href="/requests"
                  className={menuItemClass({ isActive: pathname.startsWith("/requests") })}
                >
                  <Inbox size={18} className="shrink-0" />
                  <span className="truncate">Yêu cầu</span>
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
                    <AlertCircle size={18} className="shrink-0" />
                    <span className="truncate">Quản Lý Ticket</span>
                    {ongoingCount > 0 && (
                      <span className="ml-auto bg-orange-500 text-white text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
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
                  <Wrench size={18} className="shrink-0" />
                  <span className="truncate">Dịch Vụ Bảo Trì</span>
                </Link>
              )}

              {showLink("/projects") && (
                <Link
                  href="/projects"
                  className={menuItemClass({ isActive: pathname.startsWith("/projects") })}
                >
                  <FolderOpen size={18} className="shrink-0" />
                  <span className="truncate">Triển khai dự án</span>
                </Link>
              )}

              {showLink("/notifications") && (
                <Link
                  href="/notifications"
                  className={menuItemClass({ isActive: pathname.startsWith("/notifications") })}
                >
                  <Bell size={18} className="shrink-0" />
                  <span className="truncate">Thông báo</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: THÔNG TIN (Renamed from QUẢN LÝ THÔNG TIN) */}
        {showInfoSection && (
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-widest text-cyan-400 font-extrabold mb-2.5 px-2">
              THÔNG TIN
            </p>

            <div className="space-y-1">
              {(showLink("/customers") || showLink("/opportunities") || showLink("/contacts") || showLink("/nhan-su") || showLink("/contracts")) && (
                <Link
                  href="/customers"
                  className={menuItemClass({
                    isActive: ["/customers", "/opportunities", "/contacts", "/nhan-su", "/contracts"].some(path => pathname.startsWith(path)),
                  })}
                >
                  <FolderOpen size={18} className="shrink-0" />
                  <span className="truncate">Quản Lý Thông Tin</span>
                </Link>
              )}

              {showLink("/sla") && (
                <Link
                  href="/sla"
                  className={menuItemClass({
                    isActive: pathname.startsWith("/sla"),
                  })}
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="truncate">Quản lý SLA</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: HỆ THỐNG */}
        {showSystemSection && (
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-widest text-cyan-400 font-extrabold mb-2.5 px-2">
              HỆ THỐNG
            </p>

            <div className="space-y-1">
              {(showLink("/system") || showLink("/users") || showLink("/settings")) && (
                <Link
                  href="/users"
                  className={menuItemClass({
                    isActive: ["/system", "/users", "/settings"].some(path => pathname.startsWith(path)),
                  })}
                >
                  <Server size={18} className="shrink-0" />
                  <span className="truncate">Quản lý hệ thống</span>
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
"use client";

import { useEffect, useState } from "react";
import { 
  Bell, LayoutDashboard, Users, FileText, FolderGit2, Wrench, ShieldCheck, 
  Settings, Database, HelpCircle, UserCheck, PhoneCall, Ticket
} from "lucide-react";
import { getCurrentUser, UserSession } from "@/lib/auth-operations";

interface HeaderProps {
  title: string;
  description: string;
  tabs?: { id: string; label: string; icon?: any }[];
  activeTab?: string;
  setActiveTab?: (id: string) => void;
}

const getIconForTitle = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("bảng điều khiển") || t.includes("dashboard")) return <LayoutDashboard size={18} />;
  if (t.includes("khách hàng")) return <Users size={18} />;
  if (t.includes("hợp đồng")) return <FileText size={18} />;
  if (t.includes("dự án")) return <FolderGit2 size={18} />;
  if (t.includes("nhân sự")) return <Users size={18} />;
  if (t.includes("liên hệ")) return <PhoneCall size={18} />;
  if (t.includes("sla")) return <ShieldCheck size={18} />;
  if (t.includes("hệ thống")) return <Database size={18} />;
  if (t.includes("người dùng") || t.includes("phân quyền")) return <UserCheck size={18} />;
  if (t.includes("cài đặt")) return <Settings size={18} />;
  if (t.includes("bảo trì")) return <Wrench size={18} />;
  return <HelpCircle size={18} />;
};

export default function Header({
  title,
  description,
  tabs,
  activeTab,
  setActiveTab,
}: HeaderProps) {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <div className="flex items-center justify-between gap-3 mb-6 bg-gradient-to-r from-teal-800/90 via-teal-900/95 to-slate-900/95 backdrop-blur-md border border-teal-700/30 text-white py-3.5 px-5 rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.15)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(20,184,166,0.15),transparent_60%)] pointer-events-none" />
      {/* LEFT */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 shrink-0">
          {getIconForTitle(title)}
        </div>
        <div className="space-y-0 text-left">
          <h1 className="text-[18px] font-normal tracking-tight text-white leading-tight">
            {title}
          </h1>
          <p className="text-sm text-teal-200/70 font-normal leading-normal">
            {description}
          </p>
        </div>
      </div>

      {/* TABS SELECTOR (OPTIONAL) */}
      {tabs && tabs.length > 0 && setActiveTab && (
        <div className="flex bg-slate-900/45 p-1 rounded-lg border border-slate-800/10 shadow-inner gap-1 relative z-10 max-h-10 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                  isActive 
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-semibold border-amber-300/40 shadow-[0_2px_10px_rgba(245,158,11,0.3)]" 
                    : "bg-white/5 text-slate-200 border-white/5 hover:bg-white/10 hover:text-white"
                }`}
              >
                {Icon && <Icon size={12} className={isActive ? "text-slate-950" : ""} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* RIGHT */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Notification */}
        <div className="relative cursor-pointer w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition">
          <Bell
            size={16}
            className="text-slate-200 hover:text-white transition"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-normal">
            3
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-[1px] bg-white/10" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white text-teal-800 font-normal text-sm border border-white/20 shadow-sm shrink-0 uppercase select-none flex items-center justify-center">
            {user?.name ? user.name.charAt(0) : "A"}
          </div>

          <div className="leading-tight select-none text-left hidden sm:block">
            <div className="text-sm font-normal text-white">
              Hi {user?.name || "Admin"}
            </div>
            <div className="text-[10px] text-teal-200/70 font-normal mt-0.5">
              {user?.roleLabel || "Quản trị viên"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
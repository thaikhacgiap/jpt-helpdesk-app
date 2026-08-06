"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bell, LayoutDashboard, Users, FileText, FolderGit2, Wrench, ShieldCheck, 
  Settings, Database, HelpCircle, UserCheck, PhoneCall, UsersRound, User, Server
} from "lucide-react";

export interface NavTabItem {
  href: string;
  label: string;
  icon?: any;
}

interface HeaderProps {
  title: string;
  description: string;
  tabs?: { id: string; label: string; icon?: any }[];
  activeTab?: string;
  setActiveTab?: (id: string) => void;
  navTabs?: NavTabItem[];
}

const getIconForTitle = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("bảng điều khiển") || t.includes("dashboard")) return <LayoutDashboard size={18} />;
  if (t.includes("khách hàng")) return <Users size={18} />;
  if (t.includes("hợp đồng")) return <FileText size={18} />;
  if (t.includes("dự án")) return <FolderGit2 size={18} />;
  if (t.includes("nhân sự")) return <UserCheck size={18} />;
  if (t.includes("liên hệ")) return <PhoneCall size={18} />;
  if (t.includes("sla")) return <ShieldCheck size={18} />;
  if (t.includes("hệ thống")) return <Server size={18} />;
  if (t.includes("người dùng") || t.includes("phân quyền")) return <User size={18} />;
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
  navTabs,
}: HeaderProps) {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between gap-3 mb-6 bg-gradient-to-r from-teal-800/90 via-teal-900/95 to-slate-900/95 backdrop-blur-md border border-teal-700/30 text-white py-3 px-5 rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.15)] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(20,184,166,0.15),transparent_60%)] pointer-events-none" />
      
      {/* LEFT TITLE BLOCK */}
      <div className="flex items-center gap-3 relative z-10 py-1">
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 shrink-0">
          {getIconForTitle(title)}
        </div>
        <div className="space-y-0 text-left">
          <h1 className="text-[17px] font-bold tracking-tight text-white leading-tight">
            {title}
          </h1>
          <p className="text-xs text-teal-200/70 font-medium leading-normal">
            {description}
          </p>
        </div>
      </div>

      {/* CENTER/RIGHT TABS & ACTIONS */}
      <div className="flex items-center gap-3 relative z-10">
        {/* LINK-BASED NAV TABS (For Quản lý thông tin & Quản lý hệ thống) */}
        {navTabs && navTabs.length > 0 && (
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 shadow-inner gap-1 max-h-10 overflow-x-auto custom-scrollbar">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                    isActive 
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold border-amber-300/40 shadow-[0_2px_10px_rgba(245,158,11,0.3)]" 
                      : "bg-white/5 text-slate-200 border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {Icon && <Icon size={13} className={isActive ? "text-slate-950" : "text-slate-300"} />}
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* STATE-BASED BUTTON TABS (Optional) */}
        {tabs && tabs.length > 0 && setActiveTab && (
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-700/50 shadow-inner gap-1 max-h-10 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap border ${
                    isActive 
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold border-amber-300/40 shadow-[0_2px_10px_rgba(245,158,11,0.3)]" 
                      : "bg-white/5 text-slate-200 border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {Icon && <Icon size={13} className={isActive ? "text-slate-950" : "text-slate-300"} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* NOTIFICATION BELL */}
        <div className="relative cursor-pointer w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition shrink-0 ml-1">
          <Bell
            size={16}
            className="text-slate-200 hover:text-white transition"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
            3
          </div>
        </div>
      </div>
    </div>
  );
}
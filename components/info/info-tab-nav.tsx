"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UsersRound, UserCheck, FileText } from "lucide-react";

export default function InfoTabNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/customers", label: "Khách hàng", icon: Users },
    { href: "/contacts", label: "Liên hệ", icon: UsersRound },
    { href: "/nhan-su", label: "Nhân sự", icon: UserCheck },
    { href: "/contracts", label: "Hợp đồng", icon: FileText }
  ];

  return (
    <div className="bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl mb-6 flex items-center gap-1.5 w-fit shadow-2xs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? "bg-white text-blue-600 shadow-xs border border-slate-200/80 ring-2 ring-blue-500/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

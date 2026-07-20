"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getCurrentUser, UserSession } from "@/lib/auth-operations";

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({
  title,
  description,
}: HeaderProps) {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return (
    <div className="flex items-start justify-between mb-6">
      {/* LEFT */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>

        <p className="text-xs text-slate-500 mt-0.5">
          {description}
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">
        {/* Notification */}
        <div className="relative cursor-pointer">
          <Bell
            size={24}
            className="text-slate-600 hover:text-black transition"
          />

          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
            3
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-base border-2 border-white shadow-sm shrink-0 uppercase select-none">
            {user?.name ? user.name.charAt(0) : "A"}
          </div>

          <div className="leading-tight select-none">
            <div className="text-sm font-semibold text-slate-900">
              Hi {user?.name || "Admin"}
            </div>

            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {user?.roleLabel || "Quản trị viên"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
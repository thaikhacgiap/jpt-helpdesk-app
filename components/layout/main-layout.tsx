"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./sidebar";
import { getCurrentUser, hasAccess, UserSession } from "@/lib/auth-operations";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const session = getCurrentUser();
    if (!session) {
      router.push("/login");
      return;
    }

    if (session.role === "Customer") {
      router.push("/portal");
      return;
    }

    setUser(session);
    const authorized = hasAccess(session.role, pathname);
    setIsAuthorized(authorized);
    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-medium">Đang xác thực thông tin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isAuthorized ? (
            children
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm text-center max-w-md space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mx-auto">
                  <ShieldAlert size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-slate-800">Quyền truy cập bị giới hạn</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tài khoản của bạn với vai trò <strong className="text-slate-700">{user?.roleLabel}</strong> không được phân quyền xem trang này.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Quay lại Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
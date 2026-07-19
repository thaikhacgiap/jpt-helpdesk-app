"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, fetchUsers, SystemUser } from "@/lib/auth-operations";
import { ShieldCheck, Mail, Lock, ArrowRight, User, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickAccounts, setQuickAccounts] = useState<SystemUser[]>([]);

  useEffect(() => {
    setQuickAccounts(fetchUsers());
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (result.success && result.user) {
        if (result.user.role === "Customer") {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(result.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.");
      }
    }, 600);
  };

  const handleQuickLogin = (selectedUser: SystemUser) => {
    setError("");
    setLoading(true);
    setEmail(selectedUser.email);
    setPassword(selectedUser.password || "123");
    
    setTimeout(() => {
      const result = login(selectedUser.email, selectedUser.password || "123");
      setLoading(false);
      if (result.success && result.user) {
        if (result.user.role === "Customer") {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(result.error || "Đăng nhập thất bại.");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 text-slate-100 antialiased font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left column: Brand Info */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
          <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
            <ShieldCheck size={36} className="animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            JPT Helpdesk <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Portal & Management
            </span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
            Hệ thống quản lý dịch vụ bảo trì định kỳ, vé hỗ trợ kỹ thuật helpdesk và phân phối các dự án triển khai cho khách hàng doanh nghiệp JPT.
          </p>
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
            <Info size={14} className="text-slate-400" />
            <span>Mật khẩu mặc định của các tài khoản mẫu là <strong className="text-slate-300">123</strong>.</span>
          </div>
        </div>

        {/* Right column: Login form & Quick selector */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          
          {/* Main Credentials Box */}
          <div className="md:col-span-7 bg-slate-900/60 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-100">Đăng nhập tài khoản</h2>
              <p className="text-xs text-slate-500 mt-1">Vui lòng nhập thông tin đăng nhập của bạn.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email tài khoản</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@jpt.vn"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl outline-none text-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Login Accounts Box */}
          <div className="md:col-span-5 bg-slate-900/30 border border-slate-800/80 backdrop-blur-md rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Đăng nhập nhanh</h3>
              <p className="text-[10px] text-slate-500 leading-normal mb-4">Click chọn vai trò để đăng nhập nhanh:</p>
              
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {quickAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleQuickLogin(acc)}
                    disabled={loading}
                    className="w-full text-left p-2.5 bg-slate-950/50 hover:bg-slate-800/50 border border-slate-850 hover:border-slate-700 rounded-xl transition flex items-center gap-3 cursor-pointer group disabled:opacity-50"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      !acc.active ? "bg-slate-800 text-slate-600" :
                      acc.role === "Admin" ? "bg-red-500/10 text-red-400" :
                      acc.role === "PM" ? "bg-purple-500/10 text-purple-400" :
                      acc.role === "Technical" ? "bg-amber-500/10 text-amber-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      <User size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-200 group-hover:text-white truncate">{acc.name}</p>
                        {!acc.active && (
                          <span className="text-[7px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/20 px-1 rounded uppercase">Khóa</span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 group-hover:text-slate-400 truncate">{acc.roleLabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

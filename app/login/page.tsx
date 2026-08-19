"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, fetchUsers, SystemUser } from "@/lib/auth-operations";
import {
  ShieldCheck,
  Shield,
  Headphones,
  Clock,
  Mail,
  Lock,
  ArrowRight,
  User,
  Eye,
  EyeOff,
  Loader2,
  Sparkles
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickAccounts, setQuickAccounts] = useState<SystemUser[]>([]);
  const [showQuickModal, setShowQuickModal] = useState(false);

  useEffect(() => {
    fetchUsers()
      .then((data) => setQuickAccounts(data || []))
      .catch((err) => console.error("Error loading quick accounts:", err));
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      setLoading(false);
      if (result.success && result.user) {
        if (result.user.role === "Customer") {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(result.error || "Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.");
      }
    } catch (err: any) {
      setLoading(false);
      setError("Đăng nhập thất bại. Lỗi kết nối máy chủ.");
    }
  };

  const handleQuickLogin = async (selectedUser: SystemUser) => {
    setError("");
    setLoading(true);
    setEmail(selectedUser.email);
    const pwd = selectedUser.password || "123";
    setPassword(pwd);
    setShowQuickModal(false);

    try {
      const result = await login(selectedUser.email, pwd);
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
    } catch (err) {
      setLoading(false);
      setError("Đăng nhập thất bại. Lỗi kết nối hệ thống.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060913] text-slate-100 flex flex-col lg:flex-row antialiased font-sans relative overflow-hidden select-none">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-600/12 blur-[150px] pointer-events-none" />

      {/* ================= LEFT COLUMN: HERO SHOWCASE (CAN GIUA) ================= */}
      <div className="lg:w-[46%] w-full flex flex-col justify-center items-center lg:items-start p-8 lg:p-16 relative z-10 bg-gradient-to-b from-blue-950/40 via-[#0a1128]/60 to-[#060913]/90 border-r border-slate-800/40 backdrop-blur-xs min-h-screen">
        
        <div className="w-full max-w-xl my-auto space-y-7">
          
          {/* Top: JPT Brand Logo (Tăng kích thước 100%) */}
          <div>
            <div className="inline-flex items-center gap-4 px-5 py-3.5 rounded-3xl bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl shadow-blue-950/60 backdrop-blur-md hover:border-blue-500/50 transition duration-300">
              {/* Logo Oval 2x size */}
              <div className="w-18 h-12 rounded-2xl border-2 border-blue-400 flex items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 shadow-inner px-2">
                <span className="text-2xl font-black tracking-tighter text-blue-300 font-mono">JPT</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-white tracking-wider uppercase leading-tight">J-PROTECH</span>
                <span className="text-xs text-slate-300 font-medium tracking-tight mt-0.5">Japan Replacement Technology</span>
              </div>
            </div>
          </div>

          {/* Heading (Font chữ +4px) */}
          <div className="space-y-3 pt-2">
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              JPT Helpdesk
            </h1>
            <h2 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent tracking-tight">
              Portal & Management
            </h2>
            <p className="text-base lg:text-lg text-slate-300/90 leading-relaxed pt-2 font-normal">
              Hệ thống quản lý dịch vụ bảo trì định kỳ, hỗ trợ kỹ thuật helpdesk và phân phối các dự án triển khai cho khách hàng doanh nghiệp JPT.
            </p>
          </div>

          {/* 3 Features Cards (Font +4px, Icons to hơn) */}
          <div className="space-y-4 pt-2">
            
            {/* Card 1: Bảo mật */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.09] hover:bg-white/[0.08] transition duration-200 flex items-center gap-4 group shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-sm group-hover:scale-105 transition">
                <Shield size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Bảo mật tuyệt đối</h4>
                <p className="text-sm text-slate-300/80 mt-0.5">Thông tin của bạn được mã hóa và bảo vệ an toàn</p>
              </div>
            </div>

            {/* Card 2: Hỗ trợ nhanh */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.09] hover:bg-white/[0.08] transition duration-200 flex items-center gap-4 group shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 shadow-sm group-hover:scale-105 transition">
                <Headphones size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Hỗ trợ nhanh chóng</h4>
                <p className="text-sm text-slate-300/80 mt-0.5">Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ 24/7</p>
              </div>
            </div>

            {/* Card 3: Quản lý hiệu quả */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.09] hover:bg-white/[0.08] transition duration-200 flex items-center gap-4 group shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0 shadow-sm group-hover:scale-105 transition">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Quản lý hiệu quả</h4>
                <p className="text-sm text-slate-300/80 mt-0.5">Theo dõi và quản lý toàn bộ yêu cầu dễ dàng</p>
              </div>
            </div>
          </div>

          {/* Bottom copyright */}
          <div className="pt-4 flex items-center gap-2.5 text-sm text-slate-400">
            <ShieldCheck size={17} className="text-slate-400" />
            <span>© 2026 JPT Helpdesk. All rights reserved.</span>
          </div>

        </div>
      </div>

      {/* ================= RIGHT COLUMN: LOGIN FORM ================= */}
      <div className="lg:w-[54%] w-full flex-1 flex flex-col justify-center items-center p-6 lg:p-14 relative z-10 min-h-screen">
        
        {/* Form Card Container (Rộng hơn & Font +4px) */}
        <div className="w-full max-w-[480px] bg-[#0d1424]/90 border border-slate-700/60 rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/80 backdrop-blur-2xl relative animate-in fade-in zoom-in-95 duration-300">
          
          {/* Avatar Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-slate-800 to-indigo-950 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-950/60">
              <User size={28} />
            </div>
          </div>

          {/* Form Header (Font +4px) */}
          <div className="text-center mb-7">
            <h3 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Chào mừng trở lại!</h3>
            <p className="text-sm text-slate-300 mt-1.5 font-normal">Vui lòng đăng nhập để tiếp tục</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm flex items-center gap-2.5 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-200">Email</label>
              <div className="relative flex items-center">
                <Mail size={19} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#141d33] border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-200">Mật khẩu</label>
              <div className="relative flex items-center">
                <Lock size={19} className="absolute left-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full pl-11 pr-11 py-3.5 bg-[#141d33] border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-200 transition p-1"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded bg-[#141d33] border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition cursor-pointer"
                />
                <span className="text-sm font-medium">Ghi nhớ đăng nhập</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Vui lòng liên hệ quản trị viên IT qua techsupport@jprotech.vn để đặt lại mật khẩu.");
                }}
                className="text-sm font-semibold text-sky-400 hover:text-sky-300 hover:underline transition"
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button (Font +4px) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-xl shadow-indigo-600/40 hover:shadow-indigo-500/60 transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Đang xử lý đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Account Test Modal / Dropdown */}
          {quickAccounts.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800 flex justify-center">
              <button
                type="button"
                onClick={() => setShowQuickModal(!showQuickModal)}
                className="text-xs font-semibold text-slate-400 hover:text-indigo-300 flex items-center gap-2 py-1.5 px-3.5 rounded-xl hover:bg-slate-800/60 transition"
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>{showQuickModal ? "Ẩn danh sách tài khoản mẫu" : "Chọn nhanh tài khoản mẫu (Demo)"}</span>
              </button>
            </div>
          )}

          {showQuickModal && (
            <div className="mt-3 p-3.5 bg-slate-900/95 border border-slate-700/80 rounded-2xl space-y-2 max-h-52 overflow-y-auto">
              <p className="text-xs uppercase font-bold text-slate-400 tracking-wider px-1">Tài khoản có sẵn (Pass: 123)</p>
              <div className="grid grid-cols-1 gap-2">
                {quickAccounts.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-indigo-600/30 border border-slate-700/50 hover:border-indigo-500/50 transition flex items-center justify-between group text-xs"
                  >
                    <div>
                      <p className="font-bold text-sm text-white group-hover:text-indigo-200">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700 text-slate-300">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Support Info Footer */}
          <div className="mt-7 text-center">
            <p className="text-xs text-slate-400">
              Cần hỗ trợ? Liên hệ <strong className="text-slate-200 font-mono">techsupport@jprotech.vn</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

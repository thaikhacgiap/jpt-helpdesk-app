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
  HelpCircle,
  CheckCircle2,
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
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />

      {/* ================= LEFT COLUMN: HERO SHOWCASE ================= */}
      <div className="lg:w-[42%] w-full flex flex-col justify-between p-8 lg:p-14 relative z-10 bg-gradient-to-b from-blue-950/40 via-[#0a1128]/60 to-[#060913]/90 border-r border-slate-800/40 backdrop-blur-xs">
        
        {/* Top: JPT Brand Logo */}
        <div>
          <div className="mb-10">
            <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg backdrop-blur-md">
              <div className="w-10 h-7 rounded-lg border border-blue-400/80 flex items-center justify-center bg-gradient-to-br from-blue-950 to-indigo-950">
                <span className="text-[13px] font-black tracking-tighter text-blue-300 font-mono">JPT</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white tracking-wide uppercase leading-none">J-PROTECH</span>
                <span className="text-[9px] text-slate-400 font-medium tracking-tight mt-0.5">Japan Replacement Technology</span>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3 mb-6">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              JPT Helpdesk
            </h1>
            <h2 className="text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent tracking-tight">
              Portal & Management
            </h2>
            <p className="text-xs lg:text-sm text-slate-300/80 leading-relaxed max-w-md pt-2">
              Hệ thống quản lý dịch vụ bảo trì định kỳ, hỗ trợ kỹ thuật helpdesk và phân phối các dự án triển khai cho khách hàng doanh nghiệp JPT.
            </p>
          </div>

          {/* 3 Features Cards */}
          <div className="space-y-3.5 max-w-md pt-4">
            
            {/* Card 1: Bảo mật */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition duration-200 flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-sm group-hover:scale-105 transition">
                <Shield size={19} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Bảo mật tuyệt đối</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Thông tin của bạn được mã hóa và bảo vệ an toàn</p>
              </div>
            </div>

            {/* Card 2: Hỗ trợ nhanh */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition duration-200 flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-sm group-hover:scale-105 transition">
                <Headphones size={19} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Hỗ trợ nhanh chóng</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ 24/7</p>
              </div>
            </div>

            {/* Card 3: Quản lý hiệu quả */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition duration-200 flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 shadow-sm group-hover:scale-105 transition">
                <Clock size={19} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Quản lý hiệu quả</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Theo dõi và quản lý toàn bộ yêu cầu dễ dàng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck size={14} className="text-slate-500" />
          <span>© 2026 JPT Helpdesk. All rights reserved.</span>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: LOGIN FORM ================= */}
      <div className="lg:w-[58%] w-full flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative z-10">
        
        {/* Form Card Container */}
        <div className="w-full max-w-[440px] bg-[#0d1424]/85 border border-slate-700/50 rounded-3xl p-7 lg:p-9 shadow-2xl shadow-black/80 backdrop-blur-2xl relative animate-in fade-in zoom-in-95 duration-300">
          
          {/* Avatar Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-slate-800 to-indigo-950 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-950/50">
              <User size={24} />
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">Chào mừng trở lại!</h3>
            <p className="text-xs text-slate-400 mt-1">Vui lòng đăng nhập để tiếp tục</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Email</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#141d33] border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Mật khẩu</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#141d33] border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#141d33] border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition cursor-pointer"
                />
                <span className="text-[11px] font-medium">Ghi nhớ đăng nhập</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Vui lòng liên hệ quản trị viên IT qua techsupport@jprotech.vn để đặt lại mật khẩu.");
                }}
                className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 hover:underline transition"
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/35 hover:shadow-indigo-500/50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang xử lý đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick Account Test Modal / Dropdown */}
          {quickAccounts.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-center">
              <button
                type="button"
                onClick={() => setShowQuickModal(!showQuickModal)}
                className="text-[11px] font-semibold text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-800/50 transition"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span>{showQuickModal ? "Ẩn danh sách tài khoản mẫu" : "Chọn nhanh tài khoản mẫu (Demo)"}</span>
              </button>
            </div>
          )}

          {showQuickModal && (
            <div className="mt-3 p-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl space-y-2 max-h-48 overflow-y-auto">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">Tài khoản có sẵn (Pass: 123)</p>
              <div className="grid grid-cols-1 gap-1.5">
                {quickAccounts.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="w-full text-left p-2 rounded-xl bg-slate-800/60 hover:bg-indigo-600/30 border border-slate-700/50 hover:border-indigo-500/50 transition flex items-center justify-between group text-xs"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-indigo-200">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Support Info Footer */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-slate-500">
              Cần hỗ trợ? Liên hệ <strong className="text-slate-300 font-mono">techsupport@jprotech.vn</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

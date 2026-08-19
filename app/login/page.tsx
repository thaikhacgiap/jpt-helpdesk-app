"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, fetchUsers, SystemUser } from "@/lib/auth-operations";
import {
  Shield,
  Headphones,
  Clock,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
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
    <>
      {/* Embedded CSS Style matching exactly the provided template */}
      <style jsx global>{`
        :root {
          --bg-0: #0A0F2C;
          --bg-1: #171B4D;
          --bg-2: #2B1E6B;
          --blue: #3E7BFF;
          --violet: #9358FF;
          --cyan: #2DD9F0;
          --ink: #F7F9FF;
          --ink-soft: #B9C3EC;
          --ink-faint: #7C86B8;
          --card: rgba(18, 22, 54, 0.62);
          --card-border: rgba(255, 255, 255, 0.14);
          --field: rgba(255, 255, 255, 0.06);
          --field-border: rgba(255, 255, 255, 0.16);
        }

        .login-stage {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 30fr 70fr;
          position: relative;
          overflow: hidden;
          background: var(--bg-0);
          color: var(--ink);
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ---------- LEFT PANEL ---------- */
        .login-left {
          position: relative;
          padding: 48px 36px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background:
            radial-gradient(120% 90% at 12% -10%, rgba(62, 123, 255, 0.55), transparent 55%),
            radial-gradient(90% 70% at 100% 15%, rgba(147, 88, 255, 0.5), transparent 55%),
            radial-gradient(80% 60% at 20% 110%, rgba(45, 217, 240, 0.28), transparent 55%),
            linear-gradient(160deg, var(--bg-0) 0%, var(--bg-1) 45%, var(--bg-2) 100%);
          overflow: hidden;
        }
        .login-left::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.10) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: radial-gradient(circle at 30% 20%, black, transparent 70%);
          opacity: 0.5;
          pointer-events: none;
        }

        .login-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.55;
          pointer-events: none;
          animation: loginDrift 14s ease-in-out infinite alternate;
        }
        .login-blob1 {
          width: 340px;
          height: 340px;
          background: var(--blue);
          top: -80px;
          right: -60px;
        }
        .login-blob2 {
          width: 280px;
          height: 280px;
          background: var(--violet);
          bottom: 60px;
          left: -80px;
          animation-delay: 2s;
        }
        .login-blob3 {
          width: 220px;
          height: 220px;
          background: var(--cyan);
          bottom: -60px;
          right: 10%;
          animation-delay: 4s;
          opacity: 0.35;
        }
        @keyframes loginDrift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(18px, -16px) scale(1.08); }
        }

        .login-brand-block {
          position: relative;
          z-index: 2;
        }

        .login-logo-hero {
          position: relative;
          display: inline-block;
          margin-bottom: 30px;
          padding: 20px 22px;
        }
        .login-logo-hero::before {
          content: "";
          position: absolute;
          inset: -10px;
          border-radius: 26px;
          background: radial-gradient(60% 90% at 30% 20%, rgba(62, 123, 255, 0.45), transparent 70%),
                     radial-gradient(60% 90% at 80% 80%, rgba(147, 88, 255, 0.4), transparent 70%);
          filter: blur(18px);
          opacity: 0.9;
          z-index: -1;
        }
        .login-logo-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 20px 50px rgba(10, 15, 44, 0.5);
          z-index: -1;
        }
        .login-logo-hero img {
          display: block;
          height: 46px;
          width: auto;
          max-width: 100%;
          filter: drop-shadow(0 0 26px rgba(120, 160, 255, 0.55));
        }

        h1.login-headline {
          font-family: 'Plus Jakarta Sans', sans-serif, system-ui;
          font-weight: 800;
          font-size: 30px;
          line-height: 1.18;
          margin-bottom: 6px;
          color: var(--ink);
        }
        h1.login-headline .login-grad {
          background: linear-gradient(95deg, var(--cyan) 0%, var(--blue) 45%, var(--violet) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          display: block;
        }
        .login-lede {
          max-width: 100%;
          color: var(--ink-soft);
          font-size: 13.5px;
          line-height: 1.65;
          margin-top: 14px;
          margin-bottom: 30px;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 2;
        }
        .login-feature {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 11px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.045);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: background 0.2s ease;
        }
        .login-feature:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .login-f-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .login-f-icon svg {
          width: 17px;
          height: 17px;
        }
        .login-f1 {
          background: linear-gradient(140deg, var(--blue), #5A9BFF);
          box-shadow: 0 8px 18px rgba(62, 123, 255, 0.35);
        }
        .login-f2 {
          background: linear-gradient(140deg, var(--violet), #B98BFF);
          box-shadow: 0 8px 18px rgba(147, 88, 255, 0.35);
        }
        .login-f3 {
          background: linear-gradient(140deg, var(--cyan), #7BE8FA);
          box-shadow: 0 8px 18px rgba(45, 217, 240, 0.35);
        }
        .login-f-title {
          font-weight: 700;
          font-size: 13.5px;
          color: var(--ink);
          margin-bottom: 2px;
        }
        .login-f-desc {
          font-size: 11.5px;
          line-height: 1.4;
          color: var(--ink-faint);
        }

        .login-left-footer {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--ink-faint);
          font-size: 12px;
          margin-top: 30px;
        }
        .login-left-footer svg {
          width: 14px;
          height: 14px;
          color: var(--cyan);
        }

        /* ---------- RIGHT PANEL ---------- */
        .login-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: radial-gradient(120% 100% at 50% 0%, #10143A 0%, var(--bg-0) 60%);
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background: var(--card);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid var(--card-border);
          border-radius: 24px;
          padding: 44px 40px 36px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.02);
        }
        .login-avatar {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(140deg, rgba(62, 123, 255, 0.25), rgba(147, 88, 255, 0.25));
          border: 1.5px solid rgba(122, 158, 255, 0.55);
          box-shadow: 0 0 0 8px rgba(62, 123, 255, 0.08);
        }
        .login-avatar svg {
          width: 28px;
          height: 28px;
          color: #8FB2FF;
        }

        .login-card h2 {
          font-family: 'Plus Jakarta Sans', sans-serif, system-ui;
          text-align: center;
          font-size: 23px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .login-card .login-sub {
          text-align: center;
          color: var(--ink-faint);
          font-size: 13.5px;
          margin-bottom: 30px;
        }

        .login-field {
          margin-bottom: 18px;
        }
        .login-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink-soft);
          margin-bottom: 8px;
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-wrap .login-input-icon {
          position: absolute;
          left: 14px;
          width: 17px;
          height: 17px;
          color: var(--ink-faint);
          pointer-events: none;
        }
        .login-input-wrap input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border-radius: 12px;
          border: 1px solid var(--field-border);
          background: var(--field);
          color: var(--ink);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .login-input-wrap input::placeholder {
          color: var(--ink-faint);
        }
        .login-input-wrap input:focus {
          border-color: var(--blue);
          background: rgba(62, 123, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(62, 123, 255, 0.18);
        }
        .login-toggle-eye {
          position: absolute;
          right: 14px;
          width: 17px;
          height: 17px;
          color: var(--ink-faint);
          cursor: pointer;
        }
        .login-toggle-eye:hover {
          color: var(--ink);
        }

        .login-row-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 20px 0 26px;
          font-size: 13px;
        }
        .login-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink-soft);
          cursor: pointer;
        }
        .login-remember input {
          width: 16px;
          height: 16px;
          accent-color: var(--blue);
          cursor: pointer;
        }
        .login-forgot {
          color: var(--cyan);
          text-decoration: none;
          font-weight: 600;
          transition: underline 0.15s;
        }
        .login-forgot:hover {
          text-decoration: underline;
        }

        .login-btn-login {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(95deg, var(--blue), var(--violet) 65%, var(--cyan));
          background-size: 160% 100%;
          background-position: 0% 0%;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif, system-ui;
          font-weight: 700;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 14px 30px rgba(62, 123, 255, 0.4);
          transition: background-position 0.35s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .login-btn-login:hover:not(:disabled) {
          background-position: 100% 0%;
          transform: translateY(-1px);
          box-shadow: 0 18px 36px rgba(147, 88, 255, 0.45);
        }
        .login-btn-login svg {
          width: 16px;
          height: 16px;
          transition: transform 0.15s ease;
        }
        .login-btn-login:hover:not(:disabled) svg {
          transform: translateX(3px);
        }
        .login-btn-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-card-footer {
          text-align: center;
          margin-top: 26px;
          font-size: 12px;
          color: var(--ink-faint);
        }

        @media (max-width: 1100px) {
          .login-stage {
            grid-template-columns: 1fr;
          }
          .login-left {
            padding: 44px 28px;
          }
          .login-features {
            display: none;
          }
          h1.login-headline {
            font-size: 32px;
          }
          .login-right {
            padding: 28px;
          }
        }
      `}</style>

      <div className="login-stage">
        {/* LEFT PANEL */}
        <div className="login-left">
          <div className="login-blob login-blob1"></div>
          <div className="login-blob login-blob2"></div>
          <div className="login-blob login-blob3"></div>

          <div className="login-brand-block">
            <div className="login-logo-hero">
              <img src="/jpt-logo.png" alt="JPT - Japan Replacement Technology" />
            </div>

            <h1 className="login-headline">
              JPT Helpdesk
              <span className="login-grad">Portal &amp; Management</span>
            </h1>
            <p className="login-lede">
              Hệ thống quản lý dịch vụ bảo trì định kỳ, hỗ trợ kỹ thuật helpdesk và phân phối các dự án triển khai cho khách hàng doanh nghiệp JPT.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-f-icon login-f1">
                  <Shield size={17} />
                </div>
                <div>
                  <div className="login-f-title">Bảo mật tuyệt đối</div>
                  <div className="login-f-desc">Thông tin của bạn được mã hóa và bảo vệ an toàn</div>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-f-icon login-f2">
                  <Headphones size={17} />
                </div>
                <div>
                  <div className="login-f-title">Hỗ trợ nhanh chóng</div>
                  <div className="login-f-desc">Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ 24/7</div>
                </div>
              </div>

              <div className="login-feature">
                <div className="login-f-icon login-f3">
                  <Clock size={17} />
                </div>
                <div>
                  <div className="login-f-title">Quản lý hiệu quả</div>
                  <div className="login-f-desc">Theo dõi và quản lý toàn bộ yêu cầu dễ dàng</div>
                </div>
              </div>
            </div>
          </div>

          <div className="login-left-footer">
            <Shield size={14} />
            © 2024 JPT Helpdesk. All rights reserved.
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-avatar">
              <User size={28} />
            </div>
            <h2>Chào mừng trở lại!</h2>
            <p className="login-sub">Vui lòng đăng nhập để tiếp tục</p>

            {/* Error Message */}
            {error && (
              <div style={{
                marginBottom: '18px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', flexShrink: 0 }}></span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="login-field">
                <label>Email</label>
                <div className="login-input-wrap">
                  <Mail className="login-input-icon" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                  />
                </div>
              </div>

              <div className="login-field">
                <label>Mật khẩu</label>
                <div className="login-input-wrap">
                  <Lock className="login-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-toggle-eye"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </div>
                </div>
              </div>

              <div className="login-row-between">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Vui lòng liên hệ quản trị viên qua techsupport@jprotech.vn để đặt lại mật khẩu.");
                  }}
                  className="login-forgot"
                >
                  Quên mật khẩu?
                </a>
              </div>

              <button type="submit" disabled={loading} className="login-btn-login">
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang xử lý đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Account Test Selector (Demo) */}
            {quickAccounts.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowQuickModal(!showQuickModal)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ink-faint)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sparkles size={14} style={{ color: '#FBBF24' }} />
                  <span>{showQuickModal ? "Ẩn danh sách tài khoản mẫu" : "Chọn nhanh tài khoản mẫu (Demo)"}</span>
                </button>
              </div>
            )}

            {showQuickModal && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(10, 15, 44, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                maxHeight: '190px',
                overflowY: 'auto'
              }}>
                <p style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-soft)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  Tài khoản có sẵn (Pass: 123)
                </p>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {quickAccounts.slice(0, 6).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        color: 'var(--ink)'
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>{u.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--ink-faint)', margin: 0 }}>{u.email}</p>
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'rgba(62, 123, 255, 0.2)', color: '#8FB2FF' }}>
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="login-card-footer">
              Cần hỗ trợ? Liên hệ <strong style={{ color: '#8FB2FF' }}>techsupport@jprotech.vn</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

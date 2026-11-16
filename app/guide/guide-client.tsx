"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import {
  Download,
  Printer,
  Search,
  BookOpen,
  FileText,
  Shield,
  Layers,
  Wrench,
  FolderOpen,
  HelpCircle,
  ExternalLink,
  Users,
  Copy,
  Check,
  Server
} from "lucide-react";

const CHAPTERS = [
  { id: "all", label: "Tất cả" },
  { id: "ch1", label: "1. Tổng quan & Đối tượng" },
  { id: "ch2", label: "2. Đăng nhập & Quản lý User" },
  { id: "ch3", label: "3. Phân hệ Dịch vụ & Yêu cầu" },
  { id: "ch4", label: "4. Dự án & Sub-Plans (Gantt)" },
  { id: "ch5", label: "5. Master Data & Google Sheets" },
  { id: "ch6", label: "6. Cổng Khách hàng (Portal)" },
  { id: "ch7", label: "7. Quản trị & Lưu trữ Drive" },
  { id: "ch8", label: "8. Quy trình SOP & FAQ" }
];

export default function GuideClient() {
  const [activeChapter, setActiveChapter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* HEADER */}
        <Header
          title="Tài Liệu Hướng Dẫn Sử Dụng"
          description="Sổ tay hướng dẫn vận hành hệ thống JPT Helpdesk & Project Management Portal v4.0"
        />

        {/* TOP ACTION & DOWNLOAD BANNER */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-6 md:p-8 rounded-2xl border border-teal-500/30 shadow-xl relative overflow-hidden text-white">
          <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-bold border border-teal-500/30">
                <BookOpen size={14} />
                <span>TÀI LIỆU CHÍNH THỨC V4.0</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Tài Liệu Hướng Dẫn Vận Hành Hệ Thống
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Bao gồm hướng dẫn chi tiết quy trình tiếp nhận vé sự cố, kiểm soát cam kết SLA, phân rã công việc dự án và sơ đồ Gantt 3 cột, lịch trình bảo trì định kỳ và Cổng thông tin khách hàng.
              </p>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
              <a
                href="/HUONG_DAN_SU_DUNG_PHAN_MEM_JPT_HELPDESK.pdf"
                download="HUONG_DAN_SU_DUNG_PHAN_MEM_JPT_HELPDESK.pdf"
                className="px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
              >
                <Download size={18} />
                <span>Tải File PDF (~292 KB)</span>
              </a>

              <a
                href="/HUONG_DAN_SU_DUNG_PHAN_MEM.html"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-semibold rounded-xl border border-white/10 flex items-center justify-center gap-2 transition text-sm cursor-pointer"
              >
                <Printer size={16} />
                <span>Mở Bản In A4</span>
                <ExternalLink size={14} className="opacity-70" />
              </a>
            </div>
          </div>
        </div>

        {/* SEARCH & CHAPTER TABS */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {CHAPTERS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChapter(ch.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeChapter === ch.id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            />
          </div>
        </div>

        {/* CONTENT SECTIONS */}
        <div className="space-y-6">
          {/* SECTION 1: TỔNG QUAN & ĐỐI TƯỢNG SỬ DỤNG */}
          {(activeChapter === "all" || activeChapter === "ch1") && matchesSearch("tổng quan đối tượng triển khai hỗ trợ kỹ thuật xử lý sự cố bảo trì ban giám đốc kinh doanh") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="text-teal-600" size={18} />
                  <span>1. Tổng quan Phần mềm &amp; Đối tượng Sử dụng</span>
                </h3>
                <span className="text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 font-bold">Phiên bản v4.0</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* MÔ TẢ PHẦN MỀM */}
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                  <div className="font-extrabold text-teal-950 text-sm flex items-center gap-2">
                    <BookOpen size={16} className="text-teal-600" />
                    <span>Mô tả mục đích phần mềm:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Phần mềm sử dụng để <strong>Quản lý toàn diện các dịch vụ của JPT</strong> bao gồm:
                  </p>
                  <ul className="space-y-1.5 text-slate-700 pl-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span><strong>Triển khai dự án:</strong> Điều hành dự án công nghệ, kế hoạch phân cấp (Main Plan, M-Plan, S-Plan...), biểu đồ Gantt thời gian thực và quản lý phạm vi SOW.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span><strong>Hỗ trợ kỹ thuật:</strong> Tiếp nhận tư vấn, giải đáp cấu hình thiết bị, hệ điều hành, cơ sở dữ liệu và chuyển giao công nghệ.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span><strong>Hỗ trợ xử lý sự cố:</strong> Chuẩn hóa tiếp nhận và giải quyết sự cố theo chuẩn quốc tế ITIL, phân cấp ưu tiên L1 - L4 và giám sát cam kết SLA.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span><strong>Bảo trì định kỳ:</strong> Lập kế hoạch và giám sát các đợt bảo dưỡng thiết bị máy chủ, sao lưu dữ liệu và kiểm tra an toàn theo chu kỳ hợp đồng.</span>
                    </li>
                  </ul>
                </div>

                {/* ĐỐI TƯỢNG SỬ DỤNG */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                  <div className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                    <Users size={16} className="text-indigo-600" />
                    <span>Đối tượng sử dụng hệ thống:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Được thiết kế chuyên biệt dành cho <strong>Ban Giám Đốc, Đội ngũ Kỹ thuật, Kinh doanh</strong> và <strong>tất cả các bộ phận tham gia vào quá trình cung cấp dịch vụ cho khách hàng</strong>:
                  </p>
                  <ul className="space-y-1.5 text-slate-700 pl-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Ban Giám Đốc:</strong> Giám sát Dashboard tổng quan, tỷ lệ SLA, tình trạng phân bổ nhân sự và tiến độ triển khai chung.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Đội ngũ Kỹ thuật (Technical / Engineers):</strong> Tiếp nhận yêu cầu, xử lý ticket, bấm giờ tạm dừng On Hold bảo vệ SLA, upload file báo cáo kỹ thuật.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Kinh doanh (Sales / AM):</strong> Theo dõi thông tin khách hàng, cơ hội kinh doanh, danh mục hợp đồng và cảnh báo tái tục.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Các bộ phận liên quan:</strong> Điều phối viên dịch vụ (Dispatch Team), Quản lý Dự án (PM), Nhân sự (HR), Quản trị viên (Admin) và Đại diện Khách hàng qua Portal.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: ĐĂNG NHẬP, CẤP TÀI KHOẢN QUA HR & QUẢN LÝ USER */}
          {(activeChapter === "all" || activeChapter === "ch2") && matchesSearch("đăng nhập mật khẩu nhân sự hr admin đổi mật khẩu tài khoản user information quyền") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="text-teal-600" size={18} />
                  <span>2. Hướng dẫn Đăng nhập, Quy trình Cấp Tài khoản qua Nhân sự &amp; Quản lý Thông tin Cá nhân</span>
                </h3>
              </div>

              {/* ĐĂNG NHẬP & QUY TRÌNH HR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">Link đăng nhập vào phần mềm:</div>
                  <div className="font-mono bg-white p-2.5 rounded-lg border border-slate-200 text-teal-700 flex items-center justify-between">
                    <span>https://jpt-helpdesk-app.vercel.app/login</span>
                    <button
                      onClick={() => handleCopy("https://jpt-helpdesk-app.vercel.app/login", "u-login-url")}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy Link"
                    >
                      {copiedKey === "u-login-url" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-slate-600">
                    Người dùng truy cập link trên, nhập <strong>Email (hoặc Tên đăng nhập)</strong> và <strong>Mật khẩu</strong> để truy cập. Hệ thống tự động chuyển hướng theo phân quyền vai trò.
                  </p>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-950 text-sm">Quy trình yêu cầu cấp tài khoản (Account Request):</div>
                  <p className="text-slate-700 leading-relaxed">
                    Để đảm bảo an toàn thông tin và tính bảo mật, quy trình cấp phát tài khoản được thực hiện như sau:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                    <li>Nhân sự mới / nhân viên gửi yêu cầu cấp tài khoản <strong>thông qua Bộ phận Nhân sự (HR) cấp phép</strong>.</li>
                    <li>Sau khi kiểm tra và phê duyệt, Bộ phận Nhân sự sẽ gửi phiếu yêu cầu tới <strong>Quản trị viên (Admin)</strong>.</li>
                    <li>Admin tạo tài khoản trên hệ thống, phân quyền vai trò phù hợp và bàn giao tài khoản an toàn cho nhân sự.</li>
                  </ol>
                </div>
              </div>

              {/* QUẢN LÝ THÔNG TIN CÁ NHÂN SAU KHI ĐĂNG NHẬP */}
              <div className="p-4 bg-teal-50/30 rounded-xl border border-teal-200 space-y-3 text-xs">
                <div className="font-extrabold text-teal-950 text-sm">Quản lý thông tin cá nhân sau khi đăng nhập:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-teal-100 space-y-1">
                    <div className="font-bold text-teal-900">1. Nơi xem thông tin cá nhân</div>
                    <p className="text-slate-600 text-[11px]">
                      Nhấp vào <strong>nút User ở góc dưới cùng Sidebar bên trái</strong> &rarr; Chọn <strong>"Thông tin cá nhân"</strong> để mở hộp thoại quản lý.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-teal-100 space-y-1">
                    <div className="font-bold text-teal-900">2. Cập nhật thông tin cá nhân</div>
                    <p className="text-slate-600 text-[11px]">
                      Tại tab <em>Hồ sơ cá nhân</em>: Có thể xem &amp; cập nhật <strong>Họ tên hiển thị</strong>, <strong>Số điện thoại</strong>, <strong>Phòng ban</strong> rồi bấm Lưu.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-teal-100 space-y-1">
                    <div className="font-bold text-teal-900">3. Cách đổi mật khẩu (Password)</div>
                    <p className="text-slate-600 text-[11px]">
                      Chuyển sang tab <em>Đổi mật khẩu</em>: Nhập mật khẩu hiện tại, nhập mật khẩu mới (tối thiểu 6 ký tự), xác nhận và bấm <strong>Cập nhật mật khẩu</strong>.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-teal-100 space-y-1">
                    <div className="font-bold text-teal-900">4. Xem phân quyền &amp; phân hệ</div>
                    <p className="text-slate-600 text-[11px]">
                      Tại tab <em>Quyền hạn &amp; Phân hệ</em>: Kiểm tra vai trò của mình, các phân hệ được phép truy cập và danh mục quyền thao tác chi tiết.
                    </p>
                  </div>
                </div>
              </div>

              {/* TÀI KHOẢN MẪU */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Danh sách Tài khoản mẫu truy cập kiểm thử:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Admin */}
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-red-100 text-red-700">ADMIN</span>
                      <span className="text-xs text-slate-500">Ban Giám Đốc</span>
                    </div>
                    <div className="text-xs font-mono bg-white p-2 rounded border border-red-100 text-slate-800 flex items-center justify-between">
                      <span>admin@jpt.vn</span>
                      <button
                        onClick={() => handleCopy("admin@jpt.vn", "u-admin")}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy email"
                      >
                        {copiedKey === "u-admin" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">Mật khẩu: <code className="font-bold text-slate-700">123</code></div>
                    <p className="text-[11px] text-slate-600">Toàn quyền hệ thống: Dashboard, Users, Phân quyền, Google Drive OAuth, Sao lưu.</p>
                  </div>

                  {/* PM */}
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-indigo-100 text-indigo-700">PM</span>
                      <span className="text-xs text-slate-500">Quản lý Dự án</span>
                    </div>
                    <div className="text-xs font-mono bg-white p-2 rounded border border-indigo-100 text-slate-800 flex items-center justify-between">
                      <span>pm@jpt.vn</span>
                      <button
                        onClick={() => handleCopy("pm@jpt.vn", "u-pm")}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy email"
                      >
                        {copiedKey === "u-pm" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">Mật khẩu: <code className="font-bold text-slate-700">123</code></div>
                    <p className="text-[11px] text-slate-600">Điều hành Dự án (Kế hoạch Sub-Plans M/S-Plan, Gantt, SOW), Hợp đồng, Yêu cầu.</p>
                  </div>

                  {/* Technical */}
                  <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-teal-100 text-teal-800">TECHNICAL</span>
                      <span className="text-xs text-slate-500">Kỹ thuật viên</span>
                    </div>
                    <div className="text-xs font-mono bg-white p-2 rounded border border-teal-100 text-slate-800 flex items-center justify-between">
                      <span>technical@jpt.vn</span>
                      <button
                        onClick={() => handleCopy("technical@jpt.vn", "u-tech")}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy email"
                      >
                        {copiedKey === "u-tech" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">Mật khẩu: <code className="font-bold text-slate-700">123</code></div>
                    <p className="text-[11px] text-slate-600">Tiếp nhận Ticket, Bấm giờ On Hold bảo vệ SLA, upload file báo cáo kỹ thuật, Bảo trì.</p>
                  </div>

                  {/* Customer */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-100 text-amber-800">CUSTOMER</span>
                      <span className="text-xs text-slate-500">Khách hàng</span>
                    </div>
                    <div className="text-xs font-mono bg-white p-2 rounded border border-amber-100 text-slate-800 flex items-center justify-between">
                      <span>customer@vpbank.vn</span>
                      <button
                        onClick={() => handleCopy("customer@vpbank.vn", "u-cust")}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copy email"
                      >
                        {copiedKey === "u-cust" ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-500">Mật khẩu: <code className="font-bold text-slate-700">123</code></div>
                    <p className="text-[11px] text-slate-600">Cổng tiếp nhận riêng (<code>/portal</code>): Gửi yêu cầu dịch vụ, tra cứu tiến độ dự án.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: PHÂN HỆ DỊCH VỤ - YÊU CẦU & QUY TRÌNH TICKET ITIL */}
          {(activeChapter === "all" || activeChapter === "ch3") && matchesSearch("yêu cầu requests customer service task 3 khung warning ticket itil sla") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Wrench className="text-teal-600" size={18} />
                  <span>3. Phân hệ Dịch Vụ - Quản lý Yêu Cầu (Requests - 3 Khung) &amp; Ticket Chuẩn ITIL</span>
                </h3>
              </div>

              {/* 3 KHUNG CHÍNH CỦA YÊU CẦU */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs">Giao diện Yêu Cầu (Requests) gồm 3 Khung chính:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-xl space-y-1.5">
                    <div className="font-extrabold text-red-900 flex items-center justify-between">
                      <span>Khung 1: Yêu cầu mới</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-200 text-red-800 font-bold animate-pulse">Warning!</span>
                    </div>
                    <p className="text-red-950 text-[11px] leading-relaxed">
                      Dành cho các yêu cầu mới gửi tới chờ tiếp nhận. Khi có yêu cầu mới xuất hiện, hệ thống <strong>phát cảnh báo warning (viền nhấp nháy đỏ, âm thanh chuông cảnh báo và huy hiệu đếm ngược)</strong> để điều phối viên phản ứng ngay.
                    </p>
                  </div>

                  <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1.5">
                    <div className="font-extrabold text-sky-900">Khung 2: Đã tiếp nhận &amp; Đang xử lý</div>
                    <p className="text-sky-950 text-[11px] leading-relaxed">
                      Nằm ở khung bên trái giao diện làm việc. Dành cho những yêu cầu đã được tiếp nhận, đã gán nhân sự phụ trách và đang trong quá trình điều tra, xử lý kỹ thuật hoặc tạm dừng (On Hold).
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="font-extrabold text-emerald-900">Khung 3: Đã xử lý xong</div>
                    <p className="text-emerald-950 text-[11px] leading-relaxed">
                      Nằm ở khung bên phải giao diện làm việc. Dành cho những yêu cầu đã được xử lý xong, hoàn tất giải quyết, hoặc đã được chuyển tiếp thành công sang Ticket chuyên sâu / đóng phiếu hoàn tất.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 LOẠI YÊU CẦU */}
              <div className="space-y-2 pt-2">
                <div className="font-bold text-slate-900 text-xs">3 Loại Yêu Cầu trong hệ thống:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">1. Customer request</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Dùng để quản lý các yêu cầu dịch vụ từ khách hàng. Khách hàng sẽ tạo yêu cầu thông qua <strong>Web Portal</strong> hoặc <strong>Đội điều phối sẽ tạo giúp yêu cầu</strong> nếu khách hàng cần hỗ trợ thông qua Hotline / Email.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">2. Service request</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Dùng để quản lý các yêu cầu cung cấp dịch vụ chuyên môn, ví dụ như: Yêu cầu triển khai dự án mới, yêu cầu thực hiện bảo trì định kỳ, yêu cầu thực hiện hỗ trợ ngoài hợp đồng (Out-of-scope).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">3. Task request</div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Dùng để tạo các yêu cầu thực hiện công việc trực tiếp cho từng cá nhân (phân công nhiệm vụ kỹ thuật cụ thể, công việc nội bộ chỉ định cho từng kỹ sư phụ trách).
                    </p>
                  </div>
                </div>
              </div>

              {/* TICKET ITIL 5 BƯỚC */}
              <div className="space-y-2 pt-2">
                <div className="font-bold text-slate-900 text-xs">Quy trình Xử lý Ticket Chuẩn ITIL 5 Bước &amp; Tải Báo cáo Google Drive:</div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>Tạo Ticket</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">Chọn khách hàng, mã KH viết tắt, mức ưu tiên L1 - L4, nhập mô tả.</p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>Check Hợp đồng</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">Xác định phạm vi: <code>In scope</code>, <code>Out scope</code> hoặc <code>Presale</code>.</p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">3</span>
                      <span>Điều phối</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">Gán Kỹ sư phụ trách chính (Assigned) và Người theo dõi (Following).</p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1 text-xs">
                    <div className="font-bold text-teal-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px]">4</span>
                      <span>Troubleshooting</span>
                    </div>
                    <p className="text-teal-800 text-[11px]">Bấm giờ xử lý SLA. Có nút <strong>On Hold</strong> để dừng đồng hồ SLA khi chờ khách.</p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1 text-xs">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">5</span>
                      <span>Đóng &amp; Báo cáo</span>
                    </div>
                    <p className="text-emerald-800 text-[11px]">Upload file báo cáo sự cố qua Google Drive, gửi duyệt và nghiệm thu.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DỰ ÁN V4.0 & SUB-PLANS */}
          {(activeChapter === "all" || activeChapter === "ch4") && matchesSearch("dự án project gantt kế hoạch plan sow milestone tiến độ phase sub-plan m-plan s-plan") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FolderOpen className="text-teal-600" size={18} />
                  <span>4. Phân hệ Quản lý Dự án &amp; Kế hoạch Sub-Plans (M-Plan, S-Plan, Gantt)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">Tạo Sub-Plan &amp; Bảng Kế hoạch (Plan) Đa cấp:</div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                    <li><strong>Tạo Sub-Plan (M-Plan, S-Plan):</strong> Bấm nút <code>++ Sub-Plan</code> để tạo thêm các tab kế hoạch phân cấp song song bên cạnh Main-Plan.</li>
                    <li><strong>Đổi tên các Plan linh hoạt:</strong> Nhấp vào biểu tượng chỉnh sửa cạnh tên Plan để đổi tên (M-Plan, S-Plan, Kế hoạch hạ tầng...) và xóa khi cần.</li>
                    <li><strong>Bảng công việc gọn gàng:</strong> Gộp chung toàn bộ nút thao tác (Thêm task, Di chuyển, Nhập/Xuất, Khóa bảng) trên 1 dòng duy nhất.</li>
                    <li><strong>% Hoàn thành Phase:</strong> Tự động tính toán từ các task con theo trọng số.</li>
                    <li><strong>Đa nhân sự &amp; Sắp xếp:</strong> Chọn nhiều kỹ sư tag màu, kéo thả hoặc gõ số dòng để đổi vị trí task nhanh.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">Biểu đồ Gantt 3 Cột &amp; Tổng quan Tùy biến:</div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                    <li><strong>Tổng quan (Overview) không default:</strong> Chỉnh sửa linh hoạt Quản lý dự án (PM), Khách hàng, Hợp đồng và Bảng phạm vi SOW theo thực tế từng dự án.</li>
                    <li><strong>Biểu đồ Gantt 3 cột đồng bộ:</strong> Tự động chuyển đổi hiển thị theo tab Plan đang mở (Main Plan hoặc Sub-Plans).</li>
                    <li>Cột 1: Tên công việc (phân cấp rõ ràng) | Cột 2: Tiến độ % và thanh Bar 2 màu | Cột 3: Lưới Lịch Ngày/Tháng.</li>
                    <li>Tự động highlight cột <strong>Hôm nay (Today)</strong> để theo dõi sát sao công việc đến hạn.</li>
                    <li>Quản lý mốc nghiệm thu (Milestones), tài liệu dự án và nhật ký công việc (Diary).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: MASTER DATA */}
          {(activeChapter === "all" || activeChapter === "ch5") && matchesSearch("khách hàng hợp đồng cơ hội liên hệ nhân sự google sheets đồng bộ") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="text-teal-600" size={18} />
                  <span>5. Quản lý Master Data &amp; Tự động Đồng bộ Google Sheets</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Khách hàng &amp; Hợp đồng</div>
                  <p className="text-slate-600">Quản lý mã khách hàng, đầu mối TTKD, kỹ sư phụ trách. Cảnh báo tự động hợp đồng sắp hết hạn trong 30 ngày.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Cơ hội &amp; Liên hệ &amp; Nhân sự</div>
                  <p className="text-slate-600">Theo dõi phễu bán hàng (Pipeline), danh bạ cán bộ khách hàng và hồ sơ kỹ sư công ty JPT.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Đồng bộ 2 chiều Google Sheets</div>
                  <p className="text-slate-600">Tự động đồng bộ mỗi 15 phút hoặc bấm nút <strong>Đồng bộ ngay</strong> để kéo dữ liệu mới nhất từ bảng tính Google Drive.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: CUSTOMER PORTAL */}
          {(activeChapter === "all" || activeChapter === "ch6") && matchesSearch("portal khách hàng customer tự phục vụ gửi ticket theo dõi gantt") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="text-teal-600" size={18} />
                  <span>6. Cổng Dịch vụ Khách hàng (Customer Portal - <code>/portal</code>)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Dành riêng cho đại diện các đối tác doanh nghiệp đăng nhập tự phục vụ:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl">
                  <div className="font-bold text-teal-900 mb-1">Tạo Yêu Cầu Nhanh</div>
                  <p className="text-teal-800">Bấm nút Tạo yêu cầu, đính kèm ảnh chụp màn hình lỗi và gửi thẳng tới đội ngũ trực ban kỹ thuật.</p>
                </div>
                <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl">
                  <div className="font-bold text-indigo-900 mb-1">Theo Dõi Tiến Độ Dự Án</div>
                  <p className="text-indigo-800">Xem trực quan Bảng kế hoạch và Biểu đồ Gantt các dự án đang triển khai cho đơn vị mình.</p>
                </div>
                <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <div className="font-bold text-amber-900 mb-1">Lịch Bảo Trì Định Kỳ</div>
                  <p className="text-amber-800">Nhận thông báo lịch bảo trì hệ thống và cảnh báo gián đoạn dịch vụ trước ngày diễn ra.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: QUẢN TRỊ HỆ THỐNG & GOOGLE DRIVE */}
          {(activeChapter === "all" || activeChapter === "ch7") && matchesSearch("hệ thống sao lưu backup restore phân quyền logs google drive oauth storage") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Server className="text-teal-600" size={18} />
                  <span>7. Quản trị Người dùng, Phân quyền &amp; Lưu trữ Google Drive Toàn hệ thống</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-700">
                <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl space-y-1">
                  <div className="font-bold text-teal-950 mb-1">Lưu trữ Google Drive Email Riêng</div>
                  <p className="text-slate-600">
                    Cấu hình OAuth 2.0 Client ID, Client Secret, Refresh Token và Folder ID. Tự động lưu mọi file báo cáo sự cố và tài liệu vào Google Drive công ty.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 mb-1">Quản lý Tài khoản (Users)</div>
                  <p className="text-slate-600">Tạo tài khoản, gán vai trò, khóa tài khoản tạm thời và đặt lại mật khẩu cho người dùng.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 mb-1">Phân quyền Nhóm (Settings)</div>
                  <p className="text-slate-600">Tích chọn các màn hình/đường dẫn phân hệ cho phép từng nhóm vai trò truy cập.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 mb-1">Sao lưu &amp; Nhật ký (Backup &amp; Logs)</div>
                  <p className="text-slate-600">Xuất file JSON sao lưu cơ sở dữ liệu Supabase, dọn dẹp bản ghi trùng và theo dõi audit logs.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: FAQ & QUY TRÌNH */}
          {(activeChapter === "all" || activeChapter === "ch8") && matchesSearch("faq hỏi đáp tình huống sự cố sop quy trình hr đổi mật khẩu") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="text-teal-600" size={18} />
                  <span>8. Các Tình Huống Thường Gặp &amp; Quy Trình Vận Hành Tiêu Chuẩn (FAQ)</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Q1: Làm thế nào để xin cấp tài khoản mới hoặc đổi mật khẩu cá nhân?</div>
                  <p className="text-slate-600 leading-relaxed">
                    Mọi yêu cầu tạo tài khoản mới đều phải thông qua <strong>Bộ phận Nhân sự (HR) cấp phép</strong>, sau đó Nhân sự yêu cầu Admin tạo account. Sau khi đăng nhập, bạn có thể tự cập nhật Họ tên, SĐT, Phòng ban và Đổi mật khẩu bất cứ lúc nào bằng cách bấm vào <strong>nút User ở góc dưới cùng Sidebar</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Q2: Làm sao để bảo vệ SLA khi khách hàng phản hồi chậm?</div>
                  <p className="text-slate-600">
                    Kỹ sư mở Ticket đó lên &rarr; Chuyển trạng thái sang <strong>On Hold</strong> &rarr; Chọn lý do <code>Chờ phản hồi từ khách hàng</code>. Hệ thống sẽ lập tức tạm dừng đồng hồ tính giờ SLA và lưu vết mốc thời gian.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Q3: Khi tạo Sub-Plan (M-Plan, S-Plan) có đổi tên được không?</div>
                  <p className="text-slate-600">
                    Có. Bạn có thể bấm nút <code>++ Sub-Plan</code> để tạo thêm tab kế hoạch song song, sau đó nhấp vào biểu tượng chỉnh sửa cạnh tên tab để đổi tên tùy ý hoặc xóa khi hoàn thành.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Q4: Tại sao Kỹ sư không nhìn thấy phân hệ Quản lý Người dùng &amp; Cấu hình hệ thống?</div>
                  <p className="text-slate-600">
                    Các phân hệ Quản lý người dùng, Phân quyền nhóm và Cấu hình sao lưu chỉ dành riêng cho Ban Giám Đốc (nhóm quyền <code>Admin</code>).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

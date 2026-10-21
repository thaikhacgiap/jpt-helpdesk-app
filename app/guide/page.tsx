"use client";

import { useState } from "react";
import Link from "next/link";
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
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Copy,
  Check,
  Server,
  ArrowRight
} from "lucide-react";

const CHAPTERS = [
  { id: "all", label: "Tất cả" },
  { id: "ch1", label: "1. Tổng quan & Vai trò" },
  { id: "ch2", label: "2. Đăng nhập & Dashboard" },
  { id: "ch3", label: "3. Phân hệ Dịch vụ" },
  { id: "ch4", label: "4. Dự án v4.0 & Gantt" },
  { id: "ch5", label: "5. Quản lý Master Data & SLA" },
  { id: "ch6", label: "6. Cổng Khách hàng (Portal)" },
  { id: "ch7", label: "7. Quản trị & Sao lưu" },
  { id: "ch8", label: "8. Quy trình SOP & FAQ" }
];

export default function GuidePage() {
  const [activeChapter, setActiveChapter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
          {/* SECTION 1: TỔNG QUAN & TÀI KHOẢN MẪU */}
          {(activeChapter === "all" || activeChapter === "ch1") && matchesSearch("tổng quan tài khoản phân quyền admin pm technical customer") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="text-teal-600" size={18} />
                  <span>1. Tổng quan &amp; Danh sách Tài khoản Truy cập mẫu</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">Bản chính thức v4.0</span>
              </div>

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
                  <p className="text-[11px] text-slate-600">Toàn quyền hệ thống: Dashboard, Users, Quyền, Sao lưu, SLA, Master Data.</p>
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
                  <p className="text-[11px] text-slate-600">Điều hành Dự án (Kế hoạch, Gantt, SOW), Hợp đồng, Khách hàng, Yêu cầu.</p>
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
                  <p className="text-[11px] text-slate-600">Tiếp nhận và giải quyết Ticket, Bấm giờ tạm dừng bảo vệ SLA, Bảo trì định kỳ.</p>
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
                  <p className="text-[11px] text-slate-600">Cổng tiếp nhận riêng (<code>/portal</code>): Gửi phiếu, tra cứu tiến độ dự án.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: BÁO CÁO DASHBOARD */}
          {(activeChapter === "all" || activeChapter === "ch2") && matchesSearch("dashboard báo cáo chỉ số kpi tổng hợp nhân sự workload") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="text-teal-600" size={18} />
                  <span>2. Bảng điều khiển (Dashboard) &amp; Báo cáo KPI</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Báo cáo Tổng hợp (Synthesis)</div>
                  <p className="text-slate-600 leading-relaxed">
                    Tổng số Ticket tiếp nhận, Tỷ lệ hoàn thành đúng cam kết SLA (%), Số dự án đang chạy và số kỳ bảo trì đã chốt.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Khối lượng Nhân sự (Staff Workload)</div>
                  <p className="text-slate-600 leading-relaxed">
                    Theo dõi số lượng ticket và nhiệm vụ đang gán cho từng kỹ sư, lọc theo phòng ban, cảnh báo nhân sự bị quá tải.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Báo cáo Chung &amp; Bảo trì &amp; Dự án</div>
                  <p className="text-slate-600 leading-relaxed">
                    Phân tích chi tiết các mức L1-L4, danh sách ticket trễ hạn, tiến độ các đợt bảo dưỡng và tiến độ hoàn thành các dự án.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: QUY TRÌNH TICKET ITIL 5 BƯỚC */}
          {(activeChapter === "all" || activeChapter === "ch3") && matchesSearch("ticket yêu cầu itil quy trình sla l1 l2 l3 l4 bảo trì hold") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Wrench className="text-teal-600" size={18} />
                  <span>3. Quy trình Xử lý Sự cố Chuẩn ITIL 5 Bước &amp; Quản lý SLA</span>
                </h3>
              </div>

              {/* 5 STEPS */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Tạo Ticket</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Chọn khách hàng, mức độ ưu tiên L1 - L4, loại sự cố, nhập mô tả.</p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Check Hợp đồng</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Xác định phạm vi: <code>In scope</code>, <code>Out scope</code> hoặc <code>Presale</code>.</p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Điều phối</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">Gán Kỹ sư phụ trách chính (Assigned) và Người theo dõi (Following).</p>
                </div>

                <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1 text-xs">
                  <div className="font-bold text-teal-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Troubleshooting</span>
                  </div>
                  <p className="text-teal-800 text-[11px]">Bấm giờ xử lý SLA. Có nút <strong>On Hold</strong> để dừng đồng hồ SLA khi chờ khách.</p>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1 text-xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">5</span>
                    <span>Hoàn tất / Đóng</span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">Nhập nguyên nhân gốc (Root cause), giải pháp khắc phục, nghiệm thu.</p>
                </div>
              </div>

              {/* SLA TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="p-2.5">Mức ưu tiên</th>
                      <th className="p-2.5">Thời gian Phản hồi (Response)</th>
                      <th className="p-2.5">Thời gian Giải quyết (Resolution)</th>
                      <th className="p-2.5">Cơ chế Bảo vệ SLA (On Hold)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-bold text-red-700 bg-red-50/40">L1 - Critical</td>
                      <td className="p-2.5">&le; 15 - 30 phút</td>
                      <td className="p-2.5">&le; 2 - 4 giờ</td>
                      <td className="p-2.5 text-slate-600" rowSpan={4}>
                        Khi cần chờ phản hồi từ khách hàng hoặc chờ linh kiện, kỹ sư chuyển trạng thái sang <code>On Hold</code> kèm lý do. Hệ thống sẽ tạm dừng đồng hồ đếm SLA, bảo vệ tính trung thực của cam kết.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-orange-700 bg-orange-50/40">L2 - Major</td>
                      <td className="p-2.5">&le; 1 giờ</td>
                      <td className="p-2.5">&le; 8 giờ</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-yellow-700 bg-yellow-50/40">L3 - Minor</td>
                      <td className="p-2.5">&le; 2 giờ</td>
                      <td className="p-2.5">&le; 24 giờ</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-blue-700 bg-blue-50/40">L4 - Warning</td>
                      <td className="p-2.5">&le; 4 giờ</td>
                      <td className="p-2.5">&le; 48 giờ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: DỰ ÁN V4.0 */}
          {(activeChapter === "all" || activeChapter === "ch4") && matchesSearch("dự án project gantt kế hoạch plan sow milestone tiến độ phase") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FolderOpen className="text-teal-600" size={18} />
                  <span>4. Phân hệ Quản lý Dự án (Project Management v4.0)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">Bảng Kế hoạch (Plan) Phân cấp Tự động:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Hỗ trợ phân rã 3 cấp: Giai đoạn (Phase) &rarr; Công việc chính &rarr; Công việc con.</li>
                    <li><strong>% Hoàn thành Phase:</strong> Tự động tính trung bình % các task con.</li>
                    <li><strong>Nhân sự Phase:</strong> Tự động tổng hợp danh sách kỹ sư từ các task con.</li>
                    <li><strong>Ngày bắt đầu/kết thúc:</strong> Lấy ngày sớm nhất và muộn nhất từ các task con.</li>
                    <li><strong>Đa nhân sự:</strong> Chọn nhiều kỹ sư cùng thực hiện một đầu việc dạng tag màu.</li>
                    <li><strong>Sắp xếp linh hoạt:</strong> Kéo thả chuột hoặc gõ số dòng để đổi vị trí task.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 text-sm">Biểu đồ Gantt 3 Cột Hiện đại:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>Cột 1: Tên công việc (phân cấp thụt lề rõ ràng).</li>
                    <li>Cột 2: Tiến độ % kèm thanh Bar 2 màu trực quan.</li>
                    <li>Cột 3: Lưới thời gian theo ngày &amp; tháng, tự động highlight cột <strong>Hôm nay (Today)</strong>.</li>
                    <li>Màu sắc thanh Gantt bar phân biệt riêng biệt theo từng Giai đoạn dự án.</li>
                    <li>Tích hợp các mốc nghiệm thu (Milestones), tài liệu dự án và nhật ký công việc (Diary).</li>
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

          {/* SECTION 7: QUẢN TRỊ HỆ THỐNG */}
          {(activeChapter === "all" || activeChapter === "ch7") && matchesSearch("hệ thống sao lưu backup restore phân quyền logs") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Server className="text-teal-600" size={18} />
                  <span>7. Quản trị Người dùng, Phân quyền &amp; Sao lưu Hệ thống</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Quản lý Tài khoản (Users)</div>
                  <p className="text-slate-600">Tạo tài khoản, gán vai trò, khóa tài khoản tạm thời và đặt lại mật khẩu cho người dùng.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Phân quyền Nhóm (Settings)</div>
                  <p className="text-slate-600">Tích chọn các màn hình/đường dẫn phân hệ cho phép từng nhóm vai trò truy cập.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Sao lưu &amp; Nhật ký (Backup &amp; Logs)</div>
                  <p className="text-slate-600">Xuất file JSON sao lưu cơ sở dữ liệu Supabase, dọn dẹp bản ghi trùng và theo dõi audit logs.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: FAQ & QUY TRÌNH */}
          {(activeChapter === "all" || activeChapter === "ch8") && matchesSearch("faq hỏi đáp tình huống sự cố sop quy trình") && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="text-teal-600" size={18} />
                  <span>8. Các Tình Huống Thường Gặp &amp; Quy Trình Vận Hành Tiêu Chuẩn (FAQ)</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Q1: Làm sao để bảo vệ SLA khi khách hàng phản hồi chậm?</div>
                  <p className="text-slate-600">
                    Kỹ sư mở Ticket đó lên &rarr; Chuyển trạng thái sang <strong>On Hold</strong> &rarr; Chọn lý do <code>Chờ phản hồi từ khách hàng</code>. Hệ thống sẽ lập tức tạm dừng đồng hồ tính giờ SLA và lưu vết mốc thời gian.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Q2: Khi chuyển đổi vị trí công việc trong Kế hoạch dự án có bị mất dữ liệu không?</div>
                  <p className="text-slate-600">
                    Hoàn toàn không. Phiên bản 4.0 hỗ trợ cả 2 phương thức: kéo thả chuột trực tiếp và gõ số thứ tự dòng mong muốn. Dữ liệu được đồng bộ ngay tức thì lên cơ sở dữ liệu Supabase.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">Q3: Tại sao Kỹ sư không nhìn thấy phân hệ Quản lý Người dùng?</div>
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

"use client";

import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import NhanSuTable from "@/components/nhan-su/nhan-su-table";
import NhanSuModal from "@/components/nhan-su/nhan-su-modal";
import NhanSuImportModal from "@/components/nhan-su/nhan-su-import-modal";
import {
  Plus, Download, Search,
  UserCheck, Users, UsersRound, FileText, Target,
  FileSpreadsheet, RefreshCw, CheckCircle2, Phone, Mail, Building2
} from "lucide-react";
import { fetchNhanSu, NhanSu } from "@/lib/nhan-su-operations";

const INFO_NAV_TABS = [
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/opportunities", label: "Cơ hội", icon: Target },
  { href: "/contacts", label: "Liên hệ", icon: UsersRound },
  { href: "/nhan-su", label: "Nhân sự", icon: UserCheck },
  { href: "/contracts", label: "Hợp đồng", icon: FileText }
];

export default function NhanSuPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editData, setEditData] = useState<NhanSu | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, withPhone: 0, withEmail: 0, lastSync: "" });
  const tableRef = useRef<any>(null);

  const loadStats = async () => {
    const data = await fetchNhanSu();
    const withPhone = data.filter(ns => !!ns.so_dien_thoai && ns.so_dien_thoai.trim() !== "").length;
    const withEmail = data.filter(ns => !!ns.email && ns.email.trim() !== "").length;
    const lastSyncTime = localStorage.getItem("jpt_nhan_su_last_sync_time") || "Chưa đồng bộ";
    setStats({ total: data.length, withPhone, withEmail, lastSync: lastSyncTime });
  };

  useEffect(() => { loadStats(); }, []);

  // Background Auto-Sync Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const checkAndRunAutoSync = async (isInitial = false) => {
      const isExplicitlyDisabled = localStorage.getItem("jpt_customer_auto_sync") === "false";
      if (isExplicitlyDisabled) return;

      const sheetUrl =
        localStorage.getItem("jpt_nhan_su_sheet_url") ||
        localStorage.getItem("jpt_customer_sheet_url") ||
        localStorage.getItem("jpt_master_sheet_url") ||
        "https://docs.google.com/spreadsheets/d/1uo-bOv9u5Z284oWLtkca4zYadxkiNvMGhSh5HFCwWG8/edit";

      const userAccessToken = localStorage.getItem("jpt_google_user_access_token") || "";
      const userRefreshToken = localStorage.getItem("jpt_google_user_refresh_token") || "";
      const userClientId = localStorage.getItem("jpt_google_user_client_id") || "";
      const userClientSecret = localStorage.getItem("jpt_google_user_client_secret") || "";

      if (!userAccessToken && !userRefreshToken) return;

      try {
        const payload: any = {
          sheetUrl,
          sheetName: localStorage.getItem("jpt_nhan_su_sheet_name") || "NhanSu",
          userAccessToken,
          userRefreshToken,
          userClientId,
          userClientSecret,
          mode: "sync_diff",
        };

        const res = await fetch("/api/nhan-su/sync-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          const nowStr = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
          localStorage.setItem("jpt_nhan_su_last_sync_time", nowStr);
          tableRef.current?.loadNhanSu?.();
          loadStats();
        }
      } catch (err) {
        console.error("Auto sync nhan su error:", err);
      }
    };

    checkAndRunAutoSync(true);

    const intervalMin = parseInt(localStorage.getItem("jpt_customer_auto_sync_interval") || "15", 10);
    timer = setInterval(() => checkAndRunAutoSync(false), intervalMin * 60 * 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleModalSuccess = () => {
    tableRef.current?.loadNhanSu?.();
    loadStats();
  };

  const handleEdit = (ns: NhanSu) => {
    setEditData(ns);
    setIsModalOpen(true);
  };

  const handleNewClick = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  // Export CSV
  const handleExport = async () => {
    const data: NhanSu[] = tableRef.current?.getAllData?.() || await fetchNhanSu();
    if (data.length === 0) { alert("Không có dữ liệu để xuất."); return; }

    const labelRow = ["Mã Nhân Sự", "Họ và Tên", "Bộ Phận", "Chức Vụ", "Phụ Trách", "Ngày Sinh", "Số CCCD", "Cấp Ngày", "Email", "Số Điện Thoại", "Địa Chỉ"];

    const escape = (v: string | null | undefined) => {
      if (!v) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [
      labelRow.join(","),
      ...data.map(ns => [
        escape(ns.ma_nhan_su),
        escape(ns.ten_nhan_su),
        escape(ns.bo_phan),
        escape(ns.chuc_vu),
        escape(ns.phu_trach),
        escape(ns.ngay_sinh),
        escape(ns.so_cccd),
        escape(ns.cap_ngay),
        escape(ns.email),
        escape(ns.so_dien_thoai),
        escape(ns.dia_chi),
      ].join(","))
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh_sach_nhan_su_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-28px)] overflow-hidden">
        {/* Header with Unified Navigation Tabs */}
        <div className="shrink-0 mb-3">
          <Header
            title="Quản lý Thông Tin"
            description="Hồ sơ nhân sự, chức danh, bộ phận và thông tin liên hệ công ty"
            navTabs={INFO_NAV_TABS}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Tổng Nhân sự</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
                <p className="text-[11px] text-slate-400">Toàn bộ công ty</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <UserCheck size={16} className="text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Có Số Điện Thoại</p>
                <p className="text-xl font-bold text-teal-600 mt-0.5">{stats.withPhone}</p>
                <p className="text-[11px] text-teal-500">Đầu mối liên lạc</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <Phone size={16} className="text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Có Địa Chỉ Email</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.withEmail}</p>
                <p className="text-[11px] text-blue-500">Hòm thư công vụ</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail size={16} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsImportOpen(true)}
            className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-emerald-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Google Sheet Sync (NhanSu)</p>
                {stats.lastSync && stats.lastSync !== "Chưa đồng bộ" ? (
                  <>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <p className="text-xs font-bold text-emerald-700">Đã đồng bộ</p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{stats.lastSync}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-600 mt-1">Chưa đồng bộ</p>
                    <p className="text-[10px] text-emerald-600 font-medium">Tự động 1 chiều</p>
                  </>
                )}
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition">
                <RefreshCw size={16} className="text-emerald-600 group-hover:rotate-180 transition duration-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          {/* Left */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewClick}
              id="btn-new-nhansu"
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
            >
              <Plus size={15} />
              Thêm nhân sự
            </button>

            <div className="relative">
              <input
                type="text"
                id="search-nhansu"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã NV, họ tên, bộ phận, chức vụ, email, SĐT..."
                className="w-80 h-9 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition shadow-sm"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportOpen(true)}
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition shadow-sm"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              Đồng bộ Google Sheet / Import
            </button>

            <button
              onClick={handleExport}
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-sm"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 min-h-0 flex flex-col">
          <NhanSuTable
            ref={tableRef}
            onRefresh={handleModalSuccess}
            onEdit={handleEdit}
            searchValue={search}
          />
        </div>
      </div>

      {/* Modals */}
      <NhanSuModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editData={editData}
      />

      <NhanSuImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </MainLayout>
  );
}

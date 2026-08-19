"use client";

import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import OpportunityTable from "@/components/opportunity/opportunity-table";
import OpportunityModal from "@/components/opportunity/opportunity-modal";
import OpportunityImportModal from "@/components/opportunity/opportunity-import-modal";
import {
  Plus, Download, Search,
  Target, Building2,
  RefreshCw, FileSpreadsheet, UserCheck, TrendingUp
} from "lucide-react";
import { fetchOpportunities, Opportunity } from "@/lib/opportunity-operations";
import { Users, UsersRound, FileText } from "lucide-react";

const INFO_NAV_TABS = [
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/opportunities", label: "Cơ hội", icon: Target },
  { href: "/contacts", label: "Liên hệ", icon: UsersRound },
  { href: "/nhan-su", label: "Nhân sự", icon: UserCheck },
  { href: "/contracts", label: "Hợp đồng", icon: FileText }
];

export default function OpportunitiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editData, setEditData] = useState<Opportunity | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, activeStages: 0, withPhuTrach: 0, lastSync: "" });
  const tableRef = useRef<any>(null);

  const loadStats = async () => {
    const data = await fetchOpportunities();
    const activeStages = data.filter(o => o.giai_doan && !o.giai_doan.includes("Hủy") && !o.giai_doan.includes("Thất bại")).length;
    const withPhuTrach = data.filter(o => o.phu_trach && o.phu_trach.trim() !== "").length;
    const lastSyncTime = localStorage.getItem("jpt_opp_last_sync_time") || "Chưa đồng bộ";
    setStats({ total: data.length, activeStages, withPhuTrach, lastSync: lastSyncTime });
  };

  useEffect(() => { loadStats(); }, []);

  // Background Auto-Sync
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const checkAndRunAutoSync = async (isInitial = false) => {
      const isExplicitlyDisabled = localStorage.getItem("jpt_customer_auto_sync") === "false";
      if (isExplicitlyDisabled) return;

      const sheetUrl = localStorage.getItem("jpt_opp_sheet_url") ||
        localStorage.getItem("jpt_customer_sheet_url") ||
        localStorage.getItem("jpt_contract_sheet_url") ||
        "https://docs.google.com/spreadsheets/d/1uo-bOv9u5Z284oWLtkca4zYadxkiNvMGhSh5HFCwWG8/edit";

      const userAccessToken = localStorage.getItem("jpt_google_user_access_token") || "";
      const userRefreshToken = localStorage.getItem("jpt_google_user_refresh_token") || "";
      const userClientId = localStorage.getItem("jpt_google_user_client_id") || "";
      const userClientSecret = localStorage.getItem("jpt_google_user_client_secret") || "";

      if (!userAccessToken && !userRefreshToken) return;

      try {
        const payload: any = {
          sheetUrl,
          sheetName: localStorage.getItem("jpt_opp_sheet_name") || "Opportunity",
          userAccessToken,
          userRefreshToken,
          userClientId,
          userClientSecret,
          mode: "sync_diff",
        };

        const res = await fetch("/api/opportunities/sync-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          const nowStr = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
          localStorage.setItem("jpt_opp_last_sync_time", nowStr);
          tableRef.current?.loadOpportunities?.();
          loadStats();
        }
      } catch (err) {
        console.error("Opportunity auto sync error:", err);
      }
    };

    // Run initial auto sync if credentials exist
    checkAndRunAutoSync(true);

    const intervalMin = parseInt(localStorage.getItem("jpt_customer_auto_sync_interval") || "15", 10);
    timer = setInterval(() => checkAndRunAutoSync(false), intervalMin * 60 * 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleModalSuccess = () => {
    tableRef.current?.loadOpportunities?.();
    loadStats();
  };

  const handleEdit = (opp: Opportunity) => {
    setEditData(opp);
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
    const data: Opportunity[] = tableRef.current?.getAllData?.() || await fetchOpportunities();
    if (data.length === 0) { alert("Không có dữ liệu để xuất."); return; }

    const headers = ["system_code", "code", "name", "customer_name", "giai_doan", "gia_tri", "ttkd", "phu_trach", "ghi_chu"];
    const labelRow = ["Mã HT", "Mã Cơ hội", "Tên Cơ hội / Dự án", "Khách hàng", "Giai đoạn", "Giá trị", "TTKD", "Người phụ trách", "Ghi chú"];

    const escape = (v: string | undefined) => {
      if (!v) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [
      labelRow.join(","),
      ...data.map(o => [
        escape(o.system_code),
        escape(o.code),
        escape(o.name),
        escape(o.customer_name),
        escape(o.giai_doan),
        escape(o.gia_tri),
        escape(o.ttkd),
        escape(o.phu_trach),
        escape(o.ghi_chu),
      ].join(","))
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh_sach_co_hoi_${new Date().toISOString().slice(0, 10)}.csv`;
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
            description="Danh sách cơ hội kinh doanh, giai đoạn phát triển và người phụ trách"
            navTabs={INFO_NAV_TABS}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Tổng Cơ hội</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
                <p className="text-[11px] text-slate-400">Dự án kinh doanh</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target size={16} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Đang triển khai / Đàm phán</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.activeStages}</p>
                <p className="text-[11px] text-blue-500">Cơ hội hoạt động</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Đã gán Phụ trách</p>
                <p className="text-xl font-bold text-green-600 mt-0.5">{stats.withPhuTrach}</p>
                <p className="text-[11px] text-green-500">Sales / Quản lý</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck size={16} className="text-green-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsImportOpen(true)}
            className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Google Sheet Sync (Opportunity)</p>
                {stats.lastSync && stats.lastSync !== "Chưa đồng bộ" ? (
                  <>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                      <p className="text-xs font-bold text-purple-700">Đã đồng bộ</p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{stats.lastSync}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-600 mt-1">Chưa đồng bộ</p>
                    <p className="text-[10px] text-purple-600 font-medium">Tự động 1 chiều</p>
                  </>
                )}
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition">
                <RefreshCw size={16} className="text-purple-600 group-hover:rotate-180 transition duration-500" />
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
              id="btn-new-opportunity"
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition shadow-sm"
            >
              <Plus size={15} />
              Thêm cơ hội
            </button>

            <div className="relative">
              <input
                type="text"
                id="search-opportunity"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã, tên, khách hàng, phụ trách..."
                className="w-72 h-9 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition shadow-sm"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportOpen(true)}
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition shadow-sm"
            >
              <FileSpreadsheet size={15} className="text-purple-600" />
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
          <OpportunityTable
            ref={tableRef}
            onRefresh={handleModalSuccess}
            onEdit={handleEdit}
            searchValue={search}
          />
        </div>
      </div>

      {/* Modals */}
      <OpportunityModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editData={editData}
      />

      <OpportunityImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </MainLayout>
  );
}

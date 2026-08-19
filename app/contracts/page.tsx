"use client";

import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import ContractTable from "@/components/contracts/contract-table";
import ContractModal from "@/components/contracts/new-contract-modal";
import ContractImportModal from "@/components/contracts/contract-import-modal";
import {
  Plus, Download, Search,
  FileText, Building2,
  RefreshCw, FileSpreadsheet, UserCheck, CheckCircle2, Target
} from "lucide-react";
import { fetchContracts, Contract } from "@/lib/contract-operations";
import { Users, UsersRound } from "lucide-react";

const INFO_NAV_TABS = [
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/opportunities", label: "Cơ hội", icon: Target },
  { href: "/contacts", label: "Liên hệ", icon: UsersRound },
  { href: "/nhan-su", label: "Nhân sự", icon: UserCheck },
  { href: "/contracts", label: "Hợp đồng", icon: FileText }
];

export default function ContractsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editData, setEditData] = useState<Contract | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, activeCount: 0, withPhuTrach: 0, lastSync: "" });
  const tableRef = useRef<any>(null);

  const loadStats = async () => {
    const data = await fetchContracts();
    const activeCount = data.filter(c => (c.status || "").toLowerCase().includes("active") || (c.status || "").toLowerCase().includes("hiệu lực")).length;
    const withPhuTrach = data.filter(c => (c.owner_name && c.owner_name.trim() !== "") || (c.phu_trach && c.phu_trach.trim() !== "")).length;
    const lastSyncTime = localStorage.getItem("jpt_contract_last_sync_time") || "Chưa đồng bộ";
    setStats({ total: data.length, activeCount, withPhuTrach, lastSync: lastSyncTime });
  };

  useEffect(() => { loadStats(); }, []);

  // Background Auto-Sync
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const checkAndRunAutoSync = async (isInitial = false) => {
      const isExplicitlyDisabled = localStorage.getItem("jpt_customer_auto_sync") === "false";
      if (isExplicitlyDisabled) return;

      const sheetUrl = localStorage.getItem("jpt_contract_sheet_url") ||
        localStorage.getItem("jpt_customer_sheet_url") ||
        localStorage.getItem("jpt_opp_sheet_url") ||
        "https://docs.google.com/spreadsheets/d/1uo-bOv9u5Z284oWLtkca4zYadxkiNvMGhSh5HFCwWG8/edit";

      const userAccessToken = localStorage.getItem("jpt_google_user_access_token") || "";
      const userRefreshToken = localStorage.getItem("jpt_google_user_refresh_token") || "";
      const userClientId = localStorage.getItem("jpt_google_user_client_id") || "";
      const userClientSecret = localStorage.getItem("jpt_google_user_client_secret") || "";

      if (!userAccessToken && !userRefreshToken) return;

      try {
        const payload: any = {
          sheetUrl,
          sheetName: localStorage.getItem("jpt_contract_sheet_name") || "Contract",
          userAccessToken,
          userRefreshToken,
          userClientId,
          userClientSecret,
          mode: "sync_diff",
        };

        const res = await fetch("/api/contracts/sync-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          const nowStr = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
          localStorage.setItem("jpt_contract_last_sync_time", nowStr);
          tableRef.current?.loadContracts?.();
          loadStats();
        }
      } catch (err) {
        console.error("Contract auto sync error:", err);
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
    tableRef.current?.loadContracts?.();
    loadStats();
  };

  const handleEdit = (contract: Contract) => {
    setEditData(contract);
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
    const data: Contract[] = tableRef.current?.getAllData?.() || await fetchContracts();
    if (data.length === 0) { alert("Không có dữ liệu để xuất."); return; }

    const headers = ["code", "contract_no", "name", "customer_name", "contract_type", "signed_date", "value", "status", "owner_name", "description"];
    const labelRow = ["Mã HĐ", "Số Hợp Đồng", "Tên Hợp Đồng", "Khách Hàng", "Loại Hợp Đồng", "Ngày Ký", "Giá Trị", "Trạng Thái", "Người Phụ Trách", "Ghi Chú"];

    const escape = (v: string | null | undefined) => {
      if (!v) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [
      labelRow.join(","),
      ...data.map(c => [
        escape(c.code),
        escape(c.contract_no),
        escape(c.name),
        escape(c.customer_name),
        escape(c.contract_type),
        escape(c.signed_date),
        escape(c.value),
        escape(c.status),
        escape(c.owner_name || c.phu_trach),
        escape(c.description || c.ghi_chu),
      ].join(","))
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh_sach_hop_dong_${new Date().toISOString().slice(0, 10)}.csv`;
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
            description="Hồ sơ hợp đồng pháp lý, loại hợp đồng, thời hạn và giá trị"
            navTabs={INFO_NAV_TABS}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Tổng Hợp đồng</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
                <p className="text-[11px] text-slate-400">Hồ sơ pháp lý</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <FileText size={16} className="text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Đang Hiệu Lực</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.activeCount}</p>
                <p className="text-[11px] text-emerald-500">Đang triển khai</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Đã gán Phụ trách</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.withPhuTrach}</p>
                <p className="text-[11px] text-blue-500">Nhân sự quản lý</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserCheck size={16} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsImportOpen(true)}
            className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-indigo-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Google Sheet Sync (Contract)</p>
                {stats.lastSync && stats.lastSync !== "Chưa đồng bộ" ? (
                  <>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      <p className="text-xs font-bold text-indigo-700">Đã đồng bộ</p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{stats.lastSync}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-600 mt-1">Chưa đồng bộ</p>
                    <p className="text-[10px] text-indigo-600 font-medium">Tự động 1 chiều</p>
                  </>
                )}
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition">
                <RefreshCw size={16} className="text-indigo-600 group-hover:rotate-180 transition duration-500" />
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
              id="btn-new-contract"
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm"
            >
              <Plus size={15} />
              Thêm hợp đồng
            </button>

            <div className="relative">
              <input
                type="text"
                id="search-contract"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã, số HĐ, tên, khách hàng, phụ trách..."
                className="w-80 h-9 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportOpen(true)}
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition shadow-sm"
            >
              <FileSpreadsheet size={15} className="text-indigo-600" />
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
          <ContractTable
            ref={tableRef}
            onRefresh={handleModalSuccess}
            onEdit={handleEdit}
            searchValue={search}
          />
        </div>
      </div>

      {/* Modals */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        initialData={editData}
      />

      <ContractImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </MainLayout>
  );
}
"use client";

import React, { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import ContractTable from "@/components/contracts/contract-table";
import ContractModal from "@/components/contracts/new-contract-modal";
import ContractImportModal from "@/components/contracts/contract-import-modal";
import {
  Plus, Download, Search,
  FileText, Users, Target, UsersRound, UserCheck,
  FileSpreadsheet, RefreshCw, CheckCircle2, ShieldCheck, Clock
} from "lucide-react";
import { fetchContracts, Contract } from "@/lib/contract-operations";

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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stats, setStats] = useState({ total: 0, active: 0, customers: 0, lastSync: "" });
  const tableRef = useRef<any>(null);

  const loadStats = async () => {
    const data = await fetchContracts();
    const active = data.filter(c => {
      const s = (c.status || "").trim().toLowerCase();
      return (
        s === "đang triển khai" ||
        s === "hỗ trợ kỹ thuật" ||
        s === "active" ||
        s.includes("hiệu lực") ||
        s.includes("đang")
      );
    }).length;
    const uniqueCustomers = new Set(data.map(c => c.customer).filter(Boolean)).size;
    const lastSyncTime = localStorage.getItem("jpt_contract_last_sync_time") || "Chưa đồng bộ";
    setStats({ total: data.length, active, customers: uniqueCustomers, lastSync: lastSyncTime });
  };

  useEffect(() => { loadStats(); }, []);

  // Background Auto-Sync Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const checkAndRunAutoSync = async (isInitial = false) => {
      const isExplicitlyDisabled = localStorage.getItem("jpt_customer_auto_sync") === "false";
      if (isExplicitlyDisabled) return;

      const sheetUrl =
        localStorage.getItem("jpt_contract_sheet_url") ||
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
        console.error("Auto sync contract error:", err);
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

  // Export CSV 14 columns
  const handleExport = async () => {
    const data: Contract[] = tableRef.current?.getAllData?.() || await fetchContracts();
    if (data.length === 0) { alert("Không có dữ liệu để xuất."); return; }

    const labelRow = [
      "CONTRACT NO",
      "PROJECT ID",
      "STATUS",
      "SIGNED DATE",
      "EXPIRY DATE",
      "SERVICE",
      "CONTRACT TYPE",
      "DESCRIPTION",
      "SUPPLIER",
      "END USER",
      "CUSTOMER",
      "AM",
      "TEAM",
      "FY"
    ];

    const escape = (v: string | null | undefined) => {
      if (!v) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [
      labelRow.join(","),
      ...data.map(c => [
        escape(c.contract_no),
        escape(c.project_id),
        escape(c.status),
        escape(c.signed_date),
        escape(c.expiry_date),
        escape(c.service),
        escape(c.contract_type),
        escape(c.description),
        escape(c.supplier),
        escape(c.end_user),
        escape(c.customer),
        escape(c.am),
        escape(c.team),
        escape(c.fy),
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
            description="Theo dõi toàn bộ hợp đồng dịch vụ, bảo trì và dự án công ty"
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
                <p className="text-[11px] text-slate-400">Toàn bộ hồ sơ</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText size={16} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Đang Hiệu Lực</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
                <p className="text-[11px] text-emerald-500">Đang triển khai / Active</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ShieldCheck size={16} className="text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Khách Hàng Ký Kết</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{stats.customers}</p>
                <p className="text-[11px] text-blue-500">Doanh nghiệp đối tác</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users size={16} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setIsImportOpen(true)}
            className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Google Sheet Sync (Contract)</p>
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
                    <p className="text-[10px] text-purple-600 font-medium">Lọc trùng: CONTRACT NO</p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
          {/* Left */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewClick}
              id="btn-new-contract"
              className="h-9 flex items-center gap-1.5 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition shadow-sm"
            >
              <Plus size={15} />
              Thêm hợp đồng
            </button>

            <div className="relative">
              <input
                type="text"
                id="search-contracts"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo CONTRACT NO, PROJECT ID, Customer, AM, Team, FY..."
                className="w-80 h-9 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition shadow-sm"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Đang triển khai">Đang triển khai</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
              <option value="Nháp">Nháp</option>
              <option value="Hủy">Hủy</option>
            </select>
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
          <ContractTable
            ref={tableRef}
            onRefresh={handleModalSuccess}
            onEdit={handleEdit}
            searchValue={search}
            statusFilter={statusFilter}
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
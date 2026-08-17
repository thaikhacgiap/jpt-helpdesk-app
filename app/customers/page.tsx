"use client";

import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import CustomerTable from "@/components/customer/customer-table";
import CustomerModal from "@/components/customer/new-customer-modal";
import CustomerImportModal from "@/components/customer/customer-import-modal";
import {
  Plus, Upload, Download, Search, Filter,
  ChevronDown, Users, Building2, TrendingUp, AlertCircle,
  Trash2, Loader2, RefreshCw, FileSpreadsheet, UserCheck, Clock
} from "lucide-react";
import { fetchCustomers, deleteCustomer, Customer } from "@/lib/customer-operations";
import { UsersRound, FileText } from "lucide-react";

const INFO_NAV_TABS = [
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/contacts", label: "Liên hệ", icon: UsersRound },
  { href: "/nhan-su", label: "Nhân sự", icon: UserCheck },
  { href: "/contracts", label: "Hợp đồng", icon: FileText }
];

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editData, setEditData] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, withTtkd: 0, withPhuTrach: 0, lastSync: "" });
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const tableRef = useRef<any>(null);

  const loadStats = async () => {
    const data = await fetchCustomers();
    const withTtkd = data.filter(c => c.ttkd && c.ttkd.trim() !== "").length;
    const withPhuTrach = data.filter(c => c.phu_trach && c.phu_trach.trim() !== "").length;
    const lastSyncTime = localStorage.getItem("jpt_customer_last_sync_time") || "Chưa đồng bộ";
    setStats({ total: data.length, withTtkd, withPhuTrach, lastSync: lastSyncTime });
  };

  useEffect(() => { loadStats(); }, []);

  // Background Auto-Sync Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const checkAndRunAutoSync = async () => {
      const enabled = localStorage.getItem("jpt_customer_auto_sync") === "true";
      const sheetUrl = localStorage.getItem("jpt_customer_sheet_url") || "";
      const intervalMin = parseInt(localStorage.getItem("jpt_customer_auto_sync_interval") || "15", 10);

      if (!enabled || !sheetUrl) return;

      try {
        const res = await fetch("/api/customers/sync-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl }),
        });
        const data = await res.json();
        if (data.success) {
          const nowStr = new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN");
          localStorage.setItem("jpt_customer_last_sync_time", nowStr);
          tableRef.current?.loadCustomers?.();
          loadStats();
        }
      } catch (err) {
        console.error("Auto sync background error:", err);
      }
    };

    const enabled = localStorage.getItem("jpt_customer_auto_sync") === "true";
    const intervalMin = parseInt(localStorage.getItem("jpt_customer_auto_sync_interval") || "15", 10);

    if (enabled) {
      // Run auto sync timer
      timer = setInterval(checkAndRunAutoSync, intervalMin * 60 * 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const handleModalSuccess = () => {
    tableRef.current?.loadCustomers?.();
    loadStats();
  };

  const handleEdit = (customer: Customer) => {
    setEditData(customer);
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
    const data: Customer[] = tableRef.current?.getAllData?.() || await fetchCustomers();
    if (data.length === 0) { alert("Không có dữ liệu để xuất."); return; }

    const headers = ["system_code", "code", "name", "ten_tieng_anh", "ttkd", "phu_trach", "ghi_chu"];
    const labelRow = ["Mã HT", "Mã Khách Hàng", "Tên Hiển Thị", "Tên Tiếng Anh", "TTKD", "Người phụ trách", "Ghi chú"];

    const escape = (v: string | undefined) => {
      if (!v) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [
      labelRow.join(","),
      ...data.map(c => headers.map(h => escape((c as any)[h])).join(",")),
    ];

    const bom = "\uFEFF";
    const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    const selectedIds: string[] = tableRef.current?.getSelectedIds?.() || [];
    if (selectedIds.length === 0) { alert("Vui lòng chọn ít nhất 1 khách hàng."); return; }
    if (!window.confirm(`Xóa ${selectedIds.length} khách hàng đã chọn?`)) return;

    setBulkDeleting(true);
    const allData: Customer[] = tableRef.current?.getAllData?.() || [];
    const toDelete = allData.filter(c => selectedIds.includes(c.id));
    for (const c of toDelete) {
      await deleteCustomer(c.code);
    }
    setBulkDeleting(false);
    tableRef.current?.loadCustomers?.();
    loadStats();
  };

  return (
    <MainLayout>
      <Header
        title="Quản lý Thông Tin"
        description="Quản lý dữ liệu đối tác & đồng bộ tự động 1 chiều từ Google Sheets"
        navTabs={INFO_NAV_TABS}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng khách hàng</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              <p className="text-xs text-slate-400 mt-1">Mã tự gán KH-00x</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Đã phân TTKD</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.withTtkd}</p>
              <p className="text-xs text-purple-500 mt-1">Trung tâm kinh doanh</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building2 size={18} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Đã gán Phụ trách</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.withPhuTrach}</p>
              <p className="text-xs text-green-500 mt-1">Nhân sự quản lý</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <UserCheck size={18} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Google Sheet Sync</p>
              <p className="text-xs font-bold text-slate-700 mt-2 truncate max-w-[130px]">{stats.lastSync}</p>
              <p className="text-xs text-green-600 font-medium mt-1">Tự động 1 chiều</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <RefreshCw size={18} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        {/* Left */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewClick}
            id="btn-new-customer"
            className="h-10 flex items-center gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} />
            Thêm khách hàng
          </button>

          <div className="relative">
            <input
              type="text"
              id="search-customer"
              placeholder="Tìm kiếm mã, tên, TTKD, phụ trách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-72 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Bulk delete */}
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            title="Xóa các dòng đã chọn"
            className="h-10 flex items-center gap-2 px-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition shadow-sm disabled:opacity-50"
          >
            {bulkDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Xóa đã chọn
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="h-10 flex items-center gap-2 px-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold transition shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-green-600" />
            Đồng bộ Google Sheet / Import
          </button>

          <button
            onClick={handleExport}
            className="h-10 flex items-center gap-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <CustomerTable
        ref={tableRef}
        onRefresh={handleModalSuccess}
        onEdit={handleEdit}
        searchValue={search}
      />

      {/* Modals */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editData={editData}
      />

      <CustomerImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </MainLayout>
  );
}
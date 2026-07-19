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
  Trash2, Loader2,
} from "lucide-react";
import { fetchCustomers, deleteCustomer, Customer } from "@/lib/customer-operations";

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editData, setEditData] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, types: 0 });
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const tableRef = useRef<any>(null);

  const loadStats = async () => {
    const data = await fetchCustomers();
    const active = data.filter(c => !c.tinh_trang || c.tinh_trang === "Active").length;
    const types = new Set(data.map(c => c.type).filter(Boolean)).size;
    setStats({ total: data.length, active, inactive: data.length - active, types });
  };

  useEffect(() => { loadStats(); }, []);

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

  // ── Export CSV ──────────────────────────────────────────────
  const handleExport = async () => {
    const data: Customer[] = tableRef.current?.getAllData?.() || await fetchCustomers();
    if (data.length === 0) { alert("Không có dữ liệu để xuất."); return; }

    const headers = ["code","name","type","tinh_trang","khu_vuc","address","phu_trach","ttkd","ghi_chu","email","phone"];
    const labelRow = ["Mã KH","Tên KH","Loại DN","Tình trạng","Khu vực","Địa chỉ","Người phụ trách","TTKD","Ghi chú","Email","Điện thoại"];

    const escape = (v: string | undefined) => {
      if (!v) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g,'""')}"` : s;
    };

    const lines = [
      labelRow.join(","),
      ...data.map(c => headers.map(h => escape((c as any)[h])).join(",")),
    ];

    const bom = "\uFEFF"; // UTF-8 BOM for Excel
    const blob = new Blob([bom + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Bulk Delete ─────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const selectedIds: string[] = tableRef.current?.getSelectedIds?.() || [];
    if (selectedIds.length === 0) { alert("Vui lòng chọn ít nhất 1 khách hàng."); return; }
    if (!window.confirm(`Xóa ${selectedIds.length} khách hàng đã chọn?`)) return;

    setBulkDeleting(true);
    // Get codes from the ids
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
        title="Quản lý Khách Hàng"
        description="Quản lý thông tin toàn bộ khách hàng của công ty"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng khách hàng</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              <p className="text-xs text-slate-400 mt-1">Tất cả trạng thái</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              <p className="text-xs text-green-500 mt-1">Active</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Ngừng hoạt động</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{stats.inactive}</p>
              <p className="text-xs text-red-400 mt-1">Inactive</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Loại DN</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.types}</p>
              <p className="text-xs text-slate-400 mt-1">Nhóm khác nhau</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Building2 size={18} className="text-purple-600" />
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
              placeholder="Tìm kiếm khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <button className="h-10 flex items-center gap-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm">
            <Filter size={15} />
            Lọc
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {/* Bulk delete — hiện khi có dòng được chọn */}
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
            className="h-10 flex items-center gap-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm"
          >
            <Upload size={15} />
            Import CSV
          </button>
          <button
            onClick={handleExport}
            className="h-10 flex items-center gap-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm"
          >
            <Download size={15} />
            Export CSV
            <ChevronDown size={14} className="text-slate-400" />
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
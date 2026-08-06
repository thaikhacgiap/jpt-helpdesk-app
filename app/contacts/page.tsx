"use client";

import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import ContactTable from "@/components/contact/contact-table";
import ContactModal from "@/components/contact/contact-modal";
import {
  Plus, Search, Download, Upload,
  UsersRound, Building2, Phone, Mail,
} from "lucide-react";
import { Users, UserCheck, FileText } from "lucide-react";
import { fetchContacts, Contact } from "@/lib/contact-operations";

const INFO_NAV_TABS = [
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/contacts", label: "Liên hệ", icon: UsersRound },
  { href: "/nhan-su", label: "Nhân sự", icon: UserCheck },
  { href: "/contracts", label: "Hợp đồng", icon: FileText }
];

export default function ContactsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, withEmail: 0, withPhone: 0, customers: 0 });
  const tableRef = useRef<any>(null);

  const loadStats = async () => {
    const data = await fetchContacts();
    const withEmail = data.filter(c => !!c.email).length;
    const withPhone = data.filter(c => !!c.so_di_dong || !!c.so_may_ban).length;
    const uniqueCustomers = new Set(data.map(c => c.customer_code).filter(Boolean)).size;
    setStats({ total: data.length, withEmail, withPhone, customers: uniqueCustomers });
  };

  useEffect(() => { loadStats(); }, []);

  const handleModalSuccess = () => {
    tableRef.current?.loadContacts?.();
    loadStats();
  };

  const handleEdit = (c: Contact) => { setEditData(c); setIsModalOpen(true); };
  const handleNew = () => { setEditData(null); setIsModalOpen(true); };
  const handleClose = () => { setIsModalOpen(false); setEditData(null); };

  // Export CSV
  const handleExport = async () => {
    const data = await fetchContacts();
    if (data.length === 0) { alert("Không có dữ liệu để xuất."); return; }
    const headers = ["code","customer_code","customer_name","ho_ten","bo_phan","chuc_danh","so_may_ban","so_di_dong","email","dia_chi","ghi_chu"];
    const labels = ["Mã liên hệ","Mã KH","Tên KH","Họ và tên","Bộ phận","Chức danh","Số máy bàn","Số di động","Email","Địa chỉ","Ghi chú"];
    const esc = (v?: string) => {
      if (!v) return "";
      return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g,'""')}"` : v;
    };
    const lines = [labels.join(","), ...data.map(c => headers.map(h => esc((c as any)[h])).join(","))];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <Header
        title="Quản lý Thông Tin"
        description="Danh sách đầu mối liên hệ tại các khách hàng"
        navTabs={INFO_NAV_TABS}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng liên hệ</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              <p className="text-xs text-slate-400 mt-1">Tất cả bản ghi</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
              <UsersRound size={18} className="text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Khách hàng</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.customers}</p>
              <p className="text-xs text-slate-400 mt-1">Có liên hệ</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 size={18} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Có số di động</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.withPhone}</p>
              <p className="text-xs text-slate-400 mt-1">Liên hệ được qua điện thoại</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Phone size={18} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Có Email</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.withEmail}</p>
              <p className="text-xs text-slate-400 mt-1">Liên hệ được qua email</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Mail size={18} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleNew}
            id="btn-new-contact"
            className="h-10 flex items-center gap-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} />
            Thêm liên hệ
          </button>

          <div className="relative">
            <input
              type="text"
              id="search-contact"
              placeholder="Tìm kiếm liên hệ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="h-10 flex items-center gap-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm">
            <Upload size={15} /> Import CSV
          </button>
          <button
            onClick={handleExport}
            className="h-10 flex items-center gap-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <ContactTable
        ref={tableRef}
        onEdit={handleEdit}
        onRefresh={loadStats}
        searchValue={search}
      />

      {/* Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleModalSuccess}
        editData={editData}
      />
    </MainLayout>
  );
}
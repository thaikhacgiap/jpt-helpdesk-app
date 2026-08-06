"use client";

import { useState, useRef } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";
import NhanSuToolbar from "@/components/nhan-su/nhan-su-toolbar";
import NhanSuTable from "@/components/nhan-su/nhan-su-table";
import NhanSuModal from "@/components/nhan-su/nhan-su-modal";
import { Users, UsersRound, UserCheck, FileText } from "lucide-react";
import { NhanSu } from "@/lib/nhan-su-operations";

const INFO_NAV_TABS = [
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/contacts", label: "Liên hệ", icon: UsersRound },
  { href: "/nhan-su", label: "Nhân sự", icon: UserCheck },
  { href: "/contracts", label: "Hợp đồng", icon: FileText }
];

export default function NhanSuPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<NhanSu | null>(null);
  const [search, setSearch] = useState("");
  const tableRef = useRef<any>(null);

  const handleModalSuccess = () => {
    tableRef.current?.loadNhanSu?.();
  };

  const handleEdit = (ns: NhanSu) => {
    setEditData(ns);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleNewClick = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <Header
        title="Quản lý Thông Tin"
        description="Quản lý thông tin toàn bộ nhân viên trong công ty"
        navTabs={INFO_NAV_TABS}
      />

      <NhanSuToolbar
        onNewClick={handleNewClick}
        searchValue={search}
        onSearchChange={setSearch}
      />

      <NhanSuTable
        ref={tableRef}
        onRefresh={handleModalSuccess}
        onEdit={handleEdit}
        searchValue={search}
      />

      <NhanSuModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editData={editData}
      />
    </MainLayout>
  );
}

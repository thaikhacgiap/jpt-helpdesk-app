"use client";

import { useState, useRef } from "react";
import MainLayout from "@/components/layout/main-layout";
import Header from "@/components/layout/header";

import ContractForm from "@/components/contracts/contract-form";
import ContractTable from "@/components/contracts/contract-table";
import ContractModal from "@/components/contracts/new-contract-modal";
import type { Contract } from "@/lib/contract-operations";

import { Users, UsersRound, UserCheck, FileText } from "lucide-react";

const INFO_NAV_TABS = [
  { href: "/customers", label: "Khách hàng", icon: Users },
  { href: "/contacts", label: "Liên hệ", icon: UsersRound },
  { href: "/nhan-su", label: "Nhân sự", icon: UserCheck },
  { href: "/contracts", label: "Hợp đồng", icon: FileText }
];

export default function ContractsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const tableRef = useRef<any>(null);

  const handleModalSuccess = () => {
    tableRef.current?.loadContracts?.();
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContract(null);
  };

  return (
    <MainLayout>
      <Header
        title="Quản lý Thông Tin"
        description="Quản lý toàn bộ thông tin hợp đồng của công ty"
        navTabs={INFO_NAV_TABS}
      />

      <ContractForm onNewClick={() => { setEditingContract(null); setIsModalOpen(true); }} />

      <div className="mt-6">
        <ContractTable ref={tableRef} onRefresh={handleModalSuccess} onEdit={handleEdit} />
      </div>

      {/* Create / Edit Modal */}
      <ContractModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        initialData={editingContract}
      />
    </MainLayout>
  );
}
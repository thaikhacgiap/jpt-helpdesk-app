"use client";

import MainLayout from "@/components/layout/main-layout";
import TicketFormModal from "../ticket-form-modal";

export default function CreateTicketPage() {
  return (
    <MainLayout>
      <TicketFormModal mode="create" isPage={true} />
    </MainLayout>
  );
}

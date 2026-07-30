"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TicketFormModal from "../ticket-form-modal";
import MainLayout from "@/components/layout/main-layout";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading ticket detail:", error);
          router.push("/tickets");
          return;
        }
        setTicket(data);
        setLoading(false);
      });
  }, [id, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-100px)] text-sm text-slate-500 font-normal gap-2">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Đang tải thông tin ticket...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <TicketFormModal mode="view" ticket={ticket} isPage={true} />
    </MainLayout>
  );
}

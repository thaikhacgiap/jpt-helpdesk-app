import { supabase } from "./supabase";

export interface Opportunity {
  id: string;
  system_code?: string;
  code: string;
  name: string;
  customer_id?: string;
  customer_code?: string;
  customer_name?: string;
  giai_doan?: string;
  gia_tri?: string;
  xac_suat?: string;
  ngay_du_kien?: string;
  ttkd?: string;
  phu_trach?: string;
  tinh_trang?: string;
  ghi_chu?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = "jpt_helpdesk_opportunities_cache";

// ─── Fetch All Opportunities (Uncapped with Chunked Pagination) ──
export async function fetchOpportunities(): Promise<Opportunity[]> {
  try {
    const PAGE_SIZE = 1000;
    let allData: Opportunity[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.warn("Supabase fetch opportunities warning:", error.message);
        break;
      }

      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (allData.length === 0 && typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    }

    if (typeof window !== "undefined" && allData.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allData));
    }
    return allData;
  } catch (err) {
    console.error("fetchOpportunities error:", err);
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    }
    return [];
  }
}

// ─── Create Opportunity ───────────────────────────────────────
export async function createOpportunity(
  opp: Omit<Opportunity, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; data?: Opportunity; error?: string }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...opp,
      tinh_trang: opp.tinh_trang || "Active",
      giai_doan: opp.giai_doan || "Tiềm năng",
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("opportunities")
      .insert([payload])
      .select()
      .single();

    if (error) {
      // Local fallback
      if (typeof window !== "undefined") {
        const cached: Opportunity[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        const newOpp: Opportunity = {
          ...payload,
          id: `local-${Date.now()}`,
        };
        cached.unshift(newOpp);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cached));
        return { success: true, data: newOpp };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi tạo cơ hội mới." };
  }
}

// ─── Update Opportunity ───────────────────────────────────────
export async function updateOpportunity(
  id: string,
  opp: Partial<Opportunity>
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ...opp,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("opportunities")
      .update(payload)
      .eq("id", id);

    if (error) {
      if (typeof window !== "undefined") {
        const cached: Opportunity[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        const idx = cached.findIndex(c => c.id === id);
        if (idx >= 0) {
          cached[idx] = { ...cached[idx], ...payload };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cached));
          return { success: true };
        }
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi cập nhật cơ hội." };
  }
}

// ─── Upsert Opportunity From Import ───────────────────────────
export async function upsertOpportunityFromImport(
  opp: Partial<Opportunity> & { code: string; name: string }
): Promise<{ success: boolean; action?: "created" | "updated"; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from("opportunities")
      .select("id")
      .eq("code", opp.code)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("opportunities")
        .update({
          name: opp.name,
          customer_code: opp.customer_code,
          customer_name: opp.customer_name,
          giai_doan: opp.giai_doan,
          gia_tri: opp.gia_tri,
          xac_suat: opp.xac_suat,
          ngay_du_kien: opp.ngay_du_kien,
          ttkd: opp.ttkd,
          phu_trach: opp.phu_trach,
          ghi_chu: opp.ghi_chu,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) return { success: false, error: error.message };
      return { success: true, action: "updated" };
    } else {
      const { error } = await supabase
        .from("opportunities")
        .insert([{
          ...opp,
          tinh_trang: "Active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);

      if (error) return { success: false, error: error.message };
      return { success: true, action: "created" };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

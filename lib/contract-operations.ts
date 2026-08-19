import { supabase } from "./supabase";

export interface Contract {
  id: string;
  system_code?: string;
  code: string;
  contract_no?: string;
  name: string;
  contract_type?: string;
  customer_id?: string;
  customer_name?: string;
  signed_date?: string;
  start_date?: string;
  end_date?: string;
  value?: string;
  status?: string;
  owner_id?: string;
  owner_name?: string | null;
  phu_trach?: string | null;
  ttkd?: string;
  description?: string;
  ghi_chu?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = "jpt_helpdesk_contracts_cache";

// ─── Fetch All Contracts ──────────────────────────────────────
export async function fetchContracts(): Promise<Contract[]> {
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Supabase fetch contracts warning:", error.message);
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) return JSON.parse(cached);
      }
      return [];
    }

    if (typeof window !== "undefined" && data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
    return data || [];
  } catch (err) {
    console.error("fetchContracts error:", err);
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    }
    return [];
  }
}

// ─── Fetch Contracts By Customer ──────────────────────────────
export async function fetchContractsByCustomer(customerIdOrName: string): Promise<Contract[]> {
  const all = await fetchContracts();
  if (!customerIdOrName) return all;
  const q = customerIdOrName.trim().toLowerCase();
  return all.filter(c =>
    (c.customer_id && c.customer_id.toLowerCase() === q) ||
    (c.customer_name && c.customer_name.toLowerCase() === q) ||
    (c.customer_name && c.customer_name.toLowerCase().includes(q))
  );
}

// ─── Create Contract ──────────────────────────────────────────
export async function createContract(
  contract: Omit<Contract, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; data?: Contract; error?: string }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...contract,
      status: contract.status || "Active",
      contract_type: contract.contract_type || "Hợp đồng dịch vụ",
      owner_name: contract.owner_name || contract.phu_trach || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("contracts")
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (typeof window !== "undefined") {
        const cached: Contract[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        const newCtr: Contract = {
          ...payload,
          id: `local-${Date.now()}`,
        };
        cached.unshift(newCtr);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cached));
        return { success: true, data: newCtr };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi tạo hợp đồng mới." };
  }
}

// ─── Update Contract ──────────────────────────────────────────
export async function updateContract(
  id: string,
  contract: Partial<Contract>
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ...contract,
      owner_name: contract.owner_name || contract.phu_trach,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("contracts")
      .update(payload)
      .eq("id", id);

    if (error) {
      if (typeof window !== "undefined") {
        const cached: Contract[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
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
    return { success: false, error: err.message || "Lỗi cập nhật hợp đồng." };
  }
}

// ─── Upsert Contract From Import ──────────────────────────────
export async function upsertContractFromImport(
  contract: Partial<Contract> & { code: string; name: string }
): Promise<{ success: boolean; action?: "created" | "updated"; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from("contracts")
      .select("id")
      .eq("code", contract.code)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("contracts")
        .update({
          name: contract.name,
          contract_no: contract.contract_no,
          contract_type: contract.contract_type,
          customer_name: contract.customer_name,
          signed_date: contract.signed_date,
          start_date: contract.start_date,
          end_date: contract.end_date,
          value: contract.value,
          status: contract.status || "Active",
          owner_name: contract.owner_name || contract.phu_trach,
          ttkd: contract.ttkd,
          description: contract.description || contract.ghi_chu,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) return { success: false, error: error.message };
      return { success: true, action: "updated" };
    } else {
      const { error } = await supabase
        .from("contracts")
        .insert([{
          ...contract,
          status: contract.status || "Active",
          contract_type: contract.contract_type || "Hợp đồng dịch vụ",
          owner_name: contract.owner_name || contract.phu_trach,
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

import { supabase } from "./supabase";

export interface Contract {
  id: string;
  contract_no: string;            // CONTRACT NO (Mã hợp đồng - Khóa kiểm tra & lọc trùng)
  project_id?: string;            // PROJECT ID
  status?: string;                // STATUS
  signed_date?: string;           // SIGNED DATE
  expiry_date?: string;           // EXPIRY DATE
  service?: string;               // SERVICE
  contract_type?: string;         // CONTRACT TYPE
  description?: string;           // DESCRIPTION
  supplier?: string;              // SUPPLIER
  end_user?: string;              // END USER
  customer?: string;              // CUSTOMER
  am?: string;                    // AM
  team?: string;                  // TEAM
  fy?: string;                    // FY (Fiscal Year)
  
  // Backwards compatibility aliases for ticket creation & SLA components
  code?: string;
  name?: string;
  customer_name?: string;
  customer_id?: string;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
  owner_name?: string;
  owner_id?: string;
  phu_trach?: string;
  ttkd?: string;
  value?: string;
  ghi_chu?: string;
  
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = "jpt_helpdesk_contracts_cache";

function normalizeContract(c: any): Contract {
  const contract_no = c?.contract_no || c?.code || "";
  const service = c?.service || c?.name || "";
  const signed_date = c?.signed_date || c?.start_date || "";
  const expiry_date = c?.expiry_date || c?.end_date || "";
  const customer = c?.customer || c?.customer_name || "";
  const am = c?.am || c?.owner_name || c?.phu_trach || "";
  const customer_id = c?.customer_id || undefined;
  const supplier_id = c?.supplier_id || undefined;

  return {
    ...c,
    id: c?.id || "",
    customer_id,
    supplier_id,
    contract_no,
    project_id: c?.project_id || "",
    status: c?.status || "Active",
    signed_date,
    expiry_date,
    service,
    contract_type: c?.contract_type || "Hợp đồng dịch vụ",
    description: c?.description || "",
    supplier: c?.supplier || "",
    end_user: c?.end_user || "",
    customer,
    am,
    team: c?.team || "",
    fy: c?.fy || "",
    // Compat fields
    code: contract_no,
    name: service || contract_no,
    customer_name: customer,
    start_date: signed_date,
    end_date: expiry_date,
    owner_name: am,
    phu_trach: am,
  };
}

// ─── Fetch All Contracts (Uncapped with Chunked Pagination) ──
export async function fetchContracts(): Promise<Contract[]> {
  try {
    const PAGE_SIZE = 1000;
    let allData: any[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.warn("Supabase fetch contracts warning:", error.message);
        break;
      }

      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (allData.length === 0 && typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached).map(normalizeContract);
      }
    }

    const normalized = allData.map(normalizeContract);

    if (typeof window !== "undefined" && normalized.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch (err) {
    console.error("fetchContracts error:", err);
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) return JSON.parse(cached).map(normalizeContract);
    }
    return [];
  }
}

// ─── Fetch Contracts By Customer ──────────────────────────────
export async function fetchContractsByCustomer(customerNameOrCode: string): Promise<Contract[]> {
  const all = await fetchContracts();
  if (!customerNameOrCode) return all;
  const q = customerNameOrCode.trim().toLowerCase();
  return all.filter(c =>
    (c.customer && c.customer.toLowerCase().includes(q)) ||
    (c.end_user && c.end_user.toLowerCase().includes(q)) ||
    (c.customer_name && c.customer_name.toLowerCase().includes(q))
  );
}

// ─── Create Contract ──────────────────────────────────────────
export async function createContract(
  contract: Omit<Contract, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; data?: Contract; error?: string }> {
  try {
    const now = new Date().toISOString();
    const contract_no = (contract.contract_no || contract.code || "").trim();

    const payload = {
      contract_no,
      customer_id: contract.customer_id || null,
      supplier_id: contract.supplier_id || null,
      project_id: contract.project_id?.trim() || null,
      status: contract.status || "Active",
      signed_date: contract.signed_date || contract.start_date || null,
      expiry_date: contract.expiry_date || contract.end_date || null,
      service: (contract.service || contract.name || "").trim() || null,
      contract_type: contract.contract_type || "Hợp đồng dịch vụ",
      description: contract.description?.trim() || null,
      supplier: contract.supplier?.trim() || null,
      end_user: contract.end_user?.trim() || null,
      customer: (contract.customer || contract.customer_name || "").trim() || null,
      am: (contract.am || contract.owner_name || contract.phu_trach || "").trim() || null,
      team: (contract.team || contract.ttkd || "").trim() || null,
      fy: contract.fy?.trim() || null,
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
        const newCtr: Contract = normalizeContract({
          ...payload,
          id: `local-${Date.now()}`,
        });
        cached.unshift(newCtr);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cached));
        return { success: true, data: newCtr };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: normalizeContract(data) };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi tạo hợp đồng" };
  }
}

// ─── Update Contract ──────────────────────────────────────────
export async function updateContract(
  id: string,
  updates: Partial<Contract>
): Promise<{ success: boolean; data?: Contract; error?: string }> {
  try {
    const now = new Date().toISOString();
    const payload: any = {
      ...updates,
      updated_at: now,
    };

    if (updates.code && !updates.contract_no) payload.contract_no = updates.code;
    if (updates.name && !updates.service) payload.service = updates.name;
    if (updates.customer_name && !updates.customer) payload.customer = updates.customer_name;
    if (updates.start_date && !updates.signed_date) payload.signed_date = updates.start_date;
    if (updates.end_date && !updates.expiry_date) payload.expiry_date = updates.end_date;

    const { data, error } = await supabase
      .from("contracts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (typeof window !== "undefined") {
        const cached: Contract[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        const idx = cached.findIndex(c => c.id === id);
        if (idx !== -1) {
          cached[idx] = normalizeContract({ ...cached[idx], ...payload });
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cached));
          return { success: true, data: cached[idx] };
        }
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: normalizeContract(data) };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi cập nhật hợp đồng" };
  }
}

// ─── Delete Contract ──────────────────────────────────────────
export async function deleteContract(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", id);

    if (error) {
      if (typeof window !== "undefined") {
        const cached: Contract[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
        const filtered = cached.filter(c => c.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi xóa hợp đồng" };
  }
}

// ─── Upsert Contract From Import ──────────────────────────────
export async function upsertContractFromImport(
  c: Partial<Contract> & { contract_no: string }
): Promise<{ success: boolean; action?: "created" | "updated"; error?: string }> {
  try {
    const contract_no = (c.contract_no || c.code || "").trim();
    if (!contract_no) {
      return { success: false, error: "Thiếu CONTRACT NO" };
    }

    let existingId: string | null = null;
    const { data } = await supabase
      .from("contracts")
      .select("id")
      .ilike("contract_no", contract_no)
      .maybeSingle();

    if (data) existingId = data.id;

    const payload = {
      contract_no,
      project_id: c.project_id?.trim() || null,
      status: c.status?.trim() || "Active",
      signed_date: (c.signed_date || c.start_date)?.trim() || null,
      expiry_date: (c.expiry_date || c.end_date)?.trim() || null,
      service: (c.service || c.name)?.trim() || null,
      contract_type: c.contract_type?.trim() || "Hợp đồng dịch vụ",
      description: c.description?.trim() || null,
      supplier: c.supplier?.trim() || null,
      end_user: c.end_user?.trim() || null,
      customer: (c.customer || c.customer_name)?.trim() || null,
      am: (c.am || c.owner_name || c.phu_trach)?.trim() || null,
      team: (c.team || c.ttkd)?.trim() || null,
      fy: c.fy?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (existingId) {
      const { error } = await supabase
        .from("contracts")
        .update(payload)
        .eq("id", existingId);

      if (error) return { success: false, error: error.message };
      return { success: true, action: "updated" };
    } else {
      const { error } = await supabase
        .from("contracts")
        .insert([{
          ...payload,
          created_at: new Date().toISOString(),
        }]);

      if (error) return { success: false, error: error.message };
      return { success: true, action: "created" };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi upsert hợp đồng" };
  }
}

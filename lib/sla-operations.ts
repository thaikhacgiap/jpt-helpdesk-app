import { supabase } from "./supabase";

export interface SLASetting {
  id: string;
  sla_id: string;
  customer_id: string | null;
  customer_name: string | null;
  contract_id: string | null;
  contract_no: string | null;
  priority: string;
  response_time: number;
  resolve_time: number;
  created_at: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = "jpt_helpdesk_sla_cache";

export const DEFAULT_SLA_SETTINGS: SLASetting[] = [
  {
    id: "sla-default-001",
    sla_id: "SLA-001",
    customer_id: "e13f866b-90b4-488b-9d82-684784e62c4e",
    customer_name: "Công Ty Cổ Phần Chăn Nuôi C.P Việt Nam - Chi Nhánh tại Đồng Tháp",
    contract_id: "d9275166-a279-4412-bbaa-97ccf290a33f",
    contract_no: "18/2024/CNTTBV-JPROTECH",
    priority: "L1",
    response_time: 15,
    resolve_time: 120,
    created_at: "2026-08-15T08:00:00.000Z"
  },
  {
    id: "sla-default-002",
    sla_id: "SLA-002",
    customer_id: "e13f866b-90b4-488b-9d82-684784e62c4e",
    customer_name: "Công Ty Cổ Phần Chăn Nuôi C.P Việt Nam - Chi Nhánh tại Đồng Tháp",
    contract_id: "d9275166-a279-4412-bbaa-97ccf290a33f",
    contract_no: "18/2024/CNTTBV-JPROTECH",
    priority: "L2",
    response_time: 30,
    resolve_time: 240,
    created_at: "2026-08-16T08:00:00.000Z"
  },
  {
    id: "sla-default-003",
    sla_id: "SLA-003",
    customer_id: "7db1ae33-6673-4801-b2cd-3cd7a9a7ab79",
    customer_name: "Công ty TNHH ORACLE VIỆT NAM",
    contract_id: "bd140a76-7bff-425c-ab66-049d847df76b",
    contract_no: "2005-24/HDDV/JPT-SVT",
    priority: "L1",
    response_time: 10,
    resolve_time: 60,
    created_at: "2026-08-17T08:00:00.000Z"
  },
  {
    id: "sla-default-004",
    sla_id: "SLA-004",
    customer_id: "7db1ae33-6673-4801-b2cd-3cd7a9a7ab79",
    customer_name: "Công ty TNHH ORACLE VIỆT NAM",
    contract_id: "bd140a76-7bff-425c-ab66-049d847df76b",
    contract_no: "2005-24/HDDV/JPT-SVT",
    priority: "L2",
    response_time: 45,
    resolve_time: 360,
    created_at: "2026-08-18T08:00:00.000Z"
  },
  {
    id: "sla-default-005",
    sla_id: "SLA-005",
    customer_id: "1928173b-1770-446e-a7e9-2c55e6969e7b",
    customer_name: "CÔNG TY TRÁCH NHIỆM HỮU HẠN TÂN ĐỆ",
    contract_id: "5a12dbdd-f593-42e9-8c9f-6d374455db5d",
    contract_no: "01.17-0524.JPT-A.DUY/BG.DHH",
    priority: "L3",
    response_time: 120,
    resolve_time: 1440,
    created_at: "2026-08-19T08:00:00.000Z"
  },
  {
    id: "sla-default-006",
    sla_id: "SLA-006",
    customer_id: "1928173b-1770-446e-a7e9-2c55e6969e7b",
    customer_name: "CÔNG TY TRÁCH NHIỆM HỮU HẠN TÂN ĐỆ",
    contract_id: "5a12dbdd-f593-42e9-8c9f-6d374455db5d",
    contract_no: "01.17-0524.JPT-A.DUY/BG.DHH",
    priority: "L4",
    response_time: 240,
    resolve_time: 2880,
    created_at: "2026-08-20T08:00:00.000Z"
  },
  {
    id: "sla-default-007",
    sla_id: "SLA-007",
    customer_id: "8ff0a39d-8645-447b-97c2-9a54eeece749",
    customer_name: "Bộ Tài nguyên và Môi trường",
    contract_id: "7732082a-4217-469c-8d0a-673eaa700986",
    contract_no: "16230224.JPT-HN/BG.VTV",
    priority: "L1",
    response_time: 15,
    resolve_time: 180,
    created_at: "2026-08-21T08:00:00.000Z"
  },
  {
    id: "sla-default-008",
    sla_id: "SLA-008",
    customer_id: "8ff0a39d-8645-447b-97c2-9a54eeece749",
    customer_name: "Bộ Tài nguyên và Môi trường",
    contract_id: "7732082a-4217-469c-8d0a-673eaa700986",
    contract_no: "16230224.JPT-HN/BG.VTV",
    priority: "L2",
    response_time: 60,
    resolve_time: 480,
    created_at: "2026-08-22T08:00:00.000Z"
  },
  {
    id: "sla-default-009",
    sla_id: "SLA-009",
    customer_id: "e4e5b4ee-da8d-4ff9-abe3-b60c7de8ed7a",
    customer_name: "CÔNG TY ĐIỆN LỰC BÌNH PHƯỚC",
    contract_id: "280965d6-13e7-40be-a5a7-43bf95abe037",
    contract_no: "1705/JPT-BVĐKCL/HĐKT",
    priority: "L2",
    response_time: 30,
    resolve_time: 300,
    created_at: "2026-08-23T08:00:00.000Z"
  },
  {
    id: "sla-default-010",
    sla_id: "SLA-010",
    customer_id: "e4e5b4ee-da8d-4ff9-abe3-b60c7de8ed7a",
    customer_name: "CÔNG TY ĐIỆN LỰC BÌNH PHƯỚC",
    contract_id: "280965d6-13e7-40be-a5a7-43bf95abe037",
    contract_no: "1705/JPT-BVĐKCL/HĐKT",
    priority: "L3",
    response_time: 180,
    resolve_time: 1440,
    created_at: "2026-08-24T08:00:00.000Z"
  }
];

export async function fetchSLASettings(): Promise<SLASetting[]> {
  try {
    const { data, error } = await supabase
      .from("sla_settings")
      .select("*")
      .order("sla_id", { ascending: true });

    if (!error && data && data.length > 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
      return data as SLASetting[];
    }
  } catch (err) {
    console.warn("fetchSLASettings Supabase query warning:", err);
  }

  // Fallback to local storage or defaults
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SLA_SETTINGS));
    } catch {}
  }

  return DEFAULT_SLA_SETTINGS;
}

export async function generateSlaId(): Promise<string> {
  const current = await fetchSLASettings();
  if (!current || current.length === 0) return "SLA-001";
  
  const numbers = current.map(s => {
    const match = s.sla_id.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  });
  
  const maxNum = Math.max(...numbers, 0);
  return `SLA-${String(maxNum + 1).padStart(3, "0")}`;
}

export async function saveSLASetting(sla: Partial<SLASetting>): Promise<{ success: boolean; data?: SLASetting; error?: string }> {
  try {
    const currentList = await fetchSLASettings();
    let updatedList: SLASetting[] = [];

    if (sla.id) {
      // Update
      const { data, error } = await supabase
        .from("sla_settings")
        .update({
          ...sla,
          updated_at: new Date().toISOString()
        })
        .eq("id", sla.id)
        .select();

      updatedList = currentList.map(item => item.id === sla.id ? { ...item, ...sla, updated_at: new Date().toISOString() } as SLASetting : item);
    } else {
      // Insert
      const newSlaId = sla.sla_id || (await generateSlaId());
      const newRecord: SLASetting = {
        id: sla.id || `sla-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sla_id: newSlaId,
        customer_id: sla.customer_id || null,
        customer_name: sla.customer_name || null,
        contract_id: sla.contract_id || null,
        contract_no: sla.contract_no || null,
        priority: sla.priority || "L1",
        response_time: sla.response_time || 15,
        resolve_time: sla.resolve_time || 120,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from("sla_settings").insert([newRecord]);
      } catch {}

      updatedList = [...currentList, newRecord];
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteSLASetting(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      await supabase.from("sla_settings").delete().eq("id", id);
    } catch {}

    const currentList = await fetchSLASettings();
    const filtered = currentList.filter(item => item.id !== id);

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

import { supabase } from "./supabase";

export interface OperationLog {
  id?: string;
  user_email: string;
  user_name: string;
  action: string;
  details?: string;
  created_at?: string;
}

function getLocalCurrentUser() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem("jpt_auth_session");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

export async function logOperation(action: string, details?: string): Promise<boolean> {
  const currentUser = getLocalCurrentUser();
  const email = currentUser ? currentUser.email : "system@jpt.vn";
  const name = currentUser ? currentUser.name : "Hệ thống";

  try {
    const { error } = await supabase
      .from("operation_logs")
      .insert([
        {
          user_email: email,
          user_name: name,
          action,
          details
        }
      ]);

    if (error) {
      console.error("Error inserting operation log:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Logger error:", err);
    return false;
  }
}

export async function fetchOperationLogs(): Promise<OperationLog[]> {
  try {
    const { data, error } = await supabase
      .from("operation_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching operation logs:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Error fetching operation logs:", err);
    return [];
  }
}

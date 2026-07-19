import { supabase } from "@/lib/supabase";
import { generateNextPortalTicketId } from "@/lib/ticket-operations";

export interface ServiceTicket {
  id: string;
  ticket_id: string;
  title: string;
  description: string;
  tt_type: string;
  category: string;
  priority: string;
  tt_status: string;
  start_time: string;
  end_time: string;
  created_at: string;
  customer_id: string;
  document_link?: string;
  remark?: string;       // stores contract info: "Hợp đồng: XYZ"
  hold_reason?: string;  // stores affected service description
  contract_no?: string;  // contract number (if column exists)
}

export interface DashboardStats {
  total_tickets: number;
  tickets_by_status: Record<string, number>;
  tickets_by_priority: Record<string, number>;
  total_resolved: number;
  average_resolution_time: number | null;
}

// Fetch tickets for a specific customer
export async function fetchCustomerTickets(customerId: string): Promise<ServiceTicket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get dashboard statistics for a customer
export async function getDashboardStats(customerId: string): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("customer_id", customerId);

  if (error) throw error;

  const tickets = data || [];
  const total_tickets = tickets.length;

  // Count by status
  const tickets_by_status: Record<string, number> = {};
  tickets.forEach(ticket => {
    const status = ticket.tt_status || "Unknown";
    tickets_by_status[status] = (tickets_by_status[status] || 0) + 1;
  });

  // Count by priority
  const tickets_by_priority: Record<string, number> = {};
  tickets.forEach(ticket => {
    const priority = ticket.priority || "Unknown";
    tickets_by_priority[priority] = (tickets_by_priority[priority] || 0) + 1;
  });

  // Count resolved tickets
  const total_resolved = tickets.filter(t => t.tt_status === "Resolved" || t.tt_status === "Closed").length;

  // Calculate average resolution time (in hours)
  let average_resolution_time: number | null = null;
  const resolvedTickets = tickets.filter(t => t.end_time && t.start_time);
  if (resolvedTickets.length > 0) {
    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const start = new Date(ticket.start_time).getTime();
      const end = new Date(ticket.end_time).getTime();
      return sum + (end - start);
    }, 0);
    average_resolution_time = Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // Convert to hours
  }

  return {
    total_tickets,
    tickets_by_status,
    tickets_by_priority,
    total_resolved,
    average_resolution_time,
  };
}

// Create a new service request ticket
export async function createServiceRequest(customerId: string, data: {
  title: string;
  description: string;
  tt_type: string;
  category: string;
  priority: string;
  contract_no?: string;
  affected_service?: string;
  start_time?: string;
}): Promise<ServiceTicket> {
  // Generate next ticket ID — use shared TH-YYYYMMDD-NNN format
  const ticket_id = await generateNextPortalTicketId();

  // Validate that customerId exists in DB to avoid FK violation
  let validCustomerId: string | null = null;
  if (customerId) {
    const { data: custCheck } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .maybeSingle();
    validCustomerId = custCheck ? customerId : null;
  }

  // Store contract number in remark field
  const remarkParts: string[] = [];
  if (data.contract_no) remarkParts.push(`Hợp đồng: ${data.contract_no}`);

  const { data: newTicket, error } = await supabase
    .from("tickets")
    .insert({
      ticket_id,
      title: data.title,
      description: data.description,
      customer_id: validCustomerId,
      tt_type: data.tt_type,
      category: data.category,
      priority: data.priority,
      remark: remarkParts.length > 0 ? remarkParts.join(" | ") : null,
      // Store affected service separately in hold_reason for easy display
      hold_reason: data.affected_service || null,
      tt_status: "New",
      start_time: data.start_time || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return newTicket;
}

// Get customer info
export async function getCustomerInfo(customerId: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) throw error;
  return data;
}

// Fetch all tickets from the database for management
export async function fetchAllTickets(): Promise<ServiceTicket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Update ticket status or attributes
export async function updateServiceTicket(id: string, updates: any): Promise<void> {
  const { error } = await supabase
    .from("tickets")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

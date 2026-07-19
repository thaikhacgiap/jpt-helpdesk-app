import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for database tables
export interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  position?: string
  department?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  type?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  customer_id?: string
  position?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  code: string
  name: string
  customer_id?: string
  start_date?: string
  end_date?: string
  value?: number
  status?: string
  owner_id?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  ticket_id: string
  title: string
  description?: string
  customer_id?: string
  customer_name?: string
  contract_no?: string
  contract_id?: string
  tt_type?: string
  contract_scope?: string
  category?: string
  priority?: string
  creator_id?: string
  creator_name?: string
  assigned?: string
  following?: string
  sla_time?: string
  sla_status?: string
  contract_status?: string
  tt_status?: string
  progress?: string
  start_time?: string
  end_time?: string
  close_time?: string
  hold_time?: string
  hold_reason?: string
  remark?: string
  document_link?: string
  unhold_time?: string
  onsite?: string
  runbook?: string
  created_at: string
  updated_at: string
}

export interface TicketUpdate {
  id: string
  ticket_id: string
  updated_by?: string
  update_content: string
  old_status?: string
  new_status?: string
  created_at: string
}

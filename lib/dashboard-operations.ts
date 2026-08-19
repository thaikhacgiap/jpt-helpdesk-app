import { supabase } from '@/lib/supabase'

export interface DashboardData {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  slaBreached: number
  newToday: number
  totalCustomers: number
  totalContracts: number
  totalStaff: number
  ticketsByStatus: { name: string; value: number; color: string }[]
  ticketsByPriority: { name: string; value: number; color: string }[]
  ticketTrend: { date: string; count: number }[]
  recentTickets: any[]
}

const STATUS_COLORS: Record<string, string> = {
  'New': '#3B82F6',
  'In Progress': '#F59E0B',
  'On Hold': '#EF4444',
  'Resolved': '#10B981',
  'Closed': '#8B5CF6',
}

const PRIORITY_COLORS: Record<string, string> = {
  'Low': '#10B981',
  'Medium': '#F59E0B',
  'High': '#EF4444',
  'Critical': '#7C3AED',
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [ticketsRes, customersRes, contractsRes, staffRes] = await Promise.all([
    supabase.from('tickets').select('*').order('created_at', { ascending: false }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('*', { count: 'exact', head: true }),
    supabase.from('nhan_su').select('*', { count: 'exact', head: true }),
  ])

  const tickets = ticketsRes.data || []
  const today = new Date().toISOString().split('T')[0]

  const totalTickets = tickets.length
  const openTickets = tickets.filter(t => ['New', 'In Progress'].includes(t.tt_status)).length
  const resolvedTickets = tickets.filter(t => ['Resolved', 'Closed'].includes(t.tt_status)).length
  const slaBreached = tickets.filter(t => t.sla_status === 'Breached').length
  const newToday = tickets.filter(t => t.created_at?.startsWith(today)).length

  const statusMap: Record<string, number> = {}
  tickets.forEach(t => {
    const s = t.tt_status || 'Unknown'
    statusMap[s] = (statusMap[s] || 0) + 1
  })
  const ticketsByStatus = Object.entries(statusMap).map(([name, value]) => ({
    name, value, color: STATUS_COLORS[name] || '#6B7280',
  }))

  const priorityMap: Record<string, number> = {}
  tickets.forEach(t => {
    const p = t.priority || 'Unknown'
    priorityMap[p] = (priorityMap[p] || 0) + 1
  })
  const ticketsByPriority = Object.entries(priorityMap).map(([name, value]) => ({
    name, value, color: PRIORITY_COLORS[name] || '#6B7280',
  }))

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
  const ticketTrend = last7Days.map(date => ({
    date: date.slice(5),
    count: tickets.filter(t => t.created_at?.startsWith(date)).length,
  }))

  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    slaBreached,
    newToday,
    totalCustomers: customersRes.count || 0,
    totalContracts: contractsRes.count || 0,
    totalStaff: staffRes.count || 0,
    ticketsByStatus,
    ticketsByPriority,
    ticketTrend,
    recentTickets: tickets.slice(0, 8),
  }
}

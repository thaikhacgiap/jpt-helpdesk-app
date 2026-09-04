import { supabase, Ticket, TicketUpdate } from '@/lib/supabase'

// Generate next ticket ID — format: TK-YYYYMMDD-NNN
export async function generateNextTicketId(): Promise<string> {
  // Today's date string e.g. "20260623"
  const today = new Date()
  const dateStr = today.getFullYear().toString()
    + String(today.getMonth() + 1).padStart(2, '0')
    + String(today.getDate()).padStart(2, '0')

  const prefix = `TK-${dateStr}-`

  // Find highest sequence number for today
  const { data, error } = await supabase
    .from('tickets')
    .select('ticket_id')
    .like('ticket_id', `${prefix}%`)
    .order('ticket_id', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching last ticket:', error)
    return `${prefix}001`
  }

  if (!data || data.length === 0) return `${prefix}001`

  // Extract sequence number from last ticket ID and increment
  const lastSeq = data[0].ticket_id.split('-').pop() || '000'
  const nextSeq = String(parseInt(lastSeq, 10) + 1).padStart(3, '0')
  return `${prefix}${nextSeq}`
}

// Generate next Portal request ticket ID — format: CR-YYYYMMDD-NNN
export async function generateNextPortalTicketId(): Promise<string> {
  const today = new Date()
  const dateStr = today.getFullYear().toString()
    + String(today.getMonth() + 1).padStart(2, '0')
    + String(today.getDate()).padStart(2, '0')

  const prefix = `CR-${dateStr}-`
  const fallbackPrefix = `TH-${dateStr}-`

  // Find highest sequence number for today starting with CR-YYYYMMDD- or TH-YYYYMMDD-
  const { data, error } = await supabase
    .from('tickets')
    .select('ticket_id')
    .or(`ticket_id.like.${prefix}%,ticket_id.like.${fallbackPrefix}%`)
    .order('ticket_id', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching last portal ticket:', error)
    return `${prefix}001`
  }

  if (!data || data.length === 0) return `${prefix}001`

  // Extract sequence number from last ticket ID and increment
  const lastSeq = data[0].ticket_id.split('-').pop() || '000'
  const nextSeq = String(parseInt(lastSeq, 10) + 1).padStart(3, '0')
  return `${prefix}${nextSeq}`
}


// Helper to get SLA duration based on priority level
export function getDefaultSlaDuration(priority?: string): string {
  const p = (priority || '').toLowerCase();
  if (p.includes('l1') || p.includes('critical')) return '2h';
  if (p.includes('l2') || p.includes('major') || p.includes('high')) return '4h';
  if (p.includes('l3') || p.includes('minor') || p.includes('medium')) return '24h';
  if (p.includes('l4') || p.includes('warning') || p.includes('low')) return '48h';
  return '24h';
}

// Create new ticket
export async function createTicket(formData: any): Promise<{ success: boolean; ticketId?: string; dbId?: string; error?: string }> {
  try {
    const ticketId = await generateNextTicketId()

    // Determine creator name from formData or active user session
    let creatorName = formData.creatorName || formData.creator_name || null;
    if (!creatorName && typeof window !== 'undefined') {
      try {
        const authSession = localStorage.getItem('jpt_auth_session');
        if (authSession) {
          const parsed = JSON.parse(authSession);
          if (parsed?.name) {
            creatorName = parsed.name;
          }
        }
      } catch {}
    }

    const nowIso = new Date().toISOString();
    const startTime = formData.startTime || formData.start_time || nowIso;
    const slaTime = formData.slaTime || formData.sla_time || getDefaultSlaDuration(formData.priority);

    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        ticket_id:      ticketId,
        title:          formData.title,
        description:    formData.description,
        customer_id:    formData.customerId    || null,
        customer_name:  formData.customerName  || null,
        contract_id:    formData.contractId    || null,
        contract_no:    formData.contractNo    || null,
        tt_type:        formData.ttType        || null,
        contract_scope: formData.contractScope || null,
        category:       formData.category      || null,
        priority:       formData.priority      || null,
        creator_name:   creatorName,
        assigned:       Array.isArray(formData.assigned) ? formData.assigned.join(', ') : (formData.assigned || null),
        following:      Array.isArray(formData.following) ? formData.following.join(', ') : (formData.following || null),
        tt_status:      formData.ttStatus      || 'In progress',
        sla_status:     formData.slaStatus     || 'Under SLA',
        sla_time:       slaTime,
        start_time:     startTime,
        end_time:       formData.endTime       || null,
        tt_close_time:  formData.closeTime     || null,
        hold_time:      formData.holdTime      || null,
        hold_reason:    formData.holdReason    || null,
        remark:         formData.remark        || null,
        document_link:  formData.documentLink  || null,
        progress:       formData.progress      || null,
        unhold_time:    formData.unholdTime    || null,
        onsite:         formData.onsite        || null,
        runbook:        formData.runbook       || null,
        created_at:     nowIso,
        updated_at:     nowIso,
      }])
      .select()

    if (error) {
      console.error('Error creating ticket:', error)
      return { success: false, error: error.message }
    }

    const dbId = data?.[0]?.id || ''
    return { success: true, ticketId, dbId }
  } catch (error) {
    console.error('Error creating ticket:', error)
    return { success: false, error: String(error) }
  }
}

// Fetch all tickets (excluding Requests)
export async function fetchTickets(): Promise<Ticket[]> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
      return []
    }

    // Filter out only customer/service requests (CR-, TH-, SR-, TR-)
    const ticketsOnly = (data || []).filter(t => {
      const tid = (t.ticket_id || '').toUpperCase();
      if (tid.startsWith('CR-') || tid.startsWith('TH-') || tid.startsWith('SR-') || tid.startsWith('TR-')) return false;
      return true;
    });

    return ticketsOnly;
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return []
  }
}

// Fetch single ticket by ID
export async function fetchTicketById(ticketId: string): Promise<Ticket | null> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_id', ticketId)
      .single()

    if (error) {
      console.error('Error fetching ticket:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return null
  }
}

// Update ticket
export async function updateTicket(ticketId: string, updates: any): Promise<{ success: boolean; error?: string }> {
  try {
    // First get the ticket to find its database ID - handle both formats
    let ticketDbId = ticketId;
    
    // If it looks like a ticket_id (TH-1021), fetch the database ID
    if (ticketId.includes('-')) {
      const { data: ticketData, error: fetchError } = await supabase
        .from('tickets')
        .select('id')
        .eq('ticket_id', ticketId)
        .single()

      if (fetchError || !ticketData) {
        return { success: false, error: 'Ticket not found' }
      }
      ticketDbId = ticketData.id
    }

    const { error } = await supabase
      .from('tickets')
      .update({
        start_time: updates.startTime,
        end_time: updates.endTime,
        tt_status: updates.ttStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketDbId)

    if (error) {
      console.error('Error updating ticket:', error)
      return { success: false, error: error.message }
    }

    // Add ticket update to history
    if (updates.updates) {
      await addTicketUpdate(ticketDbId, updates)
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating ticket:', error)
    return { success: false, error: String(error) }
  }
}

// Add ticket update/note
export async function addTicketUpdate(ticketDbId: string, updateData: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ticket_updates')
      .insert([{
        ticket_id: ticketDbId,
        update_content: updateData.updates,
        new_status: updateData.ttStatus,
      }])

    if (error) {
      console.error('Error adding ticket update:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error adding ticket update:', error)
    return false
  }
}

// Delete ticket
export async function deleteTicket(idOrTicketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the ticket first to get both id and ticket_id
    const { data: ticketData } = await supabase
      .from('tickets')
      .select('id, ticket_id')
      .or(`id.eq.${idOrTicketId},ticket_id.eq.${idOrTicketId}`)
      .maybeSingle()

    const targetId = ticketData?.id || idOrTicketId
    const targetTicketId = ticketData?.ticket_id || idOrTicketId

    // Remove any related ticket_updates
    try {
      await supabase
        .from('ticket_updates')
        .delete()
        .or(`ticket_id.eq.${targetId},ticket_id.eq.${targetTicketId}`)
    } catch {}

    // Delete the ticket record
    const { error } = await supabase
      .from('tickets')
      .delete()
      .or(`id.eq.${targetId},ticket_id.eq.${targetTicketId}`)

    if (error) {
      console.error('Error deleting ticket:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return { success: false, error: String(error) }
  }
}

// Fetch updates history for a ticket
export async function fetchTicketUpdates(ticketDbId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('ticket_updates')
      .select('*')
      .eq('ticket_id', ticketDbId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching ticket updates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching ticket updates:', error)
    return []
  }
}


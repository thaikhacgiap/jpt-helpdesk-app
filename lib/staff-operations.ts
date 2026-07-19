import { supabase } from '@/lib/supabase'

export interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  position?: string
  department?: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export async function fetchStaff(): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching staff:', error)
    return []
  }
  return data || []
}

export async function createStaff(formData: {
  name: string
  email: string
  phone?: string
  position?: string
  department?: string
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('staff')
    .insert([{
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      position: formData.position || null,
      department: formData.department || null,
      active: true,
    }])

  if (error) {
    console.error('Error creating staff:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function updateStaff(id: string, updates: Partial<Staff>): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('staff')
    .update({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      position: updates.position,
      department: updates.department,
      active: updates.active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating staff:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function toggleStaffActive(id: string, active: boolean): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('staff')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteStaff(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting staff:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

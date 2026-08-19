import { supabase } from '@/lib/supabase'

export interface Contact {
  id: string
  code: string           // CTC-001, CTC-002, ...  (auto-generated)
  customer_code?: string // Mã khách hàng → customers.code
  customer_name?: string // Tên KH (denormalized để hiển thị)
  ho_ten: string         // Họ và tên
  bo_phan?: string       // Bộ phận
  chuc_danh?: string     // Chức danh / Chức vụ
  so_may_ban?: string    // Số máy bàn
  so_di_dong?: string    // Số di động
  email?: string
  dia_chi?: string       // Địa chỉ
  ghi_chu?: string       // Ghi chú
  created_at?: string
  updated_at?: string
}

// ─── Auto-generate mã CTC-xxx ───────────────────────────────
export async function generateNextContactCode(): Promise<string> {
  const { data, error } = await supabase
    .from('contacts')
    .select('code')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data || data.length === 0) return 'CTC-001'

  let max = 0
  for (const row of data) {
    const match = (row.code as string)?.match(/^CTC-(\d+)$/)
    if (match) {
      const n = parseInt(match[1])
      if (n > max) max = n
    }
  }
  return `CTC-${String(max + 1).padStart(3, '0')}`
}

// ─── Fetch all ───────────────────────────────────────────────
export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchContacts:', JSON.stringify(error)); return [] }
  return data || []
}

// ─── Fetch by customer code ──────────────────────────────────
export async function fetchContactsByCustomerCode(customerCode: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('customer_code', customerCode)
    .order('created_at', { ascending: false })
  if (error) { console.error('fetchContactsByCustomer:', JSON.stringify(error)); return [] }
  return data || []
}

// ─── Create ──────────────────────────────────────────────────
export async function createContact(formData: any): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const code = formData.code?.trim() || await generateNextContactCode()
    const { error } = await supabase.from('contacts').insert([{
      code,
      customer_code: formData.customer_code || null,
      customer_name: formData.customer_name || null,
      ho_ten: formData.ho_ten,
      bo_phan: formData.bo_phan || null,
      chuc_danh: formData.chuc_danh || null,
      so_may_ban: formData.so_may_ban || null,
      so_di_dong: formData.so_di_dong || null,
      email: formData.email || null,
      dia_chi: formData.dia_chi || null,
      ghi_chu: formData.ghi_chu || null,
    }])
    if (error) {
      console.error('createContact:', JSON.stringify(error))
      return { success: false, error: error.message }
    }
    return { success: true, code }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Update ──────────────────────────────────────────────────
export async function updateContact(id: string, formData: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('contacts')
      .update({
        customer_code: formData.customer_code || null,
        customer_name: formData.customer_name || null,
        ho_ten: formData.ho_ten,
        bo_phan: formData.bo_phan || null,
        chuc_danh: formData.chuc_danh || null,
        so_may_ban: formData.so_may_ban || null,
        so_di_dong: formData.so_di_dong || null,
        email: formData.email || null,
        dia_chi: formData.dia_chi || null,
        ghi_chu: formData.ghi_chu || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) {
      console.error('updateContact:', JSON.stringify(error))
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Delete ──────────────────────────────────────────────────
export async function deleteContact(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error, count } = await supabase
      .from('contacts')
      .delete({ count: 'exact' })
      .eq('id', id)
    if (error) {
      console.error('deleteContact:', JSON.stringify(error))
      return { success: false, error: error.message }
    }
    if (count === 0) return { success: false, error: 'Không tìm thấy liên hệ.' }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Count ───────────────────────────────────────────────────
export async function getContactsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
  if (error) return 0
  return count || 0
}

// ─── Upsert Contact from Import ──────────────────────────────
export async function upsertContactFromImport(
  c: Partial<Contact> & { ho_ten: string }
): Promise<{ success: boolean; action?: 'created' | 'updated'; error?: string }> {
  try {
    const code = c.code?.trim()
    let existingId: string | null = null

    if (code) {
      const { data } = await supabase
        .from('contacts')
        .select('id')
        .eq('code', code)
        .maybeSingle()
      if (data) existingId = data.id
    }

    if (!existingId && c.email?.trim()) {
      const { data } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', c.email.trim())
        .maybeSingle()
      if (data) existingId = data.id
    }

    if (existingId) {
      const { error } = await supabase
        .from('contacts')
        .update({
          customer_code: c.customer_code || null,
          customer_name: c.customer_name || null,
          ho_ten: c.ho_ten,
          bo_phan: c.bo_phan || null,
          chuc_danh: c.chuc_danh || null,
          so_may_ban: c.so_may_ban || null,
          so_di_dong: c.so_di_dong || null,
          email: c.email || null,
          dia_chi: c.dia_chi || null,
          ghi_chu: c.ghi_chu || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingId)

      if (error) return { success: false, error: error.message }
      return { success: true, action: 'updated' }
    } else {
      const finalCode = code || await generateNextContactCode()
      const { error } = await supabase
        .from('contacts')
        .insert([{
          code: finalCode,
          customer_code: c.customer_code || null,
          customer_name: c.customer_name || null,
          ho_ten: c.ho_ten,
          bo_phan: c.bo_phan || null,
          chuc_danh: c.chuc_danh || null,
          so_may_ban: c.so_may_ban || null,
          so_di_dong: c.so_di_dong || null,
          email: c.email || null,
          dia_chi: c.dia_chi || null,
          ghi_chu: c.ghi_chu || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])

      if (error) return { success: false, error: error.message }
      return { success: true, action: 'created' }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi upsert liên hệ' }
  }
}

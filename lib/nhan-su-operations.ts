import { supabase } from '@/lib/supabase'

export interface NhanSu {
  id: string
  ma_nhan_su: string
  ten_nhan_su: string
  bo_phan: string
  chuc_vu: string
  phu_trach: string
  ngay_sinh: string
  so_cccd: string
  cap_ngay: string
  email: string
  so_dien_thoai: string
  dia_chi: string
  created_at?: string
  updated_at?: string
}

// Generate next mã nhân sự: NS-001, NS-002, ...
export async function generateNextMaNhanSu(): Promise<string> {
  const { data, error } = await supabase
    .from('nhan_su')
    .select('ma_nhan_su')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return 'NS-001'

  const lastCode = data[0].ma_nhan_su
  const match = lastCode.match(/NS-(\d+)/)
  if (!match) return 'NS-001'
  const number = parseInt(match[1]) + 1
  return `NS-${String(number).padStart(3, '0')}`
}

// Fetch all nhan su
export async function fetchNhanSu(): Promise<NhanSu[]> {
  try {
    const { data, error } = await supabase
      .from('nhan_su')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching nhan_su:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching nhan_su:', error)
    return []
  }
}

// Create nhan su
export async function createNhanSu(formData: Omit<NhanSu, 'id' | 'ma_nhan_su' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
  try {
    const ma_nhan_su = await generateNextMaNhanSu()

    const { error } = await supabase
      .from('nhan_su')
      .insert([{
        ma_nhan_su,
        ten_nhan_su: formData.ten_nhan_su,
        bo_phan: formData.bo_phan,
        chuc_vu: formData.chuc_vu,
        phu_trach: formData.phu_trach,
        ngay_sinh: formData.ngay_sinh,
        so_cccd: formData.so_cccd,
        cap_ngay: formData.cap_ngay,
        email: formData.email,
        so_dien_thoai: formData.so_dien_thoai,
        dia_chi: formData.dia_chi,
      }])

    if (error) {
      console.error('Error creating nhan_su:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating nhan_su:', error)
    return { success: false, error: String(error) }
  }
}

// Update nhan su
export async function updateNhanSu(id: string, updates: Partial<NhanSu>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('nhan_su')
      .update({
        ten_nhan_su: updates.ten_nhan_su,
        bo_phan: updates.bo_phan,
        chuc_vu: updates.chuc_vu,
        phu_trach: updates.phu_trach,
        ngay_sinh: updates.ngay_sinh,
        so_cccd: updates.so_cccd,
        cap_ngay: updates.cap_ngay,
        email: updates.email,
        so_dien_thoai: updates.so_dien_thoai,
        dia_chi: updates.dia_chi,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating nhan_su:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating nhan_su:', error)
    return { success: false, error: String(error) }
  }
}

// Delete nhan su
export async function deleteNhanSu(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('nhan_su')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting nhan_su:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting nhan_su:', error)
    return { success: false, error: String(error) }
  }
}

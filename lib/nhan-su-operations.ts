import { supabase } from '@/lib/supabase'

export interface NhanSu {
  id: string
  ma_nhan_su: string
  ten_nhan_su: string
  bo_phan: string
  chuc_vu: string
  phu_trach: string
  ngay_sinh: string | null
  so_cccd: string
  cap_ngay: string | null
  email: string
  so_dien_thoai: string
  dia_chi: string
  created_at?: string
  updated_at?: string
}

export function sanitizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const str = String(raw).trim()
  if (!str) return null

  // Check Excel serial number (e.g., 32145 or 44521)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10)
    const utcDays = serial - 25569
    const date = new Date(utcDays * 86400 * 1000)
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
  }

  // Check DD/MM/YYYY, M/D/YYYY, MM/DD/YYYY with slash or dash
  const slashMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (slashMatch) {
    const n1 = parseInt(slashMatch[1], 10)
    const n2 = parseInt(slashMatch[2], 10)
    const y = slashMatch[3]

    // If first number > 12, it must be DAY (DD/MM/YYYY)
    if (n1 > 12 && n2 <= 12) {
      return `${y}-${String(n2).padStart(2, '0')}-${String(n1).padStart(2, '0')}`
    }
    // If second number > 12, it must be DAY (MM/DD/YYYY)
    if (n2 > 12 && n1 <= 12) {
      return `${y}-${String(n1).padStart(2, '0')}-${String(n2).padStart(2, '0')}`
    }
    // Default to DD/MM/YYYY for Vietnamese data
    return `${y}-${String(n2).padStart(2, '0')}-${String(n1).padStart(2, '0')}`
  }

  // Check YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10)
  }

  return null
}

// Generate next mã nhân sự: NS-001, NS-002, ...
export async function generateNextMaNhanSu(): Promise<string> {
  const { data, error } = await supabase
    .from('nhan_su')
    .select('ma_nhan_su')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data || data.length === 0) return 'NS-001'

  let max = 0
  for (const row of data) {
    const match = (row.ma_nhan_su as string)?.match(/NS-(\d+)/)
    if (match) {
      const n = parseInt(match[1], 10)
      if (n > max) max = n
    }
  }
  return `NS-${String(max + 1).padStart(3, '0')}`
}

// Fetch all nhan su (Uncapped with Chunked Pagination)
export async function fetchNhanSu(): Promise<NhanSu[]> {
  try {
    const PAGE_SIZE = 1000
    let allData: NhanSu[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('nhan_su')
        .select('*')
        .order('created_at', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        console.error('Error fetching nhan_su:', error)
        break
      }

      if (!data || data.length === 0) break
      allData = allData.concat(data)
      if (data.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    return allData
  } catch (error) {
    console.error('Error fetching nhan_su:', error)
    return []
  }
}

// Create nhan su
export async function createNhanSu(formData: {
  ma_nhan_su?: string
  ten_nhan_su: string
  bo_phan?: string
  chuc_vu?: string
  phu_trach?: string
  ngay_sinh?: string | null
  so_cccd?: string
  cap_ngay?: string | null
  email?: string
  so_dien_thoai?: string
  dia_chi?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const ma_nhan_su = formData.ma_nhan_su?.trim() || await generateNextMaNhanSu()

    const { error } = await supabase
      .from('nhan_su')
      .insert([{
        ma_nhan_su,
        ten_nhan_su: formData.ten_nhan_su.trim(),
        bo_phan: formData.bo_phan?.trim() || '',
        chuc_vu: formData.chuc_vu?.trim() || '',
        phu_trach: formData.phu_trach?.trim() || '',
        ngay_sinh: sanitizeDate(formData.ngay_sinh),
        so_cccd: formData.so_cccd?.trim() || '',
        cap_ngay: sanitizeDate(formData.cap_ngay),
        email: formData.email?.trim() || '',
        so_dien_thoai: formData.so_dien_thoai?.trim() || '',
        dia_chi: formData.dia_chi?.trim() || '',
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
    const payload: any = {
      updated_at: new Date().toISOString()
    }

    if (updates.ten_nhan_su !== undefined && updates.ten_nhan_su.trim() !== '') {
      payload.ten_nhan_su = updates.ten_nhan_su.trim()
    }
    if (updates.bo_phan !== undefined) payload.bo_phan = updates.bo_phan
    if (updates.chuc_vu !== undefined) payload.chuc_vu = updates.chuc_vu
    if (updates.phu_trach !== undefined) payload.phu_trach = updates.phu_trach
    if (updates.ngay_sinh !== undefined) payload.ngay_sinh = sanitizeDate(updates.ngay_sinh)
    if (updates.so_cccd !== undefined) payload.so_cccd = updates.so_cccd
    if (updates.cap_ngay !== undefined) payload.cap_ngay = sanitizeDate(updates.cap_ngay)
    if (updates.email !== undefined) payload.email = updates.email
    if (updates.so_dien_thoai !== undefined) payload.so_dien_thoai = updates.so_dien_thoai
    if (updates.dia_chi !== undefined) payload.dia_chi = updates.dia_chi

    const { error } = await supabase
      .from('nhan_su')
      .update(payload)
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

// Upsert Nhan Su from Import
export async function upsertNhanSuFromImport(
  ns: Partial<NhanSu> & { ten_nhan_su?: string }
): Promise<{ success: boolean; action?: 'created' | 'updated'; error?: string }> {
  try {
    const ma_nhan_su = ns.ma_nhan_su?.trim()
    const ten_nhan_su = ns.ten_nhan_su?.trim() || ''

    let existingRow: any = null

    if (ma_nhan_su) {
      const { data } = await supabase
        .from('nhan_su')
        .select('*')
        .eq('ma_nhan_su', ma_nhan_su)
        .maybeSingle()
      if (data) existingRow = data
    }

    if (!existingRow && ns.email?.trim()) {
      const { data } = await supabase
        .from('nhan_su')
        .select('*')
        .eq('email', ns.email.trim())
        .maybeSingle()
      if (data) existingRow = data
    }

    if (!existingRow && ten_nhan_su) {
      const { data } = await supabase
        .from('nhan_su')
        .select('*')
        .ilike('ten_nhan_su', ten_nhan_su)
        .maybeSingle()
      if (data) existingRow = data
    }

    if (existingRow) {
      const payload: any = {
        updated_at: new Date().toISOString()
      }

      // STRICT: Only update name if incoming name is non-empty and not just a code
      if (ten_nhan_su && ten_nhan_su.trim() !== "" && !ten_nhan_su.startsWith("NS-")) {
        payload.ten_nhan_su = ten_nhan_su.trim()
      }
      if (ns.bo_phan !== undefined && ns.bo_phan.trim() !== '') payload.bo_phan = ns.bo_phan.trim()
      if (ns.chuc_vu !== undefined && ns.chuc_vu.trim() !== '') payload.chuc_vu = ns.chuc_vu.trim()
      if (ns.phu_trach !== undefined && ns.phu_trach.trim() !== '') payload.phu_trach = ns.phu_trach.trim()
      if (ns.ngay_sinh !== undefined) payload.ngay_sinh = sanitizeDate(ns.ngay_sinh)
      if (ns.so_cccd !== undefined && ns.so_cccd.trim() !== '') payload.so_cccd = ns.so_cccd.trim()
      if (ns.cap_ngay !== undefined) payload.cap_ngay = sanitizeDate(ns.cap_ngay)
      if (ns.email !== undefined && ns.email.trim() !== '') payload.email = ns.email.trim()
      if (ns.so_dien_thoai !== undefined && ns.so_dien_thoai.trim() !== '') payload.so_dien_thoai = ns.so_dien_thoai.trim()
      if (ns.dia_chi !== undefined && ns.dia_chi.trim() !== '') payload.dia_chi = ns.dia_chi.trim()

      const { error } = await supabase
        .from('nhan_su')
        .update(payload)
        .eq('id', existingRow.id)

      if (error) return { success: false, error: error.message }
      return { success: true, action: 'updated' }
    } else {
      const finalCode = ma_nhan_su || await generateNextMaNhanSu()
      const finalName = (ten_nhan_su && !ten_nhan_su.startsWith("NS-")) ? ten_nhan_su : `Nhân viên ${finalCode}`

      const { error } = await supabase
        .from('nhan_su')
        .insert([{
          ma_nhan_su: finalCode,
          ten_nhan_su: finalName,
          bo_phan: ns.bo_phan || '',
          chuc_vu: ns.chuc_vu || '',
          phu_trach: ns.phu_trach || '',
          ngay_sinh: sanitizeDate(ns.ngay_sinh),
          so_cccd: ns.so_cccd || '',
          cap_ngay: sanitizeDate(ns.cap_ngay),
          email: ns.email || '',
          so_dien_thoai: ns.so_dien_thoai || '',
          dia_chi: ns.dia_chi || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])

      if (error) return { success: false, error: error.message }
      return { success: true, action: 'created' }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi upsert nhân sự' }
  }
}

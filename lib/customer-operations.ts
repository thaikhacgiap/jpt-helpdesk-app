import { supabase } from '@/lib/supabase'

export interface Customer {
  id: string
  system_code?: string     // Code hệ thống (ví dụ: KH-001, KH-002) - Tự động gán
  code: string            // Mã Khách Hàng (lấy từ cột "Mã Khách Hàng" trong import)
  name: string            // Tên Khách Hàng (lấy từ cột "Tên Hiển Thị" trong import)
  ten_tieng_anh?: string  // Tên Tiếng Anh (lấy từ cột "Tên Tiếng Anh" trong import)
  ttkd?: string           // TTKD (để trống khi import, edit trên UI)
  phu_trach?: string      // Người phụ trách (để trống khi import, chọn từ bảng nhan_su)
  ghi_chu?: string        // Ghi chú
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  type?: string
  phan_loai?: string
  tinh_trang?: string
  khu_vuc?: string
  created_at?: string
  updated_at?: string
}

// Generate next auto system code: KH-001, KH-002...
export async function getNextSystemCode(): Promise<string> {
  try {
    const { data } = await supabase
      .from('customers')
      .select('system_code')
      .not('system_code', 'is', null)

    let maxNum = 0
    if (data && data.length > 0) {
      data.forEach((row: any) => {
        if (row.system_code && typeof row.system_code === 'string') {
          const match = row.system_code.match(/KH-(\d+)/i)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num > maxNum) maxNum = num
          }
        }
      })
    }
    const nextNum = maxNum + 1
    return `KH-${String(nextNum).padStart(3, '0')}`
  } catch (err) {
    return `KH-001`
  }
}

// Check if a customer code already exists
export async function checkCustomerCodeExists(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('customers')
    .select('code')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle()

  if (error) return false
  return !!data
}

// Upsert single customer from import (Sheet / CSV)
export async function upsertCustomerFromImport(item: {
  code?: string
  name: string
  ten_tieng_anh?: string
}): Promise<{ success: boolean; action: 'created' | 'updated'; error?: string }> {
  try {
    let code = (item.code || '').trim().toUpperCase()
    const name = (item.name || '').trim()
    const ten_tieng_anh = (item.ten_tieng_anh || '').trim()

    if (!name) {
      return { success: false, action: 'created', error: 'Thiếu Tên hiển thị/Tên khách hàng.' }
    }

    let existing: any = null

    // 1. Match by exact code (skip AUTO- codes)
    if (code && !code.startsWith('AUTO-')) {
      const { data } = await supabase
        .from('customers')
        .select('id, system_code, code')
        .ilike('code', code)   // case-insensitive
        .maybeSingle()
      existing = data
    }

    // 2. Fallback: match by name (case-insensitive)
    if (!existing) {
      const { data } = await supabase
        .from('customers')
        .select('id, system_code, code')
        .ilike('name', name)   // case-insensitive
        .maybeSingle()
      existing = data
    }

    if (existing) {
      // Update existing record - include code update
      const updatePayload: any = {
        name,
        ten_tieng_anh: ten_tieng_anh || null,
        tinh_trang: 'Active',  // re-activate if previously set Inactive
        updated_at: new Date().toISOString(),
      }
      // Only update code if it's a real code (not AUTO-)
      if (code && !code.startsWith('AUTO-')) {
        updatePayload.code = code
      }

      const { error } = await supabase
        .from('customers')
        .update(updatePayload)
        .eq('id', existing.id)

      if (error) return { success: false, action: 'updated', error: error.message }
      return { success: true, action: 'updated' }
    } else {
      // Insert new record with auto-generated system_code
      const system_code = await getNextSystemCode()
      if (!code || code.startsWith('AUTO-')) {
        code = system_code
      }

      const { error } = await supabase
        .from('customers')
        .insert([{
          system_code,
          code,
          name,
          ten_tieng_anh: ten_tieng_anh || null,
          ttkd: null,
          phu_trach: null,
          tinh_trang: 'Active'
        }])

      if (error) return { success: false, action: 'created', error: error.message }
      return { success: true, action: 'created' }
    }
  } catch (error: any) {
    return { success: false, action: 'created', error: error.message || String(error) }
  }
}

// Create new customer manually
export async function createCustomer(formData: any): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const code = (formData.code || '').trim().toUpperCase()
    if (!code) return { success: false, error: 'Vui lòng nhập mã khách hàng.' }

    // Duplicate check
    const exists = await checkCustomerCodeExists(code)
    if (exists) return { success: false, error: `Mã khách hàng "${code}" đã tồn tại.` }

    const system_code = formData.system_code || await getNextSystemCode()

    const { error } = await supabase
      .from('customers')
      .insert([{
        system_code,
        code,
        name: formData.name,
        ten_tieng_anh: formData.ten_tieng_anh || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        contact_person: formData.contact_person || null,
        contact_phone: formData.contact_phone || null,
        type: formData.type || null,
        phan_loai: formData.phan_loai || null,
        tinh_trang: formData.tinh_trang || 'Active',
        khu_vuc: formData.khu_vuc || null,
        phu_trach: formData.phu_trach || null,
        ttkd: formData.ttkd || null,
        ghi_chu: formData.ghi_chu || null,
      }])

    if (error) {
      console.error('Error creating customer:', error)
      return { success: false, error: error.message }
    }

    return { success: true, customerId: code }
  } catch (error) {
    console.error('Error creating customer:', error)
    return { success: false, error: String(error) }
  }
}

// Fetch all customers (Uncapped with Chunked Pagination)
export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const PAGE_SIZE = 1000;
    let allData: Customer[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching customers:', error);
        break;
      }

      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    return allData;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

// Fetch single customer by ID or code
export async function fetchCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`code.eq.${customerId},system_code.eq.${customerId},id.eq.${customerId}`)
      .single()

    if (error) {
      console.error('Error fetching customer:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching customer:', error)
    return null
  }
}

// Update customer (allows updating internal fields like ttkd, phu_trach, ghi_chu)
export async function updateCustomer(customerId: string, updates: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('customers')
      .update({
        ten_tieng_anh: updates.ten_tieng_anh !== undefined ? updates.ten_tieng_anh : undefined,
        phu_trach: updates.phu_trach || null,
        ttkd: updates.ttkd || null,
        ghi_chu: updates.ghi_chu || null,
        updated_at: new Date().toISOString(),
      })
      .or(`code.eq.${customerId},id.eq.${customerId}`)

    if (error) {
      console.error('Error updating customer:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating customer:', error)
    return { success: false, error: String(error) }
  }
}

// Delete customer by code or id
export async function deleteCustomer(customerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error, count } = await supabase
      .from('customers')
      .delete({ count: 'exact' })
      .or(`code.eq.${customerId},id.eq.${customerId}`)

    if (error) {
      console.error('Error deleting customer:', JSON.stringify(error))

      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('fkey')) {
        return {
          success: false,
          error: 'Không thể xóa: Khách hàng này đang có ticket liên quan. Hãy xóa hoặc chuyển ticket trước.',
        }
      }
      if (error.code === '42501' || error.message?.includes('policy')) {
        return { success: false, error: 'Không có quyền xóa. Kiểm tra RLS policy trong Supabase.' }
      }

      return { success: false, error: error.message }
    }

    if (count === 0) {
      return { success: false, error: 'Không tìm thấy bản ghi để xóa (mã không khớp).' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return { success: false, error: String(error) }
  }
}

// Get customer count
export async function getCustomerCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    if (error) return 0
    return count || 0
  } catch (error) {
    return 0
  }
}

// Get customers by type
export async function getCustomersByType(type: string): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) return []
    return data || []
  } catch (error) {
    return []
  }
}


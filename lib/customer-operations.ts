import { supabase } from '@/lib/supabase'

export interface Customer {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  type?: string          // Loại doanh nghiệp: BANK, GOV, CORP, SME, ...
  phan_loai?: string     // Phân loại: End User / Partner / Reseller / ...
  tinh_trang?: string    // Active / Inactive
  khu_vuc?: string       // Bắc / Trung / Nam
  phu_trach?: string     // Tên người phụ trách (từ nhân sự)
  ttkd?: string          // TTKD code
  ghi_chu?: string       // Ghi chú
  created_at?: string
  updated_at?: string
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

// Create new customer (code is provided by user)
export async function createCustomer(formData: any): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const code = (formData.code || '').trim().toUpperCase()
    if (!code) return { success: false, error: 'Vui lòng nhập mã khách hàng.' }

    // Duplicate check
    const exists = await checkCustomerCodeExists(code)
    if (exists) return { success: false, error: `Mã khách hàng "${code}" đã tồn tại.` }

    const { error } = await supabase
      .from('customers')
      .insert([{
        code,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        contact_person: formData.phu_trach || formData.contact_person || null,
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

// Fetch all customers
export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching customers:', error)
    return []
  }
}

// Fetch single customer by ID
export async function fetchCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('code', customerId)
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

// Update customer
export async function updateCustomer(customerId: string, updates: any): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('customers')
      .update({
        name: updates.name,
        email: updates.email || null,
        phone: updates.phone || null,
        address: updates.address || null,
        contact_person: updates.phu_trach || updates.contact_person || null,
        contact_phone: updates.contact_phone || null,
        type: updates.type || null,
        phan_loai: updates.phan_loai || null,
        tinh_trang: updates.tinh_trang || null,
        khu_vuc: updates.khu_vuc || null,
        phu_trach: updates.phu_trach || null,
        ttkd: updates.ttkd || null,
        ghi_chu: updates.ghi_chu || null,
        updated_at: new Date().toISOString(),
      })
      .eq('code', customerId)

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

// Delete customer by code
export async function deleteCustomer(customerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error, count } = await supabase
      .from('customers')
      .delete({ count: 'exact' })
      .eq('code', customerId)

    if (error) {
      console.error('Error deleting customer:', JSON.stringify(error))

      // Foreign key constraint — customer has related tickets
      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('fkey')) {
        return {
          success: false,
          error: 'Không thể xóa: Khách hàng này đang có ticket liên quan. Hãy xóa hoặc chuyển ticket trước.',
        }
      }
      // RLS / permission error
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

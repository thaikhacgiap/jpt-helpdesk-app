import { supabase } from '@/lib/supabase'

export interface Contract {
  id: string
  code: string          // Mã HĐ (auto: CTR-001, CTR-002,...)
  contract_no?: string  // Số HĐ (do người dùng nhập, vd: ACB-02-20045)
  name: string          // Tên HĐ
  contract_type?: string // Loại HĐ
  customer_id?: string
  customer_name?: string // join từ customers
  customer_code?: string // join từ customers
  owner_name?: string    // Phụ trách HĐ
  start_date?: string    // Ngày bắt đầu HĐ
  end_date?: string      // Ngày kết thúc HĐ
  signed_date?: string   // Ngày ký HĐ
  status?: string        // Tình trạng
  description?: string   // Ghi chú
  value?: number
  created_at?: string
  updated_at?: string
}

// Generate next contract code (CTR-001, CTR-002, ...)
export async function generateNextContractCode(): Promise<string> {
  const { data, error } = await supabase
    .from('contracts')
    .select('code')
    .like('code', 'CTR-%')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return 'CTR-001'

  const lastCode = data[0].code
  const parts = lastCode.split('-')
  const number = parseInt(parts[parts.length - 1]) + 1
  return `CTR-${String(number).padStart(3, '0')}`
}

// Create new contract
export async function createContract(formData: any): Promise<{ success: boolean; contractId?: string; error?: string }> {
  try {
    const code = await generateNextContractCode()

    // Lookup customer UUID by code if provided
    let customerId: string | null = null
    if (formData.customerCode) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('code', formData.customerCode.trim().toUpperCase())
        .maybeSingle()
      customerId = customerData?.id ?? null
    }

    const { error } = await supabase
      .from('contracts')
      .insert([{
        code,
        contract_no: formData.contractNo || null,
        name: formData.name,
        contract_type: formData.contractType || 'Hợp đồng dịch vụ',
        customer_id: customerId,
        owner_name: formData.ownerName || null,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        signed_date: formData.signedDate || null,
        status: formData.status || 'Active',
        description: formData.description || null,
        value: formData.value ? parseFloat(formData.value) : null,
      }])

    if (error) {
      console.error('Error creating contract:', error)
      return { success: false, error: error.message }
    }

    return { success: true, contractId: code }
  } catch (error) {
    console.error('Error creating contract:', error)
    return { success: false, error: String(error) }
  }
}

// Fetch all contracts with customer name join
export async function fetchContracts(): Promise<Contract[]> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id, code, contract_no, name, contract_type,
        customer_id, owner_name,
        start_date, end_date, signed_date,
        status, description, value, created_at, updated_at,
        customers (code, name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contracts:', error)
      return []
    }

    // Flatten customer join
    const flattened = (data || []).map((row: any) => ({
      ...row,
      customer_name: row.customers?.name ?? null,
      customer_code: row.customers?.code ?? null,
      customers: undefined,
    }))

    return flattened as Contract[]
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return []
  }
}

// Fetch contracts by customer
export async function fetchContractsByCustomer(customerId: string): Promise<Contract[]> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contracts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return []
  }
}

// Fetch single contract by code
export async function fetchContractById(contractId: string): Promise<Contract | null> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        id, code, contract_no, name, contract_type,
        customer_id, owner_name,
        start_date, end_date, signed_date,
        status, description, value, created_at, updated_at,
        customers (code, name)
      `)
      .eq('code', contractId)
      .single()

    if (error) {
      console.error('Error fetching contract:', error)
      return null
    }

    const row: any = data
    return {
      ...row,
      customer_name: row.customers?.name ?? null,
      customer_code: row.customers?.code ?? null,
      customers: undefined,
    } as Contract
  } catch (error) {
    console.error('Error fetching contract:', error)
    return null
  }
}

// Update contract
export async function updateContract(contractCode: string, updates: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Lookup customer UUID if customerCode changed
    let customerId: string | null | undefined = undefined
    if (updates.customerCode !== undefined) {
      if (updates.customerCode) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('code', updates.customerCode.trim().toUpperCase())
          .maybeSingle()
        customerId = customerData?.id ?? null
      } else {
        customerId = null
      }
    }

    const payload: any = {
      updated_at: new Date().toISOString(),
    }
    if (updates.contractNo !== undefined) payload.contract_no = updates.contractNo || null
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.contractType !== undefined) payload.contract_type = updates.contractType || null
    if (customerId !== undefined) payload.customer_id = customerId
    if (updates.ownerName !== undefined) payload.owner_name = updates.ownerName || null
    if (updates.startDate !== undefined) payload.start_date = updates.startDate || null
    if (updates.endDate !== undefined) payload.end_date = updates.endDate || null
    if (updates.signedDate !== undefined) payload.signed_date = updates.signedDate || null
    if (updates.status !== undefined) payload.status = updates.status || null
    if (updates.description !== undefined) payload.description = updates.description || null
    if (updates.value !== undefined) payload.value = updates.value ? parseFloat(updates.value) : null

    const { error } = await supabase
      .from('contracts')
      .update(payload)
      .eq('code', contractCode)

    if (error) {
      console.error('Error updating contract:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating contract:', error)
    return { success: false, error: String(error) }
  }
}

// Delete contract
export async function deleteContract(contractCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('code', contractCode)

    if (error) {
      console.error('Error deleting contract:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting contract:', error)
    return { success: false, error: String(error) }
  }
}

// Get contracts count
export async function getContractsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })

    if (error) return 0
    return count || 0
  } catch (error) {
    return 0
  }
}

// Get contracts by status
export async function getContractsByStatus(status: string): Promise<Contract[]> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) return []
    return data || []
  } catch (error) {
    return []
  }
}

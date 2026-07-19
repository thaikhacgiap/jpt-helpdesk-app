import { supabase } from '@/lib/supabase'

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Test basic connection by fetching from staff table
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      }
    }

    return {
      success: true,
      message: `Connected successfully! Found ${data?.length || 0} staff records.`
    }
  } catch (error) {
    console.error('Connection test error:', error)
    return {
      success: false,
      message: `Connection test failed: ${String(error)}`
    }
  }
}

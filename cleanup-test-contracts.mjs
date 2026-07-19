// cleanup-test-contracts.mjs
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://bxxzmfchmbhwoaazvjxb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'
)

async function cleanup() {
  // Xóa schema test records
  const { error: e1 } = await supabase
    .from('contracts')
    .delete()
    .like('code', '_SCHEMA_TEST_%')
  console.log(e1 ? '✗ Schema test delete: ' + e1.message : '✓ Đã xóa _SCHEMA_TEST_* records')

  // Xóa CT-0001 test record
  const { error: e2 } = await supabase
    .from('contracts')
    .delete()
    .eq('code', 'CT-0001')
  console.log(e2 ? '✗ CT-0001 delete: ' + e2.message : '✓ Đã xóa CT-0001 record')

  console.log('✅ Cleanup xong!')
}

cleanup().catch(console.error)

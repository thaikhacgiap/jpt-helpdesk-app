// run-alter-table.mjs
// Thêm các cột mới vào bảng contracts qua Supabase RPC

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bxxzmfchmbhwoaazvjxb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHptZmNobWJod29hYXp2anhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjU5NTYsImV4cCI6MjA5NTY0MTk1Nn0.dmSbyQF8hveECNuogyb4jBkuxCQlEOtDelFCC7l_D1c'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Thử upsert với tất cả cột để biết cột nào đang thiếu
async function checkColumns() {
  // Insert một bản ghi test để xem schema hiện tại
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .limit(1)
  
  if (data && data.length > 0) {
    console.log('Các cột hiện có:', Object.keys(data[0]))
  } else {
    console.log('Bảng trống hoặc lỗi:', error?.message)
    // Thử lấy schema từ empty table
    const { data: d2, error: e2 } = await supabase
      .from('contracts')
      .select('id, code, name')
      .limit(0)
    console.log('Test query:', e2?.message || 'OK')
  }
}

checkColumns()

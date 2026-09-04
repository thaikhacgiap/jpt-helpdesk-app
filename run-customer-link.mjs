import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/)[1].trim();
const supabase = createClient(url, key);

async function main() {
  console.log('🔄 Đang kiểm tra liên kết giữa customers và contracts/opportunities...');
  
  // 1. Lấy tất cả khách hàng
  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .select('id, code, name, ten_tieng_anh');

  if (custErr || !customers) {
    console.error('❌ Lỗi lấy danh sách khách hàng:', custErr?.message);
    return;
  }
  console.log(`✅ Đã tải ${customers.length} khách hàng.`);

  // 2. Lấy tất cả hợp đồng
  const { data: contracts, error: contrErr } = await supabase
    .from('contracts')
    .select('id, contract_no, customer');

  if (contrErr || !contracts) {
    console.error('❌ Lỗi lấy danh sách hợp đồng:', contrErr?.message);
    return;
  }
  console.log(`✅ Đã tải ${contracts.length} hợp đồng.`);

  // 3. Xây dựng bản đồ mapping từ Tên / Mã / Tên tiếng Anh sang customer_id
  const nameMap = new Map();
  customers.forEach(c => {
    if (c.name) nameMap.set(c.name.trim().toLowerCase(), c.id);
    if (c.code) nameMap.set(c.code.trim().toLowerCase(), c.id);
    if (c.ten_tieng_anh) nameMap.set(c.ten_tieng_anh.trim().toLowerCase(), c.id);
  });

  let matched = 0;
  let unmatched = 0;
  const sampleMatches = [];
  const sampleUnmatched = [];

  contracts.forEach(ctr => {
    const rawName = (ctr.customer || '').trim();
    const cleanName = rawName.toLowerCase();
    
    let matchedId = nameMap.get(cleanName);
    
    // Thử so khớp lỏng hơn nếu chưa match
    if (!matchedId && cleanName) {
      for (const [key, id] of nameMap.entries()) {
        if (key.includes(cleanName) || cleanName.includes(key)) {
          matchedId = id;
          break;
        }
      }
    }

    if (matchedId) {
      matched++;
      if (sampleMatches.length < 5) {
        sampleMatches.push({ contract_no: ctr.contract_no, customer: rawName, matched_customer_id: matchedId });
      }
    } else {
      unmatched++;
      if (sampleUnmatched.length < 5 && rawName) {
        sampleUnmatched.push({ contract_no: ctr.contract_no, customer: rawName });
      }
    }
  });

  console.log('\n📊 KẾT QUẢ PHÂN TÍCH SO KHỚP HỢP ĐỒNG:');
  console.log(`- Khớp thành công: ${matched} / ${contracts.length} (${((matched/contracts.length)*100).toFixed(1)}%)`);
  console.log(`- Chưa khớp (do tên khác hoặc KH lẻ): ${unmatched} / ${contracts.length}`);
  
  console.log('\n🔍 Ví dụ các dòng khớp thành công:');
  console.log(sampleMatches);

  if (sampleUnmatched.length > 0) {
    console.log('\n⚠️ Ví dụ các dòng chưa khớp (tên viết tắt hoặc khác cấu trúc):');
    console.log(sampleUnmatched);
  }
}

main().catch(console.error);

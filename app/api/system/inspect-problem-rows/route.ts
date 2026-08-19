import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  const admin = getAdmin();
  
  // Search for the 4 problematic items
  const { data: wasuco } = await admin.from("customers").select("*").or("code.ilike.%wasuco%,name.ilike.%chợ lớn%,name.ilike.%cho lon%");
  const { data: pvgazprom } = await admin.from("customers").select("*").or("code.ilike.%pvgazprom%,name.ilike.%pvgazprom%");
  const { data: bvtd } = await admin.from("customers").select("*").or("code.ilike.%bvtd%,name.ilike.%từ dũ%,name.ilike.%thủ đức%");
  const { data: hipt } = await admin.from("customers").select("*").or("code.ilike.%hipt%,name.ilike.%hipt%");

  return NextResponse.json({
    wasuco,
    pvgazprom,
    bvtd,
    hipt,
  });
}

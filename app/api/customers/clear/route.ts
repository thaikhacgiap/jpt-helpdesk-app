import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseKey);

    const steps: string[] = [];
    const errors: string[] = [];

    // Count before
    const { count: beforeCount } = await client
      .from("customers")
      .select("*", { count: "exact", head: true });
    steps.push(`Before: ${beforeCount} customers`);

    // Get all customer IDs
    const { data: customers } = await client.from("customers").select("id");
    if (!customers || customers.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, remaining: 0, message: "Bảng customers đã trống" });
    }
    const custIds = customers.map((c: any) => c.id);

    // Get contract IDs linked to these customers  
    const { data: contracts } = await client.from("contracts").select("id").in("customer_id", custIds);
    const contractIds = (contracts || []).map((c: any) => c.id);
    steps.push(`Found ${contractIds.length} linked contracts`);

    // STEP 1: Nullify tickets.contract_id for all linked contracts FIRST
    if (contractIds.length > 0) {
      const { error: e1 } = await client
        .from("tickets")
        .update({ contract_id: null })
        .in("contract_id", contractIds);
      if (e1) errors.push("step1 (tickets.contract_id=null): " + e1.message);
      else steps.push("Step1: nullified tickets.contract_id OK");
    }

    // STEP 2: Nullify tickets.customer_id
    const { error: e2 } = await client
      .from("tickets")
      .update({ customer_id: null })
      .in("customer_id", custIds);
    if (e2) errors.push("step2 (tickets.customer_id=null): " + e2.message);
    else steps.push("Step2: nullified tickets.customer_id OK");

    // STEP 3: Delete contracts
    if (contractIds.length > 0) {
      const { error: e3 } = await client
        .from("contracts")
        .delete()
        .in("id", contractIds);
      if (e3) errors.push("step3 (delete contracts): " + e3.message);
      else steps.push("Step3: deleted contracts OK");
    }

    // STEP 4: Delete all customers
    const { error: e4 } = await client
      .from("customers")
      .delete()
      .in("id", custIds);
    if (e4) errors.push("step4 (delete customers): " + e4.message);
    else steps.push("Step4: deleted customers OK");

    // Count after
    const { count: afterCount } = await client
      .from("customers")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: errors.length === 0,
      deleted: beforeCount || 0,
      remaining: afterCount || 0,
      steps,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

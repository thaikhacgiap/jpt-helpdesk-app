import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseKey);

    // Count before
    const { count: beforeCount } = await client
      .from("customers")
      .select("*", { count: "exact", head: true });

    const errors: string[] = [];

    // Step 1: Get all customer IDs
    const { data: customerIds } = await client
      .from("customers")
      .select("id");

    if (customerIds && customerIds.length > 0) {
      const ids = customerIds.map((c: any) => c.id);

      // Step 2: Get contract IDs linked to these customers
      const { data: contractData } = await client
        .from("contracts")
        .select("id")
        .in("customer_id", ids);

      if (contractData && contractData.length > 0) {
        const contractIds = contractData.map((c: any) => c.id);

        // Step 3: Nullify contract_id on tickets (don't delete tickets)
        const { error: ticketErr } = await client
          .from("tickets")
          .update({ contract_id: null, customer_id: null })
          .in("contract_id", contractIds);
        if (ticketErr) errors.push("tickets update: " + ticketErr.message);

        // Step 4: Also nullify customer_id on tickets directly
        const { error: ticketCustErr } = await client
          .from("tickets")
          .update({ customer_id: null })
          .in("customer_id", ids);
        if (ticketCustErr) errors.push("tickets customer_id: " + ticketCustErr.message);

        // Step 5: Delete contracts linked to customers
        const { error: contractErr } = await client
          .from("contracts")
          .delete()
          .in("customer_id", ids);
        if (contractErr) errors.push("contracts delete: " + contractErr.message);
      }

      // Step 6: Now delete all customers
      const { error: custErr } = await client
        .from("customers")
        .delete()
        .in("id", ids);
      if (custErr) errors.push("customers delete: " + custErr.message);
    }

    // Count after
    const { count: afterCount } = await client
      .from("customers")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: errors.length === 0,
      deleted: beforeCount || 0,
      remaining: afterCount || 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

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
      .from("tickets")
      .select("*", { count: "exact", head: true });
    steps.push(`Before: ${beforeCount} tickets`);

    // STEP 1: Delete ticket_updates (child of tickets - CASCADE should handle but be explicit)
    const { error: e1 } = await client
      .from("ticket_updates")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (e1) errors.push("ticket_updates: " + e1.message);
    else steps.push("Deleted ticket_updates OK");

    // STEP 2: Delete ticket_assigned
    const { error: e2 } = await client
      .from("ticket_assigned")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (e2) errors.push("ticket_assigned: " + e2.message);
    else steps.push("Deleted ticket_assigned OK");

    // STEP 3: Delete ticket_following
    const { error: e3 } = await client
      .from("ticket_following")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (e3) errors.push("ticket_following: " + e3.message);
    else steps.push("Deleted ticket_following OK");

    // STEP 4: Delete all tickets
    const { error: e4 } = await client
      .from("tickets")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (e4) errors.push("tickets: " + e4.message);
    else steps.push("Deleted tickets OK");

    // Count after
    const { count: afterCount } = await client
      .from("tickets")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: errors.length === 0,
      deleted: beforeCount || 0,
      remaining: afterCount || 0,
      steps,
      errors: errors.length > 0 ? errors : undefined,
      note: "Projects và Maintenance được lưu trong localStorage - xóa qua trình duyệt",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

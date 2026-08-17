import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    // Use service role if available, otherwise anon key (RLS must allow DELETE)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseKey);

    // Get count before deleting
    const { count: beforeCount } = await client
      .from("customers")
      .select("*", { count: "exact", head: true });

    // Delete all customers
    const { error } = await client
      .from("customers")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // match all rows

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Verify after delete
    const { count: afterCount } = await client
      .from("customers")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      success: true,
      deleted: beforeCount || 0,
      remaining: afterCount || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

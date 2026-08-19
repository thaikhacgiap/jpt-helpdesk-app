import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role admin client
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const admin = getAdmin();

  // 1. Fetch ALL customers
  const { data: allRows, error: fetchErr } = await admin
    .from("customers")
    .select("id, code, name, created_at")
    .order("created_at", { ascending: true });

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!allRows?.length) return NextResponse.json({ message: "No data", deleted: 0 });

  // 2. Group by normalized code - keep earliest created_at, delete rest
  const grouped = new Map<string, typeof allRows>();
  for (const row of allRows) {
    const key = (row.code || row.name || "").trim().toLowerCase();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  const toDelete: string[] = [];
  for (const [, rows] of grouped) {
    if (rows.length > 1) {
      // Keep first (earliest created_at), delete the rest
      rows.slice(1).forEach(r => toDelete.push(r.id));
    }
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ message: "No duplicates found", deleted: 0, total: allRows.length });
  }

  // 3. Delete duplicates in batches of 100
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    const { error } = await admin.from("customers").delete().in("id", batch);
    if (!error) deleted += batch.length;
    else console.error("Delete batch error:", error.message);
  }

  return NextResponse.json({
    message: `Cleaned up ${deleted} duplicate records`,
    deleted,
    kept: allRows.length - deleted,
    total: allRows.length,
  });
}

export async function GET() {
  // Preview mode: show stats without deleting
  const admin = getAdmin();
  const { data: allRows, error } = await admin.from("customers").select("id, code, name, created_at").order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grouped = new Map<string, number>();
  for (const row of allRows || []) {
    const key = (row.code || row.name || "").trim().toLowerCase();
    grouped.set(key, (grouped.get(key) || 0) + 1);
  }
  const duplicateGroups = [...grouped.entries()].filter(([, count]) => count > 1);
  const duplicateCount = duplicateGroups.reduce((sum, [, count]) => sum + count - 1, 0);

  return NextResponse.json({
    total: allRows?.length,
    uniqueKeys: grouped.size,
    duplicateCount,
    preview: duplicateGroups.slice(0, 20).map(([key, count]) => ({ key, count })),
  });
}

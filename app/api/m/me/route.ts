import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  // 🔑 ต้อง await เพราะ createSupabaseServer เป็น async
  const supabase = await createSupabaseServer();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const uid = userRes.user.id;

  const { data: staff, error: staffErr } = await supabase
    .from("staff")
    .select("id, org_id, display_name")
    .eq("user_id", uid)
    .maybeSingle();

  if (staffErr) {
    return NextResponse.json({ error: staffErr.message }, { status: 400 });
  }
  if (!staff) {
    return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  }

  const { data: wards, error: wardsErr } = await supabase
    .from("staff_wards")
    .select("ward_id, primary_ward")
    .eq("staff_id", staff.id);

  if (wardsErr) {
    return NextResponse.json({ error: wardsErr.message }, { status: 400 });
  }

  return NextResponse.json({
    staff: {
      id: staff.id,
      org_id: staff.org_id,
      display_name: staff.display_name,
    },
    wards: wards ?? [],
  });
}

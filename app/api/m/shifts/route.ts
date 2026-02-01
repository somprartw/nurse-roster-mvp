import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createSupabaseServer();

  // 0) Auth
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const uid = userRes.user.id;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const wardId = searchParams.get("wardId");
  const limit = Number(searchParams.get("limit") ?? "14");

  // 1) map user -> staff
  const { data: staff, error: staffErr } = await supabase
    .from("staff")
    .select("id, org_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (staffErr) {
    return NextResponse.json({ error: staffErr.message }, { status: 400 });
  }
  if (!staff) {
    return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  }

  const fromDate = from ?? new Date().toISOString().slice(0, 10);
  const take = Number.isFinite(limit) && limit > 0 ? limit : 14;

  // 2) Query shifts
  let q = supabase
    .from("shift_instances")
    .select(
      `
      id,
      shift_date,
      ward_id,
      note,
      shift_types:shift_type_id (
        code,
        name,
        start_time,
        end_time,
        cross_midnight,
        allowance_amount
      ),
      shift_instance_staff!shift_instance_staff_shift_instance_id_fkey!inner (
        role_in_shift,
        staff_id,
        org_id
      )
    `
    )
    .eq("shift_instance_staff.staff_id", staff.id)
    .eq("shift_instance_staff.org_id", staff.org_id)
    .gte("shift_date", fromDate)
    .order("shift_date", { ascending: true })
    .limit(take);

  if (wardId) {
    q = q.eq("ward_id", wardId);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 3) map shape ให้ตรงกับหน้า /m
  const items =
    (data ?? []).map((si: any) => ({
      role_in_shift: si.shift_instance_staff?.[0]?.role_in_shift ?? null,

      shift_instance_id: si.id,
      shift_date: si.shift_date,
      ward_id: si.ward_id,

      shift_code: si.shift_types?.code ?? null,
      shift_name: si.shift_types?.name ?? null,

      start_time: si.shift_types?.start_time ?? null,
      end_time: si.shift_types?.end_time ?? null,
      cross_midnight: si.shift_types?.cross_midnight ?? null,

      allowance_amount: si.shift_types?.allowance_amount ?? null,

      // ตอนนี้ DB ไม่มี risk_flag → ส่ง null ไปก่อน
      risk_flag: null,

      note: si.note ?? null,
    })) ?? [];

  return NextResponse.json({ data: items });
}

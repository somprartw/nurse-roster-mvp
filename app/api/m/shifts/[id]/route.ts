// app/api/m/shifts/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CoworkerRow = {
  staff_id: string;
  role_in_shift: string | null;
  staff?: {
    id: string;
    display_name: string;
    position: string;
  } | null;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const { id } = await params;
  const shiftInstanceId = id;

  // Guard: bad id (e.g. "undefined")
  if (!UUID_RE.test(shiftInstanceId)) {
    return NextResponse.json(
      { error: "bad_request", detail: "invalid shift_instance_id", received: shiftInstanceId },
      { status: 400 }
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // 1) Auth
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Staff ของ user
  const { data: staff, error: staffErr } = await supabase
    .from("staff")
    .select("id, org_id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffErr) {
    return NextResponse.json(
      { error: "staff_query_failed", detail: staffErr.message },
      { status: 500 }
    );
  }
  if (!staff) return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  if (staff.is_active === false) return NextResponse.json({ error: "staff_inactive" }, { status: 403 });

  // 3) Detail (schema-accurate)
  const { data: detailRow, error: detailErr } = await supabase
    .from("shift_instance_staff")
    .select(
      `
      shift_instance_id,
      role_in_shift,
      shift_instances:shift_instance_id (
        id,
        org_id,
        ward_id,
        period_id,
        shift_date,
        shift_type_id,
        risk_flag,
        note,
        changed_after_final,
        changed_at,
        shift_type:shift_types!shift_type_id (
          id,
          code,
          name,
          start_time,
          end_time,
          cross_midnight,
          allowance_amount,
          is_active
        )
      )
    `
    )
    .eq("staff_id", staff.id)
    .eq("shift_instance_id", shiftInstanceId)
    .maybeSingle();

  if (detailErr) {
    return NextResponse.json({ error: "query_failed", detail: detailErr.message }, { status: 500 });
  }
  if (!detailRow || !detailRow.shift_instances) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const si: any = detailRow.shift_instances;
  const st: any = si.shift_type ?? null;

  // 4) Coworkers (shift_instance_staff + staff)
  // ถ้า RLS บล็อก/อ่านไม่ได้ ให้ยังส่ง detail ได้ แต่บอก limited
  const { data: coworkerRows, error: coworkerErr } = await supabase
    .from("shift_instance_staff")
    .select(
      `
      staff_id,
      role_in_shift,
      staff:staff_id (
        id,
        display_name,
        position
      )
    `
    )
    .eq("shift_instance_id", shiftInstanceId);

  const coworker_limited = Boolean(coworkerErr);

  const coworkers = ((coworkerRows ?? []) as CoworkerRow[])
    .map((r) => ({
      staff_id: r.staff_id,
      display_name: r.staff?.display_name ?? null,
      position: r.staff?.position ?? null,
      role_in_shift: r.role_in_shift ?? null,
    }))
    .sort((a, b) => String(a.display_name ?? "").localeCompare(String(b.display_name ?? "")));

  // 5) Response shape ตรงกับ ShiftDetailResponse ใน UI
  return NextResponse.json({
    data: {
      shift_instance_id: detailRow.shift_instance_id ?? shiftInstanceId,
      ward_id: si.ward_id ?? null,
      shift_date: si.shift_date ?? null,

      shift_code: st?.code ?? null,
      shift_name: st?.name ?? null,
      start_time: st?.start_time ?? null,
      end_time: st?.end_time ?? null,
      cross_midnight: st?.cross_midnight ?? null,

      note: si.note ?? null,
      changed_after_final: si.changed_after_final ?? null,

      coworkers,
      coworker_limited,
    },
  });
}

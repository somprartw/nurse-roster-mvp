import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseLimit(v: string | null, def = 14) {
  const n = Number(v ?? "");
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.floor(n), 60);
}

export async function GET(req: Request) {
  const cookieStore = await cookies();

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

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: staff, error: staffErr } = await supabase
    .from("staff")
    .select("id, org_id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffErr) {
    return NextResponse.json({ error: "staff_query_failed", detail: staffErr.message }, { status: 500 });
  }
  if (!staff) return NextResponse.json({ error: "staff_not_found" }, { status: 404 });
  if (staff.is_active === false) return NextResponse.json({ error: "staff_inactive" }, { status: 403 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? toISODate(new Date());
  const limit = parseLimit(url.searchParams.get("limit"), 14);

  const { data, error } = await supabase
    .from("shift_instance_staff")
    .select(
      `
      shift_instance_id,
      role_in_shift,
      shift_instances:shift_instance_id (
        id,
        ward_id,
        shift_date,
        shift_type_id,
        risk_flag,
        changed_at,
        shift_type:shift_types!shift_type_id (
          code,
          name,
          start_time,
          end_time,
          cross_midnight
        )
      )
    `
    )
    .eq("staff_id", staff.id)
    .not("shift_instances", "is", null)
    .gte("shift_instances.shift_date", from)
    .order("shift_date", { ascending: true, referencedTable: "shift_instances" })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "query_failed", detail: error.message }, { status: 500 });
  }

  const rows = (data ?? [])
    .filter((r: any) => r.shift_instances && r.shift_instance_id)
    .map((r: any) => {
      const si = r.shift_instances;
      const st = si?.shift_type ?? null;

      return {
        shift_instance_id: r.shift_instance_id ?? null,
        ward_id: si?.ward_id ?? null,
        shift_date: si?.shift_date ?? null,

        shift_code: st?.code ?? null,
        shift_name: st?.name ?? null,
        start_time: st?.start_time ?? null,
        end_time: st?.end_time ?? null,
        cross_midnight: st?.cross_midnight ?? null,

        role_in_shift: r.role_in_shift ?? null,
        risk_flag: si?.risk_flag ?? null,
        changed_at: si?.changed_at ?? null,
      };
    });

  return NextResponse.json({ data: rows });
}

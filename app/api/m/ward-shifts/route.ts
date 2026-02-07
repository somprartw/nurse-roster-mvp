// app/api/m/ward-shifts/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

function monthRange(yyyyMm: string) {
  const [yStr, mStr] = yyyyMm.split("-");
  const y = Number(yStr);
  const m = Number(mStr); // 1-12

  // ใช้ UTC ล้วน กันหลุดวันจาก timezone
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1)); // เดือนถัดไป

  const startISO = start.toISOString().slice(0, 10);
  const endISO = end.toISOString().slice(0, 10);
  return { startISO, endISO };
}

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function toHTTPDate(d: Date) {
  return d.toUTCString();
}

function parseHTTPDate(s: string | null) {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t) : null;
}

export async function GET(req: Request) {
  const cookieStore = await cookies(); // ✅

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

  // staff ของ user
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
  const wardId = url.searchParams.get("wardId");
  const month = url.searchParams.get("month"); // yyyy-mm

  if (!wardId || !month) {
    return NextResponse.json({ error: "bad_request", detail: "wardId and month are required" }, { status: 400 });
  }

  const { startISO, endISO } = monthRange(month);

  // ดึง shifts ของทั้งวอร์ดในเดือนนั้น (base table = shift_instances)
  const { data, error } = await supabase
    .from("shift_instances")
    .select(
      `
      id,
      org_id,
      ward_id,
      shift_date,
      risk_flag,
      changed_after_final,
      changed_at,
      shift_types:shift_type_id (
        code,
        name,
        start_time,
        end_time,
        cross_midnight
      ),
      shift_instance_staff (
        role_in_shift,
        staff:staff_id ( id, display_name, position )
      )
    `
    )
    .eq("org_id", staff.org_id)
    .eq("ward_id", wardId)
    .gte("shift_date", startISO)
    .lt("shift_date", endISO)
    .order("shift_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "query_failed", detail: error.message }, { status: 500 });
  }

  // ✅ map ใหม่ให้ตรงกับ shape ของ data (shift_instances เป็น root)
  const shifts = (data ?? []).flatMap((si: any) => {
    const st = si.shift_types ?? {};
    const rows = si.shift_instance_staff ?? [];

    // ถ้า shift ยังไม่มีคนลงเวร
    if (rows.length === 0) {
      return [
        {
          shift_instance_id: si.id,
          ward_id: si.ward_id ?? null,
          shift_date: si.shift_date ?? null,
          shift_code: st.code ?? null,
          shift_name: st.name ?? null,
          start_time: st.start_time ?? null,
          end_time: st.end_time ?? null,
          cross_midnight: st.cross_midnight ?? null,
          staff_id: null,
          display_name: null,
          position: null,
          role_in_shift: null,
          risk_flag: si.risk_flag ?? false,
          changed_at: si.changed_at ?? null,
          changed_after_final: si.changed_after_final ?? false,
        },
      ];
    }

    // ถ้ามีคนลงเวรแล้ว (หลายคนได้)
    return rows.map((r: any) => ({
      shift_instance_id: si.id,
      ward_id: si.ward_id ?? null,
      shift_date: si.shift_date ?? null,
      shift_code: st.code ?? null,
      shift_name: st.name ?? null,
      start_time: st.start_time ?? null,
      end_time: st.end_time ?? null,
      cross_midnight: st.cross_midnight ?? null,
      staff_id: r.staff?.id ?? null,
      display_name: r.staff?.display_name ?? null,
      position: r.staff?.position ?? null,
      role_in_shift: r.role_in_shift ?? null,
      risk_flag: si.risk_flag ?? false,
      changed_at: si.changed_at ?? null,
      changed_after_final: si.changed_after_final ?? false,
    }));
  });

  // สร้าง marks วันในเดือน (นับจำนวน shift_instance_id ต่อวัน)
  const countByDate: Record<string, number> = {};
  for (const s of shifts) {
    const d = String(s.shift_date ?? "");
    if (!d) continue;
    countByDate[d] = (countByDate[d] ?? 0) + 1;
  }

  const days = Object.entries(countByDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  /**
   * ✅ Conditional GET: ETag + Last-Modified
   * หลักคิด:
   * - ETag ผูกกับ org/ward/month + จำนวนแถว + max(changed_at)
   * - Last-Modified ใช้ max(changed_at) (หรือ fallback เป็น start ของเดือน)
   */
  let maxChangedAt: string | null = null;
  for (const s of shifts) {
    const ca = s.changed_at ? String(s.changed_at) : null;
    if (!ca) continue;
    if (!maxChangedAt || ca > maxChangedAt) maxChangedAt = ca;
  }

  const lastModifiedDate =
    maxChangedAt && !Number.isNaN(Date.parse(maxChangedAt))
      ? new Date(maxChangedAt)
      : new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1));

  const etagRaw = [
    "ward-shifts-v1",
    staff.org_id,
    wardId,
    month,
    String(shifts.length),
    maxChangedAt ?? "none",
  ].join("|");

  // ใส่ quote ตาม RFC
  const etag = `"${sha1(etagRaw)}"`;

  const ifNoneMatch = req.headers.get("if-none-match");
  const ifModifiedSince = parseHTTPDate(req.headers.get("if-modified-since"));

  const notModifiedByEtag = ifNoneMatch ? ifNoneMatch.split(",").map((x) => x.trim()).includes(etag) : false;
  const notModifiedByTime =
    ifModifiedSince ? lastModifiedDate.getTime() <= ifModifiedSince.getTime() : false;

  // headers พื้นฐาน (สำคัญ: vary cookie เพราะ auth)
  const baseHeaders = new Headers();
  baseHeaders.set("ETag", etag);
  baseHeaders.set("Last-Modified", toHTTPDate(lastModifiedDate));
  baseHeaders.set("Cache-Control", "private, max-age=0, must-revalidate");
  baseHeaders.set("Vary", "Cookie");

  if (notModifiedByEtag || notModifiedByTime) {
    // ✅ 304 ไม่มี body ประหยัดเน็ต/แบต
    return new NextResponse(null, { status: 304, headers: baseHeaders });
  }

  const res = NextResponse.json(
    {
      data: {
        ward_id: wardId,
        month,
        days,
        shifts,
        ward_view_limited: false,
      },
    },
    { status: 200 }
  );

  // แนบ headers
  baseHeaders.forEach((v, k) => res.headers.set(k, v));

  return res;
}

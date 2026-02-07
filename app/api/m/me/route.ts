// app/api/m/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ ใช้ getAll / setAll ตามสเปก @supabase/ssr
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
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
    return NextResponse.json(
      { error: "unauthorized", detail: userErr?.message ?? null },
      { status: 401 }
    );
  }

  const uid = user.id;

  // 2) staff ของตัวเอง
  const { data: staff, error: staffErr } = await supabase
    .from("staff")
    .select("id, org_id, display_name, is_active")
    .eq("user_id", uid)
    .maybeSingle();

  if (staffErr) {
    return NextResponse.json(
      { error: "staff_query_failed", detail: staffErr.message },
      { status: 500 }
    );
  }

  if (!staff) {
    return NextResponse.json(
      { error: "staff_not_found", uid, email: user.email ?? null },
      { status: 404 }
    );
  }

  if (staff.is_active === false) {
    return NextResponse.json(
      { error: "staff_inactive", staff_id: staff.id },
      { status: 403 }
    );
  }

  // 3) ward ที่สังกัด
  const { data: wards, error: wardsErr } = await supabase
    .from("staff_wards")
    .select("ward_id, primary_ward")
    .eq("staff_id", staff.id);

  if (wardsErr) {
    return NextResponse.json(
      { error: "staff_wards_query_failed", detail: wardsErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    user: { id: uid, email: user.email ?? null },
    staff: { id: staff.id, org_id: staff.org_id, display_name: staff.display_name },
    wards: wards ?? [],
  });
}

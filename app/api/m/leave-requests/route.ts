import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type Body = {
  shift_id: string;
  reason?: string;
};

async function getSupabase() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // บาง context อาจ set cookie ไม่ได้ → ปล่อยผ่าน
        }
      },
    },
  });
}

export async function POST(req: Request) {
  const supabase = await getSupabase();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const shift_id = (body.shift_id || "").trim();
  const reason = (body.reason || "").trim();

  if (!shift_id) {
    return NextResponse.json({ error: "shift_id_required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      user_id: auth.user.id,
      shift_id,
      type: "cant_make_it",
      reason: reason.length ? reason : null,
      status: "pending",
    })
    .select("id,status,shift_id,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    (async () => {
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
      console.log("getSession:", { session: sessionData.session, sessErr });

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      console.log("getUser:", { user: userData.user, userErr });

      if (userData?.user) router.replace("/m");
      else router.replace("/login");
    })();
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-zinc-50">
      <div className="rounded-2xl border bg-white p-4 text-sm text-zinc-700">
        Checking session...
      </div>
    </div>
  );
}

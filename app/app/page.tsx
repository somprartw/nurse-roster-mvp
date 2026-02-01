"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
};

export default function AppPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      const userEmail = session?.user.email ?? null;
      const userId = session?.user.id ?? null;

      if (!userId) {
        router.replace("/auth");
        return;
      }

      setEmail(userEmail);

      const { data: prof, error } = await supabase
        .from("profiles")
        .select("id,email,display_name,role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("PROFILE ERROR:", error);
        return;
      }

      setProfile(prof as Profile);
    }

    load();
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: 16 }}>
      <h1>MVP ตารางเวรพยาบาล</h1>
      <p>Signed in as: {email ?? "..."}</p>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div><b>Profile</b></div>
        <div>display_name: {profile?.display_name ?? "-"}</div>
        <div>role: {profile?.role ?? "-"}</div>
      </div>

      <button onClick={signOut} style={{ marginTop: 16, padding: 10 }}>
        Sign out
      </button>
    </main>
  );
}


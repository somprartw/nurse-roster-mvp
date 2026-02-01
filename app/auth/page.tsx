"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function cleanEmail(raw: string) {
    return raw
      .trim()
      .toLowerCase()
      // ลบ zero-width chars ที่ชอบติดมากับการ copy
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      // แปลง NBSP ให้เป็น space ปกติ แล้วค่อย trim อีกรอบ
      .replace(/\u00A0/g, " ")
      .trim();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const eClean = cleanEmail(email);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: eClean,
          password,
        });
        if (error) throw error;

        console.log("SIGNUP RESULT:", data);

        // ถ้าเปิด confirm email: session อาจเป็น null แต่ user จะมี id
        if (data.user?.id) {
          setMsg(
            `✅ Sign up OK (user id: ${data.user.id}). ` +
              (data.session ? "Logged in แล้ว" : "ถ้าเปิดยืนยันอีเมล ให้ไปกดยืนยันในอีเมลก่อน แล้วค่อย Sign in")
          );

          // ถ้ามี session มาเลย (ไม่ได้บังคับ confirm email) พาไป /m ได้ทันที
          if (data.session) {
            router.replace("/m");
            router.refresh();
          }
        } else {
          setMsg("✅ Sign up OK แต่ไม่ได้ user id กลับมา (ดูใน console: SIGNUP RESULT)");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: eClean,
          password,
        });
        if (error) throw error;

        console.log("SIGNIN RESULT:", data);

        setMsg("✅ Sign in OK กำลังพาไป /m ...");
        router.replace("/m");
        router.refresh();
      }
    } catch (err: any) {
      console.error("AUTH ERROR:", err);
      setMsg(`❌ ${err?.message ?? "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Auth</h1>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setMsg("");
          }}
          disabled={loading}
          style={{ padding: "8px 12px", opacity: mode === "signin" ? 1 : 0.6 }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setMsg("");
          }}
          disabled={loading}
          style={{ padding: "8px 12px", opacity: mode === "signup" ? 1 : 0.6 }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@nurse.com"
            autoComplete="email"
            required
            style={{ width: "100%", padding: 10 }}
            disabled={loading}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            style={{ width: "100%", padding: 10 }}
            disabled={loading}
          />
        </label>

        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Loading..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        <div style={{ fontSize: 12, opacity: 0.8 }}>
          * ระบบจะ trim/ทำ email เป็นตัวพิมพ์เล็กให้อัตโนมัติ: <br />
          <code>{cleanEmail(email || "your@email.com")}</code>
        </div>

        {msg && <p style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{msg}</p>}
      </form>
    </main>
  );
}

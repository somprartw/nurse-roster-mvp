"use client";

import * as React from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = React.useMemo(() => createSupabaseBrowser(), []);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) return setErr(error.message);

    // ไป /m ได้เลย (middleware จะปล่อย)
    window.location.href = "/m";
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-5">
      <form onSubmit={signIn} className="w-full max-w-sm rounded-3xl bg-white p-6 ring-1 ring-zinc-200 shadow-sm">
        <div className="text-xl font-semibold text-zinc-900">Login</div>
        <div className="mt-1 text-sm text-zinc-500">Staff / Scheduler / Admin</div>

        <label className="mt-5 block text-sm font-medium text-zinc-700">Email</label>
        <input
          className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="mt-4 block text-sm font-medium text-zinc-700">Password</label>
        <input
          type="password"
          className="mt-1 w-full rounded-2xl border border-zinc-200 px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {err && <div className="mt-3 text-sm text-rose-600">{err}</div>}

        <button
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-4 text-xs text-zinc-500">
          * ตอน demo ใช้ password fix ได้ตามที่คุณทำอยู่
        </div>
      </form>
    </div>
  );
}


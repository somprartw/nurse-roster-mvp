"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function ProfilePage() {
  const supabase = supabaseBrowser();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (!error && data) setDisplayName(data.display_name ?? "");
    })();
  }, []);

const onSave = async () => {
  setSaving(true);

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

const { error } = await supabase
  .from("profiles")
  .upsert(
    { id: user.id, email: user.email, display_name: displayName },
    { onConflict: "id" }
  );

  setSaving(false);

  if (error) alert(`Save failed: ${error.message}`);
  else alert("Saved!");
};

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4">
      <h1 className="text-xl font-semibold">Edit display_name</h1>

      <input
        className="border px-3 py-2 w-full"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Your name"
      />

      <button
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}


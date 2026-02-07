import * as React from "react";

export type ShiftRound = "morning" | "evening" | "night" | "ot" | string | null | undefined;

export function roundEmoji(code: ShiftRound) {
  switch (code) {
    case "morning":
      return "😎";
    case "evening":
      return "☕️";
    case "night":
      return "✨";
    case "ot":
      return "🕒";
    default:
      return "🗓️";
  }
}

export function isOT(code: ShiftRound) {
  return String(code ?? "").toLowerCase() === "ot";
}

export function OTBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
      <span aria-hidden>🕒</span>
      <span className="font-light">OT</span>
    </span>
  );
}

export function RoundBadge({ code }: { code: ShiftRound }) {
  const e = roundEmoji(code);
  const label = String(code ?? "").toUpperCase();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
      <span aria-hidden>{e}</span>
      <span className="font-medium">{label || "SHIFT"}</span>
    </span>
  );
}

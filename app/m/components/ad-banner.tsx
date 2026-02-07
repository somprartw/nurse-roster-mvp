"use client";

import * as React from "react";

export function AdBannerSlot({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-semibold text-slate-500">Sponsored / Announcement</div>
      <div className="flex min-h-14 items-center justify-center rounded-2xl bg-slate-50 px-4 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
        {children ?? "พื้นที่สำหรับแถบโฆษณา / ประกาศ"}
      </div>
    </div>
  );
}

// app/m/components/shift-detail-view.tsx
"use client";

import { formatDateTH, timeRange, positionLabel, roleLabel } from "./shift-utils";

type ShiftDetailData = {
  shift_instance_id: string;
  ward_id: string;
  shift_date: string;
  shift_code: string | null;
  shift_name: string | null;
  start_time: string | null;
  end_time: string | null;
  cross_midnight: boolean | null;
  note: string | null;
  changed_after_final: boolean | null;
  coworkers: Array<{
    staff_id: string;
    display_name: string | null;
    position: string | null;
    role_in_shift: string | null;
  }>;
  coworker_limited: boolean;
};

export function ShiftDetailView({ detail }: { detail: ShiftDetailData }) {
  return (
    <div className="space-y-4">
      {/* Shift name + date */}
      <div>
        <div className="text-base font-semibold text-slate-900">{detail.shift_name ?? "—"}</div>
        <div className="text-sm text-slate-600">{formatDateTH(detail.shift_date)}</div>
      </div>

      {/* Time */}
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800">
        เวลา: {timeRange(detail.start_time, detail.end_time, detail.cross_midnight)}
      </div>

      {/* Note */}
      {detail.note ? (
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">หมายเหตุ: {detail.note}</div>
      ) : null}

      {/* Changed after final */}
      {detail.changed_after_final ? <div className="text-xs text-rose-600">⚠️ มีการเปลี่ยนแปลงหลัง final</div> : null}

      {/* Coworkers */}
      <div>
        <div className="mb-1 text-xs font-medium text-slate-500">
          ผู้ร่วมเวร{detail.coworker_limited ? " (แสดงจำกัด)" : ""}
        </div>

        <div className="space-y-2">
          {detail.coworkers.length === 0 ? (
            <div className="text-sm text-slate-500">ไม่มีข้อมูลผู้ร่วมเวร</div>
          ) : (
            detail.coworkers.map((c) => (
              <div key={c.staff_id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">{c.display_name ?? "—"}</div>
                  <div className="text-xs text-slate-500">ตำแหน่ง: {positionLabel(c.position)}</div>
                </div>
                <div className="text-xs text-slate-600">บทบาท: {roleLabel(c.role_in_shift)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

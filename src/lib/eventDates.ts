import {
  daysInMonth,
  parseIsoDate,
  toIsoDate,
  todayIso,
  formatDateYMD,
} from "./date";
import type { DateAnchor, EventDate } from "../types";

export function resolveDateWithAnchor(iso: string, anchor: DateAnchor): string {
  const { y, m, d } = parseIsoDate(iso);
  if (anchor === "month_start") return toIsoDate(y, m, 1);
  if (anchor === "month_end") return toIsoDate(y, m, daysInMonth(y, m));
  return toIsoDate(y, m, d);
}

export function createEventDate(iso: string, anchor: DateAnchor = "exact"): EventDate {
  return { iso: resolveDateWithAnchor(iso, anchor), anchor };
}

export function formatEventDateLabel(ed: EventDate): string {
  const { y, m } = parseIsoDate(ed.iso);
  if (ed.anchor === "month_start") {
    return `${y}/${String(m).padStart(2, "0")} 月初`;
  }
  if (ed.anchor === "month_end") {
    return `${y}/${String(m).padStart(2, "0")} 月末`;
  }
  return formatDateYMD(ed.iso);
}

export function migrateLegacyDate(
  raw: unknown,
  fallbackIso: string
): EventDate {
  if (typeof raw === "object" && raw !== null && "iso" in raw) {
    const o = raw as { iso?: unknown; anchor?: unknown };
    const anchor =
      o.anchor === "month_start" || o.anchor === "month_end" || o.anchor === "exact"
        ? o.anchor
        : "exact";
    const iso = typeof o.iso === "string" ? o.iso : fallbackIso;
    return createEventDate(iso, anchor);
  }
  if (typeof raw === "string") return createEventDate(raw, "exact");
  return createEventDate(fallbackIso, "exact");
}

export function defaultCreatedToday(): EventDate {
  return createEventDate(todayIso(), "exact");
}

export function defaultFirstFromCreated(created: EventDate): EventDate {
  return createEventDate(created.iso, created.anchor);
}

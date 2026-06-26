import type { DateAnchor, Frequency } from "../types";
import { compareIsoDate, daysInMonth, parseIsoDate, toIsoDate } from "./date";

function dayMatchesAnchor(
  targetIso: string,
  anchorIso: string,
  anchor: DateAnchor
): boolean {
  const target = parseIsoDate(targetIso);
  if (anchor === "month_start") return target.d === 1;
  if (anchor === "month_end") {
    return target.d === daysInMonth(target.y, target.m);
  }
  return target.d === parseIsoDate(anchorIso).d;
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function monthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

export function monthsBetween(start: Date, target: Date): number {
  return (
    (target.getFullYear() - start.getFullYear()) * 12 +
    (target.getMonth() - start.getMonth())
  );
}

export function dateInRange(
  iso: string,
  firstIso: string,
  lastIso: string | null,
  isLongTerm: boolean
): boolean {
  if (compareIsoDate(iso, firstIso) < 0) return false;
  if (isLongTerm || !lastIso) return true;
  return compareIsoDate(iso, lastIso) <= 0;
}

function daysBetween(anchorIso: string, targetIso: string): number {
  const a = parseDate(anchorIso).getTime();
  const t = parseDate(targetIso).getTime();
  return Math.round((t - a) / 86400000);
}

export function matchesFrequency(
  anchorIso: string,
  targetIso: string,
  frequency: Frequency,
  anchor: DateAnchor = "exact"
): boolean {
  const diffDays = daysBetween(anchorIso, targetIso);
  if (diffDays < 0) return false;

  switch (frequency) {
    case "once":
      return targetIso === anchorIso;
    case "daily":
      return true;
    case "weekly":
      return diffDays % 7 === 0;
    case "biweekly":
      return diffDays % 14 === 0;
    case "monthly":
      return dayMatchesAnchor(targetIso, anchorIso, anchor);
    case "quarterly": {
      const months = monthsBetween(parseDate(anchorIso), parseDate(targetIso));
      return (
        months >= 0 &&
        months % 3 === 0 &&
        dayMatchesAnchor(targetIso, anchorIso, anchor)
      );
    }
    case "semiannual": {
      const months = monthsBetween(parseDate(anchorIso), parseDate(targetIso));
      return (
        months >= 0 &&
        months % 6 === 0 &&
        dayMatchesAnchor(targetIso, anchorIso, anchor)
      );
    }
    case "yearly": {
      const months = monthsBetween(parseDate(anchorIso), parseDate(targetIso));
      return (
        months >= 0 &&
        months % 12 === 0 &&
        dayMatchesAnchor(targetIso, anchorIso, anchor)
      );
    }
  }
}

export function occurrenceDatesInMonth(
  firstIso: string,
  simMonth: Date,
  frequency: Frequency,
  lastIso: string | null,
  isLongTerm: boolean,
  firstAnchor: DateAnchor = "exact"
): string[] {
  const y = simMonth.getFullYear();
  const m = simMonth.getMonth() + 1;
  const dim = daysInMonth(y, m);
  const out: string[] = [];
  for (let d = 1; d <= dim; d++) {
    const iso = toIsoDate(y, m, d);
    if (!dateInRange(iso, firstIso, lastIso, isLongTerm)) continue;
    if (matchesFrequency(firstIso, iso, frequency, firstAnchor)) out.push(iso);
  }
  return out;
}

/** 统计首次至末次（含）之间按周期应发生的还款次数 */
export function countOccurrencesBetween(
  firstIso: string,
  lastIso: string | null,
  frequency: Frequency,
  isLongTerm: boolean,
  firstAnchor: DateAnchor = "exact"
): number {
  if (frequency === "once") {
    if (compareIsoDate(lastIso ?? firstIso, firstIso) < 0) return 0;
    return 1;
  }
  if (isLongTerm || !lastIso) return 0;
  if (compareIsoDate(lastIso, firstIso) < 0) return 1;

  const start = parseDate(firstIso);
  const end = parseDate(lastIso);
  let count = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endIdx = monthIndex(end);

  while (monthIndex(cursor) <= endIdx) {
    count += occurrenceDatesInMonth(
      firstIso,
      cursor,
      frequency,
      lastIso,
      false,
      firstAnchor
    ).length;
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return Math.max(1, count);
}

/** 截至某日（含）已发生的还款次数 */
export function countOccurrencesThrough(
  firstIso: string,
  throughIso: string,
  frequency: Frequency,
  lastIso: string | null,
  isLongTerm: boolean,
  firstAnchor: DateAnchor = "exact"
): number {
  if (compareIsoDate(throughIso, firstIso) < 0) return 0;

  const start = parseDate(firstIso);
  const through = parseDate(throughIso);
  let count = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endIdx = monthIndex(through);

  while (monthIndex(cursor) <= endIdx) {
    for (const iso of occurrenceDatesInMonth(
      firstIso,
      cursor,
      frequency,
      lastIso,
      isLongTerm,
      firstAnchor
    )) {
      if (compareIsoDate(iso, throughIso) <= 0) count++;
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return count;
}

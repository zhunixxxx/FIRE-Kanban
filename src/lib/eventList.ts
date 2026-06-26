import type { FinancialEvent, LoanEvent } from "../types";
import { compareIsoDate, parseIsoDate, todayIso } from "./date";
import { buildLoanSchedule } from "./loan";
import { countOccurrencesThrough, occurrenceDatesInMonth } from "./recurrence";

export type EventSortMode = "created" | "upcoming";
export type EventFilterCategory = "income" | "expense" | "loan";

const FILTER_CATEGORIES: EventFilterCategory[] = ["income", "expense", "loan"];

export function defaultEventFilters(): Set<EventFilterCategory> {
  return new Set(FILTER_CATEGORIES);
}

export function filterCategory(ev: FinancialEvent): EventFilterCategory | null {
  if (ev.category === "income") return "income";
  if (ev.category === "expense") return "expense";
  if (ev.category === "loan") return "loan";
  return null;
}

export function filterEvents(
  events: FinancialEvent[],
  activeFilters: Set<EventFilterCategory>
): FinancialEvent[] {
  return events.filter((ev) => {
    const cat = filterCategory(ev);
    if (cat === null) return true;
    return activeFilters.has(cat);
  });
}

export function nextOccurrenceIso(
  ev: FinancialEvent,
  fromIso: string = todayIso()
): string | null {
  const firstIso = ev.firstDate.iso;
  const lastIso = ev.lastDate?.iso ?? null;

  if (!ev.isLongTerm && lastIso && compareIsoDate(fromIso, lastIso) > 0) {
    return null;
  }

  const { y, m } = parseIsoDate(fromIso);
  const cursor = new Date(y, m - 1, 1);

  for (let i = 0; i < 120; i++) {
    const dates = occurrenceDatesInMonth(
      firstIso,
      cursor,
      ev.frequency,
      lastIso,
      ev.isLongTerm,
      ev.firstDate.anchor
    );
    for (const iso of dates) {
      if (compareIsoDate(iso, fromIso) >= 0) return iso;
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return null;
}

export function nextOccurrenceAmount(ev: FinancialEvent, nextIso: string): number {
  if (ev.category !== "loan") return ev.amount;
  const loan = ev as LoanEvent;
  const lastIso = loan.lastDate?.iso ?? null;
  const payIndex = countOccurrencesThrough(
    loan.firstDate.iso,
    nextIso,
    loan.frequency,
    lastIso,
    loan.isLongTerm,
    loan.firstDate.anchor
  );
  if (payIndex < 1 || payIndex > loan.periods) return ev.amount;
  const schedule = buildLoanSchedule(
    loan.amount,
    loan.periods,
    loan.annualRate,
    loan.method
  );
  return schedule[payIndex - 1]?.payment ?? ev.amount;
}

export function upcomingEventsWithDate(
  events: FinancialEvent[],
  fromIso: string = todayIso()
): { ev: FinancialEvent; nextIso: string }[] {
  return events
    .map((ev) => ({ ev, nextIso: nextOccurrenceIso(ev, fromIso) }))
    .filter((item): item is { ev: FinancialEvent; nextIso: string } => item.nextIso !== null)
    .sort((a, b) => compareIsoDate(a.nextIso, b.nextIso));
}

export function sortEvents(
  events: FinancialEvent[],
  mode: EventSortMode,
  fromIso: string = todayIso()
): FinancialEvent[] {
  const copy = [...events];
  if (mode === "created") {
    copy.sort((a, b) => compareIsoDate(b.createdDate.iso, a.createdDate.iso));
    return copy;
  }
  copy.sort((a, b) => {
    const na = nextOccurrenceIso(a, fromIso);
    const nb = nextOccurrenceIso(b, fromIso);
    if (na === null && nb === null) {
      return compareIsoDate(b.createdDate.iso, a.createdDate.iso);
    }
    if (na === null) return 1;
    if (nb === null) return -1;
    const byNext = compareIsoDate(na, nb);
    if (byNext !== 0) return byNext;
    return compareIsoDate(b.createdDate.iso, a.createdDate.iso);
  });
  return copy;
}

export const filterCategoryLabels: Record<EventFilterCategory, string> = {
  income: "收入",
  expense: "支出",
  loan: "贷款",
};

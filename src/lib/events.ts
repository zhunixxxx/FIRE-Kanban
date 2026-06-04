import { addMonthsToIso, todayIso } from "./date";
import { createEventDate, migrateLegacyDate } from "./eventDates";
import { loanPeriodsFromRepaymentSchedule } from "./loanPeriods";
import type { EventDate, FinancialEvent, Frequency } from "../types";

export function defaultLastFromFirst(firstIso: string): EventDate {
  return createEventDate(addMonthsToIso(firstIso, 12));
}

function parseFrequency(raw: unknown): Frequency {
  const map: Record<string, Frequency> = {
    daily: "daily",
    weekly: "weekly",
    biweekly: "biweekly",
    monthly: "monthly",
    quarterly: "quarterly",
    semiannual: "semiannual",
    yearly: "yearly",
    once: "monthly",
  };
  if (typeof raw === "string" && raw in map) return map[raw];
  return "monthly";
}

function parseDateField(
  raw: Record<string, unknown>,
  keys: string[],
  fallbackIso: string
): EventDate {
  for (const key of keys) {
    if (raw[key] !== undefined) return migrateLegacyDate(raw[key], fallbackIso);
  }
  return migrateLegacyDate(undefined, fallbackIso);
}

function parseLast(
  raw: Record<string, unknown>,
  fallbackIso: string,
  isLongTerm: boolean
): EventDate | null {
  if (isLongTerm) return null;
  if (raw.lastDate === null || raw.endDate === null) return null;
  return parseDateField(raw, ["lastDate", "endDate"], addMonthsToIso(fallbackIso, 60));
}

function parseAmount(raw: Record<string, unknown>): number {
  if (raw.amount !== undefined) return Number(raw.amount) || 0;
  if (raw.category === "loan") return Number(raw.principal) || 0;
  return 0;
}

export function normalizeEvent(raw: unknown): FinancialEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.id !== "string" || typeof e.name !== "string") return null;

  const legacyStart =
    typeof e.startDate === "string" ? e.startDate : todayIso();

  const createdDate = parseDateField(
    e,
    ["createdDate", "occurrenceDate"],
    legacyStart
  );
  const firstDate = parseDateField(
    e,
    ["firstDate", "firstPaymentDate"],
    legacyStart
  );
  const isLongTerm = e.isLongTerm === true;
  const frequency = parseFrequency(e.frequency);
  const amount = parseAmount(e);

  const base = {
    id: e.id,
    name: e.name,
    amount,
    createdDate,
    firstDate,
    isLongTerm,
    frequency,
  };

  if (e.category === "loan") {
    const lastDate = isLongTerm
      ? null
      : parseLast(e, firstDate.iso, false) ??
      defaultLastFromFirst(firstDate.iso);
    const periods = loanPeriodsFromRepaymentSchedule(
      firstDate.iso,
      lastDate?.iso ?? null,
      frequency,
      isLongTerm,
      Math.max(1, Math.round(Number(e.periods) || 0) || 12)
    );
    return {
      ...base,
      category: "loan",
      lastDate:
        lastDate ??
        createEventDate(addMonthsToIso(firstDate.iso, periods - 1)),
      periods,
      annualRate: Number(e.annualRate) || 0,
      method:
        e.method === "equal_principal" ? "equal_principal" : "equal_installment",
      excludeFromExpense: Boolean(e.excludeFromExpense),
      expenseSource: e.expenseSource === "investment" ? "investment" : "liquid",
    };
  }

  if (e.category === "transfer") {
    const from = e.transferFrom === "investment" ? "investment" : "liquid";
    const to =
      e.transferTo === "liquid"
        ? "liquid"
        : e.transferTo === "investment"
          ? "investment"
          : from === "liquid"
            ? "investment"
            : "liquid";
    return {
      ...base,
      category: "transfer",
      transferFrom: from,
      transferTo: to,
      lastDate: parseLast(e, firstDate.iso, isLongTerm),
    };
  }

  if (e.category === "income") {
    return {
      ...base,
      category: "income",
      lastDate: parseLast(e, firstDate.iso, isLongTerm),
    };
  }

  if (e.category === "expense") {
    return {
      ...base,
      category: "expense",
      expenseSource: e.expenseSource === "investment" ? "investment" : "liquid",
      lastDate: parseLast(e, firstDate.iso, isLongTerm),
    };
  }

  return null;
}

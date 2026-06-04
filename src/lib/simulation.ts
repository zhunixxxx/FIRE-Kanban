import type {
  AppParams,
  CashflowEvent,
  FinancialEvent,
  LoanEvent,
  SimulationResult,
  TimelineEntry,
  TransferEvent,
} from "../types";
import { compareIsoDate, daysInMonth, toIsoDate } from "./date";
import { buildLoanSchedule } from "./loan";
import {
  countOccurrencesThrough,
  occurrenceDatesInMonth,
} from "./recurrence";

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatLabel(date: Date, granularity: "monthly" | "quarterly"): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  if (granularity === "quarterly") {
    const q = Math.ceil(m / 3);
    return `${y} Q${q}`;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

function monthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

function applyTransfer(t: TransferEvent, liquid: number, investment: number) {
  const amt = t.amount;
  if (t.transferFrom === "liquid") liquid -= amt;
  else investment -= amt;
  if (t.transferTo === "liquid") liquid += amt;
  else investment += amt;
  return { liquid, investment };
}

function loanActiveInMonth(loan: LoanEvent, simMonth: Date): boolean {
  if (loan.amount <= 0 || loan.periods <= 0) return false;

  const y = simMonth.getFullYear();
  const m = simMonth.getMonth() + 1;
  const monthStart = toIsoDate(y, m, 1);
  const monthEnd = toIsoDate(y, m, daysInMonth(y, m));

  if (compareIsoDate(monthEnd, loan.createdDate.iso) < 0) return false;

  if (!loan.isLongTerm && loan.lastDate) {
    if (compareIsoDate(monthStart, loan.lastDate.iso) > 0) return false;
  }

  return true;
}

function loanSchedule(loan: LoanEvent) {
  return buildLoanSchedule(
    loan.amount,
    loan.periods,
    loan.annualRate,
    loan.method
  );
}

function loanPaymentForMonth(
  loan: LoanEvent,
  simMonth: Date
): { payment: number; remaining: number; date: string } | null {
  if (!loanActiveInMonth(loan, simMonth)) return null;

  const created = parseDate(loan.createdDate.iso);
  if (monthIndex(simMonth) < monthIndex(created)) return null;

  const lastIso = loan.lastDate?.iso ?? null;
  const dates = occurrenceDatesInMonth(
    loan.firstDate.iso,
    simMonth,
    loan.frequency,
    lastIso,
    loan.isLongTerm
  );
  if (dates.length === 0) return null;

  const payDate = dates[dates.length - 1];
  if (compareIsoDate(payDate, loan.createdDate.iso) < 0) return null;

  const payIndex = countOccurrencesThrough(
    loan.firstDate.iso,
    payDate,
    loan.frequency,
    lastIso,
    loan.isLongTerm
  );
  if (payIndex < 1 || payIndex > loan.periods) return null;

  const schedule = loanSchedule(loan);
  const item = schedule[payIndex - 1];
  if (!item) return null;
  return { payment: item.payment, remaining: item.remaining, date: payDate };
}

function remainingLoanBalance(loans: LoanEvent[], simMonth: Date): number {
  let total = 0;
  for (const loan of loans) {
    if (!loanActiveInMonth(loan, simMonth)) continue;

    const y = simMonth.getFullYear();
    const m = simMonth.getMonth() + 1;
    const throughIso = toIsoDate(y, m, daysInMonth(y, m));
    const lastIso = loan.lastDate?.iso ?? null;

    const completed = countOccurrencesThrough(
      loan.firstDate.iso,
      throughIso,
      loan.frequency,
      lastIso,
      loan.isLongTerm
    );

    if (completed === 0) {
      total += loan.amount;
      continue;
    }
    if (completed >= loan.periods) continue;

    const schedule = loanSchedule(loan);
    const item = schedule[completed - 1];
    if (item) total += item.remaining;
  }
  return total;
}

function lastDayOfMonth(simMonth: Date): string {
  const y = simMonth.getFullYear();
  const m = simMonth.getMonth() + 1;
  const last = new Date(y, m, 0).getDate();
  return toIsoDate(y, m, last);
}

export function runSimulation(
  params: AppParams,
  events: FinancialEvent[]
): SimulationResult {
  const start = new Date();
  start.setDate(1);
  const totalMonths = params.projectionYears * 12;
  const step = params.projectionGranularity === "quarterly" ? 3 : 1;
  const periodCount = Math.ceil(totalMonths / step);

  const loans = events.filter((e): e is LoanEvent => e.category === "loan");
  const cashEvents = events.filter(
    (e): e is CashflowEvent =>
      e.category === "income" ||
      e.category === "expense" ||
      e.category === "transfer"
  );

  let investment = params.initialInvestment;
  let liquid = params.initialLiquid;
  const timeline: TimelineEntry[] = [];
  const snapshots = [];

  const pushEntry = (
    dateIso: string,
    simMonth: Date,
    entry: Omit<
      TimelineEntry,
      "date" | "liquid" | "investment" | "remainingDebt"
    >
  ) => {
    timeline.push({
      date: dateIso,
      ...entry,
      liquid,
      investment,
      remainingDebt: remainingLoanBalance(loans, simMonth),
    });
  };

  type PendingAction = {
    date: string;
    run: () => Omit<
      TimelineEntry,
      "date" | "liquid" | "investment" | "remainingDebt"
    >;
  };

  const loanInceptionLogged = new Set<string>();

  for (let i = 0; i <= periodCount; i++) {
    const simMonth = addMonths(start, i * step);
    const pending: PendingAction[] = [];

    for (const loan of loans) {
      if (!loanActiveInMonth(loan, simMonth)) continue;
      const createdIso = loan.createdDate.iso;
      const inceptionKey = `${loan.id}@${createdIso}`;
      if (
        monthIndex(simMonth) === monthIndex(parseDate(createdIso)) &&
        !loanInceptionLogged.has(inceptionKey)
      ) {
        loanInceptionLogged.add(inceptionKey);
        pending.push({
          date: createdIso,
          run: () => ({
            label: `${loan.name} · 计入负债`,
            amount: loan.amount,
            category: "loan" as const,
            flowType: "neutral" as const,
          }),
        });
      }
    }

    for (const ev of cashEvents) {
      const lastIso = ev.lastDate?.iso ?? null;
      const dates = occurrenceDatesInMonth(
        ev.firstDate.iso,
        simMonth,
        ev.frequency,
        lastIso,
        ev.isLongTerm
      );
      for (const date of dates) {
        pending.push({
          date,
          run: () => {
            if (ev.category === "income") {
              liquid += ev.amount;
              return {
                label: ev.name,
                amount: ev.amount,
                category: "income" as const,
                flowType: "income" as const,
              };
            }
            if (ev.category === "transfer") {
              const next = applyTransfer(ev, liquid, investment);
              liquid = next.liquid;
              investment = next.investment;
              return {
                label: ev.name,
                amount: ev.amount,
                category: "transfer" as const,
                flowType: "neutral" as const,
              };
            }
            if (ev.expenseSource === "investment") {
              investment -= ev.amount;
            } else {
              liquid -= ev.amount;
            }
            return {
              label: ev.name,
              amount: ev.amount,
              category: "expense" as const,
              flowType: "expense" as const,
            };
          },
        });
      }
    }

    for (const loan of loans) {
      const pay = loanPaymentForMonth(loan, simMonth);
      if (!pay) continue;
      pending.push({
        date: pay.date,
        run: () => {
          liquid -= pay.payment;
          return {
            label: `${loan.name} · 还款`,
            amount: pay.payment,
            category: "loan" as const,
            flowType: "expense" as const,
          };
        },
      });
    }

    pending.sort((a, b) => a.date.localeCompare(b.date));

    for (const { date, run } of pending) {
      pushEntry(date, simMonth, run());
    }

    const nextMonthExpense = estimateNextMonthExpense(
      simMonth,
      cashEvents,
      loans,
      step
    );

    if (
      params.fixedDepositTrigger > 0 &&
      liquid >= params.fixedDepositTrigger &&
      liquid - params.fixedDepositTrigger >= nextMonthExpense
    ) {
      const transfer = params.fixedDepositTrigger;
      investment += transfer;
      liquid -= transfer;
      pushEntry(lastDayOfMonth(simMonth), simMonth, {
        label: "定存触发",
        amount: transfer,
        category: "transfer",
        flowType: "neutral",
      });
    }

    const liabilities = remainingLoanBalance(loans, simMonth);
    snapshots.push({
      label: formatLabel(simMonth, params.projectionGranularity),
      date: toIsoDate(simMonth.getFullYear(), simMonth.getMonth() + 1, 1),
      investmentAssets: investment,
      totalLiabilities: liabilities,
      netWorth: investment + liquid - liabilities,
      liquid,
    });
  }

  const current = snapshots[0];

  return {
    snapshots,
    timeline: timeline.sort((a, b) => a.date.localeCompare(b.date)),
    liquid: current?.liquid ?? params.initialLiquid,
    investment: current?.investmentAssets ?? params.initialInvestment,
    remainingDebt: current?.totalLiabilities ?? 0,
  };
}

function estimateNextMonthExpense(
  simMonth: Date,
  cashEvents: CashflowEvent[],
  loans: LoanEvent[],
  step: number
): number {
  const next = addMonths(simMonth, step);
  let expense = 0;
  for (const ev of cashEvents) {
    if (ev.category !== "expense") continue;
    if (ev.expenseSource === "investment") continue;
    const lastIso = ev.lastDate?.iso ?? null;
    const dates = occurrenceDatesInMonth(
      ev.firstDate.iso,
      next,
      ev.frequency,
      lastIso,
      ev.isLongTerm
    );
    if (dates.length === 0) continue;
    expense += ev.amount * dates.length;
  }
  for (const loan of loans) {
    if (loan.excludeFromExpense) continue;
    const pay = loanPaymentForMonth(loan, next);
    if (pay) expense += pay.payment;
  }
  return expense;
}

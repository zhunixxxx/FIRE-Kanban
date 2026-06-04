import { formatEventDateLabel } from "./eventDates";
import type { EventCategory, ExpenseSource, FinancialEvent, Frequency } from "../types";

export const frequencyLabels: Record<Frequency, string> = {
  once: "不重复",
  daily: "每日",
  weekly: "每周",
  biweekly: "每半月",
  monthly: "每月",
  quarterly: "每季度",
  semiannual: "每半年",
  yearly: "每年",
};

export const accountLabels: Record<ExpenseSource, string> = {
  liquid: "活期留存",
  investment: "定期理财",
};

export function formatLastLabel(ev: FinancialEvent): string {
  if (ev.isLongTerm) return "长期";
  if (!ev.lastDate) return "长期";
  return formatEventDateLabel(ev.lastDate);
}

export function categoryBadgeClass(cat: EventCategory): string {
  switch (cat) {
    case "income":
      return "bg-emerald-950 text-[var(--color-income)]";
    case "loan":
      return "bg-amber-950/60 text-[var(--color-gold)]";
    case "transfer":
      return "bg-slate-700/80 text-white";
    default:
      return "bg-red-950/60 text-[var(--color-expense)]";
  }
}

export function categoryLabel(cat: EventCategory): string {
  switch (cat) {
    case "income":
      return "收入";
    case "loan":
      return "贷款";
    case "transfer":
      return "转账";
    default:
      return "支出";
  }
}

export function eventSummaryLine(ev: FinancialEvent, formatMoney: (n: number) => string): string {
  const parts = [
    formatMoney(ev.amount),
    `${formatEventDateLabel(ev.firstDate)} — ${formatLastLabel(ev)}`,
    frequencyLabels[ev.frequency],
  ];
  if (ev.category === "loan") {
    parts.push(
      `还款${frequencyLabels[ev.frequency]}`,
      `创建 ${formatEventDateLabel(ev.createdDate)}`,
      `${ev.periods} 期`,
      accountLabels[ev.expenseSource]
    );
  }
  if (ev.category === "expense") {
    parts.push(accountLabels[ev.expenseSource]);
  }
  if (ev.category === "transfer") {
    parts.push(`${accountLabels[ev.transferFrom]} → ${accountLabels[ev.transferTo]}`);
  }
  return parts.join(" · ");
}

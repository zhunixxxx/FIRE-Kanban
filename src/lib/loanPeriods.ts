import type { DateAnchor, Frequency } from "../types";
import { countOccurrencesBetween } from "./recurrence";

const LONG_TERM_DEFAULT_PERIODS = 360;

/** 根据首次/末次还款日与还款周期计算期数 */
export function loanPeriodsFromRepaymentSchedule(
  firstIso: string,
  lastIso: string | null,
  frequency: Frequency,
  isLongTerm: boolean,
  fallback = 12,
  firstAnchor: DateAnchor = "exact"
): number {
  if (isLongTerm || !lastIso) {
    return Math.max(1, fallback === 12 ? LONG_TERM_DEFAULT_PERIODS : fallback);
  }
  return countOccurrencesBetween(
    firstIso,
    lastIso,
    frequency,
    false,
    firstAnchor
  );
}

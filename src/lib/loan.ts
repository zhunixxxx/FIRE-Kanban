import type { LoanMethod } from "../types";

export interface LoanScheduleItem {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

export function buildLoanSchedule(
  principal: number,
  periods: number,
  annualRate: number,
  method: LoanMethod
): LoanScheduleItem[] {
  if (periods <= 0 || principal <= 0) return [];

  const monthlyRate = annualRate / 100 / 12;
  const schedule: LoanScheduleItem[] = [];
  let remaining = principal;

  if (method === "equal_installment") {
    const payment =
      monthlyRate === 0
        ? principal / periods
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, periods)) /
        (Math.pow(1 + monthlyRate, periods) - 1);

    for (let p = 1; p <= periods; p++) {
      const interest = remaining * monthlyRate;
      const principalPart = payment - interest;
      remaining = Math.max(0, remaining - principalPart);
      schedule.push({
        period: p,
        payment,
        principal: principalPart,
        interest,
        remaining,
      });
    }
    return schedule;
  }

  const principalPerPeriod = principal / periods;
  for (let p = 1; p <= periods; p++) {
    const interest = remaining * monthlyRate;
    const payment = principalPerPeriod + interest;
    remaining = Math.max(0, remaining - principalPerPeriod);
    schedule.push({
      period: p,
      payment,
      principal: principalPerPeriod,
      interest,
      remaining,
    });
  }
  return schedule;
}

export type Frequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "yearly";

export type LoanMethod = "equal_principal" | "equal_installment";

export type EventCategory = "income" | "expense" | "loan" | "transfer";

export type DateAnchor = "exact" | "month_start" | "month_end";

export type FlowType = "income" | "expense" | "neutral";

export interface EventDate {
  iso: string;
  anchor: DateAnchor;
}

export interface AppParams {
  initialInvestment: number;
  initialLiquid: number;
  fixedDepositTrigger: number;
  projectionYears: number;
  projectionGranularity: "monthly" | "quarterly";
}

export interface BaseEvent {
  id: string;
  name: string;
  amount: number;
  /** 创建日期；贷款自此时计入负债 */
  createdDate: EventDate;
  /** 首次发生/还款日；频率与此对齐 */
  firstDate: EventDate;
  lastDate: EventDate | null;
  isLongTerm: boolean;
  frequency: Frequency;
}

export type ExpenseSource = "liquid" | "investment";

export interface IncomeEvent extends BaseEvent {
  category: "income";
}

export interface ExpenseEvent extends BaseEvent {
  category: "expense";
  expenseSource: ExpenseSource;
}

export interface TransferEvent extends BaseEvent {
  category: "transfer";
  transferFrom: ExpenseSource;
  transferTo: ExpenseSource;
}

export interface LoanEvent extends BaseEvent {
  category: "loan";
  periods: number;
  annualRate: number;
  method: LoanMethod;
  excludeFromExpense: boolean;
  expenseSource: ExpenseSource;
}

export type CashflowEvent = IncomeEvent | ExpenseEvent | TransferEvent;

export type FinancialEvent = CashflowEvent | LoanEvent;

export type DisplayUnit = "yuan" | "wan" | "qian";

export interface AppSettings {
  displayUnit: DisplayUnit;
}

export interface AppState {
  params: AppParams;
  events: FinancialEvent[];
  settings: AppSettings;
}

export interface TimelineEntry {
  date: string;
  label: string;
  amount: number;
  category: EventCategory;
  flowType: FlowType;
  liquid: number;
  investment: number;
  remainingDebt: number;
}

export interface PeriodSnapshot {
  label: string;
  date: string;
  investmentAssets: number;
  totalLiabilities: number;
  netWorth: number;
  liquid: number;
}

export interface SimulationResult {
  snapshots: PeriodSnapshot[];
  timeline: TimelineEntry[];
  liquid: number;
  investment: number;
  remainingDebt: number;
}

export const DEFAULT_PARAMS: AppParams = {
  initialInvestment: 0,
  initialLiquid: 0,
  fixedDepositTrigger: 0,
  projectionYears: 5,
  projectionGranularity: "monthly",
};

export const DEFAULT_SETTINGS: AppSettings = {
  displayUnit: "wan",
};

export const STORAGE_KEY = "fire-kanban-state-v1";

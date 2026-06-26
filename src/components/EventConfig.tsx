import { useEffect, useMemo, useRef, useState } from "react";
import type {
  EventCategory,
  EventDate,
  ExpenseSource,
  FinancialEvent,
  Frequency,
  LoanMethod,
} from "../types";
import { compareIsoDate } from "../lib/date";
import {
  createEventDate,
  defaultCreatedToday,
  defaultFirstFromCreated,
} from "../lib/eventDates";
import { defaultLastFromFirst } from "../lib/events";
import { loanPeriodsFromRepaymentSchedule } from "../lib/loanPeriods";
import { MoneyInput, type MoneyInputHandle } from "./MoneyInput";
import { YearMonthDayField } from "./YearMonthDayField";
import { Btn, Input, Label, Select } from "./ui";

interface Props {
  events: FinancialEvent[];
  onChange: (events: FinancialEvent[]) => void;
  /** null = 新建 */
  editEventId: string | null;
  onSaved?: () => void;
}

function newId() {
  return crypto.randomUUID?.() ?? `ev-${Date.now()}-${Math.random()}`;
}

const freqOptions: { value: Frequency; label: string }[] = [
  { value: "once", label: "不重复" },
  { value: "daily", label: "每日" },
  { value: "weekly", label: "每周" },
  { value: "biweekly", label: "每半月" },
  { value: "monthly", label: "每月" },
  { value: "quarterly", label: "每季度" },
  { value: "semiannual", label: "每半年" },
  { value: "yearly", label: "每年" },
];

const loanRepaymentCycleOptions: { value: Frequency; label: string }[] = [
  { value: "monthly", label: "每月" },
  { value: "biweekly", label: "每半月" },
  { value: "quarterly", label: "每季度" },
  { value: "semiannual", label: "每半年" },
  { value: "yearly", label: "每年" },
];

const categoryOptions: { value: EventCategory; label: string }[] = [
  { value: "income", label: "收入" },
  { value: "expense", label: "固定支出" },
  { value: "loan", label: "贷款" },
  { value: "transfer", label: "转账" },
];

const methodOptions: { value: LoanMethod; label: string }[] = [
  { value: "equal_installment", label: "等额本息" },
  { value: "equal_principal", label: "等额本金" },
];

const accountOptions: { value: ExpenseSource; label: string }[] = [
  { value: "liquid", label: "活期留存" },
  { value: "investment", label: "定期理财" },
];

function num(v: string, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampLastToFirst(first: EventDate, last: EventDate): EventDate {
  if (compareIsoDate(last.iso, first.iso) < 0) {
    return createEventDate(first.iso, last.anchor);
  }
  return last;
}

const emptyForm = () => {
  const createdDate = defaultCreatedToday();
  const firstDate = defaultFirstFromCreated(createdDate);
  return {
    name: "",
    category: "expense" as EventCategory,
    amountYuan: 0,
    annualRate: "",
    method: "equal_installment" as LoanMethod,
    excludeFromExpense: false,
    expenseSource: "liquid" as ExpenseSource,
    transferFrom: "liquid" as ExpenseSource,
    transferTo: "investment" as ExpenseSource,
    createdDate,
    firstDate,
    lastDate: defaultLastFromFirst(firstDate.iso),
    isLongTerm: false,
    frequency: "monthly" as Frequency,
  };
};

function loadFormFromEvent(ev: FinancialEvent) {
  const lastDate = ev.lastDate ?? defaultLastFromFirst(ev.firstDate.iso);
  const common = {
    name: ev.name,
    amountYuan: ev.amount,
    createdDate: ev.createdDate,
    firstDate: ev.firstDate,
    lastDate,
    isLongTerm: ev.isLongTerm,
    frequency: ev.frequency,
    annualRate: "",
    method: "equal_installment" as LoanMethod,
    excludeFromExpense: false,
    expenseSource: "liquid" as ExpenseSource,
    transferFrom: "liquid" as ExpenseSource,
    transferTo: "investment" as ExpenseSource,
  };
  if (ev.category === "loan") {
    return {
      ...common,
      category: "loan" as const,
      annualRate: String(ev.annualRate),
      method: ev.method,
      excludeFromExpense: ev.excludeFromExpense,
      expenseSource: ev.expenseSource,
    };
  }
  if (ev.category === "transfer") {
    return {
      ...common,
      category: "transfer" as const,
      transferFrom: ev.transferFrom,
      transferTo: ev.transferTo,
    };
  }
  if (ev.category === "expense") {
    return {
      ...common,
      category: "expense" as const,
      expenseSource: ev.expenseSource,
    };
  }
  return { ...common, category: "income" as const };
}

export function EventConfig({
  events,
  onChange,
  editEventId,
  onSaved,
}: Props) {
  const [form, setForm] = useState(emptyForm);
  const amountInputRef = useRef<MoneyInputHandle>(null);
  const editingId = editEventId;

  useEffect(() => {
    if (editEventId === null) {
      setForm(emptyForm());
      return;
    }
    const ev = events.find((e) => e.id === editEventId);
    if (ev) setForm(loadFormFromEvent(ev));
  }, [editEventId, events]);

  const submit = () => {
    if (!form.name.trim()) return;

    const amountYuan = amountInputRef.current?.flush() ?? form.amountYuan;

    const firstDate = form.firstDate;
    const createdDate = form.createdDate;

    const isOnce = form.frequency === "once";
    const lastDate: EventDate | null = isOnce
      ? firstDate
      : form.isLongTerm
        ? null
        : clampLastToFirst(firstDate, form.lastDate);

    if (form.category === "loan" && amountYuan <= 0) {
      window.alert("请填写贷款本金。");
      return;
    }

    const base = {
      id: editingId ?? newId(),
      name: form.name.trim(),
      amount: amountYuan,
      createdDate,
      firstDate,
      isLongTerm: isOnce ? false : form.isLongTerm,
      lastDate,
      frequency: form.frequency,
    };

    let ev: FinancialEvent;
    if (form.category === "loan") {
      if (!form.isLongTerm && !lastDate) {
        window.alert("请设置末次还款日，或勾选长期。");
        return;
      }
      const periods = loanPeriodsFromRepaymentSchedule(
        firstDate.iso,
        lastDate?.iso ?? null,
        form.frequency,
        form.isLongTerm,
        12,
        firstDate.anchor
      );
      ev = {
        ...base,
        category: "loan",
        periods,
        annualRate: num(form.annualRate),
        method: form.method,
        excludeFromExpense: form.excludeFromExpense,
        expenseSource: form.expenseSource,
      };
    } else if (form.category === "transfer") {
      ev = {
        ...base,
        category: "transfer",
        transferFrom: form.transferFrom,
        transferTo: form.transferTo,
      };
    } else if (form.category === "expense") {
      ev = {
        ...base,
        category: "expense",
        expenseSource: form.expenseSource,
      };
    } else {
      ev = { ...base, category: "income" };
    }

    if (editingId) {
      onChange(events.map((e) => (e.id === editingId ? ev : e)));
    } else {
      onChange([...events, ev]);
    }
    onSaved?.();
  };

  const onFirstDateChange = (firstDate: EventDate) => {
    setForm((f) => ({
      ...f,
      firstDate,
      lastDate:
        f.frequency === "once"
          ? firstDate
          : f.isLongTerm
            ? f.lastDate
            : clampLastToFirst(firstDate, f.lastDate),
    }));
  };

  const remove = () => {
    if (!editingId) return;
    if (!window.confirm("确定删除该事件？")) return;
    onChange(events.filter((e) => e.id !== editingId));
    onSaved?.();
  };

  const showExpenseAccount =
    form.category === "expense" ||
    form.category === "transfer" ||
    form.category === "loan";
  const isLoan = form.category === "loan";
  const isOnce = !isLoan && form.frequency === "once";
  const amountLabel = isLoan ? "贷款本金" : "金额";

  const previewLoanPeriods = useMemo(() => {
    if (!isLoan) return 0;
    const last = form.isLongTerm
      ? null
      : clampLastToFirst(form.firstDate, form.lastDate);
    return loanPeriodsFromRepaymentSchedule(
      form.firstDate.iso,
      last?.iso ?? null,
      form.frequency,
      form.isLongTerm,
      12,
      form.firstDate.anchor
    );
  }, [
    isLoan,
    form.firstDate,
    form.lastDate,
    form.frequency,
    form.isLongTerm,
  ]);

  return (
    <div className="space-y-4">
      {/* 第一行：事件名称 */}
      <div>
        <Label>事件名称</Label>
        <Input
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="如：工资、房租、定存、房贷"
        />
      </div>

      {/* 第二行：类别 + 金额 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>类别</Label>
          <Select
            value={form.category}
            onChange={(v) => {
              const category = v as EventCategory;
              setForm((f) => ({
                ...f,
                category,
                frequency:
                  category === "loan" &&
                  !loanRepaymentCycleOptions.some((o) => o.value === f.frequency)
                    ? "monthly"
                    : f.frequency,
              }));
            }}
            options={categoryOptions}
          />
        </div>
        <MoneyInput
          ref={amountInputRef}
          label={amountLabel}
          valueYuan={form.amountYuan}
          onChangeYuan={(v) => setForm((f) => ({ ...f, amountYuan: v }))}
        />
      </div>

      {/* 第三行：首次 / 末次日期 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <YearMonthDayField
          label={isLoan ? "首次还款日" : "首次日期"}
          value={form.firstDate}
          onChange={onFirstDateChange}
        />
        <div>
          <YearMonthDayField
            label={isLoan ? "末次还款日" : "末次日期"}
            value={form.lastDate}
            onChange={(lastDate) =>
              setForm((f) => ({
                ...f,
                lastDate: clampLastToFirst(f.firstDate, lastDate),
              }))
            }
            disabled={form.isLongTerm || isOnce}
          />
          {!isOnce && (
            <div className="mt-2 flex justify-end">
              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isLongTerm}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isLongTerm: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
                />
                <span className="text-sm text-slate-300">长期</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 第四行：创建日期 */}
      <YearMonthDayField
        label="创建日期"
        value={form.createdDate}
        onChange={(createdDate) => setForm((f) => ({ ...f, createdDate }))}
        hint={
          form.category === "loan" ? "贷款从创建日起计入负债" : undefined
        }
      />

      {/* 第五行：频率/还款周期 + 账户 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{isLoan ? "还款周期" : "发生频率"}</Label>
          <Select
            value={form.frequency}
            onChange={(v) => {
              const frequency = v as Frequency;
              setForm((f) => ({
                ...f,
                frequency,
                ...(frequency === "once"
                  ? { isLongTerm: false, lastDate: f.firstDate }
                  : {}),
              }));
            }}
            options={isLoan ? loanRepaymentCycleOptions : freqOptions}
          />
          {isLoan && (
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              结合首次、末次还款日自动计算，共{" "}
              <span className="tabular-amount font-semibold text-[var(--color-gold)]">
                {previewLoanPeriods}
              </span>{" "}
              期
            </p>
          )}
        </div>
        {showExpenseAccount ? (
          <div className="space-y-3">
            {form.category === "transfer" ? (
              <>
                <div>
                  <Label>转出账户</Label>
                  <Select
                    value={form.transferFrom}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        transferFrom: v as ExpenseSource,
                      }))
                    }
                    options={accountOptions}
                  />
                </div>
                <div>
                  <Label>转入账户</Label>
                  <Select
                    value={form.transferTo}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        transferTo: v as ExpenseSource,
                      }))
                    }
                    options={accountOptions}
                  />
                </div>
              </>
            ) : (
              <div>
                <Label>支出账户</Label>
                <Select
                  value={form.expenseSource}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      expenseSource: v as ExpenseSource,
                    }))
                  }
                  options={accountOptions}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}
      </div>

      {form.category === "loan" && (
        <div className="grid gap-4 sm:grid-cols-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-4">
          <div>
            <Label>年利率 (%)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.annualRate}
              onChange={(v) => setForm((f) => ({ ...f, annualRate: v }))}
            />
          </div>
          <div>
            <Label>还款方式</Label>
            <Select
              value={form.method}
              onChange={(v) =>
                setForm((f) => ({ ...f, method: v as LoanMethod }))
              }
              options={methodOptions}
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.excludeFromExpense}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  excludeFromExpense: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
            />
            <span className="text-sm text-slate-300">不计入支出</span>
          </label>
        </div>
      )}

      <div
        className={`flex items-center gap-3 pt-3 ${editingId ? "justify-between" : "justify-end"
          }`}
      >
        {editingId ? (
          <Btn variant="danger" onClick={remove}>
            删除
          </Btn>
        ) : null}
        <Btn onClick={submit} className="min-w-[9.5rem] px-10">
          {editingId ? "保存" : "添加"}
        </Btn>
      </div>
    </div>
  );
}

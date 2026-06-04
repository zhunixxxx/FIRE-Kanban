import { useMemo } from "react";
import { createEventDate } from "../lib/eventDates";
import { daysInMonth, parseIsoDate, toIsoDate } from "../lib/date";
import type { DateAnchor, EventDate } from "../types";
import { Input, Label, Select } from "./ui";

const anchorOptions: { value: DateAnchor; label: string }[] = [
  { value: "exact", label: "具体日" },
  { value: "month_start", label: "月初" },
  { value: "month_end", label: "月末" },
];

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} 月`,
}));

interface Props {
  label: string;
  value: EventDate;
  onChange: (d: EventDate) => void;
  disabled?: boolean;
  hint?: string;
}

export function YearMonthDayField({
  label,
  value,
  onChange,
  disabled = false,
  hint,
}: Props) {
  const { y, m, d } = parseIsoDate(value.iso);
  const maxDay = daysInMonth(y, m);

  const yearOptions = useMemo(() => {
    const years: { value: string; label: string }[] = [];
    for (let yr = 2020; yr <= 2099; yr++) {
      years.push({ value: String(yr), label: `${yr} 年` });
    }
    return years;
  }, []);

  const apply = (year: number, month: number, day: number, anchor: DateAnchor) => {
    const clampedDay = Math.min(Math.max(1, day), daysInMonth(year, month));
    onChange(createEventDate(toIsoDate(year, month, clampedDay), anchor));
  };

  const dayDisplay =
    value.anchor === "exact"
      ? d
      : value.anchor === "month_start"
        ? 1
        : maxDay;

  return (
    <div>
      <Label>{label}</Label>
      {hint && (
        <p className="mb-1.5 text-xs text-[var(--color-muted)]">{hint}</p>
      )}
      <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
        <div className="mt-1.5 grid grid-cols-[minmax(6.75rem,1.2fr)_minmax(4.25rem,0.8fr)_3.25rem_minmax(5.25rem,1fr)] gap-2 items-center">
          <Select
            value={String(y)}
            onChange={(v) => apply(Number(v), m, d, value.anchor)}
            options={yearOptions}
          />
          <Select
            value={String(m)}
            onChange={(v) => apply(y, Number(v), d, value.anchor)}
            options={monthOptions}
          />
          <Input
            type="number"
            min={1}
            max={maxDay}
            value={dayDisplay}
            onChange={(v) => {
              const day = Math.min(Math.max(1, Math.round(Number(v) || 1)), maxDay);
              apply(y, m, day, "exact");
            }}
            disabled={value.anchor !== "exact"}
            placeholder="日"
          />
          <Select
            value={value.anchor}
            onChange={(v) => apply(y, m, d, v as DateAnchor)}
            options={anchorOptions}
          />
        </div>
      </div>
    </div>
  );
}

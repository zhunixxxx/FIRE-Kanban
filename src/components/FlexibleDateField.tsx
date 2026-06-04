import { useEffect, useState } from "react";
import { createEventDate, formatEventDateLabel } from "../lib/eventDates";
import type { DateAnchor, EventDate } from "../types";
import { DateInput, Label, Select } from "./ui";

const anchorOptions: { value: DateAnchor; label: string }[] = [
  { value: "exact", label: "具体日期" },
  { value: "month_start", label: "月初" },
  { value: "month_end", label: "月末" },
];

interface Props {
  label: string;
  value: EventDate;
  onChange: (d: EventDate) => void;
  disabled?: boolean;
}

export function FlexibleDateField({
  label,
  value,
  onChange,
  disabled = false,
}: Props) {
  const [draftIso, setDraftIso] = useState(value.iso);

  useEffect(() => {
    setDraftIso(value.iso);
  }, [value.iso, value.anchor]);

  const applyAnchor = (anchor: DateAnchor) => {
    onChange(createEventDate(draftIso || value.iso, anchor));
  };

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      <Label>{label}</Label>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-[1fr_auto]">
        <DateInput
          value={draftIso}
          onChange={(iso) => {
            setDraftIso(iso);
            onChange(createEventDate(iso, value.anchor));
          }}
        />
        <Select
          value={value.anchor}
          onChange={(v) => applyAnchor(v as DateAnchor)}
          options={anchorOptions}
        />
      </div>
      {value.anchor !== "exact" && (
        <p className="tabular-amount mt-1 text-xs text-[var(--color-muted)]">
          → {formatEventDateLabel(value)}
        </p>
      )}
    </div>
  );
}

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { fromDisplayInput, toDisplayInput } from "../lib/format";
import {
  evaluateMathExpression,
  formatCalcPreview,
} from "../lib/mathExpression";
import { useSettings } from "../contexts/SettingsContext";
import { Label } from "./ui";

export type MoneyInputHandle = { flush: () => number };

interface Props {
  id?: string;
  label: string;
  valueYuan: number;
  onChangeYuan: (yuan: number) => void;
  compact?: boolean;
}

function sanitizeInput(value: string): string {
  if (value.startsWith("=")) {
    return "=" + value.slice(1).replace(/[^\d+\-*/().\s]/g, "");
  }
  return value.replace(/[^\d.]/g, "");
}

export const MoneyInput = forwardRef<MoneyInputHandle, Props>(function MoneyInput(
  { id, label, valueYuan, onChangeYuan, compact = false },
  ref
) {
  const { displayUnit } = useSettings();
  const suffix = displayUnit === "yuan" ? "¥" : displayUnit === "wan" ? "w" : "k";
  const [text, setText] = useState(() => toDisplayInput(valueYuan, displayUnit));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setText(toDisplayInput(valueYuan, displayUnit));
  }, [valueYuan, displayUnit]);

  const calcPreview = useMemo(() => {
    if (!text.startsWith("=")) return null;
    const value = evaluateMathExpression(text);
    if (value === null || value < 0) return null;
    return formatCalcPreview(value);
  }, [text]);

  const applyValue = (displayText: string): number => {
    const raw = displayText.trim();
    if (raw === "" || raw === ".") {
      onChangeYuan(0);
      setText("");
      return 0;
    }
    const yuan = fromDisplayInput(raw, displayUnit);
    onChangeYuan(yuan);
    const formatted = toDisplayInput(yuan, displayUnit);
    setText(formatted);
    return yuan;
  };

  const applyCalcResult = (): boolean => {
    const value = evaluateMathExpression(text);
    if (value === null || value < 0) return false;
    applyValue(formatCalcPreview(value));
    return true;
  };

  const commit = (): number => {
    if (text.startsWith("=")) {
      const value = evaluateMathExpression(text);
      if (value !== null && value >= 0) {
        return applyValue(formatCalcPreview(value));
      }
      setText(toDisplayInput(valueYuan, displayUnit));
      return valueYuan;
    }
    return applyValue(text);
  };

  useImperativeHandle(ref, () => ({ flush: commit }), [text, displayUnit, onChangeYuan, valueYuan]);

  return (
    <div>
      <Label htmlFor={id} className={compact ? "mb-1" : undefined}>
        {label}
      </Label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={text.startsWith("=") ? "text" : "decimal"}
          value={text}
          placeholder="0"
          onFocus={() => {
            focusedRef.current = true;
          }}
          onChange={(e) => setText(sanitizeInput(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.startsWith("=")) {
              e.preventDefault();
              applyCalcResult();
            }
          }}
          onBlur={() => {
            focusedRef.current = false;
            if (text.startsWith("=")) {
              if (!applyCalcResult()) {
                setText(toDisplayInput(valueYuan, displayUnit));
              }
              return;
            }
            applyValue(text);
          }}
          className={`tabular-amount w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-3 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] ${
            compact ? "py-2" : "py-2.5"
          }`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-gold)]">
          {suffix}
        </span>
        {calcPreview !== null ? (
          <div
            role="status"
            className="absolute left-0 top-full z-30 mt-1.5 flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-2.5 py-1.5 text-xs shadow-lg shadow-black/40"
          >
            <span className="tabular-amount font-semibold text-[var(--color-gold)]">
              {calcPreview}
            </span>
            <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1 text-[10px] leading-none text-[var(--color-muted)]">
              ↵
            </kbd>
          </div>
        ) : null}
      </div>
    </div>
  );
});

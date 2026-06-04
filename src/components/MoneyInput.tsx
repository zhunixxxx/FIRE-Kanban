import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { fromDisplayInput, toDisplayInput } from "../lib/format";
import { useSettings } from "../contexts/SettingsContext";
import { Label } from "./ui";

export type MoneyInputHandle = { flush: () => number };

interface Props {
  id?: string;
  label: string;
  valueYuan: number;
  onChangeYuan: (yuan: number) => void;
}

export const MoneyInput = forwardRef<MoneyInputHandle, Props>(function MoneyInput(
  { id, label, valueYuan, onChangeYuan },
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

  const commit = (): number => {
    const raw = text.trim();
    if (raw === "" || raw === ".") {
      onChangeYuan(0);
      setText("");
      return 0;
    }
    const yuan = fromDisplayInput(raw, displayUnit);
    onChangeYuan(yuan);
    setText(toDisplayInput(yuan, displayUnit));
    return yuan;
  };

  useImperativeHandle(ref, () => ({ flush: commit }), [text, displayUnit, onChangeYuan]);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          placeholder="0"
          onFocus={() => {
            focusedRef.current = true;
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, "");
            setText(raw);
          }}
          onBlur={() => {
            focusedRef.current = false;
            commit();
          }}
          className="tabular-amount w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-3 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-gold)]">
          {suffix}
        </span>
      </div>
    </div>
  );
});

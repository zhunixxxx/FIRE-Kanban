import { createContext, useContext, type ReactNode } from "react";
import { formatMoney as formatMoneyBase } from "../lib/format";
import type { DisplayUnit } from "../types";

interface SettingsContextValue {
  displayUnit: DisplayUnit;
  setDisplayUnit: (unit: DisplayUnit) => void;
  formatMoney: (value: number, hidden?: boolean) => string;
  formatChartValue: (value: number) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  displayUnit,
  setDisplayUnit,
  children,
}: {
  displayUnit: DisplayUnit;
  setDisplayUnit: (unit: DisplayUnit) => void;
  children: ReactNode;
}) {
  const formatMoney = (value: number, hidden = false) =>
    formatMoneyBase(value, hidden, displayUnit);

  const formatChartValue = (value: number) => formatMoneyBase(value, false, displayUnit);

  return (
    <SettingsContext.Provider
      value={{ displayUnit, setDisplayUnit, formatMoney, formatChartValue }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

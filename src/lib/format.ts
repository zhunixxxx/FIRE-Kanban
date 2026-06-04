import type { DisplayUnit } from "../types";

export const MASKED_AMOUNT = "¥ ••••••";
export const MASKED_PERCENT = "•••";

const UNIT_DIVISOR: Record<Exclude<DisplayUnit, "yuan">, number> = {
  wan: 10_000,
  qian: 1_000,
};

export function getUnitDivisor(unit: DisplayUnit): number {
  if (unit === "yuan") return 1;
  return UNIT_DIVISOR[unit];
}

export function unitInputSuffix(unit: DisplayUnit): string {
  if (unit === "yuan") return "¥";
  return UNIT_SUFFIX[unit];
}

/** 去掉多余尾随零，如 1.00 → 1、1.50 → 1.5 */
function trimTrailingZeros(s: string): string {
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "");
}

/** 元 → 输入框显示数值（不补无意义的小数位） */
export function toDisplayInput(yuan: number, unit: DisplayUnit): string {
  if (!yuan || !Number.isFinite(yuan)) return "";
  if (unit === "yuan") return String(Math.round(yuan));
  const n = yuan / getUnitDivisor(unit);
  return trimTrailingZeros(String(parseFloat(n.toPrecision(12))));
}

/** 输入框数值 → 元 */
export function fromDisplayInput(text: string, unit: DisplayUnit): number {
  const n = parseFloat(text.trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * getUnitDivisor(unit));
}

/** 看板英文简写：万 → w，千 → k，元 → 完整 ¥ */
const UNIT_SUFFIX: Record<Exclude<DisplayUnit, "yuan">, string> = {
  wan: "w",
  qian: "k",
};

/** 看板/流水：固定最多 2 位小数，去掉尾随零，各指标样式一致 */
function formatScaled(value: number, unit: Exclude<DisplayUnit, "yuan">): string {
  const n = value / UNIT_DIVISOR[unit];
  const suffix = UNIT_SUFFIX[unit];
  if (n === 0) return `0${suffix}`;
  const rounded = Math.round(n * 100) / 100;
  return `${trimTrailingZeros(rounded.toFixed(2))}${suffix}`;
}

function formatYuan(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoney(
  value: number,
  hidden = false,
  unit: DisplayUnit = "wan"
): string {
  if (hidden) return MASKED_AMOUNT;
  if (!Number.isFinite(value)) return "—";
  if (unit === "yuan") return formatYuan(value);
  return formatScaled(value, unit);
}

export function formatPercent(value: number, hidden = false): string {
  if (hidden) return MASKED_PERCENT;
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

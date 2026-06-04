/** 求值以 = 开头的简单四则运算表达式，结果为 display 单位下的数值 */
export function evaluateMathExpression(input: string): number | null {
  if (!input.startsWith("=")) return null;
  const expr = input.slice(1).trim();
  if (!expr || !/^[\d\s+\-*/().]+$/.test(expr)) return null;
  try {
    const value = Function(`"use strict"; return (${expr});`)();
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

export function formatCalcPreview(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return String(value);
  return String(parseFloat(value.toPrecision(12)));
}

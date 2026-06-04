export function parseIsoDate(iso: string): { y: number; m: number; d: number } {
  const [ys, ms, ds] = iso.split("-").map(Number);
  const now = new Date();
  return {
    y: ys && Number.isFinite(ys) ? ys : now.getFullYear(),
    m: ms >= 1 && ms <= 12 ? ms : now.getMonth() + 1,
    d: ds >= 1 && ds <= 31 ? ds : now.getDate(),
  };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function toIsoDate(year: number, month: number, day: number): string {
  const maxDay = daysInMonth(year, month);
  const d = Math.min(Math.max(1, day), maxDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** 展示与输入：YYYY/MM/DD */
export function isoToSlash(iso: string): string {
  const { y, m, d } = parseIsoDate(iso);
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
}

export function formatDateYMD(iso: string): string {
  return isoToSlash(iso);
}

/** 解析 YYYY/MM/DD 或 YYYY/M/D，无效则返回 null */
export function parseSlashDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = trimmed.split("/").map((p) => p.trim());
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || y < 1 || m < 1 || m > 12 || d < 1) return null;
  return toIsoDate(y, m, d);
}

export function todayIso(): string {
  const n = new Date();
  return toIsoDate(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

export function addMonthsToIso(iso: string, months: number): string {
  const { y, m, d } = parseIsoDate(iso);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + months);
  return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function compareIsoDate(a: string, b: string): number {
  return a.localeCompare(b);
}


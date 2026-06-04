import { useEffect, useMemo, useState } from "react";
import { formatDateYMD } from "../lib/date";
import { useSettings } from "../contexts/SettingsContext";
import type { FlowType, TimelineEntry } from "../types";
import { Section } from "./ui";

const PERIOD_LIMIT = 12;

interface Props {
  entries: TimelineEntry[];
  granularity: "monthly" | "quarterly";
}

function flowLabel(flow: FlowType): string {
  if (flow === "income") return "收入";
  if (flow === "expense") return "支出";
  return "转账";
}

function periodKey(
  iso: string,
  granularity: "monthly" | "quarterly"
): string {
  const y = iso.slice(0, 4);
  const m = Number(iso.slice(5, 7));
  if (granularity === "monthly") {
    return `${y}-${iso.slice(5, 7)}`;
  }
  return `${y}-Q${Math.ceil(m / 3)}`;
}

function orderedPeriods(
  entries: TimelineEntry[],
  granularity: "monthly" | "quarterly"
): string[] {
  const keys = new Set(entries.map((e) => periodKey(e.date, granularity)));
  return [...keys].sort();
}

function formatPeriodLabel(
  key: string,
  granularity: "monthly" | "quarterly"
): string {
  if (granularity === "monthly") return key;
  const [y, q] = key.split("-Q");
  return `${y} Q${q}`;
}

function AssetSnapshot({ entry }: { entry: TimelineEntry }) {
  const { formatMoney } = useSettings();
  return (
    <p className="tabular-amount mt-2 w-full border-t border-white/5 pt-2 text-xs text-[var(--color-muted)]">
      <span className="text-[var(--color-accent)]">
        活期 {formatMoney(entry.liquid)}
      </span>
      <span className="mx-2 text-[var(--color-border)]">·</span>
      <span className="text-[var(--color-gold)]">
        理财 {formatMoney(entry.investment)}
      </span>
      <span className="mx-2 text-[var(--color-border)]">·</span>
      <span className="text-[var(--color-expense)]">
        负债 {formatMoney(entry.remainingDebt)}
      </span>
    </p>
  );
}

export function TimelinePipeline({ entries, granularity }: Props) {
  const { formatMoney } = useSettings();
  const [expanded, setExpanded] = useState(false);

  const periods = useMemo(
    () => orderedPeriods(entries, granularity),
    [entries, granularity]
  );
  const needsCollapse =
    entries.length > PERIOD_LIMIT && periods.length > PERIOD_LIMIT;

  useEffect(() => {
    setExpanded(false);
  }, [entries, granularity]);

  const visibleEntries = useMemo(() => {
    if (!needsCollapse || expanded) return entries;
    const allowed = new Set(periods.slice(0, PERIOD_LIMIT));
    return entries.filter((e) => allowed.has(periodKey(e.date, granularity)));
  }, [entries, expanded, granularity, needsCollapse, periods]);

  const grouped = visibleEntries.reduce<Record<string, TimelineEntry[]>>(
    (acc, e) => {
      const key = periodKey(e.date, granularity);
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    },
    {}
  );

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.date.localeCompare(b.date));
  }

  const periodKeys = Object.keys(grouped).sort();
  const labelWidth = granularity === "quarterly" ? "w-28" : "w-24";
  const connectorLeft =
    granularity === "quarterly" ? "left-[7.5rem]" : "left-[6.5rem]";

  return (
    <Section title="流水账" subtitle="每笔事件后的资产快照">
      {periodKeys.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">
          暂无流水记录，添加事件后将逐笔展示资产变化
        </p>
      ) : (
        <>
          <div className="scrollbar-fire relative overflow-x-auto pb-4">
            <div className="min-w-[640px]">
              {periodKeys.map((key, pi) => (
                <div key={key} className="relative mb-8 flex gap-0 last:mb-0">
                  <div
                    className={`${labelWidth} shrink-0 pt-1 pr-4 text-right`}
                  >
                    <span className="text-sm text-[var(--color-gold)]">
                      {formatPeriodLabel(key, granularity)}
                    </span>
                  </div>
                  <div className="relative flex-1 border-l-2 border-[var(--color-border)] pl-6">
                    <span className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-surface)]" />
                    <div className="space-y-3">
                      {grouped[key].map((e, ei) => {
                        const neutral = e.flowType === "neutral";
                        const income = e.flowType === "income";
                        return (
                          <div
                            key={`${key}-${ei}-${e.label}-${e.amount}`}
                            className="relative flex items-stretch"
                          >
                            <div
                              className={`absolute left-0 top-1/2 h-px w-8 -translate-x-full ${
                                neutral
                                  ? "bg-white/30"
                                  : income
                                    ? "bg-[var(--color-income)]/50"
                                    : "bg-[var(--color-expense)]/50"
                              }`}
                            />
                            <div
                              className={`flex flex-1 flex-col rounded-lg border px-4 py-2.5 ${
                                neutral
                                  ? "border-slate-600/50 bg-slate-800/40"
                                  : income
                                    ? "border-emerald-900/40 bg-emerald-950/20"
                                    : "border-red-900/40 bg-red-950/20"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <span className="shrink-0 text-xs tabular-amount text-[var(--color-gold)]">
                                    {formatDateYMD(e.date)}
                                  </span>
                                  <span
                                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase ${
                                      neutral
                                        ? "bg-slate-500 text-white"
                                        : income
                                          ? "bg-[var(--color-income)] text-slate-950"
                                          : "bg-[var(--color-expense)] text-white"
                                    }`}
                                  >
                                    {flowLabel(e.flowType)}
                                  </span>
                                  <span className="font-medium text-white">
                                    {e.label}
                                  </span>
                                </div>
                                <span
                                  className={`text-sm font-semibold tabular-amount ${
                                    neutral
                                      ? "text-slate-200"
                                      : income
                                        ? "text-[var(--color-income)]"
                                        : "text-[var(--color-expense)]"
                                  }`}
                                >
                                  {neutral ? "" : income ? "+" : "−"}
                                  {formatMoney(e.amount)}
                                </span>
                              </div>
                              <AssetSnapshot entry={e} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {pi < periodKeys.length - 1 && (
                    <div
                      className={`pointer-events-none absolute top-8 bottom-0 ${connectorLeft} w-px bg-gradient-to-b from-[var(--color-border)] to-transparent`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          {needsCollapse && !expanded ? (
            <div className="border-t border-[var(--color-border)] pt-4 text-center">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-sm font-medium text-[var(--color-accent)] transition hover:text-[var(--color-gold)]"
              >
                显示全部
              </button>
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}

import { formatDateYMD } from "../lib/date";
import { useSettings } from "../contexts/SettingsContext";
import type { FlowType, TimelineEntry } from "../types";
import { Section } from "./ui";

interface Props {
  entries: TimelineEntry[];
}

function flowLabel(flow: FlowType): string {
  if (flow === "income") return "收入";
  if (flow === "expense") return "支出";
  return "转账";
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

export function TimelinePipeline({ entries }: Props) {
  const { formatMoney } = useSettings();
  const grouped = entries.reduce<Record<string, TimelineEntry[]>>((acc, e) => {
    const month = e.date.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(e);
    return acc;
  }, {});

  for (const month of Object.keys(grouped)) {
    grouped[month].sort((a, b) => a.date.localeCompare(b.date));
  }

  const months = Object.keys(grouped).sort();

  return (
    <Section
      title="流水账"
      subtitle="每笔事件后的资产快照"
    >
      {months.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)] py-8 text-center">
          暂无流水记录，添加事件后将逐笔展示资产变化
        </p>
      ) : (
        <div className="scrollbar-fire relative overflow-x-auto pb-4">
          <div className="min-w-[640px]">
            {months.map((month, mi) => (
              <div key={month} className="relative flex gap-0 mb-8 last:mb-0">
                <div className="w-24 shrink-0 pt-1 text-right pr-4">
                  <span className="text-sm text-[var(--color-gold)]">
                    {month}
                  </span>
                </div>
                <div className="relative flex-1 pl-6 border-l-2 border-[var(--color-border)]">
                  <span className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-surface)]" />
                  <div className="space-y-3">
                    {grouped[month].map((e, ei) => {
                      const neutral = e.flowType === "neutral";
                      const income = e.flowType === "income";
                      return (
                        <div
                          key={`${month}-${ei}-${e.label}-${e.amount}`}
                          className="relative flex items-stretch"
                        >
                          <div
                            className={`absolute left-0 top-1/2 h-px w-8 -translate-x-full ${neutral
                                ? "bg-white/30"
                                : income
                                  ? "bg-[var(--color-income)]/50"
                                  : "bg-[var(--color-expense)]/50"
                              }`}
                          />
                          <div
                            className={`flex flex-1 flex-col rounded-lg border px-4 py-2.5 ${neutral
                                ? "border-slate-600/50 bg-slate-800/40"
                                : income
                                  ? "border-emerald-900/40 bg-emerald-950/20"
                                  : "border-red-900/40 bg-red-950/20"
                              }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="tabular-amount shrink-0 text-xs text-[var(--color-gold)]">
                                  {formatDateYMD(e.date)}
                                </span>
                                <span
                                  className={`rounded px-2 py-0.5 text-xs font-bold uppercase shrink-0 ${neutral
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
                                className={`tabular-amount text-sm font-semibold ${neutral
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
                {mi < months.length - 1 && (
                  <div className="absolute left-[6.5rem] bottom-0 top-8 w-px bg-gradient-to-b from-[var(--color-border)] to-transparent pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

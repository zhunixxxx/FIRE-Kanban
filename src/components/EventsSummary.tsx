import type { FinancialEvent } from "../types";
import {
  categoryBadgeClass,
  categoryLabel,
  eventSummaryLine,
} from "../lib/eventDisplay";
import { useSettings } from "../contexts/SettingsContext";
import { Section } from "./ui";

interface Props {
  events: FinancialEvent[];
  onEdit: (id: string) => void;
  onAdd: () => void;
}

export function EventsSummary({ events, onEdit, onAdd }: Props) {
  const { formatMoney } = useSettings();

  return (
    <Section
      title="事件列表"
      action={
        <button
          type="button"
          onClick={onAdd}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-medium leading-none text-[var(--color-accent)] transition hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/10"
          aria-label="添加事件"
          title="添加事件"
        >
          +
        </button>
      }
    >
      {events.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)] py-2">
          暂无事件，点击右上角 + 添加
        </p>
      ) : (
        <ul className="scrollbar-fire max-h-[min(240px,32vh)] overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] pr-0.5 -mx-0.5">
          {events.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onEdit(ev.id)}
                className="w-full px-3 py-2.5 text-left transition hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${categoryBadgeClass(ev.category)}`}
                  >
                    {categoryLabel(ev.category)}
                  </span>
                  <span className="truncate font-medium text-white">{ev.name}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)] line-clamp-2">
                  {eventSummaryLine(ev, formatMoney)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

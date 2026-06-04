import { useMemo, useState } from "react";
import type { FinancialEvent } from "../types";
import { formatDateYMD } from "../lib/date";
import { frequencyLabels } from "../lib/eventDisplay";
import {
  nextOccurrenceAmount,
  upcomingEventsWithDate,
} from "../lib/eventList";
import { useSettings } from "../contexts/SettingsContext";
import { EventListRow } from "./EventListRow";
import { EventsListModal } from "./EventsListModal";
import { Section } from "./ui";

interface Props {
  events: FinancialEvent[];
  onEdit: (id: string) => void;
  onAdd: () => void;
  className?: string;
}

const PREVIEW_LIMIT = 4;

export function EventsSummary({ events, onEdit, onAdd, className }: Props) {
  const { formatMoney } = useSettings();
  const [listOpen, setListOpen] = useState(false);
  const upcoming = useMemo(() => upcomingEventsWithDate(events), [events]);
  const preview = useMemo(() => upcoming.slice(0, PREVIEW_LIMIT), [upcoming]);

  return (
    <>
      <Section
        title="事件列表"
        compact
        fill
        className={className}
        action={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onAdd}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-lg font-medium leading-none text-[var(--color-accent)] transition hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/10"
              aria-label="添加事件"
              title="添加事件"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setListOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
              aria-label="查看全部事件"
              title="查看全部事件"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M2.5 4h11M2.5 8h11M2.5 12h11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        }
      >
        {upcoming.length === 0 ? (
          <p className="py-2 text-sm text-[var(--color-muted)]">
            {events.length === 0
              ? "暂无事件，点击右上角 + 添加"
              : "暂无即将发生的事件"}
          </p>
        ) : (
          <ul className="scrollbar-fire -mx-0.5 max-h-[min(240px,32vh)] overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] pr-0.5 lg:max-h-none lg:min-h-0 lg:flex-1">
            {preview.map(({ ev, nextIso }) => (
              <EventListRow
                key={ev.id}
                ev={ev}
                formatMoney={formatMoney}
                detail={`${formatMoney(nextOccurrenceAmount(ev, nextIso))} · ${formatDateYMD(nextIso)}`}
                detailRight={frequencyLabels[ev.frequency]}
                onClick={() => onEdit(ev.id)}
              />
            ))}
          </ul>
        )}
      </Section>

      <EventsListModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        events={events}
        onEdit={onEdit}
      />
    </>
  );
}

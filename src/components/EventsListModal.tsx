import { useMemo, useState } from "react";
import type { FinancialEvent } from "../types";
import { formatDateYMD } from "../lib/date";
import { formatEventDateLabel } from "../lib/eventDates";
import {
  defaultEventFilters,
  filterCategoryLabels,
  filterEvents,
  nextOccurrenceIso,
  sortEvents,
  type EventFilterCategory,
  type EventSortMode,
} from "../lib/eventList";
import { useSettings } from "../contexts/SettingsContext";
import { EventListRow } from "./EventListRow";
import { Modal } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  events: FinancialEvent[];
  onEdit: (id: string) => void;
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function SortChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-[var(--color-gold)]/50 bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export function EventsListModal({ open, onClose, events, onEdit }: Props) {
  const { formatMoney } = useSettings();
  const [sortMode, setSortMode] = useState<EventSortMode>("upcoming");
  const [filters, setFilters] = useState(defaultEventFilters);

  const visibleEvents = useMemo(() => {
    const filtered = filterEvents(events, filters);
    return sortEvents(filtered, sortMode);
  }, [events, filters, sortMode]);

  const toggleFilter = (cat: EventFilterCategory) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const rowMeta = (ev: FinancialEvent) => {
    if (sortMode === "created") {
      return `创建 ${formatEventDateLabel(ev.createdDate)}`;
    }
    const next = nextOccurrenceIso(ev);
    return next ? `下次 ${formatDateYMD(next)}` : "已结束";
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="全部事件"
      subtitle={`共 ${events.length} 项`}
      size="events-list"
      scrollBody={false}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-[var(--color-muted)]">
              排序
            </span>
            <div className="flex flex-wrap gap-1.5">
              <SortChip
                label="即将发生"
                active={sortMode === "upcoming"}
                onClick={() => setSortMode("upcoming")}
              />
              <SortChip
                label="创建时间"
                active={sortMode === "created"}
                onClick={() => setSortMode("created")}
              />
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className="shrink-0 text-xs font-medium text-[var(--color-muted)]">
              筛选
            </span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {(Object.keys(filterCategoryLabels) as EventFilterCategory[]).map(
                (cat) => (
                  <FilterChip
                    key={cat}
                    label={filterCategoryLabels[cat]}
                    active={filters.has(cat)}
                    onClick={() => toggleFilter(cat)}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {visibleEvents.length === 0 ? (
          <p className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">
            没有符合条件的事件
          </p>
        ) : (
          <ul className="scrollbar-fire min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] pr-0.5">
            {visibleEvents.map((ev) => (
              <EventListRow
                key={ev.id}
                ev={ev}
                formatMoney={formatMoney}
                meta={rowMeta(ev)}
                onClick={() => {
                  onEdit(ev.id);
                  onClose();
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

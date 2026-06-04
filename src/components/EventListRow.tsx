import type { FinancialEvent } from "../types";
import {
  categoryBadgeClass,
  categoryLabel,
  eventSummaryLine,
} from "../lib/eventDisplay";

interface Props {
  ev: FinancialEvent;
  onClick: () => void;
  formatMoney: (n: number) => string;
  meta?: string;
  detail?: string;
  detailRight?: string;
}

export function EventListRow({
  ev,
  onClick,
  formatMoney,
  meta,
  detail,
  detailRight,
}: Props) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full px-3 py-2 text-left transition hover:bg-white/5 focus:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${categoryBadgeClass(ev.category)}`}
          >
            {categoryLabel(ev.category)}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-white">
            {ev.name}
          </span>
          {meta ? (
            <span className="shrink-0 text-xs tabular-amount text-[var(--color-muted)]">
              {meta}
            </span>
          ) : null}
        </div>
        {detail ? (
          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
            <span className="min-w-0 truncate tabular-amount">{detail}</span>
            {detailRight ? (
              <span className="shrink-0">{detailRight}</span>
            ) : null}
          </div>
        ) : (
          <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted)]">
            {eventSummaryLine(ev, formatMoney)}
          </p>
        )}
      </button>
    </li>
  );
}

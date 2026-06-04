import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { isoToSlash, parseSlashDate } from "../lib/date";

export function Section({
  title,
  subtitle,
  action,
  children,
  className = "",
  compact = false,
  fill = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  fill?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-lg shadow-black/20 ${
        compact ? "p-4" : "p-5 md:p-6"
      } ${fill ? "flex min-h-0 flex-col" : ""} ${className}`}
    >
      <header
        className={`flex items-start justify-between gap-4 ${compact ? "mb-3" : "mb-5"} ${
          fill ? "shrink-0" : ""
        }`}
      >
        <div className="min-w-0">
          <h2
            className={`font-semibold tracking-tight text-white ${
              compact ? "text-base" : "text-lg"
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-0.5 text-[var(--color-muted)] ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {fill ? (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

export function Label({
  children,
  htmlFor,
  className = "",
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-medium uppercase tracking-wider text-[var(--color-muted)] mb-1.5 ${className}`}
    >
      {children}
    </label>
  );
}

export function Input({
  id,
  type = "text",
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  disabled = false,
}: {
  id?: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
    />
  );
}

const selectTriggerClass =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-white transition focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]";

const SELECT_MENU_MAX = 208;
const SELECT_ITEM_HEIGHT = 36;

export function Select({
  id,
  value,
  onChange,
  options,
  compact = false,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.value === value);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const preferred = Math.min(
      SELECT_MENU_MAX,
      Math.max(options.length * SELECT_ITEM_HEIGHT + 8, 120)
    );
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < preferred && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      SELECT_MENU_MAX,
      Math.max(96, openUp ? spaceAbove : spaceBelow)
    );

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 200,
      maxHeight,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onLayout = () => updateMenuPosition();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, updateMenuPosition]);

  const menu =
    open &&
    createPortal(
      <ul
        ref={menuRef}
        role="listbox"
        style={menuStyle}
        className="scrollbar-fire overflow-y-auto overscroll-contain rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-xl shadow-black/50"
      >
        {options.map((o) => (
          <li key={o.value} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition ${
                o.value === value
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                  : "text-white hover:bg-white/5"
              }`}
            >
              {o.label}
            </button>
          </li>
        ))}
      </ul>,
      document.body
    );

  return (
    <div ref={rootRef} className="relative" id={id}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${selectTriggerClass} ${compact ? "py-2" : ""}`}
      >
        <span className="whitespace-nowrap">{selected?.label ?? value}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`shrink-0 text-[var(--color-muted)] transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {menu}
    </div>
  );
}

export function RangeInput({
  id,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  id?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: string) => void;
}) {
  const span = max - min || 1;
  const pct = ((value - min) / span) * 100;
  return (
    <input
      id={id}
      type="range"
      className="range-fire"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
      }}
    />
  );
}

export function DateInput({
  value,
  onChange,
  placeholder = "YYYY/MM/DD",
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => isoToSlash(value));

  useEffect(() => {
    setText(isoToSlash(value));
  }, [value]);

  const commit = (raw: string) => {
    const iso = parseSlashDate(raw);
    if (iso) {
      onChange(iso);
      setText(isoToSlash(iso));
    } else {
      setText(isoToSlash(value));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value.replace(/-/g, "/");
        setText(raw);
        const iso = parseSlashDate(raw);
        if (iso) onChange(iso);
      }}
      onBlur={() => commit(text)}
      className="tabular-amount w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
    />
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary:
      "bg-[var(--color-accent)] text-slate-950 hover:brightness-110 disabled:opacity-50",
    ghost:
      "border border-[var(--color-border)] text-slate-300 hover:bg-white/5 disabled:opacity-50",
    danger:
      "border border-red-900/50 text-red-400 hover:bg-red-950/40 disabled:opacity-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "default",
  scrollBody = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "default" | "settings" | "event" | "events-list";
  scrollBody?: boolean;
}) {
  const isSettings = size === "settings";
  const isEvent = size === "event";
  const isEventsList = size === "events-list";
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        aria-label="关闭"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex w-full min-h-0 flex-col rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl shadow-black/50 ${
          isEventsList
            ? "h-[min(560px,92vh)] w-full max-w-[640px]"
            : `max-h-[92vh] ${
                isSettings
                  ? "sm:w-[600px] sm:max-w-[600px]"
                  : isEvent
                    ? "sm:w-[min(880px,96vw)] sm:max-w-[880px] sm:max-h-[88vh]"
                    : "sm:max-w-3xl sm:max-h-[88vh]"
              }`
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4 md:px-6">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-white/5 hover:text-white transition"
            aria-label="关闭窗口"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div
          className={
            isSettings
              ? "overflow-hidden"
              : scrollBody
                ? "scrollbar-fire overflow-y-auto px-5 py-5 md:px-6 md:py-6"
                : "flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 md:px-6"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

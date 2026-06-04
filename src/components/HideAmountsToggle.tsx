interface Props {
  hidden: boolean;
  onToggle: () => void;
}

function EyeOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.7a2.5 2.5 0 0 0 3.4 3.4M7.2 7.2C5.4 8.4 3.9 10.2 2 12c0 0 3.5 7 10 7 2 0 3.7-.6 5.1-1.6M14 14.5c-.8.3-1.7.5-2.6.5-3.9 0-7-3.1-7-7 0-.9.2-1.8.5-2.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 5.1A10.1 10.1 0 0 1 12 5c6.5 0 10 7 10 7a16.2 16.2 0 0 1-3.2 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HideAmountsToggle({ hidden, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={hidden}
      aria-label={hidden ? "显示金额" : "隐藏金额"}
      title={hidden ? "显示金额" : "隐藏金额"}
      className={`rounded-lg border p-2.5 transition ${
        hidden
          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-white/5 hover:text-white"
      }`}
    >
      {hidden ? <EyeOffIcon /> : <EyeOpenIcon />}
    </button>
  );
}

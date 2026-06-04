import { useSettings } from "../contexts/SettingsContext";

interface Props {
  liquid: number;
  investment: number;
  remainingDebt: number;
  hideAmounts?: boolean;
}

export function MetricCards({
  liquid,
  investment,
  remainingDebt,
  hideAmounts = false,
}: Props) {
  const { formatMoney } = useSettings();
  const cards = [
    {
      label: "活期留存",
      value: formatMoney(liquid, hideAmounts),
      accent: "text-[var(--color-accent)]",
    },
    {
      label: "理财本金",
      value: formatMoney(investment, hideAmounts),
      accent: "text-[var(--color-gold)]",
    },
    {
      label: "剩余债务",
      value: formatMoney(remainingDebt, hideAmounts),
      accent: "text-[var(--color-expense)]",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-panel)] to-[var(--color-surface)] p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {c.label}
          </p>
          <p className={`tabular-amount mt-2 text-2xl font-semibold ${c.accent}`}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

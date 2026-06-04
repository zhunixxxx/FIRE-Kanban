import { HideAmountsToggle } from "./HideAmountsToggle";
import { MetricCards } from "./MetricCards";
import { Section } from "./ui";

interface Props {
  liquid: number;
  investment: number;
  remainingDebt: number;
  periodLabel?: string;
  hideAmounts: boolean;
  onToggleHide: () => void;
  className?: string;
}

export function DashboardPanel({
  liquid,
  investment,
  remainingDebt,
  periodLabel,
  hideAmounts,
  onToggleHide,
  className,
}: Props) {
  return (
    <Section
      title="视觉看板"
      subtitle={
        periodLabel ? `时点 · ${periodLabel}` : "点击趋势图选择时点"
      }
      action={
        <HideAmountsToggle hidden={hideAmounts} onToggle={onToggleHide} />
      }
      className={className}
    >
      <MetricCards
        liquid={liquid}
        investment={investment}
        remainingDebt={remainingDebt}
        hideAmounts={hideAmounts}
      />
    </Section>
  );
}

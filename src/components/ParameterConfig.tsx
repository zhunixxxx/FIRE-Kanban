import type { AppParams } from "../types";
import { MoneyInput } from "./MoneyInput";
import { Label, RangeInput, Section, Select } from "./ui";

interface Props {
  params: AppParams;
  onChange: (p: Partial<AppParams>) => void;
  className?: string;
}

function num(v: string, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export function ParameterConfig({ params, onChange, className }: Props) {
  return (
    <Section
      title="参数配置"
      subtitle="初始资金与定存触发策略"
      className={className}
    >
      <div className="grid gap-5">
        <MoneyInput
          id="initialInvestment"
          label="初始理财本金"
          valueYuan={params.initialInvestment}
          onChangeYuan={(v) => onChange({ initialInvestment: v })}
        />
        <MoneyInput
          id="initialLiquid"
          label="初始活期留存"
          valueYuan={params.initialLiquid}
          onChangeYuan={(v) => onChange({ initialLiquid: v })}
        />
        <MoneyInput
          id="fixedDepositTrigger"
          label="定存触发器金额"
          valueYuan={params.fixedDepositTrigger}
          onChangeYuan={(v) => onChange({ fixedDepositTrigger: v })}
        />
        <div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="projectionYears" className="mb-0">
              预测年数
            </Label>
            <span className="tabular-amount text-sm font-semibold text-[var(--color-gold)]">
              {params.projectionYears} 年
            </span>
          </div>
          <RangeInput
            id="projectionYears"
            min={1}
            max={10}
            step={1}
            value={params.projectionYears}
            onChange={(v) => onChange({ projectionYears: num(v, 5) })}
          />
          <div className="flex justify-between text-xs text-[var(--color-muted)]">
            <span>1 年</span>
            <span>10 年</span>
          </div>
        </div>
        <div>
          <Label htmlFor="granularity">趋势粒度</Label>
          <Select
            id="granularity"
            value={params.projectionGranularity}
            onChange={(v) =>
              onChange({
                projectionGranularity: v as AppParams["projectionGranularity"],
              })
            }
            options={[
              { value: "monthly", label: "月度" },
              { value: "quarterly", label: "季度" },
            ]}
          />
        </div>
      </div>
    </Section>
  );
}

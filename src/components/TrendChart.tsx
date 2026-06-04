import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartEvent,
  type ActiveElement,
} from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useSettings } from "../contexts/SettingsContext";
import type { PeriodSnapshot } from "../types";
import { Section } from "./ui";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

ChartJS.defaults.font.family = '"DM Sans", system-ui, sans-serif';

interface Props {
  snapshots: PeriodSnapshot[];
  selectedIndex: number;
  onSelectSnapshot: (index: number) => void;
  className?: string;
}

export function TrendChart({
  snapshots,
  selectedIndex,
  onSelectSnapshot,
  className,
}: Props) {
  const { formatChartValue } = useSettings();
  const labels = snapshots.map((s) => s.label);
  const safeIndex = Math.min(
    Math.max(0, selectedIndex),
    Math.max(0, snapshots.length - 1)
  );

  const pointRadius = (ctx: { dataIndex: number }) =>
    ctx.dataIndex === safeIndex ? 5 : 0;

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "总资产",
          data: snapshots.map((s) => s.investmentAssets + s.liquid),
          borderColor: "#3d9eff",
          backgroundColor: "rgba(61, 158, 255, 0.08)",
          fill: true,
          tension: 0.35,
          pointRadius,
          pointHoverRadius: 4,
          pointHitRadius: 12,
          pointBackgroundColor: "#3d9eff",
          pointBorderColor: "#121820",
          pointBorderWidth: 2,
        },
        {
          label: "总负债",
          data: snapshots.map((s) => s.totalLiabilities),
          borderColor: "#ef4444",
          backgroundColor: "transparent",
          tension: 0.35,
          pointRadius,
          pointHoverRadius: 4,
          pointHitRadius: 12,
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#121820",
          pointBorderWidth: 2,
        },
      ],
    }),
    [labels, snapshots, safeIndex]
  );

  const options = useMemo(
    (): ChartOptions<"line"> => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      onClick: (_event: ChartEvent, _elements: ActiveElement[], chart) => {
        const native = _event.native;
        if (!native || !(native instanceof MouseEvent)) return;
        const hits = chart.getElementsAtEventForMode(
          native,
          "index",
          { intersect: false },
          true
        );
        if (hits.length > 0) {
          onSelectSnapshot(hits[0].index);
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#8b9cb3", boxWidth: 12, padding: 16 },
        },
        tooltip: {
          enabled: true,
          backgroundColor: "#121820",
          borderColor: "#1e2a38",
          borderWidth: 1,
          titleColor: "#8b9cb3",
          bodyColor: "#e2e8f0",
          padding: 12,
          displayColors: true,
          boxWidth: 10,
          boxHeight: 10,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label ?? "";
              const value = formatChartValue(context.parsed.y ?? 0);
              return `${label}: ${value}`;
            },
            afterLabel: (context) => {
              if (context.datasetIndex !== 0) return [];
              const snapshot = snapshots[context.dataIndex];
              if (!snapshot) return [];
              return [
                `  理财本金: ${formatChartValue(snapshot.investmentAssets)}`,
                `  活期留存: ${formatChartValue(snapshot.liquid)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(30, 42, 56, 0.6)" },
          ticks: { color: "#8b9cb3", maxRotation: 45, minRotation: 0 },
        },
        y: {
          grid: { color: "rgba(30, 42, 56, 0.6)" },
          ticks: {
            color: "#8b9cb3",
            callback: (v) => formatChartValue(Number(v)),
          },
        },
      },
    }),
    [formatChartValue, onSelectSnapshot, snapshots]
  );

  return (
    <Section
      title="趋势图表"
      subtitle="悬停查看数值，点击图表上的时点更新上方视觉看板"
      fill
      className={className}
    >
      <div className="min-h-0 w-full flex-1 cursor-pointer lg:flex lg:flex-col">
        {snapshots.length > 1 ? (
          <div className="h-72 min-h-0 flex-1 lg:h-full">
            <Line data={data} options={options} />
          </div>
        ) : (
          <p className="flex h-72 items-center justify-center text-sm text-[var(--color-muted)] lg:h-full lg:min-h-[12rem]">
            请配置参数与事件以生成预测曲线
          </p>
        )}
      </div>
    </Section>
  );
}

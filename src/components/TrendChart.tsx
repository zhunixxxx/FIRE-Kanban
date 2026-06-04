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
}

export function TrendChart({
  snapshots,
  selectedIndex,
  onSelectSnapshot,
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
          label: "理财资产",
          data: snapshots.map((s) => s.investmentAssets),
          borderColor: "#3d9eff",
          backgroundColor: "rgba(61, 158, 255, 0.08)",
          fill: true,
          tension: 0.35,
          pointRadius,
          pointHoverRadius: 0,
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
          pointHoverRadius: 0,
          pointHitRadius: 12,
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#121820",
          pointBorderWidth: 2,
        },
        {
          label: "累计净资产",
          data: snapshots.map((s) => s.netWorth),
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.06)",
          fill: true,
          tension: 0.35,
          pointRadius,
          pointHoverRadius: 0,
          pointHitRadius: 12,
          pointBackgroundColor: "#22c55e",
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
          enabled: false,
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
    [formatChartValue, onSelectSnapshot]
  );

  return (
    <Section
      title="趋势图表"
      subtitle="点击图表上的时点，更新上方视觉看板"
    >
      <div className="h-72 md:h-96 w-full cursor-pointer">
        {snapshots.length > 1 ? (
          <Line data={data} options={options} />
        ) : (
          <p className="flex h-full cursor-default items-center justify-center text-sm text-[var(--color-muted)]">
            请配置参数与事件以生成预测曲线
          </p>
        )}
      </div>
    </Section>
  );
}

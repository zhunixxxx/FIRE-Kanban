import { useEffect, useMemo, useState } from "react";
import { DashboardPanel } from "./components/DashboardPanel";
import { EventConfigModal } from "./components/EventConfigModal";
import { EventsSummary } from "./components/EventsSummary";
import { ParameterConfig } from "./components/ParameterConfig";
import { SettingsButton } from "./components/SettingsButton";
import { SettingsModal } from "./components/SettingsModal";
import { TimelinePipeline } from "./components/TimelinePipeline";
import { TrendChart } from "./components/TrendChart";
import { SettingsProvider } from "./contexts/SettingsContext";
import { usePersistedState } from "./hooks/usePersistedState";
import { runSimulation } from "./lib/simulation";

export default function App() {
  const {
    state,
    updateParams,
    setEvents,
    setDisplayUnit,
    resetAll,
    exportToFile,
    importFromFile,
  } = usePersistedState();
  const [eventsModalOpen, setEventsModalOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [snapshotIndex, setSnapshotIndex] = useState(0);

  const simulation = useMemo(
    () => runSimulation(state.params, state.events),
    [state.params, state.events]
  );

  useEffect(() => {
    setSnapshotIndex(0);
  }, [simulation.snapshots]);

  const activeSnapshot =
    simulation.snapshots[snapshotIndex] ?? simulation.snapshots[0];

  const openEventEditor = (id: string | null) => {
    setEditEventId(id);
    setEventsModalOpen(true);
  };

  return (
    <SettingsProvider
      displayUnit={state.settings.displayUnit}
      setDisplayUnit={setDisplayUnit}
    >
      <div className="min-h-screen">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-panel)]/80 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-[var(--color-gold)]">FIRE</span> Kanban
              </h1>
              <p className="text-xs text-[var(--color-muted)]">
                家庭财务看板 · 触发式理财 · 本地存储
              </p>
            </div>
            <SettingsButton onClick={() => setSettingsOpen(true)} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_1fr] xl:grid-cols-[360px_1fr] lg:items-stretch">
            <aside className="flex flex-col gap-4 lg:h-full lg:min-h-0">
              <ParameterConfig
                params={state.params}
                onChange={updateParams}
                className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col"
              />
              <EventsSummary
                events={state.events}
                onEdit={(id) => openEventEditor(id)}
                onAdd={() => openEventEditor(null)}
              />
            </aside>

            <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
              <DashboardPanel
                liquid={activeSnapshot?.liquid ?? simulation.liquid}
                investment={
                  activeSnapshot?.investmentAssets ?? simulation.investment
                }
                remainingDebt={
                  activeSnapshot?.totalLiabilities ?? simulation.remainingDebt
                }
                periodLabel={activeSnapshot?.label}
                hideAmounts={hideAmounts}
                onToggleHide={() => setHideAmounts((h) => !h)}
              />
              <TrendChart
                snapshots={simulation.snapshots}
                selectedIndex={snapshotIndex}
                onSelectSnapshot={setSnapshotIndex}
              />
            </div>
          </div>

          <div className="mt-6">
            <TimelinePipeline entries={simulation.timeline} />
          </div>
        </main>

        <EventConfigModal
          open={eventsModalOpen}
          onClose={() => setEventsModalOpen(false)}
          events={state.events}
          onChange={setEvents}
          editEventId={editEventId}
        />

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          displayUnit={state.settings.displayUnit}
          onDisplayUnitChange={setDisplayUnit}
          onExportToFile={exportToFile}
          onImportFromFile={importFromFile}
          onResetAll={resetAll}
        />

        <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-muted)]">
          数据仅保存在本机浏览器 · 兼容 Safari
        </footer>
      </div>
    </SettingsProvider>
  );
}

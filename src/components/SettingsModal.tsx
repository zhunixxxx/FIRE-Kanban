import { useState } from "react";
import type { DisplayUnit } from "../types";
import { Btn, Modal } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  displayUnit: DisplayUnit;
  onDisplayUnitChange: (unit: DisplayUnit) => void;
  onExportToFile: () => Promise<void>;
  onImportFromFile: () => Promise<void>;
  onResetAll: () => void;
}

type SettingsTab = "data" | "display";

const PANEL_HEIGHT = "h-[400px]";

const navItems: { id: SettingsTab; label: string }[] = [
  { id: "data", label: "数据" },
  { id: "display", label: "显示" },
];

const unitOptions: { value: DisplayUnit; label: string; badge: string }[] = [
  { value: "yuan", label: "元", badge: "¥" },
  { value: "wan", label: "万", badge: "w" },
  { value: "qian", label: "千", badge: "k" },
];

export function SettingsModal({
  open,
  onClose,
  displayUnit,
  onDisplayUnitChange,
  onExportToFile,
  onImportFromFile,
  onResetAll,
}: Props) {
  const [tab, setTab] = useState<SettingsTab>("display");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        window.alert("操作失败，请重试。");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleExport = () =>
    run(async () => {
      await onExportToFile();
    });

  const handleImport = () => {
    if (!window.confirm("导入将覆盖当前参数与事件，是否继续？")) return;
    run(async () => {
      await onImportFromFile();
      onClose();
    });
  };

  const handleReset = () => {
    if (window.confirm("确定清空所有参数与财务事件？此操作不可撤销。")) {
      onResetAll();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="设置" size="settings">
      <div className={`flex ${PANEL_HEIGHT}`}>
        <nav
          className="flex w-36 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/40 py-3"
          aria-label="设置分类"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition ${
                tab === item.id
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-r-2 border-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className={`relative min-w-0 flex-1 ${PANEL_HEIGHT}`}>
          <section
            className={`absolute inset-0 flex flex-col justify-center gap-3 px-8 ${
              tab === "data" ? "" : "invisible pointer-events-none"
            }`}
            aria-hidden={tab !== "data"}
          >
            <Btn variant="ghost" className="w-full" onClick={handleExport} disabled={busy}>
              保存到 JSON 文件
            </Btn>
            <Btn variant="ghost" className="w-full" onClick={handleImport} disabled={busy}>
              从 JSON 文件加载
            </Btn>
            <Btn variant="danger" className="w-full mt-2" onClick={handleReset} disabled={busy}>
              清空所有数据
            </Btn>
          </section>

          <section
            className={`absolute inset-0 flex flex-col justify-center gap-3 px-8 ${
              tab === "display" ? "" : "invisible pointer-events-none"
            }`}
            aria-hidden={tab !== "display"}
          >
            {unitOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border px-5 py-4 transition ${
                  displayUnit === opt.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                    : "border-[var(--color-border)] hover:bg-white/5"
                }`}
              >
                <input
                  type="radio"
                  name="displayUnit"
                  value={opt.value}
                  checked={displayUnit === opt.value}
                  onChange={() => onDisplayUnitChange(opt.value)}
                  className="accent-[var(--color-accent)]"
                  tabIndex={tab === "display" ? 0 : -1}
                />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-sm font-bold text-[var(--color-gold)]">
                  {opt.badge}
                </span>
                <span className="font-medium text-white">{opt.label}</span>
              </label>
            ))}
          </section>
        </div>
      </div>
    </Modal>
  );
}

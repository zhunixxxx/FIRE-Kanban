import { useCallback, useEffect, useState } from "react";
import type { AppState } from "../types";
import { DEFAULT_PARAMS } from "../types";
import type { AppSettings, DisplayUnit } from "../types";
import { loadStateFromFile, saveStateToFile } from "../lib/filePersistence";
import { loadState, saveState } from "../lib/storage";

export function usePersistedState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateParams = useCallback((params: Partial<AppState["params"]>) => {
    setState((s) => ({ ...s, params: { ...s.params, ...params } }));
  }, []);

  const setEvents = useCallback((events: AppState["events"]) => {
    setState((s) => ({ ...s, events }));
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    setState((s) => ({
      ...s,
      settings: { ...s.settings, ...settings },
    }));
  }, []);

  const setDisplayUnit = useCallback((displayUnit: DisplayUnit) => {
    updateSettings({ displayUnit });
  }, [updateSettings]);

  const replaceState = useCallback((next: AppState) => {
    setState(next);
    saveState(next);
  }, []);

  const resetAll = useCallback(() => {
    setState((s) => ({
      params: { ...DEFAULT_PARAMS },
      events: [],
      settings: s.settings,
    }));
  }, []);

  const exportToFile = useCallback(async () => {
    await saveStateToFile(state);
  }, [state]);

  const importFromFile = useCallback(async () => {
    const next = await loadStateFromFile();
    replaceState(next);
  }, [replaceState]);

  return {
    state,
    updateParams,
    setEvents,
    updateSettings,
    setDisplayUnit,
    replaceState,
    resetAll,
    exportToFile,
    importFromFile,
  };
}

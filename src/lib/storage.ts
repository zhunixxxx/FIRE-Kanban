import { parseAppState } from "./parseState";
import type { AppState } from "../types";
import { DEFAULT_PARAMS, DEFAULT_SETTINGS, STORAGE_KEY } from "../types";

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        params: { ...DEFAULT_PARAMS },
        events: [],
        settings: { ...DEFAULT_SETTINGS },
      };
    }
    return parseAppState(JSON.parse(raw));
  } catch {
    return {
      params: { ...DEFAULT_PARAMS },
      events: [],
      settings: { ...DEFAULT_SETTINGS },
    };
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Safari private mode or quota — fail silently */
  }
}

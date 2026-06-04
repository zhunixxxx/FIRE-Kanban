import { normalizeEvent } from "./events";
import type { AppState, FinancialEvent } from "../types";
import { DEFAULT_PARAMS, DEFAULT_SETTINGS } from "../types";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function parseAppState(raw: unknown): AppState {
  if (!isObject(raw)) {
    return {
      params: { ...DEFAULT_PARAMS },
      events: [],
      settings: { ...DEFAULT_SETTINGS },
    };
  }

  const params = isObject(raw.params)
    ? { ...DEFAULT_PARAMS, ...raw.params }
    : { ...DEFAULT_PARAMS };

  const rawEvents = Array.isArray(raw.events) ? raw.events : [];
  const events = rawEvents
    .map(normalizeEvent)
    .filter((e): e is FinancialEvent => e !== null);

  const settings = isObject(raw.settings)
    ? { ...DEFAULT_SETTINGS, ...raw.settings }
    : { ...DEFAULT_SETTINGS };

  const validUnits = ["yuan", "wan", "qian"] as const;
  if (!validUnits.includes(settings.displayUnit as (typeof validUnits)[number])) {
    settings.displayUnit = DEFAULT_SETTINGS.displayUnit;
  }

  return { params, events, settings };
}

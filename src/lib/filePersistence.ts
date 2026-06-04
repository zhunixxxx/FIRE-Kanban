import type { AppState } from "../types";
import { parseAppState } from "./parseState";

export const EXPORT_FORMAT = "fire-kanban";
export const EXPORT_VERSION = 1;
export const DEFAULT_FILENAME = "fire-kanban.json";

export interface ExportEnvelope {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  data: AppState;
}

export function serializeState(state: AppState): string {
  const envelope: ExportEnvelope = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(envelope, null, 2);
}

export function parseImportedJson(raw: string): AppState {
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "format" in parsed &&
    (parsed as ExportEnvelope).format === EXPORT_FORMAT &&
    "data" in parsed
  ) {
    return parseAppState((parsed as ExportEnvelope).data);
  }
  return parseAppState(parsed);
}

function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pickFileViaInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.oncancel = () => reject(new DOMException("Aborted", "AbortError"));
    input.click();
  });
}

const jsonPickerTypes = [
  {
    description: "JSON 文件",
    accept: { "application/json": [".json"] },
  },
];

export async function saveStateToFile(
  state: AppState,
  suggestedName = DEFAULT_FILENAME
): Promise<void> {
  const json = serializeState(state);

  if ("showSaveFilePicker" in window) {
    const handle = await (
      window as Window & {
        showSaveFilePicker: (opts: object) => Promise<FileSystemFileHandle>;
      }
    ).showSaveFilePicker({
      suggestedName,
      types: jsonPickerTypes,
    });
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return;
  }

  downloadJson(json, suggestedName);
}

export async function loadStateFromFile(): Promise<AppState> {
  let text: string;

  if ("showOpenFilePicker" in window) {
    const [handle] = await (
      window as Window & {
        showOpenFilePicker: (opts: object) => Promise<FileSystemFileHandle[]>;
      }
    ).showOpenFilePicker({
      types: jsonPickerTypes,
      multiple: false,
    });
    text = await (await handle.getFile()).text();
  } else {
    text = await pickFileViaInput();
  }

  return parseImportedJson(text);
}

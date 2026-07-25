import { getMeta, setMeta } from "./catalog-repo";
import type { SqlDb } from "./types";

export const META_PRINTER_PREFS = "printer_prefs";

export type PrinterConnectionMode = "system" | "thermal";

export type SavedThermalPrinter = {
  name: string;
  /** Pass as `printer` when printing — MAC / VID:PID / CUPS id. */
  identifier: string;
  interfaceType: string;
};

export type PrinterPrefs = {
  mode: PrinterConnectionMode;
  printer: SavedThermalPrinter | null;
};

export const DEFAULT_PRINTER_PREFS: PrinterPrefs = {
  mode: "system",
  printer: null,
};

export async function savePrinterPrefs(db: SqlDb, prefs: PrinterPrefs) {
  await setMeta(db, META_PRINTER_PREFS, JSON.stringify(prefs));
}

export async function getPrinterPrefs(db: SqlDb): Promise<PrinterPrefs> {
  const raw = await getMeta(db, META_PRINTER_PREFS);
  if (!raw) return { ...DEFAULT_PRINTER_PREFS };
  try {
    const parsed = JSON.parse(raw) as Partial<PrinterPrefs>;
    return {
      mode: parsed.mode === "thermal" ? "thermal" : "system",
      printer: parsed.printer ?? null,
    };
  } catch {
    return { ...DEFAULT_PRINTER_PREFS };
  }
}

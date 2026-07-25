import {
  ENCODE,
  list_thermal_printers,
  print_thermal_printer,
  test_thermal_printer,
  type PaperSize,
  type PrinterInfo,
  type PrintSections,
} from "tauri-plugin-thermal-printer";
import type { SavedThermalPrinter } from "@/lib/db/printer-prefs";
import type { RenderedReceipt } from "./render-receipt";

export type DiscoveredPrinter = PrinterInfo;

/** USB / Bluetooth / network printers exposed by the Tauri plugin. */
export async function listThermalPrinters(): Promise<DiscoveredPrinter[]> {
  return list_thermal_printers();
}

export function paperSizeFromMm(widthMm: 58 | 80): PaperSize {
  return widthMm === 58 ? "Mm58" : "Mm80";
}

/** Prefer thermal for USB/Bluetooth; interface_type casing varies by OS. */
export function isUsbOrBluetooth(printer: DiscoveredPrinter) {
  const t = printer.interface_type.toUpperCase();
  return (
    t.includes("USB") ||
    t.includes("BLUETOOTH") ||
    t.includes("BLE") ||
    t.includes("BT")
  );
}

function textSection(line: string): PrintSections {
  return {
    Text: {
      text: line.length ? line : " ",
      styles: {
        bold: false,
        underline: false,
        align: "left",
        italic: false,
        invert: false,
        font: "A",
        rotate: false,
        upside_down: false,
        size: "normal",
      },
    },
  };
}

/** Build ESC/POS job from monospace receipt lines (UTF-8 for Lao). */
export function receiptToPrintSections(
  receipt: RenderedReceipt,
): PrintSections[] {
  const sections: PrintSections[] = receipt.lines.map((line) =>
    textSection(line),
  );
  sections.push({ Feed: { feed_type: "lines", value: 2 } });
  sections.push({ Cut: { mode: "partial", feed: 0 } });
  return sections;
}

export async function printThermalReceipt(
  receipt: RenderedReceipt,
  printer: SavedThermalPrinter,
) {
  await print_thermal_printer({
    printer: printer.identifier || printer.name,
    paper_size: paperSizeFromMm(receipt.widthMm),
    options: {
      code_page: 0,
      encode: ENCODE.UTF_8,
      use_gbk: false,
    },
    sections: receiptToPrintSections(receipt),
  });
}

export async function testThermalPrinter(printer: SavedThermalPrinter) {
  await test_thermal_printer({
    printer_info: {
      printer: printer.identifier || printer.name,
      paper_size: "Mm58",
      options: {
        code_page: 0,
        encode: ENCODE.UTF_8,
        use_gbk: false,
      },
      sections: [],
    },
    include_text: true,
    include_text_styles: false,
    include_alignment: false,
    include_columns: false,
    include_separators: true,
    include_barcode: false,
    include_qr: false,
    include_image: false,
    include_beep: false,
    test_cash_drawer: false,
    cut_paper: true,
    test_feed: true,
  });
}

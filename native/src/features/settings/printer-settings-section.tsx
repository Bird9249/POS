import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bluetooth, Cable, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  isUsbOrBluetooth,
  listThermalPrinters,
  testThermalPrinter,
  type DiscoveredPrinter,
} from "@/features/receipt/thermal-print";
import { getLocalDb } from "@/lib/db/client";
import {
  DEFAULT_PRINTER_PREFS,
  getPrinterPrefs,
  savePrinterPrefs,
  type PrinterPrefs,
  type SavedThermalPrinter,
} from "@/lib/db/printer-prefs";
import { cn } from "@/lib/utils";
import { settingsCopy as copy } from "./ui-copy";

export const PRINTER_PREFS_QUERY_KEY = ["printer-prefs"] as const;

function toSaved(p: DiscoveredPrinter): SavedThermalPrinter {
  return {
    name: p.name,
    identifier: p.identifier || p.name,
    interfaceType: p.interface_type,
  };
}

function ifaceIcon(type: string) {
  const t = type.toUpperCase();
  if (t.includes("USB")) return Cable;
  if (t.includes("BLUETOOTH") || t.includes("BLE") || t.includes("BT")) {
    return Bluetooth;
  }
  return Printer;
}

export function PrinterSettingsSection() {
  const qc = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: PRINTER_PREFS_QUERY_KEY,
    queryFn: async () => getPrinterPrefs(await getLocalDb()),
  });

  const printersQuery = useQuery({
    queryKey: ["thermal-printers"],
    queryFn: listThermalPrinters,
    enabled: prefsQuery.data?.mode === "thermal",
    retry: false,
  });

  const saveMut = useMutation({
    mutationFn: async (prefs: PrinterPrefs) => {
      await savePrinterPrefs(await getLocalDb(), prefs);
      return prefs;
    },
    onSuccess: async () => {
      toast.success(copy.printerSaveOk);
      await qc.invalidateQueries({ queryKey: PRINTER_PREFS_QUERY_KEY });
    },
  });

  const testMut = useMutation({
    mutationFn: async (printer: SavedThermalPrinter) => {
      await testThermalPrinter(printer);
    },
    onSuccess: () => toast.success(copy.printerTestOk),
    onError: () => toast.error(copy.printerTestError),
  });

  const prefs = prefsQuery.data ?? DEFAULT_PRINTER_PREFS;
  const discovered = printersQuery.data ?? [];
  const usbBt = discovered.filter(isUsbOrBluetooth);
  const others = discovered.filter((p) => !isUsbOrBluetooth(p));

  async function setMode(mode: PrinterPrefs["mode"]) {
    await saveMut.mutateAsync({
      ...prefs,
      mode,
      printer: mode === "system" ? prefs.printer : prefs.printer,
    });
    if (mode === "thermal") {
      await qc.invalidateQueries({ queryKey: ["thermal-printers"] });
    }
  }

  async function selectPrinter(p: DiscoveredPrinter) {
    await saveMut.mutateAsync({
      mode: "thermal",
      printer: toSaved(p),
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <p className="text-sm font-semibold">{copy.printerSection}</p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={prefs.mode === "system" ? "default" : "outline"}
          className="rounded-xl"
          disabled={saveMut.isPending}
          onClick={() => void setMode("system")}
        >
          {copy.printerSystem}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={prefs.mode === "thermal" ? "default" : "outline"}
          className="rounded-xl"
          disabled={saveMut.isPending}
          onClick={() => void setMode("thermal")}
        >
          {copy.printerThermal}
        </Button>
      </div>

      {prefs.mode === "thermal" ? (
        <>
          <p className="text-muted-foreground text-xs">{copy.printerHintUsb}</p>
          <p className="text-muted-foreground text-xs">{copy.printerHintBt}</p>

          {prefs.printer ? (
            <div className="bg-muted/40 flex items-start justify-between gap-2 rounded-xl border px-3 py-2">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">
                  {copy.printerSelected}
                </p>
                <p className="truncate font-medium">{prefs.printer.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {prefs.printer.interfaceType} · {prefs.printer.identifier}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg"
                  disabled={testMut.isPending}
                  onClick={() => testMut.mutate(prefs.printer!)}
                >
                  {copy.printerTest}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg"
                  onClick={() =>
                    void saveMut.mutateAsync({
                      mode: "thermal",
                      printer: null,
                    })
                  }
                >
                  {copy.printerClear}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{copy.printerList}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-lg"
              disabled={printersQuery.isFetching}
              onClick={() =>
                void qc.invalidateQueries({ queryKey: ["thermal-printers"] })
              }
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  printersQuery.isFetching && "animate-spin",
                )}
              />
              {copy.printerRefresh}
            </Button>
          </div>

          {printersQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : printersQuery.isError ? (
            <p className="text-destructive text-sm">{copy.printerUnavailable}</p>
          ) : discovered.length === 0 ? (
            <p className="text-muted-foreground text-sm">{copy.printerNone}</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {[...usbBt, ...others].map((p) => {
                const Icon = ifaceIcon(p.interface_type);
                const selected =
                  prefs.printer?.identifier === (p.identifier || p.name);
                return (
                  <li key={`${p.identifier}-${p.name}`}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-3 text-left",
                        selected && "bg-muted/50",
                      )}
                      onClick={() => void selectPrinter(p)}
                    >
                      <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {p.identifier}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {p.interface_type}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}

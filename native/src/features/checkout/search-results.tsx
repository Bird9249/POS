import { useVirtualizer } from "@tanstack/react-virtual";
import { Package } from "lucide-react";
import { useRef } from "react";
import type { LocalProduct } from "@/lib/db/types";
import { formatKip } from "@/lib/format-kip";
import { copy } from "./ui-copy";

const ROW_H = 64;

type Props = {
  items: LocalProduct[];
  onPick: (product: LocalProduct) => void;
};

export function SearchResults({ items, onPick }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 6,
  });

  if (items.length === 0) return null;

  return (
    <div
      ref={parentRef}
      className="max-h-56 overflow-y-auto rounded-2xl border bg-background"
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((vRow) => {
          const p = items[vRow.index];
          if (!p) return null;
          return (
            <button
              key={p.id}
              type="button"
              className="hover:bg-muted/50 absolute inset-x-0 flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0"
              style={{
                height: vRow.size,
                transform: `translateY(${vRow.start}px)`,
              }}
              onClick={() => onPick(p)}
            >
              <div className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Package className="text-muted-foreground size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {copy.stock} {p.stock_qty}
                  {p.barcode ? ` · ${p.barcode}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatKip(p.sell_price)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

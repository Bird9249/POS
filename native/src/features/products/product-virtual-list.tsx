import { Package } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/api/catalog";
import { resolveFileSrc } from "@/lib/api/file-url";
import { formatKip } from "@/lib/format-kip";
import { cn } from "@/lib/utils";
import { copy } from "./ui-copy";

const ROW_H = 92;

type Props = {
  items: Product[];
  canSeeCost: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onOpen: (product: Product) => void;
  onRequestDelete: (id: string) => void;
};

export function ProductVirtualList({
  items,
  canSeeCost,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onOpen,
  onRequestDelete,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useLayoutEffect(() => {
    virtualizer.measure();
  }, [items.length, virtualizer]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      virtualizer.measure();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [virtualizer]);

  useEffect(() => {
    const last = virtualItems[virtualItems.length - 1];
    if (
      last &&
      last.index >= items.length - 4 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      onLoadMore();
    }
  }, [
    virtualItems,
    items.length,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
  ]);

  const rows =
    items.length > 0 && virtualItems.length === 0
      ? items.map((_, index) => ({
          index,
          key: items[index]!.id,
          start: index * ROW_H,
          size: ROW_H,
        }))
      : virtualItems.map((v) => ({
          index: v.index,
          key: items[v.index]?.id ?? String(v.index),
          start: v.start,
          size: v.size,
        }));

  const totalSize =
    items.length > 0 && virtualItems.length === 0
      ? items.length * ROW_H
      : virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className="h-[min(60dvh,28rem)] overflow-y-auto rounded-lg border"
    >
      <div className="relative w-full" style={{ height: totalSize }}>
        {rows.map((vRow) => {
          const p = items[vRow.index];
          if (!p) return null;
          const isLow = p.minStock != null && p.stockQty < p.minStock;
          return (
            <button
              key={vRow.key}
              type="button"
              className={cn(
                "hover:bg-muted/50 absolute inset-x-0 flex w-full items-center gap-3 border-b px-3 py-2.5 text-left",
              )}
              style={{
                height: vRow.size,
                transform: `translateY(${vRow.start}px)`,
              }}
              onClick={() => onOpen(p)}
              onContextMenu={(e) => {
                e.preventDefault();
                onRequestDelete(p.id);
              }}
            >
              <ProductThumb image={p.image} name={p.name} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-medium">{p.name}</p>
                  {isLow ? (
                    <Badge variant="destructive" className="shrink-0">
                      {copy.lowStockBadge}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  {p.categoryName || copy.noCategory} · {copy.stock}{" "}
                  {p.stockQty}
                  {p.barcode ? ` · ${p.barcode}` : ""}
                </p>
                <p className="text-sm tabular-nums">
                  {copy.sellPrice} {formatKip(p.sellPrice)}
                  {canSeeCost && p.costPrice != null
                    ? ` · ${copy.costPrice} ${formatKip(p.costPrice)}`
                    : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductThumb({
  image,
  name,
}: {
  image: string | null;
  name: string;
}) {
  const src = resolveFileSrc(image);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  return (
    <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-xl border">
      {src && !broken ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className="text-muted-foreground flex size-full items-center justify-center"
          aria-hidden
          title={name}
        >
          <Package className="size-6" />
        </div>
      )}
    </div>
  );
}

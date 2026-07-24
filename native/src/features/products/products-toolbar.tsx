import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertTriangle,
  FolderTree,
  Package,
  Plus,
  RefreshCw,
  ScanBarcode,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api/catalog";
import { BarcodeScanDialog } from "./barcode-scan-dialog";
import { copy } from "./ui-copy";

type Props = {
  tab: string;
  q: string;
  onQChange: (value: string) => void;
  lowStock: boolean;
  onLowStockChange: (value: boolean) => void;
  categoryId: string;
  onCategoryIdChange: (value: string) => void;
  categories: Category[];
  onAdd: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  syncDisabled?: boolean;
};

export function ProductsToolbar({
  tab,
  q,
  onQChange,
  lowStock,
  onLowStockChange,
  categoryId,
  onCategoryIdChange,
  categories,
  onAdd,
  onSync,
  isSyncing = false,
  syncDisabled = false,
}: Props) {
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TabsList className="h-11 flex-1 rounded-xl p-1">
          <TabsTrigger
            value="products"
            className="h-9 flex-1 gap-1.5 rounded-lg text-sm"
          >
            <Package className="size-4" />
            {copy.products}
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="h-9 flex-1 gap-1.5 rounded-lg text-sm"
          >
            <FolderTree className="size-4" />
            {copy.categories}
          </TabsTrigger>
        </TabsList>

        {onSync ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 gap-1.5 rounded-xl px-3"
            disabled={syncDisabled || isSyncing}
            onClick={onSync}
            aria-label={copy.sync}
            title={copy.sync}
          >
            {isSyncing ? <Spinner /> : <RefreshCw className="size-4" />}
            <span className="hidden sm:inline">
              {isSyncing ? copy.syncing : copy.sync}
            </span>
          </Button>
        ) : null}

        <Button
          type="button"
          className="h-11 shrink-0 gap-1.5 rounded-xl px-3.5"
          onClick={onAdd}
          aria-label={tab === "products" ? copy.addProduct : copy.addCategory}
        >
          <Plus data-icon="inline-start" />
          <span>{copy.add}</span>
        </Button>
      </div>

      {tab === "products" ? (
        <div className="space-y-2.5">
          <InputGroup className="h-12 rounded-xl">
            <InputGroupAddon align="inline-start">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              placeholder={copy.search}
              className="h-12 text-base"
              aria-label={copy.search}
              autoComplete="off"
            />
            <InputGroupAddon align="inline-end">
              {q ? (
                <InputGroupButton
                  size="icon-sm"
                  aria-label={copy.clearSearch}
                  onClick={() => onQChange("")}
                >
                  <X />
                </InputGroupButton>
              ) : null}
              <InputGroupButton
                size="icon-sm"
                aria-label={copy.scanBarcode}
                title={copy.scanBarcode}
                onClick={() => setScanOpen(true)}
              >
                <ScanBarcode />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          <BarcodeScanDialog
            open={scanOpen}
            onOpenChange={setScanOpen}
            onScan={(code) => {
              onQChange(code);
              toast.success(copy.toastBarcodeScanned);
            }}
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-muted-foreground shrink-0 text-xs font-medium">
              {copy.filters}
            </span>
            <FilterChip
              active={!lowStock && !categoryId}
              onClick={() => {
                onLowStockChange(false);
                onCategoryIdChange("");
              }}
            >
              {copy.allCategories}
            </FilterChip>
            <FilterChip
              active={lowStock}
              tone="warning"
              onClick={() => onLowStockChange(!lowStock)}
            >
              <AlertTriangle className="size-3.5" />
              {copy.lowStockOnly}
            </FilterChip>
            {categories.map((c) => (
              <FilterChip
                key={c.id}
                active={categoryId === c.id}
                onClick={() =>
                  onCategoryIdChange(categoryId === c.id ? "" : c.id)
                }
              >
                {c.name}
                {typeof c.productCount === "number" ? (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1.5 text-[10px]"
                  >
                    {c.productCount}
                  </Badge>
                ) : null}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  tone = "default",
  onClick,
  children,
}: {
  active: boolean;
  tone?: "default" | "warning";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={cn(
        "h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs font-medium",
        active &&
          tone === "warning" &&
          "bg-amber-600 text-white hover:bg-amber-600/90 dark:bg-amber-500",
      )}
    >
      {children}
    </Button>
  );
}

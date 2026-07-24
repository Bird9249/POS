import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ScanBarcode, Search, Tag, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Perm, hasPermission } from "@/features/auth/permissions";
import {
  getSessionPermissions,
  useSession,
} from "@/features/auth/use-session";
import { BarcodeScanDialog } from "@/features/products/barcode-scan-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getLocalDb } from "@/lib/db/client";
import {
  countLocalProducts,
  findProductByBarcode,
  searchLocalProducts,
} from "@/lib/db/catalog-repo";
import type { LocalProduct } from "@/lib/db/types";
import { formatKip } from "@/lib/format-kip";
import { lineTotal } from "./cart-math";
import { DiscountSheet } from "./discount-sheet";
import { PaySheet, type CompletedPayment } from "./pay-sheet";
import { SearchResults } from "./search-results";
import { SuccessSheet } from "./success-sheet";
import { useCart, type CartLine } from "./use-cart";
import { copy } from "./ui-copy";

export function CheckoutPage() {
  const { data: session } = useSession();
  const permissions = getSessionPermissions(
    session as { permissions?: string[] } | null | undefined,
  );
  const canSell = hasPermission(permissions, Perm.salesCreate);

  const cart = useCart();
  const searchRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 200);
  const [showResults, setShowResults] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const [discountLine, setDiscountLine] = useState<CartLine | null>(null);
  const [billDiscountOpen, setBillDiscountOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastPayment, setLastPayment] = useState<CompletedPayment | null>(null);

  const localCount = useQuery({
    queryKey: ["local-product-count"],
    queryFn: async () => countLocalProducts(await getLocalDb()),
    enabled: canSell,
  });

  const search = useQuery({
    queryKey: ["checkout-search", debouncedQ],
    queryFn: async () => {
      const db = await getLocalDb();
      return searchLocalProducts(db, debouncedQ, { limit: 50 });
    },
    enabled: canSell && showResults,
  });

  useEffect(() => {
    if (!canSell || scanOpen) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [
    canSell,
    scanOpen,
    successOpen,
    payOpen,
    discountLine,
    billDiscountOpen,
  ]);

  /** Exact barcode / single search hit → cart. Multi-hit → show results. */
  async function tryAddByQuery(raw: string) {
    const term = raw.trim();
    if (!term) return false;
    const db = await getLocalDb();

    const exact = await findProductByBarcode(db, term);
    if (exact) {
      addToCart(exact, { announce: true });
      setQ("");
      setShowResults(false);
      return true;
    }

    const hits = await searchLocalProducts(db, term, { limit: 8 });
    if (hits.length === 1) {
      addToCart(hits[0]!, { announce: true });
      setQ("");
      setShowResults(false);
      return true;
    }
    if (hits.length === 0) {
      toast.error(copy.notFound);
      return false;
    }
    // Ambiguous text search — show list (scanner barcodes are usually exact)
    setQ(term);
    setShowResults(true);
    return false;
  }

  function addToCart(
    product: LocalProduct,
    opts?: { announce?: boolean },
  ) {
    cart.addProduct(product);
    if (opts?.announce) {
      toast.success(`${copy.toastAddedToCart} · ${product.name}`);
    }
    if (product.stock_qty <= 0) {
      toast.message(copy.outOfStockWarn);
    }
    searchRef.current?.focus();
  }

  if (!canSell) {
    return (
      <Alert>
        <AlertDescription>{copy.noPermission}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {(localCount.data ?? 1) === 0 ? (
        <Alert>
          <AlertDescription>{copy.syncNeeded}</AlertDescription>
        </Alert>
      ) : null}

      <form
        className="shrink-0 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void tryAddByQuery(q);
        }}
      >
        <InputGroup className="h-12 rounded-xl">
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={copy.searchPlaceholder}
            className="h-12 text-base"
            autoComplete="off"
            enterKeyHint="done"
            aria-label={copy.searchPlaceholder}
          />
          <InputGroupAddon align="inline-end">
            {q ? (
              <InputGroupButton
                type="button"
                size="icon-sm"
                aria-label="clear"
                onClick={() => {
                  setQ("");
                  setShowResults(false);
                  searchRef.current?.focus();
                }}
              >
                <X />
              </InputGroupButton>
            ) : null}
            <InputGroupButton
              type="button"
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
            void tryAddByQuery(code);
          }}
        />

        <AnimatePresence>
          {showResults && debouncedQ.trim() ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {search.isFetching && (search.data?.length ?? 0) === 0 ? null : (
                <SearchResults
                  items={search.data ?? []}
                  onPick={(p) => {
                    addToCart(p);
                    setQ("");
                    setShowResults(false);
                  }}
                />
              )}
              {!search.isFetching &&
              debouncedQ.trim() &&
              (search.data?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground px-1 text-sm">{copy.notFound}</p>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">{copy.cart}</p>
          <span className="text-muted-foreground text-xs tabular-nums">
            {cart.lines.length}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {cart.lines.length === 0 ? (
            <div className="text-muted-foreground flex h-full min-h-40 flex-col items-center justify-center gap-2 px-6 text-center text-sm">
              <ScanBarcode className="size-8 opacity-40" />
              <p>{copy.cartEmpty}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {cart.lines.map((line) => {
                const total = lineTotal({
                  unitPrice: line.unitPrice,
                  quantity: line.quantity,
                  discount: line.discount,
                });
                return (
                  <li key={line.productId} className="px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{line.name}</p>
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {formatKip(line.unitPrice)}
                          {line.discount
                            ? ` · ${copy.discount} ${
                                line.discount.type === "percent"
                                  ? `${line.discount.value}%`
                                  : formatKip(line.discount.value)
                              }`
                            : ""}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">
                        {formatKip(total)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-9 rounded-lg"
                        onClick={() => cart.bumpQuantity(line.productId, -1)}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="font-heading min-w-8 text-center text-lg font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-9 rounded-lg"
                        onClick={() => cart.bumpQuantity(line.productId, 1)}
                      >
                        <Plus className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-9 gap-1 rounded-lg px-2"
                        onClick={() => setDiscountLine(line)}
                      >
                        <Tag className="size-3.5" />
                        {copy.discount}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive size-9 rounded-lg"
                        onClick={() => cart.removeLine(line.productId)}
                        aria-label={copy.remove}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-background/95 sticky bottom-0 shrink-0 space-y-2 border-t pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs"
            disabled={cart.lines.length === 0}
            onClick={() => setBillDiscountOpen(true)}
          >
            <Tag className="size-3.5" />
            {copy.billDiscount}
            {cart.billDiscount
              ? ` · ${
                  cart.billDiscount.type === "percent"
                    ? `${cart.billDiscount.value}%`
                    : formatKip(cart.billDiscount.value)
                }`
              : ""}
          </Button>
          {cart.totals.billDiscount > 0 ? (
            <p className="text-muted-foreground text-xs tabular-nums">
              −{formatKip(cart.totals.billDiscount)}
            </p>
          ) : null}
        </div>
        <div className="flex items-end justify-between px-0.5">
          <p className="text-muted-foreground text-sm">{copy.total}</p>
          <p className="font-heading text-3xl font-semibold tabular-nums">
            {formatKip(cart.totals.amountDue)}
          </p>
        </div>
        <Button
          type="button"
          className="h-12 w-full rounded-xl text-base"
          disabled={cart.lines.length === 0 || cart.totals.amountDue < 0}
          onClick={() => setPayOpen(true)}
        >
          {copy.pay}
        </Button>
      </div>

      <DiscountSheet
        open={Boolean(discountLine)}
        onOpenChange={(o) => !o && setDiscountLine(null)}
        title={copy.lineDiscount}
        description={discountLine?.name}
        unitPrice={discountLine?.unitPrice ?? 0}
        quantity={discountLine?.quantity ?? 1}
        initial={discountLine?.discount}
        onApply={(d) => {
          if (discountLine) cart.setLineDiscount(discountLine.productId, d);
        }}
      />

      <DiscountSheet
        open={billDiscountOpen}
        onOpenChange={setBillDiscountOpen}
        title={copy.billDiscount}
        unitPrice={cart.totals.linesSubtotal}
        quantity={1}
        initial={cart.billDiscount}
        onApply={(d) => cart.setBillDiscount(d)}
      />

      <PaySheet
        open={payOpen}
        onOpenChange={setPayOpen}
        amountDue={cart.totals.amountDue}
        onComplete={(payment) => {
          setPayOpen(false);
          setLastPayment(payment);
          setSuccessOpen(true);
        }}
      />

      <SuccessSheet
        open={successOpen}
        onOpenChange={setSuccessOpen}
        payment={lastPayment}
        onContinue={() => {
          cart.clear();
          setSuccessOpen(false);
          setLastPayment(null);
          searchRef.current?.focus();
        }}
      />
    </div>
  );
}

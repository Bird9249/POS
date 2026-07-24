import { useMemo, useState } from "react";
import type { LocalProduct } from "@/lib/db/types";
import {
  computeCartTotals,
  type BillDiscount,
  type LineDiscount,
} from "./cart-math";

export type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  stockQty: number;
  quantity: number;
  discount: LineDiscount | null;
};

function toLine(product: LocalProduct, quantity = 1): CartLine {
  return {
    productId: product.id,
    name: product.name,
    unitPrice: product.sell_price,
    stockQty: product.stock_qty,
    quantity,
    discount: null,
  };
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [billDiscount, setBillDiscount] = useState<BillDiscount>(null);

  const totals = useMemo(
    () =>
      computeCartTotals(
        lines.map((l) => ({
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          discount: l.discount,
        })),
        billDiscount,
      ),
    [lines, billDiscount],
  );

  function addProduct(product: LocalProduct) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        const cur = next[idx]!;
        next[idx] = { ...cur, quantity: cur.quantity + 1, stockQty: product.stock_qty };
        return next;
      }
      return [...prev, toLine(product, 1)];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    const q = Math.trunc(quantity);
    setLines((prev) => {
      if (q <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) =>
        l.productId === productId ? { ...l, quantity: q } : l,
      );
    });
  }

  function bumpQuantity(productId: string, delta: number) {
    setLines((prev) => {
      const line = prev.find((l) => l.productId === productId);
      if (!line) return prev;
      const nextQty = line.quantity + delta;
      if (nextQty <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) =>
        l.productId === productId ? { ...l, quantity: nextQty } : l,
      );
    });
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function setLineDiscount(productId: string, discount: LineDiscount | null) {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, discount } : l)),
    );
  }

  function clear() {
    setLines([]);
    setBillDiscount(null);
  }

  return {
    lines,
    billDiscount,
    totals,
    addProduct,
    setQuantity,
    bumpQuantity,
    removeLine,
    setLineDiscount,
    setBillDiscount,
    clear,
  };
}

export type CartApi = ReturnType<typeof useCart>;

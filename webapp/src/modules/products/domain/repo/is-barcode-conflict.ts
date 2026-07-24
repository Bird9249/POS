export function isBarcodeConflict(error: unknown): boolean {
  const walk = (e: unknown): boolean => {
    if (!e || typeof e !== "object") return false;
    const obj = e as {
      message?: string;
      constraint?: string;
      cause?: unknown;
    };
    if (obj.constraint === "product_barcode_unique") return true;
    if (
      typeof obj.message === "string" &&
      obj.message.includes("product_barcode_unique")
    ) {
      return true;
    }
    return walk(obj.cause);
  };
  return walk(error);
}

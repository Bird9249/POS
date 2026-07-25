import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { StoreSettings } from "@/lib/api/settings";
import { cn } from "@/lib/utils";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { printReceiptText } from "./print-receipt";
import {
  renderReceipt,
  type RenderedReceipt,
  type ReceiptSaleInput,
} from "./render-receipt";
import { receiptCopy as copy } from "./ui-copy";

/**
 * Scale font so `widthChars` monospace glyphs ≈ physical paper width.
 * glyph ≈ 0.6em; keep within viewport via max-width on the paper.
 */
function receiptPreviewFontSize(widthMm: number, widthChars: number) {
  return `min(13px, calc(${widthMm}mm / ${widthChars} / 0.6))`;
}

function ReceiptPaperPreview({ rendered }: { rendered: RenderedReceipt }) {
  const { widthMm, widthChars, text } = rendered;
  return (
    <div className="flex justify-center">
      {/* `ch` = one monospace column — paper edge hugs the receipt lines */}
      <pre
        className={cn(
          "m-0 max-w-full overflow-x-auto rounded-xl border bg-background",
          "py-3 font-mono leading-snug whitespace-pre shadow-sm",
        )}
        style={{
          width: `${widthChars}ch`,
          fontSize: receiptPreviewFontSize(widthMm, widthChars),
          boxSizing: "content-box",
          paddingInline: "0.75rem",
        }}
      >
        {text}
      </pre>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreSettings | null;
  sale: ReceiptSaleInput | null;
};

export function ReceiptPreviewSheet({
  open,
  onOpenChange,
  store,
  sale,
}: Props) {
  const rendered =
    store && sale
      ? renderReceipt({ store, sale })
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
          <SheetTitle className="text-lg">{copy.previewTitle}</SheetTitle>
          {rendered ? (
            <p className="text-muted-foreground text-xs">
              {rendered.widthMm}mm · {rendered.widthChars} {copy.chars}
            </p>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-4 py-4">
          {!rendered ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              {copy.noConfig}
            </p>
          ) : (
            <ReceiptPaperPreview rendered={rendered} />
          )}
        </div>

        <SheetFooter className="bg-background/95 shrink-0 gap-2 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:flex-col">
          <Button
            type="button"
            className="h-11 w-full gap-2 rounded-xl text-base"
            disabled={!rendered}
            onClick={() => {
              if (!rendered) return;
              void (async () => {
                try {
                  await printReceiptText(rendered);
                } catch {
                  toast.error(copy.printError);
                }
              })();
            }}
          >
            <Printer className="size-4" />
            {copy.print}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {copy.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

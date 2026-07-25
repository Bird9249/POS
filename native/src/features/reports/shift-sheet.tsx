import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShiftPanel } from "./shift-panel";
import { shiftCopy as copy } from "./ui-copy";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShiftSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
          <SheetTitle className="text-lg">{copy.title}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <ShiftPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { ScanBarcode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { BarcodeScanDialog } from "./barcode-scan-dialog";
import { copy } from "./ui-copy";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
};

export function BarcodeField({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  "aria-invalid": ariaInvalid,
}: Props) {
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <>
      <InputGroup className="h-11">
        <InputGroupInput
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          autoComplete="off"
          inputMode="text"
          className="h-11"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-sm"
            aria-label={copy.scanBarcode}
            title={copy.scanBarcode}
            disabled={disabled}
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
          onChange(code);
          toast.success(copy.toastBarcodeScanned);
        }}
      />
    </>
  );
}

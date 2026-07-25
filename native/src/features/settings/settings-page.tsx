import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Perm, hasPermission } from "@/features/auth/permissions";
import {
  getSessionPermissions,
  useSession,
} from "@/features/auth/use-session";
import { ReceiptPreviewSheet } from "@/features/receipt/receipt-preview-sheet";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { resolveFileSrc } from "@/lib/api/file-url";
import {
  getReceiptSettings,
  updateReceiptSettings,
} from "@/lib/api/settings";
import { uploadStoreLogo, uploadStoreQr } from "@/lib/api/upload";
import { getLocalDb } from "@/lib/db/client";
import {
  cacheReceiptSettings,
  getCachedReceiptSettings,
} from "@/lib/db/settings-repo";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  receiptSettingsSchema,
  type ReceiptSettingsFormValues,
} from "./receipt-schema";
import { settingsCopy as copy } from "./ui-copy";

export const RECEIPT_SETTINGS_QUERY_KEY = ["receipt-settings"] as const;

export function SettingsPage() {
  const { data: session } = useSession();
  const permissions = getSessionPermissions(
    session as { permissions?: string[] } | null | undefined,
  );
  const canManage = hasPermission(permissions, Perm.settingsManage);
  const { status } = useOnlineStatus();
  const online = status === "online";
  const qc = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);

  const settingsQuery = useQuery({
    queryKey: RECEIPT_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const db = await getLocalDb();
      if (online) {
        try {
          const res = await getReceiptSettings();
          await cacheReceiptSettings(db, res.settings);
          return res.settings;
        } catch {
          // fall through to cache
        }
      }
      return getCachedReceiptSettings(db);
    },
    enabled: canManage,
  });

  const form = useForm<ReceiptSettingsFormValues>({
    resolver: zodResolver(
      receiptSettingsSchema,
    ) as Resolver<ReceiptSettingsFormValues>,
    values: settingsQuery.data
      ? {
          storeName: settingsQuery.data.storeName ?? "",
          address: settingsQuery.data.address ?? "",
          phone: settingsQuery.data.phone ?? "",
          bankName: settingsQuery.data.bankName ?? "",
          bankAccount: settingsQuery.data.bankAccount ?? "",
          logoKey: settingsQuery.data.logoKey ?? "",
          qrImageKey: settingsQuery.data.qrImageKey ?? "",
          receiptWidthMm:
            settingsQuery.data.receiptWidthMm === 58 ? 58 : 80,
          footerThanks: settingsQuery.data.footerThanks ?? "",
        }
      : undefined,
    defaultValues: {
      storeName: "",
      address: "",
      phone: "",
      bankName: "",
      bankAccount: "",
      logoKey: "",
      qrImageKey: "",
      receiptWidthMm: 80,
      footerThanks: "",
    },
  });

  const save = useMutation({
    mutationFn: async (values: ReceiptSettingsFormValues) => {
      const res = await updateReceiptSettings({
        storeName: values.storeName,
        address: values.address || null,
        phone: values.phone || null,
        bankName: values.bankName || null,
        bankAccount: values.bankAccount || null,
        logoKey: values.logoKey || null,
        qrImageKey: values.qrImageKey || null,
        receiptWidthMm: values.receiptWidthMm,
        footerThanks: values.footerThanks || null,
      });
      const db = await getLocalDb();
      await cacheReceiptSettings(db, res.settings);
      return res.settings;
    },
    onSuccess: async () => {
      toast.success(copy.saveOk);
      await qc.invalidateQueries({ queryKey: RECEIPT_SETTINGS_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.saveError);
    },
  });

  if (!canManage) {
    return (
      <Alert>
        <AlertDescription>{copy.noPermission}</AlertDescription>
      </Alert>
    );
  }

  const logoSrc = resolveFileSrc(form.watch("logoKey") || null);
  const qrSrc = resolveFileSrc(form.watch("qrImageKey") || null);
  const watched = form.watch();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{copy.title}</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-xl"
          onClick={() => setPreviewOpen(true)}
        >
          {copy.preview}
        </Button>
      </div>

      {!online ? (
        <Alert>
          <AlertDescription>{copy.offlineBanner}</AlertDescription>
        </Alert>
      ) : null}

      {settingsQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : settingsQuery.isError && !settingsQuery.data ? (
        <Alert variant="destructive">
          <AlertDescription>{copy.loadError}</AlertDescription>
        </Alert>
      ) : (
        <form
          className="flex min-h-0 flex-1 flex-col gap-3"
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border p-4">
            <p className="text-sm font-semibold">{copy.receiptSection}</p>

            <Controller
              control={form.control}
              name="storeName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="s-name">{copy.storeName}</FieldLabel>
                  <Input
                    id="s-name"
                    {...field}
                    disabled={!online || save.isPending}
                    className="h-11 rounded-xl"
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="address"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="s-addr">{copy.address}</FieldLabel>
                  <Textarea
                    id="s-addr"
                    {...field}
                    disabled={!online || save.isPending}
                    className="min-h-20 rounded-xl"
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="s-phone">{copy.phone}</FieldLabel>
                  <Input
                    id="s-phone"
                    {...field}
                    disabled={!online || save.isPending}
                    className="h-11 rounded-xl"
                  />
                </Field>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="s-bank">{copy.bankName}</FieldLabel>
                    <Input
                      id="s-bank"
                      {...field}
                      disabled={!online || save.isPending}
                      className="h-11 rounded-xl"
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="s-acc">{copy.bankAccount}</FieldLabel>
                    <Input
                      id="s-acc"
                      {...field}
                      disabled={!online || save.isPending}
                      className="h-11 rounded-xl"
                    />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="receiptWidthMm"
              render={({ field }) => (
                <Field>
                  <FieldLabel>{copy.width}</FieldLabel>
                  <Tabs
                    value={String(field.value)}
                    onValueChange={(v) =>
                      field.onChange(v === "58" ? 58 : 80)
                    }
                    className="gap-0"
                  >
                    <TabsList className="h-11 w-full rounded-xl p-1">
                      <TabsTrigger
                        value="58"
                        disabled={!online || save.isPending}
                        className="h-9 flex-1 rounded-lg"
                      >
                        {copy.width58}
                      </TabsTrigger>
                      <TabsTrigger
                        value="80"
                        disabled={!online || save.isPending}
                        className="h-9 flex-1 rounded-lg"
                      >
                        {copy.width80}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="footerThanks"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="s-thanks">{copy.thanks}</FieldLabel>
                  <Input
                    id="s-thanks"
                    {...field}
                    disabled={!online || save.isPending}
                    className="h-11 rounded-xl"
                  />
                </Field>
              )}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <ImageUploadField
                label={copy.logo}
                src={logoSrc}
                disabled={!online || save.isPending}
                onUpload={async (file) => {
                  const key = await uploadStoreLogo(file);
                  if (!key) {
                    toast.error(copy.saveError);
                    return;
                  }
                  form.setValue("logoKey", key, { shouldDirty: true });
                }}
                onRemove={() =>
                  form.setValue("logoKey", "", { shouldDirty: true })
                }
              />
              <ImageUploadField
                label={copy.qr}
                src={qrSrc}
                disabled={!online || save.isPending}
                onUpload={async (file) => {
                  const key = await uploadStoreQr(file);
                  if (!key) {
                    toast.error(copy.saveError);
                    return;
                  }
                  form.setValue("qrImageKey", key, { shouldDirty: true });
                }}
                onRemove={() =>
                  form.setValue("qrImageKey", "", { shouldDirty: true })
                }
              />
            </div>
          </div>

          <div className="bg-background/95 shrink-0 border-t pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base"
              disabled={!online || save.isPending || !form.formState.isDirty}
            >
              {save.isPending ? <Spinner className="size-4" /> : null}
              {save.isPending ? copy.saving : copy.save}
            </Button>
          </div>
        </form>
      )}

      <ReceiptPreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        store={
          settingsQuery.data
            ? {
                ...settingsQuery.data,
                storeName: watched.storeName || settingsQuery.data.storeName,
                address: watched.address || null,
                phone: watched.phone || null,
                bankName: watched.bankName || null,
                bankAccount: watched.bankAccount || null,
                logoKey: watched.logoKey || null,
                qrImageKey: watched.qrImageKey || null,
                receiptWidthMm: watched.receiptWidthMm,
                footerThanks: watched.footerThanks || null,
              }
            : null
        }
        sale={{
          clientSaleId: "preview_sale",
          soldAt: new Date(),
          cashierName: "Cashier",
          lines: [
            {
              name: "Sample item",
              quantity: 1,
              unitPrice: 10_000,
              lineTotal: 10_000,
            },
          ],
          linesSubtotal: 10_000,
          payment: {
            method: "cash",
            amountDue: 10_000,
            amountReceived: 20_000,
            changeAmount: 10_000,
          },
        }}
      />
    </div>
  );
}

function ImageUploadField({
  label,
  src,
  disabled,
  onUpload,
  onRemove,
}: {
  label: string;
  src: string | null;
  disabled?: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border border-dashed p-3",
        )}
      >
        <div className="bg-muted flex size-28 items-center justify-center overflow-hidden rounded-lg">
          {src ? (
            <img src={src} alt="" className="size-full object-contain" />
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={disabled}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = () => {
                const file = input.files?.[0];
                if (file) void onUpload(file);
              };
              input.click();
            }}
          >
            {copy.upload}
          </Button>
          {src ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-xl"
              disabled={disabled}
              onClick={onRemove}
            >
              {copy.remove}
            </Button>
          ) : null}
        </div>
      </div>
    </Field>
  );
}

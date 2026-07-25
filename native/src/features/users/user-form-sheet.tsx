import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Shield, UserRound } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { PasswordInput } from "@/components/password-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createUser,
  listRolesLookup,
  updateUser,
  type PosUser,
} from "@/lib/api/users";
import { cn } from "@/lib/utils";
import { copy } from "./ui-copy";
import { userFormSchema, type UserFormValues } from "./user-schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: PosUser | null;
};

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function roleLabel(id: string, name?: string) {
  if (id === "admin" || name === "admin") return copy.roleAdmin;
  if (id === "cashier" || name === "cashier") return copy.roleCashier;
  return name || id || "—";
}

function roleHint(id: string) {
  if (id === "admin") return copy.roleAdminHint;
  if (id === "cashier") return copy.roleCashierHint;
  return "";
}

function initialsFrom(name: string, email: string) {
  const base = (name.trim() || email.trim() || "?").slice(0, 2);
  return base.toUpperCase();
}

export function UserFormSheet({ open, onOpenChange, user }: Props) {
  const isCreate = !user;
  const qc = useQueryClient();

  const roles = useQuery({
    queryKey: ["roles-lookup"],
    queryFn: () => listRolesLookup(),
    enabled: open,
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema) as Resolver<UserFormValues>,
    defaultValues: {
      name: "",
      email: "",
      roleId: "cashier",
      password: "",
      isCreate: true,
    },
  });
  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    reset({
      name: user?.name ?? "",
      email: user?.email ?? "",
      roleId: user?.roleIds?.[0] ?? user?.roles?.[0]?.id ?? "cashier",
      password: "",
      isCreate,
    });
  }, [open, user, isCreate, reset]);

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedEmail = useWatch({ control: form.control, name: "email" });
  const watchedRoleId = useWatch({ control: form.control, name: "roleId" });

  const save = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (isCreate) {
        return createUser({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          roleId: values.roleId,
        });
      }
      return updateUser(user!.id, {
        name: values.name.trim(),
        email: values.email.trim(),
        roleId: values.roleId,
        ...(values.password.trim() ? { password: values.password } : {}),
      });
    },
    onSuccess: async () => {
      toast.success(copy.saveOk);
      await qc.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.saveError);
    },
  });

  const roleItems = (() => {
    const items = roles.data?.items ?? [];
    const preferred = ["admin", "cashier"];
    const ordered = preferred
      .map((id) => items.find((r) => r.id === id) ?? { id, name: id })
      .concat(items.filter((r) => !preferred.includes(r.id)));
    return ordered.length > 0
      ? ordered
      : [
          { id: "admin", name: "admin" },
          { id: "cashier", name: "cashier" },
        ];
  })();

  const previewName = watchedName?.trim() || copy.previewNew;
  const previewEmail = watchedEmail?.trim() || "—";
  const previewRole = roleLabel(watchedRoleId ?? "");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0"
      >
        <motion.div
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3">
            <SheetTitle className="text-lg">
              {isCreate ? copy.add : copy.edit}
            </SheetTitle>
            <SheetDescription>
              {isCreate ? copy.formNewHint : copy.formEditHint}
            </SheetDescription>
          </SheetHeader>

          <form
            id="user-form"
            className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4"
            onSubmit={form.handleSubmit((values) => save.mutate(values))}
            noValidate
          >
            <div className="from-muted/70 to-background flex items-center gap-3 rounded-2xl bg-linear-to-br p-4 ring-1 ring-foreground/8">
              <Avatar className="size-14 ring-1 ring-foreground/10">
                <AvatarFallback className="text-base font-semibold">
                  {initialsFrom(watchedName ?? "", watchedEmail ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{previewName}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {previewEmail}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{previewRole}</Badge>
                  {user?.banned ? (
                    <Badge variant="destructive">{copy.banned}</Badge>
                  ) : user ? (
                    <Badge variant="outline">{copy.active}</Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <FormSection title={copy.sectionProfile}>
              <Field>
                <FieldLabel htmlFor="user-name">{copy.name}</FieldLabel>
                <Input
                  id="user-name"
                  className="h-11 rounded-xl"
                  autoComplete="off"
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="user-email">{copy.email}</FieldLabel>
                <Input
                  id="user-email"
                  type="email"
                  className="h-11 rounded-xl"
                  autoComplete="off"
                  {...form.register("email")}
                />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
            </FormSection>

            <FormSection title={copy.sectionRole}>
              <Controller
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <div className="grid gap-2">
                    {roleItems.map((r) => {
                      const active = field.value === r.id;
                      const Icon = r.id === "admin" ? Shield : UserRound;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => field.onChange(r.id)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors ring-1",
                            active
                              ? "bg-primary/8 ring-primary/40"
                              : "bg-muted/30 ring-foreground/8 hover:bg-muted/50",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground ring-1 ring-foreground/10",
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {roleLabel(r.id, r.name)}
                              </span>
                              {active ? (
                                <Check className="text-primary size-4 shrink-0" />
                              ) : null}
                            </span>
                            {roleHint(r.id) ? (
                              <span className="text-muted-foreground mt-0.5 block text-xs">
                                {roleHint(r.id)}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              <FieldError errors={[form.formState.errors.roleId]} />
            </FormSection>

            <FormSection
              title={copy.sectionPassword}
              hint={
                isCreate ? copy.passwordHintCreate : copy.passwordHintEdit
              }
            >
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="user-password">
                      {isCreate ? copy.password : copy.passwordOptional}
                    </FieldLabel>
                    <PasswordInput
                      {...field}
                      id="user-password"
                      autoComplete="new-password"
                      className="rounded-xl"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FormSection>
          </form>

          <SheetFooter className="bg-background/95 shrink-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur supports-backdrop-filter:bg-background/80">
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                {copy.cancel}
              </Button>
              <Button
                type="submit"
                form="user-form"
                className="h-12 flex-[1.4] rounded-xl text-base"
                disabled={save.isPending}
              >
                {save.isPending ? copy.saving : copy.save}
              </Button>
            </div>
          </SheetFooter>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}

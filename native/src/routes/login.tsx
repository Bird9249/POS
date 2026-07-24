import { AppLogo } from "@/components/app-logo";
import { OnlinePill } from "@/components/online-pill";
import { PasswordInput } from "@/components/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  loginFormSchema,
  type LoginFormValues,
} from "@/features/auth/login-schema";
import { authClient } from "@/lib/api/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "admin@admin.com",
      password: "123456",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null);
    try {
      const { error: signError } = await authClient.signIn.email(values);
      if (signError) {
        setAuthError(signError.message || "ເຂົ້າລະບົບບໍ່ສຳເລັດ");
        return;
      }
      // Warm session cache so root guard sees the cookie before leaving /login
      const { data: session } = await authClient.getSession();
      if (!session?.session) {
        setAuthError("ເຂົ້າລະບົບສຳເລັດແຕ່ບໍ່ມີເຊັດຊັນ — ລອງໃໝ່");
        return;
      }
      await navigate({ to: "/checkout" });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "ເຂົ້າລະບົບບໍ່ສຳເລັດ");
    }
  }

  const submitting = form.formState.isSubmitting;

  return (
    <div className="bg-background flex h-dvh flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex justify-end">
        <OnlinePill />
      </div>
      <motion.div
        className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center gap-3">
              <AppLogo size="lg" />
              <div className="space-y-1">
                <CardTitle className="text-2xl">POS</CardTitle>
                <CardDescription>ລົງຊື່ເຂົ້າເພື່ອເລີ່ມຂາຍ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              id="login-form"
              className="space-y-3"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
              <FieldGroup className="gap-3">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-email">ອີເມວ</FieldLabel>
                      <Input
                        {...field}
                        id="login-email"
                        type="email"
                        autoComplete="username"
                        className="h-12 text-base"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-password">
                        ລະຫັດຜ່ານ
                      </FieldLabel>
                      <PasswordInput
                        {...field}
                        id="login-password"
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
              </FieldGroup>
              {authError ? (
                <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              ) : null}
              <Button
                type="submit"
                className="h-12 w-full text-base"
                disabled={submitting}
              >
                {submitting ? "ກຳລັງເຂົ້າລະບົບ…" : "ເຂົ້າລະບົບ"}
              </Button>
            </form>
            <p className="text-muted-foreground mt-4 text-center text-xs">
              ທົດສອບ: admin@admin.com / cashier@pos.com · 123456
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

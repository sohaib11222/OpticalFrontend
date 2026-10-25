import AuthShell from "./AuthShell";
import { VistaSignIn } from "@/pages/integrations/VistaAuth";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { api, useSession } from "./session";
import {
  ApiError,
  safeReturn,
  type ApiEnvelope,
  type SessionUser,
} from "../../../contracts/session";
type Mode = "login" | "register" | "forgot" | "reset";
type Values = {
  email: string;
  password?: string;
  password_confirmation?: string;
  name?: string;
  shop_name?: string;
};
export default function AuthPage({ mode }: { mode: Mode }) {
  const { t, translateError } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { accept, user, loading } = useSession();
  const [message, setMessage] = useState("");
  // Server-provided error text (already localised via translateError) and a
  // translation KEY for static failures, so a language switch updates the banner.
  const [failure, setFailure] = useState("");
  const [failureKey, setFailureKey] = useState<string | null>(null);
  const titles = {
    login: t("auth.login.title"),
    register: t("auth.register.title"),
    forgot: t("auth.forgot.title"),
    reset: t("auth.reset.title"),
  };
  const schema = useMemo(
    () =>
      z
        .object({
          email: z.email(),
          password: z.string().optional(),
          password_confirmation: z.string().optional(),
          name: z.string().optional(),
          shop_name: z.string().optional(),
        })
        .superRefine((v, c) => {
          if (mode !== "forgot" && !v.password)
            c.addIssue({
              code: "custom",
              path: ["password"],
              message: t("auth.error.passwordRequired"),
            });
          if (["register", "reset"].includes(mode)) {
            if (
              !v.password ||
              v.password.length < 12 ||
              !/[a-z]/i.test(v.password) ||
              !/\d/.test(v.password)
            )
              c.addIssue({
                code: "custom",
                path: ["password"],
                message: t("auth.error.passwordWeak"),
              });
            if (v.password !== v.password_confirmation)
              c.addIssue({
                code: "custom",
                path: ["password_confirmation"],
                message: t("auth.error.passwordMismatch"),
              });
          }
          if (mode === "register")
            for (const key of ["name", "shop_name"] as const)
              if (!v[key]?.trim())
                c.addIssue({
                  code: "custom",
                  path: [key],
                  message: t("common.required"),
                });
        }),
    [mode, t],
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get("email") || "" },
  });
  const submit = handleSubmit(async (values) => {
    setFailureKey(null);
    setFailure("");
    setMessage("");
    try {
      if (mode === "login" || mode === "register") {
        const result = await api.auth<ApiEnvelope<SessionUser>>(
          mode === "login" ? "/login" : "/register",
          values,
        );
        accept(result.data);
        navigate(safeReturn(params.get("redirectTo"), result.data.shop?.status === "active" && result.data.permissions.includes("operations.read") ? "/dashboard" : "/"), { replace: true });
      } else {
        const result = await api.auth<{ message: string }>(
          mode === "forgot" ? "/forgot-password" : "/reset-password",
          mode === "reset"
            ? { ...values, token: params.get("token") || "" }
            : { email: values.email },
        );
        setMessage(result.message);
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setFailure(translateError(e.message));
        for (const [key, messages] of Object.entries(e.errors))
          setError(key as keyof Values, {
            message: translateError(messages[0]),
          });
      } else setFailureKey("common.connectionFailed");
    }
  });
  const field = (name: keyof Values, label: string, type = "text") => (
    <div className="grid gap-2" key={name}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        autoComplete={
          name === "password"
            ? mode === "login"
              ? "current-password"
              : "new-password"
            : name === "email"
              ? "email"
              : undefined
        }
        {...register(name)}
        aria-invalid={!!errors[name]}
      />
      {errors[name] && (
        <p className="text-sm text-destructive" role="alert">
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
  if (mode === "login" && loading)
    return <AuthShell><p role="status">{t("user.sessionLoading")}</p></AuthShell>;
  if (mode === "login" && user)
    return <Navigate to={safeReturn(params.get("redirectTo"), user?.shop?.status === "active" && user.permissions.includes("operations.read") ? "/dashboard" : "/")} replace />;
  return (
    <AuthShell>
      <div className="w-full max-w-md space-y-6">

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{titles[mode]}</CardTitle>
            <CardDescription>
              {mode === "register"
                ? t("auth.register.subtitle")
                : t("auth.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-5" noValidate>
              {mode === "register" && (
                <>
                  {field("name", t("auth.field.name"))}
                  {field("shop_name", t("auth.field.shopName"))}
                </>
              )}
              {field("email", t("auth.field.email"), "email")}
              {mode !== "forgot" &&
                field("password", t("auth.field.password"), "password")}
              {["register", "reset"].includes(mode) &&
                field(
                  "password_confirmation",
                  t("auth.field.passwordConfirm"),
                  "password",
                )}
              {failure && (
                <p role="alert" className="text-sm text-destructive">
                  {failure}
                </p>
              )}
              {failureKey && (
                <p role="alert" className="text-sm text-destructive">
                  {t(failureKey)}
                </p>
              )}
              {message && <p role="status">{message}</p>}
              <Button disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.pleaseWait")
                  : mode === "login"
                    ? t("auth.submit.login")
                    : mode === "register"
                      ? t("auth.submit.register")
                      : mode === "forgot"
                        ? t("auth.submit.forgot")
                        : t("auth.submit.reset")}
              </Button>
              <div className="text-sm flex flex-wrap justify-between gap-3">
                <Link to="/auth/login">{t("auth.link.login")}</Link>
                <Link to="/auth/register">{t("auth.link.register")}</Link>
                <Link to="/auth/forgot-password">{t("auth.link.forgot")}</Link>
              </div>
            </form>
            {mode === "login" && <VistaSignIn />}
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}

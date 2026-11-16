import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Stage = "start" | "code" | "verified";

export default function AccountSecurity() {
  const { user } = useSession();
  const { t, translateError } = useTranslation();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("start");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => setResendIn((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  async function sendCode() {
    setBusy(true);
    setError("");
    try {
      const result = await api.auth<{ data: { resend_after_seconds: number } }>("/password/change-code", {});
      setStage("code");
      setCode("");
      setResendIn(result.data.resend_after_seconds);
      toast.success(t("account.codeSent"));
    } catch (cause) {
      setError(cause instanceof Error ? translateError(cause.message) : t("common.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.auth("/password/verify-code", { code });
      setStage("verified");
      setCode("");
      toast.success(t("account.codeVerified"));
    } catch (cause) {
      setError(cause instanceof Error ? translateError(cause.message) : t("common.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api.auth("/password", values);
      toast.success(t("account.passwordChanged"));
      navigate("/auth/login", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? translateError(cause.message) : t("common.requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-6">
    <h1 className="text-2xl font-semibold">{t("nav.accountSecurity")}</h1>
    <Card>
      <CardHeader><CardTitle>{t("account.password.title")}</CardTitle></CardHeader>
      <CardContent className="grid max-w-lg gap-5">
        <div><p className="text-sm text-muted-foreground">{t("account.registeredEmail")}</p><p className="font-medium">{user?.email}</p></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {stage === "start" && <><p className="text-sm text-muted-foreground">{t("account.passwordCodeHelp")}</p><Button disabled={busy} onClick={() => void sendCode()}>{busy ? t("common.pleaseWait") : t("account.sendCode")}</Button></>}
        {stage === "code" && <form className="grid gap-4" onSubmit={(event) => void verifyCode(event)}><p className="text-sm text-muted-foreground">{t("account.enterCodeHelp")}</p><div className="grid gap-2"><Label htmlFor="password-change-code">{t("account.verificationCode")}</Label><Input id="password-change-code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} pattern="[0-9]{8}" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} required /></div><div className="flex flex-wrap gap-2"><Button disabled={busy || code.length !== 8}>{busy ? t("common.pleaseWait") : t("account.verifyCode")}</Button><Button type="button" variant="outline" disabled={busy || resendIn > 0} onClick={() => void sendCode()}>{resendIn > 0 ? t("account.resendIn", { seconds: resendIn }) : t("account.resendCode")}</Button></div></form>}
        {stage === "verified" && <form className="grid gap-4" onSubmit={(event) => void savePassword(event)}><p className="text-sm text-emerald-700">{t("account.codeVerified")}</p><div className="grid gap-2"><Label htmlFor="new-password">{t("account.newPassword")}</Label><Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} required /></div><div className="grid gap-2"><Label htmlFor="confirm-password">{t("account.confirmNewPassword")}</Label><Input id="confirm-password" name="password_confirmation" type="password" autoComplete="new-password" minLength={12} required /></div><p className="text-sm text-muted-foreground">{t("account.sessionsNotice")}</p><Button disabled={busy}>{busy ? t("common.pleaseWait") : t("account.saveNewPassword")}</Button></form>}
      </CardContent>
    </Card>
  </div>;
}

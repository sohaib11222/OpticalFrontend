import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function AccountSecurity() {
  const { user, refresh } = useSession();
  const { t, translateError } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>, action: string) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api.auth("/" + action, data);
      await refresh();
      navigate("/auth/login");
    } catch (ex) {
      setError(ex instanceof Error ? translateError(ex.message) : t("common.requestFailed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("nav.accountSecurity")}</h1>
      <p>{user?.email}</p>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {(["password", "email"] as const).map((action) => (
        <Card key={action}>
          <CardHeader>
            <CardTitle>{t(action === "password" ? "account.password.title" : "account.email.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => void submit(e, action)}
              className="grid gap-4 max-w-lg"
            >
              <Label htmlFor={action + "-current"}>{t("account.currentPassword")}</Label>
              <Input
                id={action + "-current"}
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
              />
              {action === "password" ? (
                <>
                  <Label htmlFor="new-password">{t("account.newPassword")}</Label>
                  <Input
                    id="new-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    required
                  />
                  <Label htmlFor="confirm-password">{t("account.confirmNewPassword")}</Label>
                  <Input
                    id="confirm-password"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="new-email">{t("account.newEmail")}</Label>
                  <Input id="new-email" name="email" type="email" required />
                </>
              )}
              <p className="text-sm text-muted-foreground">
                {t("account.sessionsNotice")}
                {user?.email_verification_required !== false &&
                  t("account.emailVerificationNotice")}
              </p>
              <Button disabled={busy}>
                {busy
                  ? t("common.pleaseWait")
                  : t(action === "password" ? "account.password.title" : "account.email.title")}
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

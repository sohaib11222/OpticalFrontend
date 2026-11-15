import AuthShell from "@/auth/AuthShell";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { errorText } from "../../../../contracts/operations/shared";
export default function Invitation() {
  const { t } = useTranslation();
  // Query-string invitations survive browser/email-link handling.  Accept
  // the legacy hash form too so already-issued invitations continue to work.
  const [token] = useState(
    () =>
      new URLSearchParams(window.location.search).get("token") ||
      window.location.hash.replace(/^#/, ""),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const invalidToken = !/^[A-Za-z0-9]{64}$/.test(token);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (invalidToken) {
      setError("This invitation link is missing, invalid, or incomplete. Ask your shop owner to send a new invitation.");
      return;
    }
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      await api.post("/auth/accept-invitation", {
        token,
        password: data.get("password"),
        password_confirmation: data.get("password_confirmation"),
      });
      setDone(true);
      window.history.replaceState(null, "", window.location.pathname);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>{t("ops.acceptInvitation")}</CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <p role="status">{t("ops.invitationAccepted")}</p>
          ) : invalidToken ? (
            <p role="alert" className="text-destructive">
              This invitation link is missing, invalid, or incomplete. Ask your shop owner to send a new invitation.
            </p>
          ) : (
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <Label htmlFor="invite-password">{t("ops.password")}</Label>
              <Input
                id="invite-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
              />
              <Label htmlFor="invite-confirm">{t("ops.confirmPassword")}</Label>
              <Input
                id="invite-confirm"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
              />
              {error && (
                <p role="alert" className="text-destructive">
                  {error}
                </p>
              )}
              <Button disabled={busy}>{t("ops.acceptInvitation")}</Button>
            </form>
          )}
          <Link className="block mt-4 underline" to="/auth/login">
            {t("ops.signIn")}
          </Link>
        </CardContent>
      </Card>
    </AuthShell>
  );
}

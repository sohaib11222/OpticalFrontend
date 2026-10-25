import AuthShell from "./AuthShell";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { api, useSession } from "./session";
export default function VerifyPage() {
  const { t, translateError } = useTranslation();
  const [params] = useSearchParams();
  const { refresh } = useSession();
  // Store the message KEY, never translated text, so that switching language
  // re-renders this line in the new language instead of keeping the old text.
  const [messageKey, setMessageKey] = useState("auth.verify.initial");
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const verify = async () => {
    const url = params.get("url") || "";
    setServerError(null);
    if (!/^\/api\/v1\/auth\/verify-email\/\d+\/[a-f0-9]{40}\?/.test(url)) {
      setMessageKey("auth.verify.invalidLink");
      return;
    }
    setBusy(true);
    try {
      await api.request(url.slice("/api/v1".length));
      await refresh();
      setMessageKey("auth.verify.success");
    } catch (e) {
      if (e instanceof Error) {
        setMessageKey("auth.verify.failed");
        setServerError(translateError(e.message));
      } else {
        setMessageKey("auth.verify.failed");
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.verify.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p role="status">{t(messageKey)}</p>
          {serverError && <p role="alert">{serverError}</p>}
          <Button onClick={verify} disabled={busy}>
            {t("auth.verify.action")}
          </Button>
          <Link className="block underline" to="/">
            {t("auth.verify.continue")}
          </Link>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
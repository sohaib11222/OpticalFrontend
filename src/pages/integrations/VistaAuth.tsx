import AuthShell from "@/auth/AuthShell";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "../../../../contracts/session";
import { useTranslation } from "@/i18n";

export function VistaSignIn({ connect = false }: { connect?: boolean }) {
  const { t, translateError } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setChecking(true);
    setError("");
    void api
      .request<{ data: { enabled: boolean } }>("/auth/vista/config")
      .then((r) => {
        if (active) setEnabled(r.data.enabled);
      })
      .catch(() => {
        if (active) {
          setEnabled(false);
          setError(t("common.connectionFailed"));
        }
      })
      .finally(() => { if (active) setChecking(false); });
    return () => {
      active = false;
    };
  }, [attempt, t]);

  return (
    <div className="space-y-2 my-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy || checking || !enabled}
        onClick={() => {
          setBusy(true);
          setError("");
          void api
            .post<{ data: { authorize_url: string } }>("/auth/vista/start", {
              mode: connect ? "connect" : "login",
            })
            .then((r) => window.location.assign(r.data.authorize_url))
            .catch((e) => {
              setError(
                e instanceof Error
                  ? translateError(e.message)
                  : t("common.connectionFailed"),
              );
              setBusy(false);
            });
        }}
      >
        {busy
          ? t("vista.openingVista")
          : connect
            ? t("vista.connectBtn")
            : t("vista.signInBtn")}
      </Button>
      {!checking && !enabled && (
        <div className="text-sm text-muted-foreground" role="status">
          <p>{t("vista.signInUnavailable")}</p>
          <Button type="button" variant="link" className="px-0" onClick={() => setAttempt((value) => value + 1)}>
            {t("vista.retryAvailability")}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {t("vista.existingCredentials")}
      </p>
    </div>
  );
}

export default function VistaCallback() {
  const { accept } = useSession();
  const navigate = useNavigate();
  const { t, translateError } = useTranslation();
  const started = useRef(false);
  const [error, setError] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    return q.has("code") && q.has("state")
      ? ""
      : t("vista.authIncomplete");
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const q = new URLSearchParams(window.location.search);
    const code = q.get("code");
    const state = q.get("state");
    window.history.replaceState(null, "", window.location.pathname);
    if (!code || !state) {
      return;
    }
    void api
      .post<{ data: SessionUser }>("/auth/vista/finish", { code, state })
      .then((r) => {
        accept(r.data);
        navigate("/integrations/vista", { replace: true });
      })
      .catch((e) => {
        setError(
          e instanceof Error ? translateError(e.message) : t("vista.authError"),
        );
      });
  }, [accept, navigate, t, translateError]);

  return (
    <AuthShell>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{t("vista.authTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <>
              <p role="alert" className="text-destructive">
                {error}
              </p>
              <Button asChild variant="outline">
                <Link to="/auth/login">{t("vista.returnToSignIn")}</Link>
              </Button>
            </>
          ) : (
            <p role="status">{t("vista.authCompleting")}</p>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

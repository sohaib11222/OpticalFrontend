import { canAccessVerifiedAccount } from "../../../contracts/session";
import { useEffect, useState, type FormEvent } from "react";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function FoundationHome() {
  const { user, refresh } = useSession();
  const { t, translateError } = useTranslation();
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [members, setMembers] = useState<
    { id: number; name: string; role: string; email: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const active =
    canAccessVerifiedAccount(user) && user.shop?.status === "active";
  useEffect(() => {
    let cancelled = false;
    if (active && user?.permissions.includes("members.view"))
      api
        .request<{ data: typeof members }>("/shop/members")
        .then((r) => {
          if (!cancelled) setMembers(r.data);
        })
        .catch((e) => {
          if (!cancelled) setMessage(translateError(e.message));
        });
    return () => {
      cancelled = true;
    };
  }, [active, user?.id, user?.shop?.id, user?.permissions, translateError]);
  const resend = async () => {
    setBusy(true);
    try {
      const r = await api.auth<{ message: string }>(
        "/verification-notification",
        {},
      );
      setMessage(translateError(r.message));
    } catch (e) {
      setMessage(e instanceof Error ? translateError(e.message) : t("common.requestFailed"));
    } finally {
      setBusy(false);
    }
  };
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.request("/shop", {
        method: "PATCH",
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      await refresh();
      setMessageKey("shop.home.shopDetailsSaved");
    } catch (e) {
      setMessage(e instanceof Error ? translateError(e.message) : t("common.requestFailed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {user?.shop?.name || t("shop.home.yourShop")}
      </h1>
      <p>{t("shop.home.welcome", { name: user?.name ?? "" })}</p>
      {message && <p role="status">{message}</p>}
      {messageKey && <p role="status">{t(messageKey)}</p>}
      {!canAccessVerifiedAccount(user) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("shop.home.verifyEmail")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{t("shop.home.checkInbox")}</p>
            <Button disabled={busy} onClick={() => void resend()}>
              {t("shop.home.resendVerification")}
            </Button>
          </CardContent>
        </Card>
      )}
      {user?.shop?.status !== "active" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t("shop.home.accountStatus", {
                status: user?.shop?.status
                  ? t("status." + user.shop.status)
                  : t("common.unavailable"),
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t("shop.home.awaitApproval")}</p>
          </CardContent>
        </Card>
      )}
      <Button variant="outline" onClick={() => void refresh()}>
        {t("shop.home.refreshStatus")}
      </Button>
      {active && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("shop.home.shopDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => void save(e)}
                className="space-y-4 max-w-lg"
              >
                <Label htmlFor="shop-name">{t("shop.home.shopName")}</Label>
                <Input
                  key={user?.shop?.name}
                  id="shop-name"
                  name="name"
                  defaultValue={user?.shop?.name}
                  maxLength={150}
                  required
                />
                {user?.permissions.includes("shop.update") && <Button disabled={busy}>{t("shop.home.saveShopDetails")}</Button>}
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("shop.home.shopAccess")}</CardTitle>
            </CardHeader>
            <CardContent>
              {members.map((m) => (
                <p key={m.id}>
                  {m.name} · {m.email} · {m.role}
                </p>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

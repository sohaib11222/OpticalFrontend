import { useState } from "react";
import { useForm } from "react-hook-form";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller } from "react-hook-form";
import type { ShopSettings as Settings } from "../../../../contracts/commerce";
import { ApiError } from "../../../../contracts/session";
type Values = {
  name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  timezone: string;
  currency: string;
  stock_location: string;
  notification_preferences: Record<string, boolean>;
};
export default function ShopSettings() {
  const { t } = useTranslation();
  const r = useApiResource<Settings>("/shop/settings");
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("nav.shopSettings")}</h1>
        <Button variant="outline" onClick={r.reload}>
          {t("settings.refresh")}
        </Button>
      </div>
      {r.error && <p role="alert">{r.error}</p>}
      {r.data ? (
        <SettingsForm
          key={r.data.data.shop.settings_version}
          settings={r.data}
          saved={r.reload}
        />
      ) : (
        <p>{t("settings.loading")}</p>
      )}
    </div>
  );
}
function SettingsForm({
  settings,
  saved,
}: {
  settings: Settings;
  saved: () => void;
}) {
  const { user, refresh } = useSession();
  const { t, translateError } = useTranslation();
  const { shop, stock_location, currency_locked } = settings.data;
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const f = useForm<Values>({
    defaultValues: {
      name: shop.name,
      phone: shop.phone ?? "",
      address_line1: shop.address_line1 ?? "",
      address_line2: shop.address_line2 ?? "",
      city: shop.city ?? "",
      postal_code: shop.postal_code ?? "",
      country: shop.country ?? "",
      timezone: shop.timezone ?? "UTC",
      currency: shop.currency ?? "",
      stock_location,
      notification_preferences: Object.fromEntries(
        ["stock", "orders", "imports", "agenda"].map((k) => [
          k,
          shop.notification_preferences?.[k] ?? true,
        ]),
      ),
    },
  });
  const write = user?.permissions.includes("shop.update");
  const fields = [
    ["name", "settings.fields.businessName", 150],
    ["phone", "settings.fields.businessPhone", 40],
    ["address_line1", "settings.fields.streetAddress", 255],
    ["address_line2", "settings.fields.addressLine2", 255],
    ["city", "settings.fields.city", 100],
    ["postal_code", "settings.fields.postalCode", 32],
    ["country", "settings.fields.country", 100],
    ["timezone", "settings.fields.businessTimezone", 80],
  ] as const;
  const notifications = [
    ["stock", "settings.notifyLowStock"],
    ["orders", "settings.notifyOrders"],
    ["imports", "settings.notifyImports"],
    ["agenda", "settings.notifyAgenda"],
  ] as const;
  return (
    <form
      className="space-y-6"
      onSubmit={f.handleSubmit(async (d) => {
        setError("");
        setMessageKey(null);
        try {
          await api.request("/shop/settings", {
            method: "PATCH",
            body: JSON.stringify({
              ...d,
              settings_version: shop.settings_version,
            }),
          });
          setMessageKey("settings.saved");
          await refresh();
          saved();
        } catch (e) {
          setError(
            e instanceof Error
              ? translateError(e.message)
              : t("settings.saveFailed"),
          );
          if (e instanceof ApiError)
            for (const [k, v] of Object.entries(e.errors))
              f.setError(k as keyof Values, { message: translateError(v[0]) });
        }
      })}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.businessInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {fields.map(([name, labelKey, max]) => {
            const label = t(labelKey);
            return (
              <div className="space-y-2" key={name}>
                <Label htmlFor={"settings-" + name}>{label}</Label>
                <Input
                  id={"settings-" + name}
                  maxLength={max}
                  readOnly={!write}
                  list={name === "timezone" ? "shop-timezones" : undefined}
                  {...f.register(name, {
                    required:
                      name === "address_line2"
                        ? false
                        : t("settings.requiredField", { label }),
                  })}
                />
                {f.formState.errors[name] && (
                  <p role="alert">{f.formState.errors[name]?.message}</p>
                )}
              </div>
            );
          })}
          <datalist id="shop-timezones">
            {(
              (
                Intl as typeof Intl & {
                  supportedValuesOf?: (key: string) => string[];
                }
              ).supportedValuesOf?.("timeZone") ?? [
                "UTC",
                "Europe/Rome",
                "Europe/Berlin",
                "Europe/London",
              ]
            ).map((z: string) => (
              <option value={z} key={z} />
            ))}
          </datalist>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.currencyAndStock")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="shop-currency">{t("settings.businessCurrency")}</Label>
            <select
              id="shop-currency"
              className="h-9 w-full border rounded-md bg-background px-3"
              disabled={!write || currency_locked}
              {...f.register("currency", {
                required: t("settings.requiredCurrency"),
              })}
            >
              <option value="">{t("settings.chooseCurrency")}</option>
              {settings.currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {t("settings.currencyOption", {
                    code: c.code,
                    name: c.name,
                    decimals: c.decimals,
                  })}
                </option>
              ))}
            </select>
            {f.formState.errors.currency && (
              <p role="alert">{f.formState.errors.currency.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {currency_locked
                ? t("settings.currencyLocked")
                : t("settings.currencyWarning")}
            </p>
            <Label htmlFor="stock-location">{t("settings.stockLocationName")}</Label>
            <Input
              id="stock-location"
              readOnly={!write}
              {...f.register("stock_location", {
                required: t("settings.requiredStockLocation"),
                maxLength: 100,
              })}
            />
            {f.formState.errors.stock_location && (
              <p role="alert">{f.formState.errors.stock_location.message}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.operationalNotifications")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("settings.notificationsHelp")}
            </p>
            {notifications.map(([key, labelKey]) => (
              <Controller
                key={key}
                control={f.control}
                name={
                  ("notification_preferences." +
                    key) as `notification_preferences.${string}`
                }
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={"notice-" + key}
                      disabled={!write}
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    <Label htmlFor={"notice-" + key}>{t(labelKey)}</Label>
                  </div>
                )}
              />
            ))}
          </CardContent>
        </Card>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {messageKey && <p role="status">{t(messageKey)}</p>}
      {write && (
        <Button type="submit" disabled={f.formState.isSubmitting}>
          {t("settings.save")}
        </Button>
      )}
    </form>
  );
}

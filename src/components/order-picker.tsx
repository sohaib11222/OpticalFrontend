import { useState } from "react";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Order } from "../../../contracts/commerce";
import type { Page } from "../../../contracts/customers";
export default function OrderPicker({
  customerId,
  value,
  onChange,
}: {
  customerId: number;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const { t, translateError } = useTranslation();
  const [page, setPage] = useState(1);
  const r = useApiResource<Page<Order>>(
    "/orders?" +
      new URLSearchParams({
        customer_id: String(customerId),
        page: String(page),
      }),
  );
  return (
    <div className="space-y-2">
      <Label htmlFor="linked-order">{t("orders.linkedOrderOptional")}</Label>
      <select
        id="linked-order"
        className="h-9 w-full border rounded-md bg-background px-3"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">{t("orders.noLinkedOrder")}</option>
        {value && !r.data?.data.some((o) => o.id === value) && (
          <option value={value}>{t("orders.orderNumber", { value })}</option>
        )}
        {r.data?.data.map((o) => (
          <option key={o.id} value={o.id}>
            {o.number} · {t("status." + o.status)}
          </option>
        ))}
      </select>
      {r.error && <p role="alert">{translateError(r.error)}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1 || r.loading}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("orders.previousOrders")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= (r.data?.last_page ?? 1) || r.loading}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("orders.moreOrders")}
        </Button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { Link } from "react-router-dom";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Paging } from "./catalog-shared";
import OrderList from "./OrderList";
import {
  amount,
  type SaleEntry,
  type SalesSummary,
} from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
export default function CustomerSales({ customerId }: { customerId: number }) {
  const { user } = useSession();
  const { t, translateError, formatDateTime } = useTranslation();
  const zone = user?.shop?.timezone ?? "UTC";
  const [page, setPage] = useState(1);
  const r = useApiResource<{
    entries: Page<SaleEntry>;
    summary: SalesSummary[];
  }>("/customers/" + customerId + "/sales?page=" + page);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>{t("customers.salesTitle")}</CardTitle>
          <Button variant="outline" onClick={r.reload}>
            {t("customers.refreshSales")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {r.error && <p role="alert">{translateError(r.error)}</p>}
          {r.loading && <p role="status">{t("customers.loadingSales")}</p>}
          <div className="grid gap-3">
            {r.data?.summary.map((s) => (
              <div
                key={s.currency}
                className="grid sm:grid-cols-3 gap-3 rounded-md border p-4"
              >
                <p>
                  {t("customers.salesLabel")}{" "}
                  {amount(s.sales_minor, s.currency, s.price_decimals)}
                </p>
                <p>
                  {t("customers.reversalsLabel")}{" "}
                  {amount(s.reversals_minor, s.currency, s.price_decimals)}
                </p>
                <p className="font-semibold">
                  {t("customers.netSalesLabel")}{" "}
                  {amount(s.net_minor, s.currency, s.price_decimals)}
                </p>
              </div>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  t("customers.colOrder"),
                  t("customers.colEntry"),
                  t("customers.colWhenZone", { zone }),
                  t("common.amount"),
                  t("common.reason"),
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.data?.entries.data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link className="underline" to={"/orders/" + s.order_id}>
                      {s.order?.number}
                    </Link>
                  </TableCell>
                  <TableCell>{t("status." + s.kind)}</TableCell>
                  <TableCell>{formatDateTime(s.created_at, zone)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {s.kind === "reversal" ? "−" : ""}
                    {amount(s.amount_minor, s.currency, s.price_decimals)}
                  </TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">
                    {s.reason || t("customers.fulfilledOrder")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!r.loading && !r.data?.entries.data.length && (
            <p>{t("customers.noSales")}</p>
          )}
          <Paging
            data={r.data?.entries ?? null}
            page={page}
            loading={r.loading}
            onChange={setPage}
          />
        </CardContent>
      </Card>
      <OrderList customerId={customerId} />
    </div>
  );
}

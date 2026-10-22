import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import SourceLinks from "@/pages/integrations/SourceLinks";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Choice, Paging } from "./catalog-shared";
import { amount, type Order } from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
export default function OrderList({ customerId }: { customerId?: number }) {
  const { t, formatDate } = useTranslation();
  const [params] = useSearchParams();
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(
    ["draft", "confirmed", "fulfilled", "cancelled", "reversed"].includes(
      params.get("status") ?? "",
    )
      ? params.get("status")!
      : "all",
  );
  const [page, setPage] = useState(1);
  const q = new URLSearchParams({ search, page: String(page) });
  if (status !== "all") q.set("status", status);
  if (customerId) q.set("customer_id", String(customerId));
  const r = useApiResource<Page<Order>>("/orders?" + q);
  return (
    <div className="space-y-6">
      <SourceLinks kind="orders" />
      <div className="flex justify-between flex-wrap gap-4">
        <div>
          <OperationsWorkspace module="output-orders" />
          <h1 className="text-2xl font-semibold">{t("nav.orders")}</h1>
          <p className="text-muted-foreground">{t("orders.flow")}</p>
        </div>
        {user?.permissions.includes("orders.write") && user.permissions.includes("orders.create") && (
          <Button asChild>
            <Link
              to={
                "/orders/new" + (customerId ? "?customer_id=" + customerId : "")
              }
            >
              <Plus className="h-4 w-4" />
              {t("orders.newOrder")}
            </Link>
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("orders.listTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-44">
              <Label htmlFor="order-search">{t("orders.searchLabel")}</Label>
              <Input
                id="order-search"
                placeholder={t("orders.searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Choice
              label={t("orders.statusFilter")}
              value={status}
              options={[
                ["all", t("orders.allStatuses")],
                ["draft", t("status.draft")],
                ["confirmed", t("status.confirmed")],
                ["fulfilled", t("status.fulfilled")],
                ["cancelled", t("status.cancelled")],
                ["reversed", t("status.reversed")],
              ]}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
            <Button variant="outline" onClick={r.reload}>
              {t("common.refresh")}
            </Button>
          </div>
          {r.error && <p role="alert">{r.error}</p>}
          {r.loading && <p role="status">{t("orders.loading")}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  t("orders.colOrder"),
                  t("orders.colCustomer"),
                  t("common.created"),
                  t("common.status"),
                  t("common.amount"),
                  t("common.actions"),
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.data?.data.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      className="font-medium underline"
                      to={"/orders/" + o.id}
                    >
                      {o.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.customer.first_name} {o.customer.last_name}
                  </TableCell>
                  <TableCell>
                    {formatDate(o.created_at, user?.shop?.timezone ?? "UTC")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t("status." + o.status)}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {amount(o.total_minor, o.currency, o.price_decimals)}
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link to={"/orders/" + o.id}>
                        {t("orders.viewOrder")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!r.loading && !r.data?.data.length && (
            <p>{t("orders.noneMatching")}</p>
          )}
          <Paging
            data={r.data}
            page={page}
            loading={r.loading}
            onChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

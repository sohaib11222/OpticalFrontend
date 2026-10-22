import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Paging } from "./catalog-shared";
import {
  amount,
  type Order,
  type OrderEvent,
} from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
type Action = "confirm" | "fulfil" | "cancel" | "reverse";
const labels: Record<Action, string> = {
  confirm: "orders.action.confirm",
  fulfil: "orders.action.fulfil",
  cancel: "orders.action.cancel",
  reverse: "orders.action.reverse",
};
const messages: Record<Action, string> = {
  confirm: "orders.msg.confirm",
  fulfil: "orders.msg.fulfil",
  cancel: "orders.msg.cancel",
  reverse: "orders.msg.reverse",
};
export default function OrderDetails() {
  const { t, translateError, formatDateTime } = useTranslation();
  const { id } = useParams();
  const { user } = useSession();
  const r = useApiResource<{ data: Order }>("/orders/" + id);
  const [action, setAction] = useState<Action | null>(null);
  const o = r.data?.data;
  if (!o)
    return (
      <div className="space-y-3">
        <p role={r.error ? "alert" : "status"}>
          {r.error ? translateError(r.error) : t("orders.loadingOrder")}
        </p>
        <Button variant="outline" onClick={r.reload}>
          {t("common.retry")}
        </Button>
      </div>
    );
  const can = (p: string) => user?.permissions.includes(p);
  return (
    <div className="order-detail-page space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{o.number}</h1>
          <p className="text-muted-foreground">
            {t("orders.inStore")}{" "}
            <Badge variant="outline">{t("status." + o.status)}</Badge>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline">
            <Link to="/orders">{t("nav.orders")}</Link>
          </Button>
          <Button variant="outline" onClick={r.reload}>
            {t("orders.refreshOrder")}
          </Button>
          {can("orders.print") && (          <Button asChild variant="outline">
            <Link to={"/orders/" + o.id + "/print"}>
              {t("orders.printSheet")}
            </Link>
          </Button>)}
          {o.status === "draft" && can("orders.write") && can("orders.edit") && (
            <Button asChild>
              <Link to={"/orders/" + o.id + "/edit"}>
                {t("orders.editDraft")}
              </Link>
            </Button>
          )}
        </div>
      </div>
      {r.error && <p role="alert">{r.error}</p>}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.itemsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      t("orders.colProduct"),
                      t("orders.colQuantity"),
                      t("orders.colUnitPrice"),
                      t("orders.colLineTotal"),
                    ].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {o.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <Link
                          className="font-medium underline"
                          to={"/products/" + i.product_id}
                        >
                          {i.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {i.sku} · {i.brand} · {i.model} · {i.color}
                        </p>
                      </TableCell>
                      <TableCell>{i.quantity}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {amount(
                          i.unit_price_minor,
                          o.currency,
                          o.price_decimals,
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {amount(i.total_minor, o.currency, o.price_decimals)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-right border-t pt-4 text-lg font-semibold">
                {t("orders.orderTotal", {
                  amount: amount(o.total_minor, o.currency, o.price_decimals),
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.salesHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {o.sales.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[
                        t("orders.colEntry"),
                        t("common.when"),
                        t("common.amount"),
                        t("orders.colStockReturned"),
                        t("common.reason"),
                      ].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {o.sales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          {t("status." + s.kind)} #{s.id}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(
                            s.created_at,
                            user?.shop?.timezone ?? "UTC",
                          )}
                        </TableCell>
                        <TableCell>
                          {s.kind === "reversal" ? "−" : ""}
                          {amount(s.amount_minor, s.currency, s.price_decimals)}
                        </TableCell>
                        <TableCell>
                          {s.kind === "reversal"
                            ? s.stock_returned
                              ? t("common.yes")
                              : t("common.no")
                            : t("common.dash")}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap break-words">
                          {s.reason ?? t("orders.fulfilledReason")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">
                  {t("orders.saleRecordedHint")}
                </p>
              )}
            </CardContent>
          </Card>
          <OrderHistory id={o.id} version={o.version} />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.customerTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                className="underline font-medium"
                to={"/customers/" + o.customer_id}
              >
                {o.customer_snapshot.first_name} {o.customer_snapshot.last_name}
              </Link>
              {o.customer_snapshot.email && <p>{o.customer_snapshot.email}</p>}
              {o.customer_snapshot.phone && <p>{o.customer_snapshot.phone}</p>}
              {o.prescription_id && (
                <p>
                  {can("optical.read") && can("optical.print") ? (
                    <Link
                      className="underline"
                      to={
                        "/customers/" +
                        o.customer_id +
                        "/optical/" +
                        o.prescription_id +
                        "/print"
                      }
                    >
                      {t("orders.prescriptionNumber", {
                        id: o.prescription_id,
                      })}
                    </Link>
                  ) : (
                    t("orders.linkedPrescription", {
                      id: o.prescription_id,
                    })
                  )}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("orders.customerRetained")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.actionsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {o.status === "draft" && can("orders.write") && can("orders.edit") && (
                <Button
                  className="w-full"
                  disabled={r.loading}
                  onClick={() => setAction("confirm")}
                >
                  {t("orders.action.confirm")}
                </Button>
              )}
              {o.status === "confirmed" && can("orders.fulfil") && (
                <Button
                  className="w-full"
                  disabled={r.loading}
                  onClick={() => setAction("fulfil")}
                >
                  {t("orders.action.fulfil")}
                </Button>
              )}
              {["draft", "confirmed"].includes(o.status) &&
                can("orders.write") && can("orders.archive") && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={r.loading}
                    onClick={() => setAction("cancel")}
                  >
                    {t("orders.action.cancel")}
                  </Button>
                )}
              {o.status === "fulfilled" && can("sales.reverse") && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={r.loading}
                  onClick={() => setAction("reverse")}
                >
                  {t("orders.action.reverse")}
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                {t("orders.actionsExplain")}
              </p>
            </CardContent>
          </Card>
          {o.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("orders.notesTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap break-words">
                {o.notes}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {action && (
        <TransitionLoader
          id={o.id}
          action={action}
          close={() => setAction(null)}
          saved={() => {
            setAction(null);
            r.reload();
          }}
        />
      )}
    </div>
  );
}
function OrderHistory({ id, version }: { id: number; version: number }) {
  const { t, formatDateTime } = useTranslation();
  const { user } = useSession();
  const [page, setPage] = useState(1);
  const r = useApiResource<Page<OrderEvent>>(
    "/orders/" + id + "/history?page=" + page,
    version,
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("orders.historyTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {r.error && <p role="alert">{r.error}</p>}
        <ol className="space-y-4">
          {r.data?.data.map((e) => {
            const actionKey = "orders.action." + e.action;
            const actionLabel = t(actionKey);
            return (
              <li className="border-l-2 pl-4" key={e.id}>
                <p className="font-medium">
                  {actionLabel === actionKey ? e.action : actionLabel} →{" "}
                  {t("status." + e.to_status)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(e.created_at, user?.shop?.timezone ?? "UTC")}{" "}
                  · {e.actor?.name ?? t("common.system")} ·{" "}
                  {t("common.version", { version: e.version })}
                </p>
                {e.reason && (
                  <p className="whitespace-pre-wrap break-words">{e.reason}</p>
                )}
              </li>
            );
          })}
        </ol>
        <Paging
          data={r.data}
          page={page}
          loading={r.loading}
          onChange={setPage}
        />
      </CardContent>
    </Card>
  );
}
function TransitionLoader(props: {
  id: number;
  action: Action;
  close: () => void;
  saved: () => void;
}) {
  const { t, translateError } = useTranslation();
  const r = useApiResource<{ data: Order }>("/orders/" + props.id);
  return r.data ? (
    <TransitionDialog {...props} order={r.data.data} />
  ) : (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) props.close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(labels[props.action])}</DialogTitle>
          <DialogDescription>{t("orders.checkingLatest")}</DialogDescription>
        </DialogHeader>
        {r.error ? (
          <>
            <p role="alert">{translateError(r.error)}</p>
            <Button onClick={r.reload}>{t("common.retry")}</Button>
          </>
        ) : (
          <p>{t("common.loading")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
function TransitionDialog({
  order,
  action,
  close,
  saved,
}: {
  order: Order;
  action: Action;
  close: () => void;
  saved: () => void;
}) {
  const { t, translateError } = useTranslation();
  const [key] = useState(() => crypto.randomUUID());
  const [reason, setReason] = useState("");
  const [returns, setReturns] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reasonRequired = action === "cancel" || action === "reverse";
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(labels[action])}</DialogTitle>
          <DialogDescription>{t(messages[action])}</DialogDescription>
        </DialogHeader>
        <p>
          {order.number} · {t("status." + order.status)} ·{" "}
          {amount(order.total_minor, order.currency, order.price_decimals)}
        </p>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api.post("/orders/" + order.id + "/" + action, {
                version: order.version,
                creation_key: key,
                ...(reason ? { reason } : {}),
                ...(action === "reverse"
                  ? { return_stock: returns === "yes" }
                  : {}),
              });
              saved();
            } catch (ex) {
              setError(
                ex instanceof Error
                  ? translateError(ex.message)
                  : t("orders.updateFailed"),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {reasonRequired && (
            <>
              <Label htmlFor="order-action-reason">{t("common.reason")}</Label>
              <Textarea
                id="order-action-reason"
                required
                minLength={3}
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </>
          )}
          {action === "reverse" && (
            <>
              <Label htmlFor="return-order-stock">
                {t("orders.returnStockQuestion")}
              </Label>
              <select
                id="return-order-stock"
                className="h-9 w-full border rounded-md bg-background px-3"
                required
                value={returns}
                onChange={(e) => setReturns(e.target.value)}
              >
                <option value="">{t("orders.chooseStockOutcome")}</option>
                <option value="yes">{t("orders.stockReturnedYes")}</option>
                <option value="no">{t("orders.stockReturnedNo")}</option>
              </select>
            </>
          )}
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={close}
            >
              {t("common.close")}
            </Button>
            <Button
              type="submit"
              disabled={busy || (action === "reverse" && !returns)}
            >
              {t(labels[action])}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

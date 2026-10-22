import { useState } from "react";
import { useForm } from "react-hook-form";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Choice, Paging } from "./catalog-shared";
import type { Product, StockMovement } from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
import { ApiError } from "../../../../contracts/session";
export default function ProductStock({
  product,
  changed,
}: {
  product: Product;
  changed: () => void;
}) {
  const { t, translateError } = useTranslation();
  const { user } = useSession();
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState("all");
  const [edit, setEdit] = useState<
    "receipt" | "adjustment" | StockMovement | null
  >(null);
  const q = new URLSearchParams({ page: String(page) });
  if (kind !== "all") q.set("kind", kind);
  const r = useApiResource<Page<StockMovement>>(
    "/products/" + product.id + "/movements?" + q,
    product.balance.version,
  );
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between gap-3 flex-wrap">
        <CardTitle>{t("products.stockHistory")}</CardTitle>
        {user?.permissions.includes("stock.write") && user.permissions.includes("stock.create") && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={product.status === "archived"}
              onClick={() => setEdit("receipt")}
            >
              {t("products.receiveStock")}
            </Button>
            <Button variant="outline" onClick={() => setEdit("adjustment")}>
              {t("products.adjustStock")}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 items-end">
          <Choice
            label={t("products.movementType")}
            value={kind}
            options={[
              ["all", t("products.allMovements")],
              ["receipt", t("products.receipts")],
              ["adjustment", t("products.adjustments")],
              ["adjustment_reversal", t("products.adjustmentReversals")],
              ["reservation", t("products.reservations")],
              ["release", t("products.reservationReleases")],
              ["fulfilment", t("products.orderFulfilments")],
              ["sale_reversal", t("products.saleReversals")],
            ]}
            onChange={(v) => {
              setKind(v);
              setPage(1);
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              changed();
              r.reload();
            }}
          >
            {t("products.refreshStock")}
          </Button>
        </div>
        {r.error && <p role="alert">{translateError(r.error)}</p>}
        {r.loading && (
          <p role="status">{t("products.loadingStockHistory")}</p>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {[
                t("products.colWhenActor"),
                t("products.colMovement"),
                t("products.colQuantityChange"),
                t("products.colReservedChange"),
                t("products.colBalanceAfter"),
                t("common.reason"),
                t("products.colAction"),
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.data?.data.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <p className="whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString(undefined, {
                      timeZone: user?.shop?.timezone ?? "UTC",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.actor?.name ?? t("common.system")}
                  </p>
                </TableCell>
                <TableCell>
                  {t("movement." + m.kind)}
                  <p className="text-xs text-muted-foreground">#{m.id}</p>
                </TableCell>
                <TableCell>
                  {m.quantity_delta > 0 ? "+" : ""}
                  {m.quantity_delta}
                </TableCell>
                <TableCell>
                  {m.reserved_delta > 0 ? "+" : ""}
                  {m.reserved_delta}
                </TableCell>
                <TableCell>
                  {t("products.onHandReserved", {
                    onHand: m.on_hand_after,
                    reserved: m.reserved_after,
                  })}
                </TableCell>
                <TableCell className="whitespace-pre-wrap min-w-40 max-w-sm break-words">
                  {m.reason}
                </TableCell>
                <TableCell>
                  {m.reversal ? (
                    <span>
                      {t("products.reversedBy", { id: m.reversal.id })}
                    </span>
                  ) : (
                    ["receipt", "adjustment"].includes(m.kind) &&
                    user?.permissions.includes("stock.write") && user.permissions.includes("stock.edit") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEdit(m)}
                      >
                        {t("products.reverseMovement")}
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Paging
          data={r.data}
          page={page}
          loading={r.loading}
          onChange={setPage}
        />
      </CardContent>
      {edit && (
        <MovementForm
          product={product}
          action={edit}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null);
            changed();
            r.reload();
          }}
        />
      )}
    </Card>
  );
}
function MovementForm(props: {
  product: Product;
  action: "receipt" | "adjustment" | StockMovement;
  close: () => void;
  saved: () => void;
}) {
  const { t, translateError } = useTranslation();
  const r = useApiResource<{ data: Product }>("/products/" + props.product.id);
  if (r.data) return <MovementFields {...props} product={r.data.data} />;
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) props.close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("products.loadCurrentStock")}</DialogTitle>
          <DialogDescription>
            {t("products.checkingQuantities")}
          </DialogDescription>
        </DialogHeader>
        {r.error ? (
          <>
            <p role="alert">{translateError(r.error)}</p>
            <Button onClick={r.reload}>{t("common.retry")}</Button>
          </>
        ) : (
          <p role="status">{t("products.loadingCurrentBalance")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
function MovementFields({
  product,
  action,
  close,
  saved,
}: {
  product: Product;
  action: "receipt" | "adjustment" | StockMovement;
  close: () => void;
  saved: () => void;
}) {
  const { t, translateError } = useTranslation();
  const [version] = useState(product.balance.version);
  const [key] = useState(() => crypto.randomUUID());
  const [error, setMessage] = useState("");
  const reversal = typeof action !== "string";
  const f = useForm<{ quantity: number; reason: string }>({
    defaultValues: { quantity: 1, reason: "" },
  });
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !f.formState.isSubmitting) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {reversal
              ? t("products.reverseStockMovement")
              : action === "receipt"
                ? t("products.receiveStock")
                : t("products.adjustStock")}
          </DialogTitle>
          <DialogDescription>
            {reversal
              ? t("products.reversalDescription")
              : t("products.movementDescription")}
          </DialogDescription>
        </DialogHeader>
        <p>
          {t("products.productStockSummary", {
            name: product.name,
            available: product.balance.available,
            reserved: product.balance.reserved,
          })}
        </p>
        <form
          className="space-y-4"
          onSubmit={f.handleSubmit(async (v) => {
            setMessage("");
            try {
              await api.post(
                reversal
                  ? "/stock-movements/" + action.id + "/reverse"
                  : "/products/" + product.id + "/movements",
                {
                  ...(!reversal ? { kind: action, quantity: v.quantity } : {}),
                  reason: v.reason,
                  version,
                  creation_key: key,
                },
              );
              saved();
            } catch (e) {
              setMessage(
                e instanceof Error
                  ? translateError(e.message)
                  : t("products.unableToRecordMovement"),
              );
              if (e instanceof ApiError)
                for (const [k, m] of Object.entries(e.errors))
                  f.setError(k as "quantity" | "reason", {
                    message: translateError(m[0]),
                  });
            }
          })}
        >
          {reversal ? (
            <p>
              {t("products.reverseMovementSummary", {
                id: action.id,
                quantity:
                  (action.quantity_delta > 0 ? "−" : "+") +
                  Math.abs(action.quantity_delta),
              })}
            </p>
          ) : (
            <>
              <Label htmlFor="movement-quantity">
                {action === "receipt"
                  ? t("products.quantityReceived")
                  : t("products.quantityChange")}
              </Label>
              <Input
                id="movement-quantity"
                type="number"
                step={1}
                min={action === "receipt" ? 1 : -1000000}
                max={1000000}
                {...f.register("quantity", {
                  valueAsNumber: true,
                  required: t("products.quantityRequired"),
                  validate: (v) =>
                    (Number.isInteger(v) && v !== 0) ||
                    t("products.quantityNonZero"),
                })}
              />
              {f.formState.errors.quantity && (
                <p role="alert">{f.formState.errors.quantity.message}</p>
              )}
            </>
          )}
          <Label htmlFor="movement-reason">{t("common.reason")}</Label>
          <Textarea
            id="movement-reason"
            maxLength={2000}
            {...f.register("reason", {
              required: t("products.reasonRequired"),
              minLength: { value: 3, message: t("products.describeReason") },
            })}
          />
          {f.formState.errors.reason && (
            <p role="alert">{f.formState.errors.reason.message}</p>
          )}
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={close}
              disabled={f.formState.isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button disabled={f.formState.isSubmitting} type="submit">
              {reversal
                ? t("products.confirmReversal")
                : t("products.recordMovement")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

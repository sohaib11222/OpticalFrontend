import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Page } from "../../../../contracts/customers";
import {
  displayVistaValue,
  type VistaStatus,
  type VistaRecord,
} from "../../../../contracts/vista";
import { VistaSignIn } from "./VistaAuth";
import { useTranslation } from "@/i18n";

export default function VistaPage() {
  const { user } = useSession();
  const { t, translateError } = useTranslation();
  const q = useApiResource<VistaStatus>("/integrations/vista");
  const c = q.data?.data.connection;
  const [params] = useSearchParams();
  const initialSource = params.get("source");
  const [kind, setKind] = useState(
    initialSource && ["products", "orders", "customers"].includes(initialSource)
      ? initialSource
      : "products",
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<VistaRecord | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [batch, setBatch] = useState<number | null>(null);
  const [detail, setDetail] = useState<VistaRecord | null>(null);
  const rows = useApiResource<Page<VistaRecord>>(
    "/integrations/vista/records/" +
      kind +
      "?" +
      new URLSearchParams({ page: String(page), search }),
  );
  const { reload: reloadConnection, loading: loadingConnection } = q;
  const { reload: reloadRecords, loading: loadingRecords } = rows;

  useEffect(() => {
    if (loadingConnection || loadingRecords) return;
    const t = setTimeout(() => {
      reloadConnection();
      reloadRecords();
    }, 10000);
    return () => clearTimeout(t);
  }, [reloadConnection, reloadRecords, loadingConnection, loadingRecords]);

  async function action(path: string) {
    setBusy(true);
    setError("");
    try {
      await api.post("/integrations/vista/" + path);
      q.reload();
      rows.reload();
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : t("vista.actionFailed")));
    } finally {
      setBusy(false);
    }
  }

  const columns =
    kind === "products"
      ? [
          "name",
          "sku",
          "product_type",
          "price",
          "currency",
          "stock_quantity",
          "stock_status",
          "visible",
        ]
      : kind === "orders"
        ? [
            "order_number",
            "customer_id",
            "status",
            "payment_status",
            "total",
            "currency",
          ]
        : ["name", "email", "phone"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("vista.title")}</h1>
      {(q.error || error) && (
        <p role="alert" className="text-destructive">
          {translateError(q.error || error)}
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t("vista.sellerConnection")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {t("vista.independentNote")}
          </p>
          {q.loading && !q.data ? (
            <p role="status">{t("vista.loadingConnection")}</p>
          ) : !q.data?.data.enabled ? (
            <p>
              {t("vista.notConfigured")}
            </p>
          ) : (
            <>
              {c && (
                <>
                  <p>
                    <strong>{c.store_name}</strong> · {t("vista.vistaStore", { id: c.store_id })} · {t("status." + c.status)}
                  </p>
                  <p className="text-sm">
                    {t("vista.lastSync", { syncedAt: c.synced_at || t("common.never"), expiresAt: c.expires_at })}
                  </p>
                  {q.data?.data.processing?.worker_active === false && <p role="alert">{t("vista.workerUnavailable")}</p>}
                  {!c.synced_at && <p role="status">{t("vista.initialSync")}</p>}
                  {c.last_error && <p role="alert">{translateError(c.last_error)}</p>}
                </>
              )}
              {user?.permissions.includes("integrations.write") && (
                <>
                  <VistaSignIn connect />
                  {c && c.status !== "disconnected" && (
                    <div className="flex gap-2">
                      <Button
                        disabled={busy || c.status === "syncing"}
                        onClick={() => void action("sync")}
                      >
                        {t("vista.syncData")}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(t("vista.disconnectConfirm"))
                          )
                            void action("disconnect");
                        }}
                      >
                        {t("vista.disconnect")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          <p className="text-sm text-muted-foreground">
            {t("vista.publishNote")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("vista.recordsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["products", "orders", "customers"]
              .filter((k) =>
                user?.permissions.includes(
                  k === "products"
                    ? "products.read"
                    : k === "orders"
                      ? "orders.read"
                      : "customers.read",
                ),
              )
              .map((k) => (
                <Button
                  key={k}
                  variant={kind === k ? "default" : "outline"}
                  onClick={() => {
                    setKind(k);
                    setPage(1);
                  }}
                >
                  {t("vista." + k)}
                </Button>
              ))}
          </div>
          <Input
            aria-label={t("vista.searchPlaceholder")}
            placeholder={t("vista.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {rows.error && <p role="alert">{translateError(rows.error)}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("vista.colVistaId")}</TableHead>
                {columns.map((k) => (
                  <TableHead key={k}>{t("vista.field." + k)}</TableHead>
                ))}
                <TableHead>{t("vista.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.data?.data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.remote_id}</TableCell>
                  {columns.map((k) => (
                    <TableCell key={k}>
                      {displayVistaValue(r.payload[k])}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetail(r)}
                    >
                      {t("vista.details")}
                    </Button>
                    {kind === "customers" &&
                      user?.permissions.includes("imports.write") &&
                      user.permissions.includes("customers.write") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFirst("");
                            setLast("");
                            setReview(r);
                          }}
                        >
                          {t("vista.reviewCustomerImport")}
                        </Button>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!rows.data?.data.length && (
            <p>
              {rows.loading
                ? t("vista.loadingRecords")
                : t("vista.noRecords")}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              {t("vista.previous")}
            </Button>
            <span>
              {t("vista.pageOf", { page, total: rows.data?.last_page ?? 1 })}
            </span>
            <Button
              variant="outline"
              disabled={page >= (rows.data?.last_page ?? 1)}
              onClick={() => setPage(page + 1)}
            >
              {t("vista.next")}
            </Button>
          </div>
        </CardContent>
      </Card>
      {batch && (
        <p>
          {t("vista.contactPreviewCreated")}{" "}
          <Link className="underline" to={"/customer-imports/" + batch}>
            {t("vista.openImportReview", { id: batch })}
          </Link>
          .
        </p>
      )}
      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("vista.reviewTitle")}</DialogTitle>
          </DialogHeader>
          <p>
            {t("vista.reviewDescription", { name: String(review?.payload.name ?? "") })}
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!review || busy) return;
              setBusy(true);
              setError("");
              void api
                .post<{ data: { id: number } }>(
                  "/integrations/vista/customer-imports",
                  {
                    rows: [
                      { id: review.id, first_name: first, last_name: last },
                    ],
                  },
                )
                .then((r) => {
                  setBatch(r.data.id);
                  setReview(null);
                })
                .catch((e) => setError(translateError(e.message)))
                .finally(() => setBusy(false));
            }}
          >
            <Label htmlFor="vista-first">{t("vista.firstName")}</Label>
            <Input
              id="vista-first"
              required
              maxLength={100}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
            />
            <Label htmlFor="vista-last">{t("imports.lastName")}</Label>
            <Input
              id="vista-last"
              required
              maxLength={100}
              value={last}
              onChange={(e) => setLast(e.target.value)}
            />
            {error && <p role="alert">{translateError(error)}</p>}
            <Button disabled={busy}>{t("vista.createReview")}</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("vista.viewTitle", {
                  kind: detail?.kind ?? "",
                  remoteId: detail?.remote_id ?? "",
                })}
            </DialogTitle>
          </DialogHeader>
          <p>{t("vista.sourceInfo", { observedAt: detail?.observed_at ?? "" })}</p>
          <dl>
            {Object.entries(detail?.payload ?? {}).map(([k, v]) => (
              <div key={k} className="mb-3">
                <dt className="font-medium">{t("vista.field." + k)}</dt>
                <dd className="break-words">{displayVistaValue(v)}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}

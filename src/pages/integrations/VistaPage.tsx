import { useEffect, useState } from "react";
import { LoaderCircle, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { ApiError } from "../../../../contracts/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Page } from "../../../../contracts/customers";
import {
  displayVistaValue,
  type VistaStatus,
  type VistaRecord,
} from "../../../../contracts/vista";
import { VistaSignIn } from "./VistaAuth";
import { useTranslation } from "@/i18n";

type IdentityFix = {
  id: number;
  name: string;
  email: string | null;
  first_name: string;
  last_name: string;
  missing_fields: string[];
};

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
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [identityFixes, setIdentityFixes] = useState<IdentityFix[]>([]);
  const [editingIdentity, setEditingIdentity] = useState<IdentityFix | null>(null);
  const [identityDrafts, setIdentityDrafts] = useState<Record<number, { first_name: string; last_name: string }>>({});
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

  useEffect(() => { setSelectedCustomers([]); setIdentityFixes([]); setEditingIdentity(null); }, [kind, page, search]);

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

  const selectedCustomerRows = () => selectedCustomers.map((id) => ({
    id,
    first_name: identityDrafts[id]?.first_name,
    last_name: identityDrafts[id]?.last_name,
  }));

  async function importCustomers() {
    if (!selectedCustomers.length) return;
    setBusy(true);
    setError("");
    try {
      const choices = selectedCustomerRows();
      const preflight = await api.post<{ data: { needs_attention: IdentityFix[] } }>("/integrations/vista/customer-imports/requirements", { rows: choices });
      if (preflight.data.needs_attention.length) {
        setIdentityFixes(preflight.data.needs_attention);
        toast.warning(t("vista.customerDetailsNeeded"));
        return;
      }
      const result = await api.post<{ data: { id: number } }>("/integrations/vista/customer-imports", { automatic: true, rows: choices });
      setBatch(result.data.id);
      setSelectedCustomers([]);
      setIdentityFixes([]);
      setEditingIdentity(null);
      toast.success(t("vista.customerImportStarted"));
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "vista_customer_details_required") {
        const details = cause.data as { needs_attention?: IdentityFix[] } | undefined;
        if (details?.needs_attention?.length) {
          setIdentityFixes(details.needs_attention);
          toast.warning(t("vista.customerDetailsNeeded"));
          return;
        }
      }
      setError(translateError(cause instanceof Error ? cause.message : t("vista.actionFailed")));
    } finally { setBusy(false); }
  }

  function saveIdentityFix(fix: IdentityFix, first_name: string, last_name: string) {
    setIdentityDrafts((current) => ({ ...current, [fix.id]: { first_name: first_name.trim(), last_name: last_name.trim() } }));
    setEditingIdentity(null);
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
      <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
        <div><p className="font-semibold">{c && c.status !== "disconnected" ? c.store_name : t("vista.notConnected")}</p><p className="text-sm text-muted-foreground">{c && c.status !== "disconnected" ? t("vista.connectedDescription") : t("vista.connectDescription")}</p></div>
        {q.data?.data.enabled && user?.permissions.includes("integrations.write") && (c && c.status !== "disconnected" ? <Button variant="outline" disabled={busy} onClick={() => { if (window.confirm(t("vista.disconnectConfirm"))) void action("disconnect"); }}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : null}{t("vista.disconnect")}</Button> : <VistaSignIn connect />)}
      </CardContent></Card>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{t("vista.recordsTitle")}</CardTitle>{kind === "customers" && user?.permissions.includes("imports.write") && user.permissions.includes("customers.write") && <Button disabled={busy || !selectedCustomers.length} onClick={() => void importCustomers()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <UsersRound className="size-4" />}{t("vista.importCustomers", { count: selectedCustomers.length })}</Button>}</div>
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
                {kind === "customers" && user?.permissions.includes("imports.write") && user.permissions.includes("customers.write") && <TableHead><input type="checkbox" aria-label={t("vista.selectAllCustomers")} checked={!!rows.data?.data.length && rows.data.data.every((record) => selectedCustomers.includes(record.id))} onChange={(event) => setSelectedCustomers(event.target.checked ? [...new Set([...selectedCustomers, ...(rows.data?.data.map((record) => record.id) ?? [])])] : selectedCustomers.filter((id) => !rows.data?.data.some((record) => record.id === id)))} /></TableHead>}
                {columns.map((k) => (
                  <TableHead key={k}>{t("vista.field." + k)}</TableHead>
                ))}
                <TableHead>{t("vista.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.data?.data.map((r) => (
                <TableRow key={r.id}>
                  {kind === "customers" && user?.permissions.includes("imports.write") && user.permissions.includes("customers.write") && <TableCell><input type="checkbox" aria-label={String(r.payload.name ?? r.id)} checked={selectedCustomers.includes(r.id)} onChange={(event) => setSelectedCustomers(event.target.checked ? [...new Set([...selectedCustomers, r.id])] : selectedCustomers.filter((id) => id !== r.id))} /></TableCell>}
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
      {batch && <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5"><p className="font-medium">{t("vista.customerImportResult")}</p><Button asChild variant="outline"><Link to={"/customer-imports/" + batch}>{t("vista.viewImportResult")}</Link></Button></CardContent></Card>}
      <Dialog open={identityFixes.length > 0} onOpenChange={(open) => { if (!open) { setIdentityFixes([]); setEditingIdentity(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("vista.customerDetailsTitle")}</DialogTitle>
            <DialogDescription>{t("vista.customerDetailsDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {identityFixes.map((fix) => {
              const draft = identityDrafts[fix.id];
              return <div key={fix.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{fix.name}</p>{fix.email && <p className="text-sm text-muted-foreground">{fix.email}</p>}<p className="text-sm text-destructive">{t("vista.missingFields", { fields: fix.missing_fields.map((field) => t("vista." + field)).join(", ") })}</p></div><Button variant="outline" onClick={() => setEditingIdentity({ ...fix, first_name: draft?.first_name ?? fix.first_name, last_name: draft?.last_name ?? fix.last_name })}>{t("vista.fixCustomer")}</Button></div>;
            })}
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setIdentityFixes([]); setEditingIdentity(null); }}>{t("common.cancel")}</Button><Button disabled={busy} onClick={() => void importCustomers()}>{busy && <LoaderCircle className="size-4 animate-spin" />}{t("vista.importCorrectedCustomers")}</Button></div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editingIdentity} onOpenChange={(open) => !open && setEditingIdentity(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("vista.fixCustomer")}</DialogTitle><DialogDescription>{editingIdentity?.name}</DialogDescription></DialogHeader>
          {editingIdentity && <IdentityEditor fix={editingIdentity} onSave={saveIdentityFix} onCancel={() => setEditingIdentity(null)} t={t} />}
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

function IdentityEditor({ fix, onSave, onCancel, t }: { fix: IdentityFix; onSave: (fix: IdentityFix, first_name: string, last_name: string) => void; onCancel: () => void; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const [firstName, setFirstName] = useState(fix.first_name);
  const [lastName, setLastName] = useState(fix.last_name);
  const canSave = firstName.trim().length > 0 && lastName.trim().length > 0;
  return <div className="space-y-4"><div className="grid gap-2"><Label htmlFor="vista-import-first-name">{t("vista.first_name")}</Label><Input id="vista-import-first-name" value={firstName} maxLength={100} onChange={(event) => setFirstName(event.target.value)} /></div><div className="grid gap-2"><Label htmlFor="vista-import-last-name">{t("vista.last_name")}</Label><Input id="vista-import-last-name" value={lastName} maxLength={100} onChange={(event) => setLastName(event.target.value)} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>{t("common.cancel")}</Button><Button disabled={!canSave} onClick={() => onSave(fix, firstName, lastName)}>{t("common.save")}</Button></div></div>;
}

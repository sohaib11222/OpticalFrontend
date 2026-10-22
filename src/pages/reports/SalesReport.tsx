import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import CustomerPicker from "@/components/customer-picker";
import ReportPeriod from "./report-period";
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
import { Choice, Paging } from "@/pages/eCommerce/catalog-shared";
import { wallTime } from "../../../../contracts/timezone";
import {
  amount,
  type SalesSummary,
  type SaleEntry,
} from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
export default function SalesReport() {
  const { user } = useSession();
  const { t, translateError, formatDateTime } = useTranslation();
  const [params] = useSearchParams();
  const zone = user?.shop?.timezone ?? "UTC";
  const today = wallTime(new Date().toISOString(), zone).slice(0, 10);
  const [period, setPeriod] = useState({
    from: params.get("from") ?? today.slice(0, 8) + "01",
    to: params.get("to") ?? today,
  });
  const [page, setPage] = useState(1);
  const [customer, setCustomer] = useState<number | null>(null);
  const [kind, setKind] = useState("all");
  const [exportError, setExportError] = useState("");
  const [busy, setBusy] = useState(false);
  const query = new URLSearchParams({ ...period, page: String(page) });
  if (customer) query.set("customer_id", String(customer));
  if (kind !== "all") query.set("kind", kind);
  const r = useApiResource<{
    summary: SalesSummary[];
    entries: Page<SaleEntry>;
  }>("/reports/sales?" + query);
  const download = async () => {
    setBusy(true);
    setExportError("");
    try {
      const response = await fetch("/api/v1/reports/sales/export?" + query, {
        credentials: "same-origin",
        headers: { Accept: "text/csv" },
      });
      if (!response.ok) {
        const e = await response.json();
        throw new Error(e.message || t("reports.exportFailed"));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales-" + period.from + "-" + period.to + ".csv";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setExportError(
        e instanceof Error ? translateError(e.message) : t("reports.exportFailed"),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.salesReport")}</h1>
          <p className="text-muted-foreground">
            {t("reports.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard">{t("nav.dashboard")}</Link>
          </Button>
          {user?.permissions.includes("reports.export") && (
            <Button
              disabled={busy || r.loading || !r.data}
              onClick={() => void download()}
            >
              {t("reports.export")}
            </Button>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="p-6 space-y-5">
          <ReportPeriod
            value={period}
            zone={zone}
            onChange={(v) => {
              setPeriod(v);
              setPage(1);
            }}
          />
          <div className="grid gap-5 md:grid-cols-3">
            <CustomerPicker
              id="report-customer"
              value={customer}
              onChange={(v) => {
                setCustomer(v);
                setPage(1);
              }}
            />
            <Choice
              label={t("reports.entryType")}
              value={kind}
              options={[
                ["all", t("reports.allEntries")],
                ["sale", t("dashboard.series.sales")],
                ["reversal", t("dashboard.series.reversals")],
              ]}
              onChange={(v) => {
                setKind(v);
                setPage(1);
              }}
            />
            <div className="self-end">
              <Button variant="outline" onClick={r.reload}>
                {t("reports.refresh")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {(r.error || exportError) && (
        <p role="alert" className="text-destructive">
          {r.error || exportError}
        </p>
      )}
      {r.loading && <p role="status">{t("reports.loading")}</p>}
      {r.data?.summary.map((s) => (
        <div key={s.currency} className="grid gap-6 md:grid-cols-3">
          {(
            [
              ["dashboard.series.sales", s.sales_minor],
              ["dashboard.series.reversals", s.reversals_minor],
              ["dashboard.series.net", s.net_minor],
            ] as const
          ).map(([labelKey, value]) => (
            <Card key={labelKey}>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t(labelKey)}</p>
                <p className="text-2xl font-semibold">
                  {amount(Number(value), s.currency, s.price_decimals)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.postedEntries")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  t("nav.orders"),
                  t("reports.entryType"),
                  t("reports.postedIn", { zone }),
                  t("common.amount"),
                  t("common.actor"),
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
                  <TableCell>
                    {t("status." + s.kind)} #{s.id}
                  </TableCell>
                  <TableCell>{formatDateTime(s.created_at, zone)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {s.kind === "reversal" ? "−" : ""}
                    {amount(s.amount_minor, s.currency, s.price_decimals)}
                  </TableCell>
                  <TableCell>{s.actor?.name}</TableCell>
                  <TableCell className="whitespace-pre-wrap break-words">
                    {s.reason || t("reports.orderFulfilled")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!r.loading && !r.data?.entries.data.length && (
            <p>{t("reports.noEntries")}</p>
          )}
          <Paging
            data={r.data?.entries ?? null}
            page={page}
            loading={r.loading}
            onChange={setPage}
          />
          <p className="text-sm text-muted-foreground">
            {t("reports.footnote")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

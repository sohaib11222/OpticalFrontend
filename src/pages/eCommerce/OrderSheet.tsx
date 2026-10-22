import { Link, useParams } from "react-router-dom";
import { useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { amount, type Order } from "../../../../contracts/commerce";
export default function OrderSheet() {
  const { t, translateError, formatDateTime } = useTranslation();
  const { id } = useParams();
  const { user } = useSession();
  const r = useApiResource<{ data: Order }>("/orders/" + id + "?purpose=print");
  const o = r.data?.data;
  if (!o)
    return (
      <p role={r.error ? "alert" : "status"}>
        {r.error ? translateError(r.error) : t("orders.loadingSheet")}
      </p>
    );
  return (
    <>
      <style>
        {
          "@media print {body * {visibility:hidden} #order-sheet,#order-sheet * {visibility:visible} #order-sheet {position:absolute;left:0;top:0;width:100%;color:#000;background:#fff;padding:20px} tr {break-inside:avoid}}"
        }
      </style>
      <div className="flex gap-3 mb-5 print:hidden">
        <Button onClick={() => window.print()}>
          {t("orders.printSavePdf")}
        </Button>
        <Button variant="outline" asChild>
          <Link to={"/orders/" + o.id}>{t("orders.backToOrder")}</Link>
        </Button>
      </div>
      <article
        id="order-sheet"
        className="rounded-lg border p-6 space-y-6 bg-card"
      >
        <header>
          <h1 className="text-2xl font-semibold">
            {user?.shop?.name} {t("orders.sheetSuffix")}
          </h1>
          <p>
            {o.number} · {t("status." + o.status)}
          </p>
          <p>
            {t("orders.createdLabel")}{" "}
            {formatDateTime(o.created_at, user?.shop?.timezone ?? "UTC")}
          </p>
        </header>
        <section>
          <h2 className="font-semibold">{t("orders.customerTitle")}</h2>
          <p>
            {o.customer_snapshot.first_name} {o.customer_snapshot.last_name}
          </p>
          <p>
            {[
              o.customer_snapshot.street_address,
              o.customer_snapshot.city,
              o.customer_snapshot.postal_code,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p>
            {o.customer_snapshot.email} {o.customer_snapshot.phone}
          </p>
          {o.prescription_id && (
            <p>{t("orders.prescriptionNumber", { id: o.prescription_id })}</p>
          )}
        </section>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("orders.colProductSku")}</TableHead>
              <TableHead>{t("orders.colQuantity")}</TableHead>
              <TableHead>{t("orders.colUnitPrice")}</TableHead>
              <TableHead>{t("common.total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {o.items.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  {i.name} · {i.sku}
                  <p>
                    {i.brand} · {i.model} · {i.color}
                  </p>
                </TableCell>
                <TableCell>{i.quantity}</TableCell>
                <TableCell>
                  {amount(i.unit_price_minor, o.currency, o.price_decimals)}
                </TableCell>
                <TableCell>
                  {amount(i.total_minor, o.currency, o.price_decimals)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-right font-semibold">
          {t("orders.orderTotalLabel")}{" "}
          {amount(o.total_minor, o.currency, o.price_decimals)}
        </p>
        {o.notes && <p className="whitespace-pre-wrap">{o.notes}</p>}
        {o.sales.map((s) => (
          <p key={s.id}>
            {s.kind === "sale"
              ? t("orders.saleRecorded")
              : t("orders.saleReversed")}
            : {amount(s.amount_minor, s.currency, s.price_decimals)} ·{" "}
            {new Date(s.created_at).toLocaleDateString()}{" "}
            {s.reason && " · " + s.reason}
          </p>
        ))}
        <footer className="text-sm border-t pt-4">
          {t("orders.sheetFooter")}
        </footer>
      </article>
    </>
  );
}

import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Users, PackageSearch, CalendarDays } from "lucide-react";
import { useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
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
import ReportPeriod from "@/pages/reports/report-period";
import SalesAnalysisCard from "./SalesAnalysisCard";
import { wallTime } from "../../../../../contracts/timezone";
import {
  amount,
  type SalesSummary,
  type StockBalance,
  type Order,
} from "../../../../../contracts/commerce";
type Dashboard = {
  period: { from: string; to: string; timezone: string };
  currency: string | null;
  price_decimals: number;
  summary: SalesSummary[];
  trend_available: boolean;
  daily: {
    date: string;
    sales_minor: number;
    reversals_minor: number;
    net_minor: number;
  }[];
  counts: Record<string, number>;
  low_stock: StockBalance[];
  recent_orders: Order[];
};
export default function EcommerceDashboard() {
  const { user } = useSession();
  const { t } = useTranslation();
  if (user?.permissions.includes("reports.read")) return <ShopDashboard />;
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">{t("nav.dashboard")}</h1><OperationsWorkspace module="daily" compact /></div>;
}
function ShopDashboard() {
  const { user } = useSession();
  const { t } = useTranslation();
  const zone = user?.shop?.timezone ?? "UTC";
  const today = wallTime(new Date().toISOString(), zone).slice(0, 10);
  const [period, setPeriod] = useState({
    from: today.slice(0, 8) + "01",
    to: today,
  });
  const query = new URLSearchParams(period);
  const r = useApiResource<Dashboard>("/dashboard?" + query);
  const d = r.data;
  const cards = [
    [
      "dashboard.card.confirmedOrders",
      "confirmed_orders",
      "/orders?status=confirmed",
      ShoppingBag,
      "bg-gradient-to-tr from-[#ee0979] to-[#ff6a00]",
    ],
    [
      "dashboard.card.activeCustomers",
      "active_customers",
      "/customers",
      Users,
      "bg-gradient-to-tr from-[#17ad37] to-[#98ec2d]",
    ],
    [
      "dashboard.card.lowStockProducts",
      "low_stock_products",
      "/inventory?low=1",
      PackageSearch,
      "bg-gradient-to-tr from-[#7928ca] to-[#ff0080]",
    ],
    [
      "dashboard.card.todayAppointments",
      "today_appointments",
      "/agenda",
      CalendarDays,
      "bg-gradient-to-tr from-[#00c6fb] to-[#005bea]",
    ],
  ] as const;
  return (
    <div className="ecommerce-dashboard space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">
            {user?.shop?.name} · {t("dashboard.dailyOperations")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={"/reports/sales?" + query}>{t("nav.salesReport")}</Link>
          </Button>
          <Button onClick={r.reload} variant="outline" disabled={r.loading}>
            {t("dashboard.refresh")}
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-5">
          <ReportPeriod value={period} zone={zone} onChange={setPeriod} />
        </CardContent>
      </Card>
      {r.error && (
        <p role="alert" className="text-destructive">
          {r.error}
        </p>
      )}
      {r.loading && <p role="status">{t("dashboard.loading")}</p>}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([labelKey, key, to, Icon, gradient]) => (
          <Card key={key}>
            <CardContent className="flex justify-between items-center p-6">
              <div>
                <p className="text-muted-foreground">{t(labelKey)}</p>
                <p className="text-2xl font-semibold">
                  {d?.counts[key] ?? t("common.dash")}
                </p>
                <Link className="text-sm underline" to={to}>
                  {t("common.viewDetails")}
                </Link>
              </div>
              <div className={"rounded-xl p-3 text-white " + gradient}>
                <Icon />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {(d?.summary.length
          ? d.summary
          : [
              {
                currency: d?.currency ?? t("dashboard.currencyNotSet"),
                price_decimals: d?.price_decimals ?? 2,
                sales_minor: 0,
                reversals_minor: 0,
                net_minor: 0,
              },
            ]
        ).flatMap((s) =>
          (
            [
              ["dashboard.recordedSales", s.sales_minor],
              ["dashboard.saleReversals", s.reversals_minor],
              ["dashboard.netSales", s.net_minor],
            ] as const
          ).map(([labelKey, value]) => (
            <Card key={s.currency + labelKey}>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t(labelKey)}</p>
                <p className="text-2xl font-semibold">
                  {amount(Number(value), s.currency, s.price_decimals)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.selectedPostingDates")}
                </p>
              </CardContent>
            </Card>
          )),
        )}
      </div>
      <OperationsWorkspace module="daily" compact />
      {d && (
        <SalesAnalysisCard
          daily={d.daily}
          currency={d.currency ?? t("dashboard.shopCurrency")}
          decimals={d.price_decimals}
          available={d.trend_available}
        />
      )}
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader>
            <CardTitle>{t("dashboard.recentOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("nav.orders")}</TableHead>
                  <TableHead>{t("nav.customers")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d?.recent_orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link className="underline" to={"/orders/" + o.id}>
                        {o.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {o.customer.first_name} {o.customer.last_name}
                    </TableCell>
                    <TableCell>{t("status." + o.status)}</TableCell>
                    <TableCell>
                      {amount(o.total_minor, o.currency, o.price_decimals)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {d && !d.recent_orders.length && <p>{t("dashboard.noOrders")}</p>}
          </CardContent>
        </Card>
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader>
            <CardTitle>{t("dashboard.lowStock")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d?.low_stock.map((b) => (
              <div key={b.id} className="border-b pb-3">
                <Link
                  className="font-medium underline"
                  to={"/products/" + b.product_id}
                >
                  {b.product?.name}
                </Link>
                <p className="text-sm">
                  {t("dashboard.availableThreshold", {
                    available: b.available,
                    threshold: b.product?.low_stock_threshold ?? 0,
                  })}
                </p>
              </div>
            ))}
            {d && !d.low_stock.length && (
              <p>{t("dashboard.noLowStock")}</p>
            )}
            <Button asChild variant="outline">
              <Link to="/inventory?low=1">{t("dashboard.viewAllLowStock")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      {d && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.operationalSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <p>
              {t("dashboard.newCustomers", {
                count: d.counts.new_customers ?? 0,
              })}
            </p>
            <p>
              {t("dashboard.newOrders", {
                count: d.counts.period_orders ?? 0,
              })}
            </p>
            <p>
              {t("dashboard.visitsInPeriod", {
                count: d.counts.period_appointments ?? 0,
              })}
            </p>
            <p>
              {t("dashboard.activeProducts", {
                count: d.counts.active_products ?? 0,
              })}
            </p>
            <p>
              {t("dashboard.unitsOnHand", {
                count: d.counts.on_hand_units ?? 0,
              })}
            </p>
            <p>
              {t("dashboard.unitsReserved", {
                count: d.counts.reserved_units ?? 0,
              })}
            </p>
          </CardContent>
        </Card>
      )}
      <p className="text-sm text-muted-foreground">
        {t("dashboard.footnote")}
      </p>
    </div>
  );
}

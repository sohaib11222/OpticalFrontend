import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTranslation } from "@/i18n";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
export default function SalesAnalysisCard({
  daily,
  currency,
  decimals,
  available,
}: {
  daily: {
    date: string;
    sales_minor: number;
    reversals_minor: number;
    net_minor: number;
  }[];
  currency: string;
  decimals: number;
  available: boolean;
}) {
  const { t } = useTranslation();
  const data = daily.map((d) => ({
    date: d.date,
    sales: d.sales_minor / 10 ** decimals,
    reversals: d.reversals_minor / 10 ** decimals,
    net: d.net_minor / 10 ** decimals,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.salesActivity")}</CardTitle>
        <CardDescription>
          {t("dashboard.salesActivityDesc", { currency })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {available ? (
          <ChartContainer
            config={{
              sales: { label: t("dashboard.series.sales"), color: "#10b981" },
              reversals: {
                label: t("dashboard.series.reversals"),
                color: "#f97316",
              },
              net: { label: t("dashboard.series.net"), color: "#3b82f6" },
            }}
            className="h-72 w-full"
          >
            <AreaChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => String(v).slice(5)}
                minTickGap={28}
              />
              <YAxis width={65} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="sales"
                stroke="var(--color-sales)"
                fill="var(--color-sales)"
                fillOpacity={0.1}
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="reversals"
                stroke="var(--color-reversals)"
                fill="var(--color-reversals)"
                fillOpacity={0.1}
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="net"
                stroke="var(--color-net)"
                fill="var(--color-net)"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <p>{t("dashboard.chartUnavailable", { count: 50001 })}</p>
        )}
      </CardContent>
    </Card>
  );
}

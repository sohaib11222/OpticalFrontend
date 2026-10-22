import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import SourceLinks from "@/pages/integrations/SourceLinks";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { StockBalance } from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
export default function Inventory() {
  const { t, translateError } = useTranslation();
  const [params] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [low, setLow] = useState(params.get("low") === "1" ? "low" : "all");
  const r = useApiResource<Page<StockBalance>>(
    "/inventory?" +
      new URLSearchParams({
        search,
        page: String(page),
        low: low === "low" ? "1" : "0",
      }),
  );
  return (
    <div className="space-y-6">
      <SourceLinks kind="products" />
      <div className="flex justify-between gap-4">
        <div>
          <OperationsWorkspace module="output-stock" />
          <h1 className="text-2xl font-semibold">{t("nav.inventory")}</h1>
          <p className="text-muted-foreground">
            {t("products.availableEquals")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/products">{t("nav.products")}</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("products.stockBalances")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-48">
              <Label htmlFor="inventory-search">
                {t("products.searchInventory")}
              </Label>
              <Input
                id="inventory-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Choice
              label={t("products.inventoryFilter")}
              value={low}
              options={[
                ["all", t("products.allBalances")],
                ["low", t("products.activeLowStock")],
              ]}
              onChange={(v) => {
                setLow(v);
                setPage(1);
              }}
            />
            <Button variant="outline" disabled={r.loading} onClick={r.reload}>
              {t("common.refresh")}
            </Button>
          </div>
          {r.error && <p role="alert">{translateError(r.error)}</p>}
          {r.loading && (
            <p role="status">{t("products.loadingStockBalances")}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  t("products.colProductSku"),
                  t("common.status"),
                  t("products.onHand"),
                  t("products.reserved"),
                  t("products.availableLabel"),
                  t("products.threshold"),
                  t("common.actions"),
                ].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.data?.data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link
                      className="font-medium underline"
                      to={"/products/" + b.product_id}
                    >
                      {b.product?.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {b.product?.sku}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {b.product ? t("status." + b.product.status) : null}
                    </Badge>
                  </TableCell>
                  <TableCell>{b.on_hand}</TableCell>
                  <TableCell>{b.reserved}</TableCell>
                  <TableCell>
                    {b.available}
                    {b.product &&
                      b.available <= b.product.low_stock_threshold && (
                        <Badge className="ml-2" variant="outline">
                          {t("products.lowBadge")}
                        </Badge>
                      )}
                  </TableCell>
                  <TableCell>{b.product?.low_stock_threshold}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link to={"/products/" + b.product_id}>
                        {t("products.stockHistory")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!r.loading && r.data?.data.length === 0 && (
            <p>{t("products.noMatchingBalances")}</p>
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

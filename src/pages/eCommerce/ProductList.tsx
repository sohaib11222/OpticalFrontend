import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import type { VistaStatus } from "../../../../contracts/vista";
import SourceLinks from "@/pages/integrations/SourceLinks";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Grid2X2, List } from "lucide-react";
import { useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
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
import { CategoryPicker, Choice, Paging, ProductPhoto } from "./catalog-shared";
import { money, type Product } from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
export default function ProductList({ grid = false }: { grid?: boolean }) {
  const { t, translateError } = useTranslation();
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const [sort, setSort] = useState("name");
  const [category, setCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const q = new URLSearchParams({ search, sort, page: String(page) });
  if (status !== "all") q.set("status", status);
  if (stock !== "all") q.set("stock", stock);
  if (category) q.set("category_id", String(category));
  const r = useApiResource<Page<Product>>("/products?" + q);
  const vista = useApiResource<VistaStatus>(
    user?.permissions.includes("integrations.read")
      ? "/integrations/vista"
      : "/auth/vista/config",
  );
  const canPublish =
    user?.permissions.includes("integrations.publish") &&
    vista.data?.data.connection &&
    vista.data.data.connection.status !== "disconnected";
  return (
    <div className="space-y-6">
      <SourceLinks kind="products" />
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <OperationsWorkspace module="output-products" />
          <h1 className="text-2xl font-semibold">{t("nav.products")}</h1>
          <p className="text-muted-foreground">
            {t("products.pageSubtitle")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline">
            <Link to="/product-categories">{t("nav.categories")}</Link>
          </Button>
          {user?.permissions.includes("stock.read") && (
            <Button asChild variant="outline">
              <Link to="/inventory">{t("nav.inventory")}</Link>
            </Button>
          )}
          {user?.permissions.includes("products.write") && user.permissions.includes("products.create") && (
            <Button asChild>
              <Link to="/products/new">
                <Plus className="h-4 w-4" />
                {t("products.addProduct")}
              </Link>
            </Button>
          )}
        </div>
      </div>
      {!user?.shop?.currency && (
        <Card>
          <CardContent className="p-5">
            {t("products.currencyWarningStart")}{" "}
            <Link className="underline" to="/shop/settings">
              {t("nav.shopSettings")}
            </Link>{" "}
            {t("products.currencyWarningEnd")}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-row justify-between flex-wrap gap-3 border-b">
          <div>
            <CardTitle>{t("products.catalogTitle")}</CardTitle>
            <CardDescription>
              {t("products.matchingProducts", { count: r.data?.total ?? 0 })}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              variant={!grid ? "default" : "outline"}
              aria-label={t("products.listViewAria")}
            >
              <Link to="/products">
                <List />
              </Link>
            </Button>
            <Button
              asChild
              variant={grid ? "default" : "outline"}
              aria-label={t("products.gridViewAria")}
            >
              <Link to="/products/grid">
                <Grid2X2 />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="product-search">{t("products.searchProducts")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4" />
                <Input
                  id="product-search"
                  className="pl-9"
                  placeholder={t("products.searchPlaceholder")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Choice
                  label={t("products.statusFilterLabel")}
                  value={status}
                  options={[
                    ["all", t("products.allStatuses")],
                    ["active", t("status.active")],
                    ["draft", t("status.draft")],
                    ["archived", t("status.archived")],
                  ]}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                />
                <Choice
                  label={t("products.stockFilterLabel")}
                  value={stock}
                  options={[
                    ["all", t("products.allStock")],
                    ["available", t("products.available")],
                    ["low", t("products.lowStock")],
                    ["out", t("products.outOfStock")],
                  ]}
                  onChange={(v) => {
                    setStock(v);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <CategoryPicker
              all
              value={category}
              onChange={(v) => {
                setCategory(v);
                setPage(1);
              }}
            />
            <div className="space-y-3">
              <Choice
                label={t("products.sortLabel")}
                value={sort}
                options={[
                  ["name", t("products.sortName")],
                  ["newest", t("products.sortNewest")],
                  ["price_asc", t("products.sortPriceAsc")],
                  ["price_desc", t("products.sortPriceDesc")],
                ]}
                onChange={(v) => {
                  setSort(v);
                  setPage(1);
                }}
              />
              <Button variant="outline" onClick={r.reload} disabled={r.loading}>
                {t("common.refresh")}
              </Button>
            </div>
          </div>
          {r.error && (
            <p role="alert" className="text-destructive">
              {translateError(r.error)}
            </p>
          )}
          {r.loading && <p role="status">{t("products.loadingProducts")}</p>}
          {grid ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {r.data?.data.map((p) => (
                <Card key={p.id}>
                  <CardContent className="space-y-3 p-5">
                    <ProductPhoto product={p} large />
                    <div className="flex justify-between">
                      <Badge variant="outline">
                        {t("status." + p.status)}
                      </Badge>
                      <span>{money(p)}</span>
                    </div>
                    <Link
                      className="font-semibold underline"
                      to={"/products/" + p.id}
                    >
                      {p.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {p.brand} · {p.model} · {p.color}
                            {p.parent_product_id && <> · {t("ops.variant.variation")} · {Object.values(p.variation_attributes ?? {}).join(" / ")}</>}
                    </p>
                    <p>
                      {p.sku} · {p.category.name}
                    </p>
                    <p>
                      {t("products.availableReserved", {
                        available: p.balance.available,
                        reserved: p.balance.reserved,
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    t("products.colProduct"),
                    t("products.colCategory"),
                    t("products.colStock"),
                    t("products.colSku"),
                    t("products.colPrice"),
                    t("common.status"),
                    t("common.actions"),
                  ].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.data?.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductPhoto product={p} />
                        <div className="min-w-36">
                          <Link
                            className="font-medium underline"
                            to={"/products/" + p.id}
                          >
                            {p.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {p.brand} · {p.model} · {p.color}
                            {p.parent_product_id && <> · {t("ops.variant.variation")} · {Object.values(p.variation_attributes ?? {}).join(" / ")}</>}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{p.category.name}</TableCell>
                    <TableCell>
                      <p>
                        {t("products.availableCount", {
                          available: p.balance.available,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("products.reservedOnHand", {
                          reserved: p.balance.reserved,
                          onHand: p.balance.on_hand,
                        })}
                      </p>
                      {p.balance.available <= p.low_stock_threshold && (
                        <Badge variant="outline">{t("products.lowStock")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {money(p)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t("status." + p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link to={"/products/" + p.id}>
                          {t("products.viewManage")}
                        </Link>
                      </Button>
                      {canPublish && (
                        <Button asChild variant="outline" size="sm">
                          <Link to={"/products/" + p.id + "#vista-publication"}>
                            {t("products.uploadToVista")}
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!r.loading && r.data?.data.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">
              {t("products.noMatchingProducts")}
            </p>
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

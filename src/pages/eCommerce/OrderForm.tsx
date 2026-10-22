import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import CustomerPicker from "@/components/customer-picker";
import OpticalRecordPicker from "@/components/optical-record-picker";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Paging } from "./catalog-shared";
import {
  amount,
  type Order,
  type Product,
} from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
import { ApiError } from "../../../../contracts/session";
type Line = {
  product_id: number;
  name: string;
  sku: string;
  quantity: number;
  price_minor: number;
};
type Values = {
  customer_id: number | null;
  prescription_id: number | null;
  notes: string;
  items: Line[];
};
export default function OrderForm() {
  const { id } = useParams();
  return id ? <EditOrder id={id} /> : <DraftEditor />;
}
function EditOrder({ id }: { id: string }) {
  const { t, translateError } = useTranslation();
  const r = useApiResource<{ data: Order }>("/orders/" + id);
  return r.data ? (
    <DraftEditor order={r.data.data} />
  ) : (
    <p role={r.error ? "alert" : "status"}>
      {r.error ? translateError(r.error) : t("orders.loadingOrder")}
    </p>
  );
}
function DraftEditor({ order }: { order?: Order }) {
  const { t, translateError } = useTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialId = Number(params.get("customer_id"));
  const [key] = useState(() => crypto.randomUUID());
  const [error, setMessage] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const f = useForm<Values>({
    defaultValues: {
      customer_id:
        order?.customer_id ??
        (Number.isSafeInteger(initialId) && initialId > 0 ? initialId : null),
      prescription_id: order?.prescription_id ?? null,
      notes: order?.notes ?? "",
      items:
        order?.items.map((i) => ({
          product_id: i.product_id,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          price_minor: i.unit_price_minor,
        })) ?? [],
    },
  });
  const list = useFieldArray({ control: f.control, name: "items" });
  const customer = useWatch({ control: f.control, name: "customer_id" });
  const items = useWatch({ control: f.control, name: "items" });
  if (
    !user?.permissions.includes("orders.write") ||
    !user.permissions.includes(order ? "orders.edit" : "orders.create")
  )
    return <p role="alert">{t("error.cannotEditOrders")}</p>;
  if (order && order.status !== "draft")
    return (
      <p>
        {t("orders.onlyDrafts")}{" "}
        <Link className="underline" to={"/orders/" + order.id}>
          {t("orders.viewOrder")}
        </Link>
      </p>
    );
  return (
    <form
      className="space-y-6"
      onSubmit={f.handleSubmit(async (v) => {
        setMessage("");
        setErrorKey(null);
        if (!v.items.length) {
          setErrorKey("orders.addProduct");
          return;
        }
        try {
          const r = await api.request<{ data: Order }>(
            "/orders" + (order ? "/" + order.id : ""),
            {
              method: order ? "PATCH" : "POST",
              body: JSON.stringify({
                ...v,
                items: v.items.map((i) => ({
                  product_id: i.product_id,
                  quantity: i.quantity,
                })),
                ...(order ? { version: order.version } : { creation_key: key }),
              }),
            },
          );
          navigate("/orders/" + r.data.id);
        } catch (e) {
          setMessage(
            e instanceof Error
              ? translateError(e.message)
              : t("orders.saveFailed"),
          );
          if (e instanceof ApiError)
            for (const [k, m] of Object.entries(e.errors))
              f.setError(k as keyof Values, {
                message: translateError(m[0]),
              });
        }
      })}
    >
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {order
              ? t("orders.editOrder", { number: order.number })
              : t("orders.newOrder")}
          </h1>
          <p className="text-muted-foreground">{t("orders.draftHint")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={order ? "/orders/" + order.id : "/orders"}>
              {t("common.cancel")}
            </Link>
          </Button>
          <Button type="submit" disabled={f.formState.isSubmitting}>
            {t("orders.saveDraft")}
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {errorKey && (
        <p role="alert" className="text-destructive">
          {t(errorKey)}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.itemsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductSearch
                selected={items.map((i) => i.product_id)}
                onAdd={(p) =>
                  list.append({
                    product_id: p.id,
                    name: p.name,
                    sku: p.sku,
                    price_minor: p.price_minor,
                    quantity: 1,
                  })
                }
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("orders.colProduct")}</TableHead>
                    <TableHead>{t("orders.colQuantity")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.fields.map((line, index) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        {line.name}
                        <p className="text-sm text-muted-foreground">
                          {line.sku}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label={t("orders.quantityFor", {
                            sku: line.sku,
                          })}
                          className="w-28"
                          type="number"
                          min={1}
                          max={1000000}
                          step={1}
                          {...f.register(
                            ("items." +
                              index +
                              ".quantity") as "items.0.quantity",
                            {
                              valueAsNumber: true,
                              min: {
                                value: 1,
                                message: t("orders.qtyPositive"),
                              },
                              max: {
                                value: 1000000,
                                message: t("orders.qtyTooLarge"),
                              },
                              validate: (v) =>
                                Number.isInteger(v) || t("orders.qtyWhole"),
                            },
                          )}
                        />
                        {f.formState.errors.items?.[index]?.quantity && (
                          <p role="alert">
                            {f.formState.errors.items[index]?.quantity?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => list.remove(index)}
                        >
                          {t("orders.removeSku", { sku: line.sku })}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!items.length && (
                <p className="text-muted-foreground">
                  {t("orders.searchToStart")}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {t("orders.catalogPricesNote")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.notesFieldTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="order-notes">{t("orders.notesOptional")}</Label>
              <Textarea
                id="order-notes"
                maxLength={5000}
                rows={4}
                {...f.register("notes")}
              />
              {f.formState.errors.notes && (
                <p role="alert">{f.formState.errors.notes.message}</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("orders.customerTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Controller
                control={f.control}
                name="customer_id"
                rules={{ required: t("orders.chooseCustomer") }}
                render={({ field }) => (
                  <CustomerPicker
                    id="order-customer"
                    required
                    value={field.value}
                    initial={order?.customer}
                    onChange={(id) => {
                      field.onChange(id);
                      f.setValue("prescription_id", null);
                    }}
                  />
                )}
              />
              {f.formState.errors.customer_id && (
                <p role="alert">{f.formState.errors.customer_id.message}</p>
              )}
            </CardContent>
          </Card>
          {customer && user.permissions.includes("optical.read") && (
            <Card>
              <CardHeader>
                <CardTitle>{t("orders.prescriptionTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  control={f.control}
                  name="prescription_id"
                  render={({ field }) => (
                    <OpticalRecordPicker
                      key={customer}
                      customerId={customer}
                      value={field.value}
                      onChange={field.onChange}
                      finalized
                      kinds={["prescription"]}
                      label={t("orders.linkedPrescriptionOptional")}
                    />
                  )}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}
function ProductSearch({
  selected,
  onAdd,
}: {
  selected: number[];
  onAdd: (p: Product) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const r = useApiResource<Page<Product>>(
    "/products?" +
      new URLSearchParams({
        search,
        status: "active",
        page: String(page),
        per_page: "10",
      }),
  );
  return (
    <div className="space-y-3 rounded-md border p-4">
      <Label htmlFor="order-product-search">{t("orders.findProducts")}</Label>
      <Input
        id="order-product-search"
        placeholder={t("orders.productSearchPlaceholder")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      {r.error && <p role="alert">{r.error}</p>}
      {r.loading && <p role="status">{t("orders.loadingCatalog")}</p>}
      <ul className="divide-y">
        {r.data?.data.map((p) => (
          <li key={p.id} className="flex justify-between gap-3 py-3">
            <div>
              <p className="font-medium">
                {p.name} · {p.sku}
              </p>
              <p className="text-sm text-muted-foreground">
                {p.brand} · {p.model} · {p.color} ·{" "}
                {amount(p.price_minor, p.currency, p.price_decimals)}
              </p>
              <p className="text-sm">
                {t("orders.available", {
                  available: p.balance.available,
                })}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={selected.includes(p.id) || selected.length >= 50}
              onClick={() => onAdd(p)}
            >
              {t("orders.addSku", { sku: p.sku })}
            </Button>
          </li>
        ))}
      </ul>
      <Paging
        data={r.data}
        page={page}
        loading={r.loading}
        onChange={setPage}
      />
    </div>
  );
}

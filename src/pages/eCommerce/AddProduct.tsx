import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "./catalog-shared";
import { decimal, type Product } from "../../../../contracts/commerce";
import { ApiError } from "../../../../contracts/session";
type Values = {
  name: string;
  sku: string;
  brand: string;
  model: string;
  color: string;
  description: string;
  price: string;
  category_id: number | null;
  low_stock_threshold: number;
  initial_quantity: number;
};
export default function AddProduct() {
  const { id } = useParams();
  return id ? <EditProduct id={id} /> : <ProductEditor />;
}
function EditProduct({ id }: { id: string }) {
  const { t, translateError } = useTranslation();
  const r = useApiResource<{ data: Product }>("/products/" + id);
  return (
    <>
      {r.error && <p role="alert">{translateError(r.error)}</p>}
      {!r.data ? (
        <p>{t("products.loadingProduct")}</p>
      ) : (
        <ProductEditor product={r.data.data} />
      )}
    </>
  );
}
function ProductEditor({ product }: { product?: Product }) {
  const { t, translateError } = useTranslation();
  const { user } = useSession();
  const navigate = useNavigate();
  const [key] = useState(() => crypto.randomUUID());
  const [error, setMessage] = useState("");
  const form = useForm<Values>({
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      brand: product?.brand ?? "",
      model: product?.model ?? "",
      color: product?.color ?? "",
      description: product?.description ?? "",
      price: product
        ? decimal(product.price_minor, product.price_decimals)
        : "",
      category_id: product?.category_id ?? null,
      low_stock_threshold: product?.low_stock_threshold ?? 1,
      initial_quantity: 0,
    },
  });
  const currency = product?.currency ?? user?.shop?.currency;
  if (
    !user?.permissions.includes("products.write") ||
    !user.permissions.includes(product ? "products.edit" : "products.create")
  )
    return <p role="alert">{t("error.cannotEditProducts")}</p>;
  if (product?.status === "archived")
    return (
      <div className="space-y-3">
        <p>{t("products.restoreBeforeEditing")}</p>
        <Button asChild>
          <Link to={"/products/" + product.id}>
            {t("products.viewProduct")}
          </Link>
        </Button>
      </div>
    );
  const field = (
    name: keyof Values,
    label: string,
    options: { number?: boolean; max?: number } = {},
  ) => (
    <div className="space-y-2" key={name}>
      <Label htmlFor={"product-" + name}>{label}</Label>
      <Input
        id={"product-" + name}
        type={options.number ? "number" : "text"}
        min={options.number ? 0 : undefined}
        step={options.number ? 1 : undefined}
        maxLength={options.max}
        {...form.register(name, {
          required: name === "sku" ? false : t("products.requiredField", { label }),
          ...(options.number
            ? {
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: t("products.mustBeZeroOrGreater"),
                },
                max: { value: 1000000, message: t("products.maximumValue") },
              }
            : {}),
        })}
      />
      {form.formState.errors[name] && (
        <p className="text-destructive" role="alert">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </div>
  );
  return (
    <>
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        setMessage("");
        try {
          const { initial_quantity, ...v } = values;
          const r = await api.request<{ data: Product }>(
            "/products" + (product ? "/" + product.id : ""),
            {
              method: product ? "PATCH" : "POST",
              body: JSON.stringify({
                ...v,
                ...(product
                  ? { version: product.version }
                  : { initial_quantity, creation_key: key }),
              }),
            },
          );
          navigate("/products/" + r.data.id);
        } catch (e) {
          setMessage(
            e instanceof Error
              ? translateError(e.message)
              : t("products.unableToSaveProduct"),
          );
          if (e instanceof ApiError)
            for (const [k, v] of Object.entries(e.errors))
              form.setError(k as keyof Values, {
                message: translateError(v[0]),
              });
        }
      })}
    >
      <div className="flex justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {product ? t("products.editProduct") : t("products.addNewProduct")}
          </h1>
          <p className="text-muted-foreground">{t("ops.variant.skuHelp")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={product ? "/products/" + product.id : "/products"}>
              {t("common.cancel")}
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || !currency}
          >
            {t("products.saveProduct")}
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}{" "}
          {error.includes("changed") && t("products.entriesRetainedNote")}
        </p>
      )}
      {!currency && (
        <p role="alert">
          {t("products.currencySetStart")}{" "}
          <Link className="underline" to="/shop/settings">
            {t("nav.shopSettings")}
          </Link>{" "}
          {t("products.currencySetEnd")}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("products.generalInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {field("name", t("products.productName"), { max: 200 })}
              {field("sku", t("products.skuLabel"), { max: 80 })}
              {field("brand", t("products.brand"), { max: 100 })}
              {field("model", t("products.model"), { max: 100 })}
              {field("color", t("products.color"), { max: 80 })}
              <Controller
                control={form.control}
                name="category_id"
                rules={{ required: t("products.chooseCategory") }}
                render={({ field: f }) => (
                  <div>
                    <CategoryPicker
                      value={f.value}
                      onChange={f.onChange}
                      initial={product?.category}
                    />
                    {form.formState.errors.category_id && (
                      <p role="alert">
                        {form.formState.errors.category_id.message}
                      </p>
                    )}
                  </div>
                )}
              />
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="product-description">
                  {t("common.description")}
                </Label>
                <Textarea
                  id="product-description"
                  rows={5}
                  maxLength={10000}
                  {...form.register("description", {
                    required:
                      product?.status === "active"
                        ? t("products.activeNeedsDescription")
                        : false,
                  })}
                />
                {form.formState.errors.description && (
                  <p role="alert">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("products.pricing")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-w-lg">
              {field(
                "price",
                t("products.priceLabel", {
                  currency: currency ?? t("products.chooseCurrency"),
                }),
                { max: 24 },
              )}
              <p className="text-sm text-muted-foreground">
                {t("products.priceHint")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("nav.inventory")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {!product &&
                user.permissions.includes("stock.write") &&
                field("initial_quantity", t("products.openingQuantity"), {
                  number: true,
                })}
              {field("low_stock_threshold", t("products.lowStockThreshold"), {
                number: true,
              })}
              <p className="md:col-span-2 text-sm text-muted-foreground">
                {product
                  ? t("products.existingStockNote")
                  : t("products.openingStockNote")}{" "}
                {t("products.availableStockNote")}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("products.productImages")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {product
                  ? t("products.managePhotos")
                  : t("products.saveDraftThenUpload")}{" "}
                {t("products.requiredToActivate")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("common.status")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {product ? t("status." + product.status) : t("status.draft")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("products.statusActionsNote")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
    {product && <div className="mt-6"><OperationsWorkspace module="variations" product={product} /></div>}
    </>
  );
}

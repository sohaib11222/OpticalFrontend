import { VistaEditorProvider, VistaImagePicker, VistaContactCategory, VistaStepNavigation } from "../../../../contracts/VistaEditor";
import { vistaStepForField } from "../../../../contracts/vista-form";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Choice } from "@/pages/eCommerce/catalog-shared";
import type { Product } from "../../../../contracts/commerce";
import {
  type VistaStatus,
  type PublicationState,
  type VistaMetadata,
} from "../../../../contracts/vista";
import { VistaFields } from "./VistaFields";
import {
  initialVistaValues,
  selectVistaCategory,
  vistaSubcategories,
  publicationValues,
  vistaAllocatedTotal,
  type VistaValues,
} from "../../../../contracts/vista-form";
import { useTranslation } from "@/i18n";

export default function VistaPublish({
  product,
  refresh,
}: {
  product: Product;
  refresh: () => void;
}) {
  const { user } = useSession();
  const { t, translateError } = useTranslation();
  const c = useApiResource<VistaStatus>("/integrations/vista");
  const q = useApiResource<PublicationState>(
    "/products/" + product.id + "/vista",
  );
  const [meta, setMeta] = useState<VistaMetadata>();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<VistaValues>({});
  const [quantity, setQuantity] = useState(0);
  const [step, setStep] = useState(0);
  const contact = values.product_type === "contact_lens";
  const [key, setKey] = useState(crypto.randomUUID());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pub = q.data?.data;
  const pending = q.data?.operations.some((o) =>
    ["pending", "processing", "uncertain"].includes(o.status),
  );
  const can =
    user?.permissions.includes("integrations.publish") &&
    user.permissions.includes("stock.write") &&
    user.permissions.includes("products.write");
  const { reload: reloadPublication, loading: loadingPublication } = q;

  useEffect(() => {
    if (!pending || loadingPublication) return;
    const timer = setTimeout(() => {
      reloadPublication();
      refresh();
    }, 5000);
    return () => clearTimeout(timer);
  }, [pending, reloadPublication, loadingPublication, refresh]);

  async function action(path: string) {
    setBusy(true);
    setError("");
    try {
      await api.post(path);
      q.reload();
      refresh();
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : t("vista.actionFailed")));
    } finally {
      setBusy(false);
    }
  }

  async function begin() {
    setBusy(true);
    setError("");
    try {
      const m = await api.request<VistaMetadata>(
        "/integrations/vista/metadata",
      );
      if (m.data.schema_version !== 3)
        throw new Error(t("vista.schemaVersionError"));
      setMeta(m);
      setValues(initialVistaValues(product, pub?.mapping));
      setQuantity(0); setStep(0);
      setKey(crypto.randomUUID());
      setOpen(true);
    } catch (e) {
      setError(translateError(e instanceof Error ? e.message : t("vista.cannotLoadCategories")));
    } finally {
      setBusy(false);
    }
  }

  if (!c.data?.data.enabled) return null;

  return (
    <Card id="vista-publication">
      <CardHeader>
        <CardTitle>{t("vista.publishTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || q.error) && (
          <p role="alert" className="text-destructive">
            {translateError(error || q.error)}
          </p>
        )}
        {!c.data.data.connection ||
        c.data.data.connection.status === "disconnected" ? (
          <Button asChild variant="outline">
            <Link to="/integrations/vista">
              {t("vista.connectFirst")}
            </Link>
          </Button>
        ) : (
          <>
            <p>
              {c.data.data.connection.store_name} ·{" "}
              {pub?.remote_id
                ? t("vista.publishedProduct", { id: pub.remote_id })
                : t("vista.notPublished")}{" "}
              ·{" "}
              {pub?.remote_id
                ? pub.visible
                  ? t("vista.visibleInCatalog")
                  : t("vista.notVisibleInCatalog")
                : ""}
            </p>
            <p>
              {t("vista.availableStock", { available: product.balance.available })}
            </p>
            {can && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  disabled={
                    busy ||
                    pending ||
                    product.status !== "active" ||
                    product.currency !== "EUR"
                  }
                  onClick={() => void begin()}
                >
                  {pub?.remote_id
                    ? t("vista.updateOrAllocate")
                    : t("vista.uploadToVista")}
                </Button>
                {pub?.remote_id && (
                  <Button
                    variant="outline"
                    disabled={busy || pending}
                    onClick={() =>
                      void action("/products/" + product.id + "/vista/refresh")
                    }
                  >
                    {t("vista.refreshPublication")}
                  </Button>
                )}
              </div>
            )}
            {product.currency !== "EUR" && (
              <p>{t("vista.currencyWarning")}</p>
            )}
            {q.data?.operations.map((o) => (
              <div key={o.id} className="rounded border p-3 space-y-2">
                <p>
                  {t("vista.operationStatus", { id: o.id, status: t("vista.status." + o.status), quantity: o.allocated_quantity, attempts: o.attempts })}
                </p>
                {o.last_error && <p>{translateError(o.last_error)}</p>}
                {can && ["pending", "uncertain"].includes(o.status) && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void action(
                          "/integrations/vista/operations/" + o.id + "/retry",
                        )
                      }
                    >
                      {t("vista.retry")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(t("vista.cancelConfirm"))
                        )
                          void action(
                            "/integrations/vista/operations/" +
                              o.id +
                              "/cancel",
                          );
                      }}
                    >
                      {t("vista.cancelPublication")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {pub?.remote_id
                  ? t("vista.updateVistaListing")
                  : t("vista.uploadToVista")}
              </DialogTitle>
            </DialogHeader>
            <p>{meta?.data.publication_policy}</p>
            <p>
              {t("vista.reviewListing")}
            </p>
            {meta && <VistaEditorProvider product={product} values={values} meta={meta} theme="shop" request={api.request} imageBase="/api/v1" refresh={refresh} t={t}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                void api
                  .post("/products/" + product.id + "/vista", {
                    version: product.version,
                    quantity,
                    creation_key: key,
                    expected_version: pub?.remote_version,
                    mapping: publicationValues(meta!, values),
                  })
                  .then(() => {
                    setOpen(false);
                    q.reload();
                    refresh();
                  })
                  .catch((e) => setError(translateError(e.message)))
                  .finally(() => setBusy(false));
              }}
            >
              <Choice
                label={t("vista.categoryLabel")}
                value={String(values.category_id ?? "")}
                options={(meta?.data.categories ?? [])
                  .filter((c) => c.parent_id === null && c.product_type)
                  .map((c) => [String(c.id), c.name])}
                onChange={(v) =>
                  { setValues(selectVistaCategory(values, v, meta!)); setStep(0); }
                }
              />
              <p>
                {t("vista.productType", {
                    type: String(values.product_type ?? "")
                      .split("_")
                      .join(" "),
                  })}
              </p>
              {contact && step === 0 && <VistaContactCategory values={values} onChange={setValues} />}
              {!contact && meta &&
                vistaSubcategories(meta, values.category_id).length > 0 && (
                  <Choice
                    label={t("vista.subcategoryLabel")}
                    value={String(values.sub_category_id ?? "")}
                    options={vistaSubcategories(meta, values.category_id)}
                    onChange={(v) =>
                      setValues({
                        ...values,
                        sub_category_id: v ? Number(v) : undefined,
                      })
                    }
                  />
                )}
              {contact && <VistaStepNavigation step={step} onChange={setStep} />}
              {(!contact || step === 0) && <>
              <VistaFields
                fields={meta?.data.common_fields ?? []}
                values={values}
                onChange={setValues}
              />
              <Label htmlFor="vista-quantity">{t("vista.quantityLabel")}</Label>
              <Input
                id="vista-quantity"
                type="number"
                required
                min={0}
                max={product.balance.available}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <VistaImagePicker label={t("ops.vista.photos")} value={values.gallery_image_ids} onChange={v => setValues({ ...values, gallery_image_ids: v })} />
              </>}
              <VistaFields
                fields={
                  meta?.data.categories.find(
                    (c) => c.id === Number(values.category_id),
                  )?.fields?.filter(f => !contact || vistaStepForField(f.key) === step) ?? []
                }
                values={values}
                onChange={setValues}
              />
              {vistaAllocatedTotal(values) !== null && (
                <p role="status">
                  {t("vista.optionAllocationTotal", {
                      total: vistaAllocatedTotal(values) ?? 0,
                      quantity,
                    })}
                </p>
              )}
              {error && (
                <p role="alert" className="text-destructive">
                  {translateError(error)}
                </p>
              )}
              <Button
                disabled={
                  busy || (contact && step !== 2) || product.images?.some(i => i.scan_status === "pending" && !i.archived_at) ||
                  !values.product_type ||
                  !values.category_id ||
                  (vistaAllocatedTotal(values) !== null &&
                    vistaAllocatedTotal(values) !== quantity)
                }
              >
                {busy ? t("vista.queueing") : t("vista.publishBtn")}
              </Button>
            </form>
            </VistaEditorProvider>}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
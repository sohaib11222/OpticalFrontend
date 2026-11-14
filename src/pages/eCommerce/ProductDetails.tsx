import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import VistaPublish from "@/pages/integrations/VistaPublish";
import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Choice, ProductPhoto } from "./catalog-shared";
import ProductStock from "./ProductStock";
import { money, type Product } from "../../../../contracts/commerce";
export default function ProductDetails() {
  const { t, translateError } = useTranslation();
  const photoInput = useRef<HTMLInputElement>(null);
  const { id } = useParams();
  const r = useApiResource<{ data: Product }>("/products/" + id);
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState("active");
  const [uploads, setUploads] = useState<
    Array<{
      id: string;
      name: string;
      state: "uploading" | "ready" | "failed";
      message?: string;
    }>
  >([]);
  const p = r.data?.data;
  const pending = p?.images?.some(
    (i) => i.scan_status === "pending" && !i.archived_at,
  );
  useEffect(() => {
    if (!pending) return;
    const t = window.setInterval(r.reload, 3000);
    return () => clearInterval(t);
  }, [pending, r.reload]);
  const mutate = async (path: string, body?: object) => {
    setBusy(true);
    try {
      await api.request(path, { method: "PATCH", body: JSON.stringify(body) });
      await r.reload();
      toast.success(t("products.actionSucceeded"));
    } catch (e) {
      toast.error(
        e instanceof Error
          ? translateError(e.message)
          : t("products.actionFailed"),
      );
    } finally {
      setBusy(false);
    }
  };
  const uploadPhotographs = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;

    const records = selected.map((item) => ({
      id: crypto.randomUUID(),
      name: item.name,
      state: "uploading" as const,
    }));
    setUploads((current) => [...current, ...records]);
    setBusy(true);

    const results = await Promise.all(
      selected.map(async (item, index) => {
        const record = records[index];
        const body = new FormData();
        body.append("file", item);
        body.append("upload_key", crypto.randomUUID());
        try {
          const result = await api.request<{ data: { scan_status: string } }>(
            "/products/" + p!.id + "/images",
            { method: "POST", body },
          );
          setUploads((current) =>
            current.map((entry) =>
              entry.id === record.id
                ? { ...entry, state: "ready", message: result.data.scan_status }
                : entry,
            ),
          );
          return true;
        } catch (cause) {
          const message =
            cause instanceof Error
              ? translateError(cause.message)
              : t("products.uploadFailed");
          setUploads((current) =>
            current.map((entry) =>
              entry.id === record.id
                ? { ...entry, state: "failed", message }
                : entry,
            ),
          );
          return false;
        }
      }),
    );

    if (photoInput.current) photoInput.current.value = "";
    setBusy(false);
    void r.reload();
    const complete = results.filter(Boolean).length;
    if (complete) {
      toast.success(
        complete === 1
          ? t("products.photoUploadedReady")
          : t("products.photosUploadedReady", { count: complete }),
      );
    }
    if (complete !== selected.length) {
      toast.error(t("products.somePhotosFailed"));
    }
  };
  if (!p)
    return (
      <div className="space-y-3">
        {r.error ? (
          <p role="alert">{translateError(r.error)}</p>
        ) : (
          <p>{t("products.loadingProduct")}</p>
        )}
        <Button variant="outline" onClick={r.reload}>
          {t("common.retry")}
        </Button>
      </div>
    );
  const write = user?.permissions.includes("products.write");
  const canEdit = write && user?.permissions.includes("products.edit");
  const canArchive = write && user?.permissions.includes("products.archive");
  return (
    <div className="space-y-6">
      {user?.permissions.includes("integrations.read") && (
        <VistaPublish product={p} refresh={r.reload} />
      )}
      <div className="flex justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <p className="text-muted-foreground">
            {p.sku} · {p.brand} · {p.model} · {p.color}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/products">{t("nav.products")}</Link>
          </Button>
          <Button
            variant="outline"
            disabled={busy || r.loading}
            onClick={r.reload}
          >
            {t("products.refreshProduct")}
          </Button>
          {canEdit && p.status !== "archived" && (
            <Button asChild>
              <Link to={"/products/" + p.id + "/edit"}>
                {t("products.editProduct")}
              </Link>
            </Button>
          )}
        </div>
      </div>
      {r.error && (
        <p role="alert" className="text-destructive">
          {translateError(r.error)}
        </p>
      )}
      <OperationsWorkspace module="variations" product={p} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("products.productInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-5 items-center">
                <ProductPhoto product={p} />
                <div>
                  <p>{p.category.name}</p>
                  <p className="font-semibold">{money(p)}</p>
                  <Badge variant="outline">{t("status." + p.status)}</Badge>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words">
                {p.description || t("products.noDescription")}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  [t("products.onHand"), p.balance.on_hand],
                  [t("products.reserved"), p.balance.reserved],
                  [t("products.availableLabel"), p.balance.available],
                ].map(([label, v]) => (
                  <div className="rounded-md border p-4" key={label}>
                    <p className="text-muted-foreground">{label}</p>
                    <p className="text-xl font-semibold">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm">
                {t("products.lowStockThresholdValue", {
                  value: p.low_stock_threshold,
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("products.photographs")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && p.status !== "archived" && (
                <div className="space-y-3 rounded-md border border-dashed p-5">
                  <Label htmlFor="product-photo">
                    {t("products.uploadPhotograph")}
                  </Label>
                  <Input
                    ref={photoInput}
                    id="product-photo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    disabled={busy}
                    onChange={(e) => void uploadPhotographs(e.target.files)}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("products.photoGuidanceAuto")}
                  </p>
                  {uploads.length > 0 && (
                    <ul className="space-y-2 rounded-md bg-muted/40 p-3 text-sm" aria-live="polite">
                      {uploads.slice(-12).map((upload) => (
                        <li className="flex items-center justify-between gap-3" key={upload.id}>
                          <span className="truncate">{upload.name}</span>
                          <span
                            className={
                              upload.state === "failed"
                                ? "text-destructive"
                                : upload.state === "ready"
                                  ? "text-emerald-700"
                                  : "text-muted-foreground"
                            }
                          >
                            {upload.state === "uploading"
                              ? t("products.uploadingAndScanning")
                              : upload.state === "ready"
                                ? t("products.uploadReady")
                                : upload.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {p.images
                  ?.filter((i) => !i.archived_at)
                  .map((i) => (
                    <div key={i.id} className="space-y-3 rounded-md border p-4">
                      {i.scan_status === "clean" ? (
                        <img
                          className="h-36 w-full object-contain"
                          src={"/api/v1/catalog-images/" + i.id}
                          alt={i.filename}
                        />
                      ) : (
                        <div className="h-24 flex items-center justify-center bg-muted/40">
                          {t("products.photoStatus", {
                            status: t("status." + i.scan_status),
                          })}
                        </div>
                      )}
                      <p className="truncate" title={i.filename}>
                        {i.filename}
                      </p>
                      <Badge variant="outline">
                        {i.id === p.primary_image_id
                          ? t("products.primaryPhoto")
                          : t("status." + i.scan_status)}
                      </Badge>
                      {i.scan_status === "failed" && (
                        <p className="text-sm">
                          {t("products.processingUnavailable")}
                        </p>
                      )}
                      {(canEdit || canArchive) && (
                        <div className="flex flex-wrap gap-2">
                          {canEdit &&
                            i.scan_status === "clean" &&
                            i.id !== p.primary_image_id && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  void mutate("/catalog-images/" + i.id, {
                                    action: "primary",
                                    version: p.version,
                                  })
                                }
                              >
                                {t("products.makePrimary")}
                              </Button>
                            )}
                          {canEdit &&
                            ["pending", "failed"].includes(i.scan_status) && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={async () => {
                                  setBusy(true);
                                  try {
                                    await api.post(
                                      "/catalog-images/" + i.id + "/retry",
                                    );
                                    await r.reload();
                                    toast.success(
                                      t("products.photoRetrySucceeded"),
                                    );
                                  } catch (e) {
                                    toast.error(
                                      e instanceof Error
                                        ? translateError(e.message)
                                        : t("products.retryFailed"),
                                    );
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                              >
                                {t("products.retryProcessing")}
                              </Button>
                            )}
                          {canArchive && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                void mutate("/catalog-images/" + i.id, {
                                  action: "archive",
                                  version: p.version,
                                })
                              }
                            >
                              {t("products.archivePhoto")}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("products.statusTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                {t("products.currentStatus")}{" "}
                <strong>{t("status." + p.status)}</strong>
              </p>
              {canArchive && (
                <>
                  <Choice
                    label={t("products.changeStatus")}
                    value={target}
                    options={[
                      ["active", t("status.active")],
                      ["draft", t("status.draft")],
                      ["archived", t("status.archived")],
                    ]}
                    onChange={setTarget}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("products.activeNeedsDescriptionPhoto")}
                  </p>
                  <Button
                    disabled={busy || target === p.status}
                    onClick={() =>
                      void mutate("/products/" + p.id + "/status", {
                        status: target,
                        version: p.version,
                      })
                    }
                  >
                    {t("products.applyStatus")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {user?.permissions.includes("stock.read") && (
        <ProductStock product={p} changed={r.reload} />
      )}
    </div>
  );
}

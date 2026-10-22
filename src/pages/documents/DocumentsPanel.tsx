import UploadProcessingStatus from "@/components/UploadProcessingStatus";
import { useEffect, useState } from "react";
import { api, useSession } from "@/auth/session";
import { ApiError } from "../../../../contracts/session";
import type { PrivateDocument } from "../../../../contracts/documents";
import type { Page } from "../../../../contracts/customers";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileCard } from "@/components/file-manager/file-card";
import DocumentUpload from "./DocumentUpload";
import { useTranslation } from "@/i18n";

function DocumentDetails({
  file,
  onClose,
  onSaved,
}: {
  file: PrivateDocument;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useSession();
  const { t, translateError } = useTranslation();
  const [title, setTitle] = useState(file.title || file.filename);
  const [description, setDescription] = useState(file.description || "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const canWrite = user?.permissions.includes("files.write") && user.permissions.includes("files.edit");
  const canArchive = user?.permissions.includes("files.write") && user.permissions.includes("files.archive");
  const available = file.scan_status === "clean" && !file.archived_at;

  const action = async (type: "metadata" | "archive" | "rescan") => {
    setBusy(true);
    setMessage("");
    try {
      await api.request(
        "/documents/" +
          file.id +
          (type === "metadata"
            ? ""
            : type === "archive"
              ? "/archive"
              : "/rescan"),
        {
          method: type === "rescan" ? "POST" : "PATCH",
          body: JSON.stringify(
            type === "metadata"
              ? { version: file.version, title, description }
              : type === "archive"
                ? { version: file.version, archived: !file.archived_at, reason }
                : {},
          ),
        },
      );
      onSaved();
    } catch (e) {
      setMessage(
        e instanceof ApiError
          ? translateError([e.message, ...Object.values(e.errors).flat()].join(" "))
          : e instanceof Error
            ? translateError(e.message)
            : t("documents.actionFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("documents.documentId", { id: file.id })}</DialogTitle>
          <DialogDescription>
            {file.filename} · {(file.size / 1024).toFixed(1)} KB ·{" "}
            {t("status." + file.scan_status)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="document-edit-title">{t("documents.documentTitle")}</Label>
            <Input
              id="document-edit-title"
              disabled={!canWrite || busy}
              value={title}
              maxLength={255}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="document-edit-description">{t("documents.documentDescription")}</Label>
            <Textarea
              id="document-edit-description"
              disabled={!canWrite || busy}
              value={description}
              maxLength={2000}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {file.customer_id && (
            <p>
              {t("documents.customer", { id: file.customer_id })}
              {file.optical_record_id
                ? t("documents.opticalRecord", { id: file.optical_record_id })
                : ""}
            </p>
          )}
          {file.scan_status === "failed" && (
            <p role="status">
              {t("documents.scanning")}
            </p>
          )}
          {file.scan_status === "rejected" && (
            <p role="status">
              {t("documents.rejected")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <Button
                disabled={busy || !title.trim()}
                onClick={() => void action("metadata")}
              >
                {t("documents.saveDetails")}
              </Button>
            )}
            {available && (
              <>
                <Button variant="outline" asChild>
                  <a href={"/api/v1/private-files/" + file.id}>{t("documents.download")}</a>
                </Button>
                {["image/png", "image/jpeg", "application/pdf"].includes(
                  file.mime,
                ) && (
                  <Button variant="outline" asChild>
                    <a
                      target="_blank"
                      rel="noopener"
                      href={"/api/v1/documents/" + file.id + "/preview"}
                    >
                      {t("documents.preview")}
                    </a>
                  </Button>
                )}
              </>
            )}
            {canWrite &&
              !file.archived_at &&
              ["pending", "failed"].includes(file.scan_status) && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void action("rescan")}
                >
                  {t("documents.retryScanBtn")}
                </Button>
              )}
          </div>
          {available && file.mime.startsWith("image/") && (
            <img
              className="max-h-80 w-full rounded-lg object-contain border"
              src={"/api/v1/documents/" + file.id + "/preview"}
              alt={file.title || file.filename}
            />
          )}{" "}
          {canArchive && (
            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="document-archive-reason">
                {file.archived_at ? t("documents.restoreReason") : t("documents.archiveReason")}
              </Label>
              <Textarea
                id="document-archive-reason"
                maxLength={2000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={busy || reason.trim().length < 3}
                onClick={() => void action("archive")}
              >
                {file.archived_at ? t("documents.restore") : t("documents.archive")}
              </Button>
            </div>
          )}
          {message && (
            <p role="alert" className="text-destructive">
              {message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentsPanel({
  customerId,
  onChange,
}: {
  customerId?: number;
  onChange?: () => void;
}) {
  const { user } = useSession();
  const { t, translateError, formatDate } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [scan, setScan] = useState("");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [grid, setGrid] = useState(false);
  const [upload, setUpload] = useState(false);
  const [selected, setSelected] = useState<PrivateDocument | null>(null);
  const query = new URLSearchParams({
    search,
    category,
    scan_status: scan,
    archived: archived ? "1" : "0",
    page: String(page),
  });
  if (customerId) query.set("customer_id", String(customerId));
  const { data, error, loading, reload } = useApiResource<
    Page<PrivateDocument>
  >("/documents?" + query);
  const pending = data?.data.some((f) => f.scan_status === "pending");
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(reload, 4000);
    return () => clearInterval(timer);
  }, [pending, reload]);
  const updated = () => {
    setUpload(false);
    setSelected(null);
    reload();
    onChange?.();
  };

  return (
    <Card>
      <CardHeader>
        <UploadProcessingStatus />
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <CardTitle>{t("documents.title")}</CardTitle>
          {user?.permissions.includes("files.write") && user.permissions.includes("files.create") && (
            <Button onClick={() => setUpload(true)}>{t("documents.upload")}</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            className="max-w-xs"
            aria-label={t("documents.search")}
            placeholder={t("documents.search")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label={t("documents.categoryCol")}
            className="h-9 rounded-md border bg-background px-3"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("documents.allCategories")}</option>
            <option value="document">{t("documents.categoryDocumentOpt")}</option>
            <option value="customer_image">{t("documents.categoryCustomerImageOpt")}</option>
            <option value="glasses_image">{t("documents.categoryGlassesImageOpt")}</option>
          </select>
          <select
            aria-label={t("documents.statusCol")}
            className="h-9 rounded-md border bg-background px-3"
            value={scan}
            onChange={(e) => {
              setScan(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("documents.allScanStates")}</option>
            {["pending", "clean", "failed", "rejected"].map((s) => (
              <option key={s} value={s}>
                {t("status." + s)}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setArchived((v) => !v);
              setPage(1);
            }}
          >
            {archived ? t("documents.showCurrent") : t("documents.showArchived")}
          </Button>
          <Button variant="outline" onClick={() => setGrid((v) => !v)}>
            {grid ? t("documents.tableView") : t("documents.gridView")}
          </Button>
          <Button variant="outline" onClick={reload} disabled={loading}>
            {t("documents.refresh")}
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-destructive">
            {translateError(error)}
          </p>
        )}
        {loading && <p role="status">{t("documents.loading")}</p>}
        {grid ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {data?.data.map((f) => (
              <button
                key={f.id}
                type="button"
                className="text-left"
                onClick={() => setSelected(f)}
              >
                <FileCard
                  name={f.title || f.filename}
                  size={(f.size / 1024).toFixed(1) + " KB · " + t("status." + f.scan_status)}
                  type={f.mime.startsWith("image/") ? "image" : "pdf"}
                />
              </button>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  t("documents.documentListTitle"),
                  t("documents.categoryCol"),
                  t("documents.statusCol"),
                  t("documents.uploadedCol"),
                  t("documents.actionsCol"),
                ].map((v) => (
                  <TableHead key={v}>{v}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <p className="font-medium">{f.title || f.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {f.filename} · {(f.size / 1024).toFixed(1)} KB
                    </p>
                  </TableCell>
                  <TableCell>{f.category.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        f.scan_status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {t("status." + f.scan_status)}
                    </Badge>
                    {f.archived_at && <p>{t("documents.archived")}</p>}
                  </TableCell>
                  <TableCell>
                    {formatDate(f.created_at, undefined)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(f)}
                    >
                      {t("documents.open")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && !error && !data?.data.length && (
          <p className="text-center p-5 text-muted-foreground">
            {t("documents.noDocuments")}
          </p>
        )}
        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("documents.previousBtn")}
          </Button>
          <span>
            {t("common.pageOf", { page, total: data?.last_page || 1 })}
          </span>
          <Button
            variant="outline"
            disabled={loading || page >= (data?.last_page || 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("documents.nextBtn")}
          </Button>
        </div>
        {upload && (
          <DocumentUpload
            customerId={customerId}
            onClose={() => setUpload(false)}
            onSaved={updated}
          />
        )}{" "}
        {selected && (
          <DocumentDetails
            file={selected}
            onClose={() => setSelected(null)}
            onSaved={updated}
          />
        )}
      </CardContent>
    </Card>
  );
}
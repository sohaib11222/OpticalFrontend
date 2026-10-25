import { useEffect, useState, type FormEvent } from "react";
import UploadProcessingStatus from "@/components/UploadProcessingStatus";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Upload, FileSpreadsheet, RefreshCw } from "lucide-react";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { ApiError } from "../../../../contracts/session";
import type { Page } from "../../../../contracts/customers";
import type {
  CustomerImport,
  CustomerField,
  ImportRow,
} from "../../../../contracts/imports";
import type { PrivateDocument } from "../../../../contracts/documents";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useTranslation } from "@/i18n";

const selectClass = "h-9 w-full rounded-md border bg-background px-3";

const fields: CustomerField[] = [
  "first_name",
  "last_name",
  "date_of_birth",
  "phone",
  "email",
  "street_address",
  "city",
  "postal_code",
  "sex",
];

const REQUIRED_FIELDS: CustomerField[] = ["first_name", "last_name"];

const fieldLabels: Record<CustomerField, string> = {
  first_name: "imports.field.firstName",
  last_name: "imports.field.lastName",
  date_of_birth: "imports.field.dateOfBirth",
  phone: "imports.field.phone",
  email: "imports.field.email",
  street_address: "imports.field.streetAddress",
  city: "imports.field.city",
  postal_code: "imports.field.postalCode",
  sex: "imports.field.sex",
};

const message = (
  e: unknown,
  t: (key: string) => string,
  translateError: (m: string) => string,
) => translateError(e instanceof ApiError ? e.message : t("imports.actionFailed"));

const processing = (s: string) =>
  ["parsing", "previewing", "committing"].includes(s);

export default function CustomerImports() {
  const { t, translateError } = useTranslation();
  const [page, setPage] = useState(1);
  const [upload, setUpload] = useState(false);
  const { user } = useSession();
  const { data, error, reload } = useApiResource<Page<CustomerImport>>(
    "/customer-imports?page=" + page,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("imports.title")}</h1>
          <p className="text-muted-foreground">{t("imports.subtitle")}</p>
        </div>
        {user?.permissions.includes("imports.write") && (
          <Button onClick={() => setUpload(true)}>
            <Upload className="size-4" /> {t("imports.importFile")}
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2">
            <FileSpreadsheet /> {t("imports.importHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p role="alert">{translateError(error)}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("imports.source")}</TableHead>
                <TableHead>{t("imports.worksheet")}</TableHead>
                <TableHead>{t("imports.status")}</TableHead>
                <TableHead>{t("imports.processed")}</TableHead>
                <TableHead>{t("imports.started")}</TableHead>
                <TableHead>{t("imports.action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    {b.source_kind === "vista_express"
                      ? t("imports.vistaExpressImport", { id: b.id })
                      : b.file?.title || t("imports.importTitle", { id: b.id })}
                  </TableCell>
                  <TableCell>{b.sheet_name || "Preparing"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t("imports.status." + b.status.replace(/_/g, ""))}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {b.processed_rows} / {b.total_rows}
                  </TableCell>
                  <TableCell>
                    {new Date(b.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline">
                      <Link to={"/customer-imports/" + b.id}>{t("imports.openImport")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data?.total === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              {t("imports.noImports")}
            </p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("imports.previousBtn")}
            </Button>
            <span>
              {t("imports.pageOf", { page, total: data?.last_page || 1 })}
            </span>
            <Button
              variant="outline"
              disabled={page >= (data?.last_page || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("imports.nextBtn")}
            </Button>
            <Button variant="ghost" onClick={reload}>
              {t("imports.refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>
      {upload && <ImportUpload onClose={() => setUpload(false)} />}
    </div>
  );
}

function ImportUpload({ onClose }: { onClose: () => void }) {
  const { t, translateError } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<number | null>(null);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("title", file.name);
      body.append("category", "document");
      body.append("upload_key", key);
      const r = await api.request<{ data: PrivateDocument }>("/documents", {
        method: "POST",
        body,
      });
      setFileId(r.data.id);
    } catch (e) {
      setError(message(e, t, translateError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("imports.uploadFile")}</DialogTitle>
          <DialogDescription>
            {t("imports.uploadDescription")}
          </DialogDescription>
        </DialogHeader>
        {fileId ? (
          <ScannedSource fileId={fileId} />
        ) : (
          <form onSubmit={upload} className="space-y-4">
            <Label htmlFor="import-file">{t("imports.customerFile")}</Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv,.xlsx"
              required
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setKey(crypto.randomUUID());
              }}
            />
            {file && file.size > 10 * 1024 * 1024 && (
              <p role="alert">{t("imports.fileTooLarge")}</p>
            )}
            <Button disabled={busy || !file || file.size > 10 * 1024 * 1024}>
              {busy ? t("imports.uploading") : t("imports.uploadForScan")}
            </Button>
          </form>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScannedSource({ fileId }: { fileId: number }) {
  const { t, translateError } = useTranslation();
  const { data, error, reload } = useApiResource<{ data: PrivateDocument }>(
    "/documents/" + fileId,
  );
  const [delimiter, setDelimiter] = useState(",");
  const [sheet, setSheet] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (["pending", "failed"].includes(data?.data.scan_status ?? "")) {
      const timer = setInterval(reload, 3000);
      return () => clearInterval(timer);
    }
  }, [data?.data.scan_status, reload]);

  async function start() {
    setBusy(true);
    setFailure("");
    try {
      const r = await api.request<{ data: CustomerImport }>(
        "/customer-imports",
        {
          method: "POST",
          body: JSON.stringify({
            file_id: fileId,
            delimiter,
            sheet_name: sheet || null,
          }),
        },
      );
      navigate("/customer-imports/" + r.data.id);
    } catch (e) {
      setFailure(message(e, t, translateError));
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    setBusy(true);
    try {
      await api.request("/documents/" + fileId + "/rescan", { method: "POST" });
      reload();
    } catch (e) {
      setFailure(message(e, t, translateError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p>
        {t("imports.scannedFile", {
              status: t(
                "status." + (data?.data.scan_status || "pending"),
              ),
            })}
      </p>
      {data?.data.scan_status === "failed" && (
        <Button disabled={busy} variant="outline" onClick={retry}>
          {t("imports.retryScan")}
        </Button>
      )}
      {data?.data.scan_status === "rejected" && (
        <p role="alert">
          {t("imports.fileRejected")}
        </p>
      )}
      <UploadProcessingStatus />
      <Label htmlFor="import-delimiter">{t("imports.csvSeparator")}</Label>
      <select
        id="import-delimiter"
        className={selectClass}
        value={delimiter}
        onChange={(e) => setDelimiter(e.target.value)}
      >
        <option value=",">{t("imports.comma")}</option>
        <option value=";">{t("imports.semicolon")}</option>
        <option value="tab">{t("imports.tab")}</option>
        <option value="|">{t("imports.pipe")}</option>
      </select>
      <Label htmlFor="import-sheet">{t("imports.sheetName")}</Label>
      <Input
        id="import-sheet"
        value={sheet}
        onChange={(e) => setSheet(e.target.value)}
        placeholder={t("imports.firstSheet")}
      />
      <Button
        disabled={busy || data?.data.scan_status !== "clean"}
        onClick={start}
      >
        {t("imports.continueMapping")}
      </Button>
      {(error || failure) && <p role="alert">{translateError(error || failure)}</p>}
    </div>
  );
}

export function CustomerImportDetails() {
  const { t, translateError } = useTranslation();
  const { id } = useParams();
  const resource = useApiResource<{
    data: CustomerImport;
    counts: Record<string, number>;
    undecided: number;
  }>("/customer-imports/" + id);
  const [updatedBatch, setUpdatedBatch] = useState<CustomerImport | null>(null);
  const loaded = resource.data?.data;
  const b =
    loaded &&
    updatedBatch?.id === loaded.id &&
    updatedBatch.version > loaded.version
      ? updatedBatch
      : loaded;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const { user } = useSession();
  const canWrite = user?.permissions.includes("imports.write") ?? false;

  function refresh(updated?: CustomerImport) {
    if (updated) setUpdatedBatch(updated);
    resource.reload();
    setRevision((r) => r + 1);
  }

  useEffect(() => {
    if (b && processing(b.status)) {
      const timer = setInterval(resource.reload, 2500);
      return () => clearInterval(timer);
    }
  }, [b, resource.reload]);

  async function action(kind: string) {
    if (!b) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.request<{ data: CustomerImport }>(
        "/customer-imports/" + id + "/" + kind,
        {
          method: "POST",
          body: JSON.stringify({ version: b.version }),
        },
      );
      refresh(result.data);
    } catch (e) {
      setError(message(e, t, translateError));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link to="/customer-imports">{t("imports.backToImports")}</Link>
      </Button>
      <div className="flex justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">
            {b?.source_kind === "vista_express"
              ? t("imports.vistaExpressImportTitle")
              : b?.file?.title ||
                  t("imports.importTitle", { id: b?.id ?? "" })}
          </h1>
          <p className="text-muted-foreground">
            {t("imports.uploadMapReview")}
          </p>
        </div>
        <Button variant="outline" onClick={() => refresh()}>
          <RefreshCw className="size-4" /> {t("imports.refreshImport")}
        </Button>
      </div>
      {(error || resource.error) && (
        <p role="alert" className="text-destructive">
          {translateError(error || resource.error)}
        </p>
      )}
      {b && (
        <>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex flex-wrap gap-4 items-center">
                <Badge variant="secondary">{t("imports.status." + b.status.replace(/_/g, ""))}</Badge>
                <span>
                  {t("imports.rowsProcessed", { processed: b.processed_rows, total: b.total_rows })}
                </span>
                <span>
                    {t("imports.decisionsRemaining", {
                      count: resource.data?.undecided ?? 0,
                    })}
                  </span>
              </div>
              {Object.entries(resource.data?.counts || {}).map(
                ([status, count]) => (
                  <span key={status} className="inline-block mr-4 text-sm">
                    {t("imports.status." + status.replace(/_/g, ""))}: {count}
                  </span>
                ),
              )}
              {b.last_error && <p role="alert">{translateError(b.last_error)}</p>}
              {processing(b.status) && (
                <p role="status">
                  {t("imports.processingMessage")}
                </p>
              )}
              {canWrite && (b.status === "failed" || processing(b.status)) && (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => action("retry")}
                >
                  {t("imports.resumeProcessing")}
                </Button>
              )}
              {canWrite && b.status === "ready" && (
                <Button
                  disabled={busy || resource.data?.undecided !== 0}
                  onClick={() => action("commit")}
                >
                  {t("imports.importReviewedRows")}
                </Button>
              )}
              {b.status === "completed" && (
                <p role="status">
                  {t("imports.importComplete")}
                </p>
              )}
            </CardContent>
          </Card>
          {canWrite &&
            b.source_kind !== "vista_express" &&
            ["mapping", "ready"].includes(b.status) &&
            b.processed_rows === 0 && (
              <MappingForm key={"mapping:" + b.id + ":" + b.version} batch={b} onSaved={refresh} />
            )}
          {b.headers && (
            <ImportRows
              key={"rows:" + b.id}
              revision={revision}
              batch={b}
              canWrite={canWrite}
              onSaved={refresh}
            />
          )}
        </>
      )}
    </div>
  );
}

function MappingForm({
  batch: b,
  onSaved,
}: {
  batch: CustomerImport;
  onSaved: (updated?: CustomerImport) => void;
}) {
  const { t, translateError } = useTranslation();
  const [mapping, setMapping] = useState<
    Partial<Record<CustomerField, number>>
  >(b.mapping || {});
  const [format, setFormat] = useState(b.date_format);
  const [sheet, setSheet] = useState(b.sheet_name || "");
  const [delimiter, setDelimiter] = useState(
    b.delimiter === "\t" ? "tab" : b.delimiter,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api.request<{ data: CustomerImport }>(
        "/customer-imports/" + b.id + "/mapping",
        {
          method: "PATCH",
          body: JSON.stringify({
            version: b.version,
            mapping,
            date_format: format,
          }),
        },
      );
      onSaved(result.data);
    } catch (e) {
      setError(message(e, t, translateError));
    } finally {
      setBusy(false);
    }
  }

  async function configure() {
    setBusy(true);
    setError("");
    try {
      const result = await api.request<{ data: CustomerImport }>(
        "/customer-imports/" + b.id + "/configure",
        {
          method: "PATCH",
          body: JSON.stringify({
            version: b.version,
            sheet_name: sheet,
            delimiter,
          }),
        },
      );
      onSaved(result.data);
    } catch (e) {
      setError(message(e, t, translateError));
    } finally {
      setBusy(false);
    }
  }

return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {t("imports.mappingTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-40">
            <Label htmlFor="mapping-sheet">{t("imports.worksheetLabel")}</Label>
            <select
              id="mapping-sheet"
              className={selectClass}
              value={sheet}
              onChange={(e) => setSheet(e.target.value)}
            >
              {b.sheets?.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="mapping-delimiter">{t("imports.csvSeparatorLabel")}</Label>
            <select
              id="mapping-delimiter"
              className={selectClass}
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
            >
              <option value=",">{t("imports.comma")}</option>
              <option value=";">{t("imports.semicolon")}</option>
              <option value="tab">{t("imports.tab")}</option>
              <option value="|">{t("imports.pipe")}</option>
            </select>
          </div>
          <Button disabled={busy} variant="outline" onClick={configure}>
            {t("imports.reloadColumns")}
          </Button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("imports.mappingDescription")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => {
              const fieldKey = field;
              return (
                <div key={field}>
                  <Label htmlFor={"map-" + field}>
                    {t(fieldLabels[fieldKey])}
                    {REQUIRED_FIELDS.includes(field) ? " *" : ""}
                  </Label>
                  <select
                    id={"map-" + field}
                    className={selectClass}
                    required={REQUIRED_FIELDS.includes(field)}
                    value={mapping[fieldKey] ?? ""}
                    onChange={(e) =>
                      setMapping((previous) => {
                        const next = { ...previous };
                        if (e.target.value === "") delete next[fieldKey];
                        else next[fieldKey] = Number(e.target.value);
                        return next;
                      })
                    }
                  >
                    <option value="">{t("imports.notImported")}</option>
                    {b.headers?.map((h, i) => (
                      <option key={i} value={i}>
                        {t("imports.columnNumber", { num: i + 1, header: h || t("imports.unnamedColumn") })}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <Label htmlFor="import-date-format">{t("imports.dateFormatLabel")}</Label>
          <select
            id="import-date-format"
            className={selectClass}
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="Y-m-d">{t("imports.dateFormatYmd")}</option>
            <option value="d/m/Y">{t("imports.dateFormatDmy")}</option>
            <option value="m/d/Y">{t("imports.dateFormatMdy")}</option>
            <option value="excel">{t("imports.dateFormatExcel")}</option>
          </select>
          <Button disabled={busy}>
            {busy ? t("imports.preparingPreview") : t("imports.validatePreviewBtn")}
          </Button>
        </form>
        {error && <p role="alert">{translateError(error)}</p>}
      </CardContent>
    </Card>
  );
}

function ImportRows({
  batch: b,
  canWrite,
  onSaved,
  revision,
}: {
  batch: CustomerImport;
  revision: number;
  canWrite: boolean;
  onSaved: (updated?: CustomerImport) => void;
}) {
  const { t, translateError } = useTranslation();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<ImportRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { data, error: loadError } = useApiResource<Page<ImportRow>>(
    "/customer-imports/" +
      b.id +
      "/rows?" +
      new URLSearchParams({ page: String(page), status: filter }),
    revision + b.version,
  );

  const editable =
    canWrite && ["ready", "completed_with_errors"].includes(b.status);

  const unambiguous =
    data?.data.filter(
      (r) =>
        r.status === "pending" &&
        r.decision === "pending" &&
        !r.errors?.length &&
        !r.matches?.length &&
        !r.file_duplicate,
    ) || [];

  async function bulk() {
    setBusy(true);
    setError("");
    try {
      const result = await api.request<{ data: CustomerImport }>(
        "/customer-imports/" + b.id + "/decisions",
        {
          method: "PATCH",
          body: JSON.stringify({
            version: b.version,
            rows: unambiguous.map((r) => ({ id: r.id, decision: "create" })),
          }),
        },
      );
      onSaved(result.data);
    } catch (e) {
      setError(message(e, t, translateError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("imports.sourceRowsOutcomes")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <Label htmlFor="import-result-filter">{t("imports.resultFilterLabel")}</Label>
            <select
              id="import-result-filter"
              className={selectClass}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t("imports.allRowsOpt")}</option>
              {["pending", "created", "updated", "skipped", "error"].map(
                (s) => (
                  <option key={s}>{t("imports.decision." + s)}</option>
                ),
              )}
            </select>
          </div>
          {editable && (
            <Button
              variant="outline"
              disabled={busy || !unambiguous.length}
              onClick={bulk}
            >
              {t("imports.bulkCreateBtn", { count: unambiguous.length })}
            </Button>
          )}
        </div>
        {(error || loadError) && <p role="alert">{translateError(error || loadError)}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("imports.colRow")}</TableHead>
              <TableHead>{t("imports.colCustomerSource")}</TableHead>
              <TableHead>{t("imports.colReview")}</TableHead>
              <TableHead>{t("imports.colDecision")}</TableHead>
              <TableHead>{t("imports.colOutcome")}</TableHead>
              <TableHead>{t("imports.colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.row_number}</TableCell>
                <TableCell className="max-w-xs break-words">
                  {r.payload ? (
                    <>
                      <strong>
                        {r.payload.first_name} {r.payload.last_name}
                      </strong>
                      <p>{r.payload.email}</p>
                      <p>{r.payload.postal_code}</p>
                    </>
                  ) : (
                    r.raw_values.join(" · ")
                  )}
                </TableCell>
                <TableCell>
                  {r.errors?.map((e) => (
                    <p key={e} className="text-destructive">
                      {translateError(e)}
                    </p>
                  ))}
                  {r.file_duplicate && <p>{t("imports.possibleDuplicates")}</p>}
                  {!!r.matches?.length && (
                    <p>{t("imports.matchingCustomers", { count: r.matches.length })}</p>
                  )}
                  {r.result_error && (
                    <p role="alert" className="text-destructive">
                      {translateError(r.result_error)}
                    </p>
                  )}
                </TableCell>
                <TableCell>{t("imports.decision." + r.decision.replace(/_/g, ""))}</TableCell>
                <TableCell>
                  {r.status}
                  {r.result_customer_id && (
                    <Button asChild variant="link">
                      <Link to={"/customers/" + r.result_customer_id}>
                        {t("imports.openCustomer")}
                      </Link>
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {r.payload && (
                    <Button variant="outline" onClick={() => setSelected(r)}>
                      {editable && ["pending", "error"].includes(r.status)
                        ? t("imports.reviewRowTitle", { row: r.row_number })
                        : t("imports.openImport")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("imports.previousBtn")}
          </Button>
          <span>
            {t("imports.pageOf", { page, total: data?.last_page || 1 })}
          </span>
          <Button
            variant="outline"
            disabled={page >= (data?.last_page || 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("imports.nextBtn")}
          </Button>
        </div>
        {selected && (
          <RowReview
            batch={b}
            row={selected}
            editable={
              editable && ["pending", "error"].includes(selected.status)
            }
            onClose={() => setSelected(null)}
            onSaved={onSaved}
          />
        )}
      </CardContent>
    </Card>
  );
}

function RowReview({
  batch: b,
  row: r,
  editable,
  onClose,
  onSaved,
}: {
  batch: CustomerImport;
  row: ImportRow;
  editable: boolean;
  onClose: () => void;
  onSaved: (updated?: CustomerImport) => void;
}) {
  const { t, translateError } = useTranslation();
  const [decision, setDecision] = useState(
    r.decision === "pending" ? "skip" : r.decision,
  );
  const [target, setTarget] = useState(String(r.target_customer_id || ""));
  const [reason, setReason] = useState(r.reason || "");
  const [overwrite, setOverwrite] = useState(r.overwrite_blanks);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const match = r.matches?.find((c) => c.id === Number(target));
      const result = await api.request<{ data: CustomerImport }>(
        "/customer-imports/" + b.id + "/decisions",
        {
          method: "PATCH",
          body: JSON.stringify({
            version: b.version,
            rows: [
              {
                id: r.id,
                decision,
                reason,
                target_customer_id: match?.id,
                target_version: match?.version,
                overwrite_blanks: overwrite,
              },
            ],
          }),
        },
      );
      onSaved(result.data);
      onClose();
    } catch (e) {
      setError(message(e, t, translateError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("imports.reviewRowTitle", { row: r.row_number })}</DialogTitle>
          <DialogDescription>
            {t("imports.compareSource")}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
          {fields.map((field) => (
            <div key={field}>
              <dt className="text-sm text-muted-foreground">{t(fieldLabels[field])}</dt>
              <dd className="break-words">{r.payload?.[field] || "—"}</dd>
            </div>
          ))}
        </dl>
        {r.errors?.map((e) => (
          <p key={e} role="alert" className="text-destructive">
            {translateError(e)}
          </p>
        ))}
        {r.matches?.map((c) => (
          <p key={c.id}>
            <Link
              className="underline"
              target="_blank"
              rel="noreferrer"
              to={"/customers/" + c.id}
            >
              {c.first_name} {c.last_name} #{c.id}
            </Link>{" "}
            · {c.email || c.phone} · {c.status}
          </p>
        ))}
        {editable && (
          <form onSubmit={save} className="space-y-4">
            <Label htmlFor="row-decision">{t("imports.colDecision")}</Label>
            <select
              id="row-decision"
              className={selectClass}
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="skip">{t("imports.decisionSkip")}</option>
              {!r.errors?.length && (
                <>
                  {!r.matches?.length && !r.file_duplicate && (
                    <option value="create">{t("imports.decisionCreate")}</option>
                  )}
                  <option value="create_distinct">{t("imports.decisionCreateDistinct")}</option>
                  {r.matches?.some((c) => c.status === "active") && (
                    <option value="update">{t("imports.decisionUpdate")}</option>
                  )}
                </>
              )}
            </select>
            {decision === "update" && (
              <>
                <Label htmlFor="row-target">{t("imports.targetCustomerLabel")}</Label>
                <select
                  id="row-target"
                  className={selectClass}
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">{t("imports.chooseTargetCustomer")}</option>
                  {r.matches
                    ?.filter((c) => c.status === "active")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} #{c.id} (version{" "}
                        {c.version})
                      </option>
                    ))}
                </select>
                <Label className="flex gap-2 items-start">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                  />{" "}
                  {t("imports.overwriteBlanksLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("imports.unmappedPreserved")}
                </p>
              </>
            )}
            <Label htmlFor="row-reason">{t("imports.reviewReasonLabel")}</Label>
            <Textarea
              id="row-reason"
              value={reason}
              required={["update", "create_distinct"].includes(decision)}
              minLength={["update", "create_distinct"].includes(decision) ? 3 : undefined}
              maxLength={2000}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button disabled={busy}>{t("imports.saveRowDecisionBtn")}</Button>
          </form>
        )}
        {error && <p role="alert">{translateError(error)}</p>}
      </DialogContent>
    </Dialog>
  );
}

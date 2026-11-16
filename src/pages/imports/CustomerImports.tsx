import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, RefreshCw, Upload, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { ApiError } from "../../../../contracts/session";
import type { Page } from "../../../../contracts/customers";
import type { CustomerImport, CustomerField, ImportRow } from "../../../../contracts/imports";
import type { PrivateDocument } from "../../../../contracts/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "@/i18n";

const selectClass = "h-9 w-full rounded-md border bg-background px-3";
const fields: CustomerField[] = ["first_name", "last_name", "date_of_birth", "phone", "email", "street_address", "city", "postal_code", "sex"];
const requiredFields: CustomerField[] = ["first_name", "last_name"];
const fieldLabels: Record<CustomerField, string> = {
  first_name: "imports.field.firstName", last_name: "imports.field.lastName", date_of_birth: "imports.field.dateOfBirth", phone: "imports.field.phone", email: "imports.field.email", street_address: "imports.field.streetAddress", city: "imports.field.city", postal_code: "imports.field.postalCode", sex: "imports.field.sex",
};

type Summary = { total: number; valid: number; duplicates: number; requires_attention: number; imported: number; skipped: number; failed: number };
type ImportResponse = { data: CustomerImport; counts: Record<string, number>; undecided: number; summary: Summary };
const processing = (status: string) => ["parsing", "previewing", "committing"].includes(status);
const errorText = (error: unknown, fallback: string, translate: (value: string) => string) => translate(error instanceof ApiError || error instanceof Error ? error.message : fallback);

function Status({ value }: { value: string }) {
  const { t } = useTranslation();
  const key = value.replace(/_([a-z])/g, (_, character: string) => character.toUpperCase());
  return <Badge variant={value.includes("error") || value === "failed" ? "destructive" : "secondary"}>{t("imports.status." + key)}</Badge>;
}

export default function CustomerImports() {
  const { t, translateError } = useTranslation();
  const { user } = useSession();
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const resource = useApiResource<Page<CustomerImport>>("/customer-imports?page=" + page);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">{t("imports.title")}</h1><p className="text-muted-foreground">{t("imports.simpleSubtitle")}</p></div>{user?.permissions.includes("imports.write") && <Button onClick={() => setUploading(true)}><Upload className="size-4" />{t("imports.importFile")}</Button>}</div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5" />{t("imports.importHistory")}</CardTitle></CardHeader><CardContent>
      {resource.error && <p role="alert" className="mb-4 text-destructive">{translateError(resource.error)}</p>}
      <Table><TableHeader><TableRow><TableHead>{t("imports.source")}</TableHead><TableHead>{t("imports.status")}</TableHead><TableHead>{t("imports.processed")}</TableHead><TableHead>{t("imports.started")}</TableHead><TableHead>{t("imports.action")}</TableHead></TableRow></TableHeader><TableBody>{resource.data?.data.map((batch) => <TableRow key={batch.id}><TableCell>{batch.source_kind === "vista_express" ? t("imports.vistaExpressImport", { id: batch.id }) : batch.file?.title || t("imports.importTitle", { id: batch.id })}</TableCell><TableCell><Status value={batch.status} /></TableCell><TableCell>{batch.processed_rows} / {batch.total_rows}</TableCell><TableCell>{new Date(batch.created_at).toLocaleString()}</TableCell><TableCell><Button asChild size="sm" variant="outline"><Link to={'/customer-imports/' + batch.id}>{t("imports.openImport")}</Link></Button></TableCell></TableRow>)}</TableBody></Table>
      {resource.data?.total === 0 && <p className="py-8 text-center text-muted-foreground">{t("imports.noImports")}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>{t("imports.previousBtn")}</Button><span>{t("imports.pageOf", { page, total: resource.data?.last_page || 1 })}</span><Button variant="outline" disabled={page >= (resource.data?.last_page || 1)} onClick={() => setPage((value) => value + 1)}>{t("imports.nextBtn")}</Button><Button variant="ghost" onClick={resource.reload}>{t("imports.refresh")}</Button></div>
    </CardContent></Card>
    {uploading && <ImportUpload onClose={() => setUploading(false)} />}
  </div>;
}

function ImportUpload({ onClose }: { onClose: () => void }) {
  const { t, translateError } = useTranslation();
  const navigate = useNavigate();
  const [source, setSource] = useState<PrivateDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const start = useCallback(async (fileId: number) => {
    if (started.current) return;
    started.current = true;
    try {
      const result = await api.request<{ data: CustomerImport }>("/customer-imports", { method: "POST", body: JSON.stringify({ file_id: fileId, automatic: true }) });
      toast.success(t("imports.filePrepared")); onClose(); navigate("/customer-imports/" + result.data.id);
    } catch (cause) { started.current = false; setError(errorText(cause, t("imports.actionFailed"), translateError)); } finally { setBusy(false); }
  }, [navigate, onClose, t, translateError]);
  useEffect(() => {
    if (!source || source.scan_status !== "pending") return;
    const timer = window.setTimeout(() => void api.request<{ data: PrivateDocument }>("/documents/" + source.id).then((result) => setSource(result.data)).catch((cause) => setError(errorText(cause, t("imports.actionFailed"), translateError))), 1500);
    return () => window.clearTimeout(timer);
  }, [source, t, translateError]);
  useEffect(() => { if (source?.scan_status === "clean") void start(source.id); }, [source, start]);
  async function choose(file: File | null) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError(t("imports.fileTooLarge")); return; }
    started.current = false; setBusy(true); setError("");
    try { const body = new FormData(); body.append("file", file); body.append("title", file.name); body.append("category", "document"); body.append("upload_key", crypto.randomUUID()); const result = await api.request<{ data: PrivateDocument }>("/documents", { method: "POST", body }); setSource(result.data); } catch (cause) { setError(errorText(cause, t("imports.actionFailed"), translateError)); setBusy(false); }
  }
  async function retryScan() { if (!source) return; setBusy(true); setError(""); try { const result = await api.request<{ data: PrivateDocument }>("/documents/" + source.id + "/rescan", { method: "POST", body: "{}" }); setSource(result.data); } catch (cause) { setError(errorText(cause, t("imports.actionFailed"), translateError)); setBusy(false); } }
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{t("imports.uploadFile")}</DialogTitle><DialogDescription>{t("imports.autoUploadDescription")}</DialogDescription></DialogHeader>{!source ? <div className="space-y-3"><Label htmlFor="import-file">{t("imports.customerFile")}</Label><Input id="import-file" type="file" accept=".csv,.xlsx" disabled={busy} onChange={(event) => void choose(event.target.files?.[0] || null)} />{busy && <p role="status">{t("imports.uploading")}</p>}</div> : <div className="space-y-3 rounded-lg border bg-muted/20 p-4"><p className="font-medium">{source.filename}</p><p>{t("imports.scannedFile", { status: t("status." + source.scan_status) })}</p>{source.scan_status === "pending" && <p role="status">{t("imports.analyzingFile")}</p>}{source.scan_status === "clean" && <p role="status">{t("imports.creatingPreview")}</p>}{source.scan_status === "failed" && <Button disabled={busy} variant="outline" onClick={() => void retryScan()}>{t("imports.retryScan")}</Button>}{source.scan_status === "rejected" && <p role="alert" className="text-destructive">{t("imports.fileRejected")}</p>}</div>}{error && <p role="alert" className="text-destructive">{error}</p>}</DialogContent></Dialog>;
}

export function CustomerImportDetails() {
  const { id } = useParams(); const { t, translateError } = useTranslation(); const { user } = useSession();
  const resource = useApiResource<ImportResponse>("/customer-imports/" + id); const [local, setLocal] = useState<CustomerImport | null>(null); const [busy, setBusy] = useState(false); const [problems, setProblems] = useState(false); const [mappingReview, setMappingReview] = useState(false);
  const loaded = resource.data?.data;
  const batch = local && loaded && local.id === loaded.id && local.version >= loaded.version ? local : loaded;
  const canWrite = user?.permissions.includes("imports.write") ?? false; const summary = resource.data?.summary;
  const refresh = useCallback((updated?: CustomerImport) => { if (updated) setLocal(updated); resource.reload(); }, [resource]);
  useEffect(() => { if (!batch || !processing(batch.status)) return; const timer = window.setInterval(resource.reload, 1800); return () => window.clearInterval(timer); }, [batch, resource.reload]);
  async function importCustomers() { if (!batch) return; setBusy(true); try { const result = await api.request<{ data: CustomerImport }>("/customer-imports/" + batch.id + "/commit", { method: "POST", body: JSON.stringify({ version: batch.version }) }); refresh(result.data); toast.success(t("imports.importStarted")); } catch (cause) { toast.error(errorText(cause, t("imports.actionFailed"), translateError)); } finally { setBusy(false); } }
  if (!batch) return <div className="space-y-4"><Button asChild variant="ghost"><Link to="/customer-imports">{t("imports.backToImports")}</Link></Button><p role="status">{resource.error ? translateError(resource.error) : t("common.loading")}</p></div>;
  const needsMapping = batch.mapping_diagnostics?.needs_mapping ?? []; const importable = ["ready", "completed_with_attention", "completed_with_errors"].includes(batch.status);
  return <div className="space-y-6"><Button asChild variant="ghost"><Link to="/customer-imports">{t("imports.backToImports")}</Link></Button><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">{batch.file?.title || t("imports.importTitle", { id: batch.id })}</h1><p className="text-muted-foreground">{t("imports.guidedFlow")}</p></div><Button variant="outline" onClick={() => refresh()}><RefreshCw className="size-4" />{t("imports.refreshImport")}</Button></div>{resource.error && <p role="alert" className="text-destructive">{translateError(resource.error)}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Step number="1" title={t("imports.stepUpload")} detail={batch.file?.filename || t("imports.vistaExpressImport", { id: batch.id })} done={batch.status !== "parsing"} /><Step number="2" title={t("imports.stepMapping")} detail={needsMapping.length ? t("imports.mappingNeedsAttention", { count: needsMapping.length }) : t("imports.mappingDetected", { count: Object.keys(batch.mapping || {}).length })} done={!needsMapping.length} /><Step number="3" title={t("imports.stepValidation")} detail={t("imports.recordsSummary", { valid: summary?.valid ?? 0, attention: summary?.requires_attention ?? 0 })} done={!processing(batch.status) && batch.status !== "mapping"} /><Step number="4" title={t("imports.stepImport")} detail={t("imports.rowsProcessed", { processed: batch.processed_rows, total: batch.total_rows })} done={batch.status.startsWith("completed")} /></div>
    <Card><CardContent className="space-y-4 pt-6"><div className="flex flex-wrap items-center gap-3"><Status value={batch.status} />{batch.last_error && <span className="text-sm text-destructive">{translateError(batch.last_error)}</span>}</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label={t("imports.totalRecords")} value={summary?.total ?? batch.total_rows} /><Metric label={t("imports.validRecords")} value={summary?.valid ?? 0} /><Metric label={t("imports.duplicates")} value={summary?.duplicates ?? 0} warn={(summary?.duplicates ?? 0) > 0} /><Metric label={t("imports.needsAttention")} value={summary?.requires_attention ?? 0} warn={(summary?.requires_attention ?? 0) > 0} /></div>{processing(batch.status) && <p role="status">{t("imports.processingMessage")}</p>}<div className="flex flex-wrap gap-2">{canWrite && importable && <Button disabled={busy || ((summary?.valid ?? 0) === 0 && batch.processed_rows === 0)} onClick={() => void importCustomers()}><UsersRound className="size-4" />{t("imports.importCustomers")}</Button>}{canWrite && ["mapping", "ready"].includes(batch.status) && batch.processed_rows === 0 && <Button variant="outline" onClick={() => setMappingReview((open) => !open)}>{mappingReview || batch.status === "mapping" ? t("imports.hideMappingReview") : t("imports.reviewMapping")}</Button>}{canWrite && ((summary?.requires_attention ?? 0) > 0 || batch.status === "completed_with_errors") && <Button variant="outline" onClick={() => setProblems(true)}><AlertTriangle className="size-4" />{t("imports.reviewProblems")}</Button>}</div></CardContent></Card>
    {(batch.status === "mapping" || mappingReview) && canWrite && <MappingReview batch={batch} optionalReview={batch.status !== "mapping"} onSaved={(updated) => { setMappingReview(false); refresh(updated); }} />}{batch.headers && <DetectedMapping batch={batch} />}{problems && <ProblemRows batch={batch} onClose={() => setProblems(false)} onSaved={refresh} />}
  </div>;
}

function Step({ number, title, detail, done }: { number: string; title: string; detail: string; done: boolean }) { return <Card className={done ? "border-primary/30" : ""}><CardContent className="flex gap-3 pt-5"><span className={done ? "text-primary" : "text-muted-foreground"}>{done ? <CheckCircle2 className="size-5" /> : <span className="font-semibold">{number}</span>}</span><div><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{detail}</p></div></CardContent></Card>; }
function Metric({ label, value, warn }: { label: string; value: number; warn?: boolean }) { return <div className={warn ? "rounded-lg border border-amber-500/30 bg-amber-500/5 p-3" : "rounded-lg border p-3"}><p className="text-2xl font-semibold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>; }

function DetectedMapping({ batch }: { batch: CustomerImport }) { const { t } = useTranslation(); const mapped = batch.mapping_diagnostics?.mapped ?? {}; const additional = batch.mapping_diagnostics?.additional_fields ?? []; return <Card><CardHeader><CardTitle><h2>{t("imports.detectedMapping")}</h2></CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2">{Object.entries(mapped).map(([field, detail]) => <Badge key={field} variant="secondary">{t(fieldLabels[field as CustomerField])}: {detail.header}</Badge>)}</div>{additional.length > 0 && <p className="text-sm text-muted-foreground">{t("imports.additionalFieldsPreserved", { count: additional.length })}: {additional.map((item) => item.header).join(", ")}</p>}</CardContent></Card>; }

function MappingReview({ batch, onSaved, optionalReview = false }: { batch: CustomerImport; onSaved: (batch?: CustomerImport) => void; optionalReview?: boolean }) {
  const { t, translateError } = useTranslation();
  const [mapping, setMapping] = useState<Partial<Record<CustomerField, number>>>(batch.mapping || {});
  const [additional, setAdditional] = useState<Record<number, { action: "custom" | "ignore"; key?: string }>>(batch.additional_mapping || {});
  const [dateFormat, setDateFormat] = useState(batch.date_format);
  const [busy, setBusy] = useState(false);
  const needs = batch.mapping_diagnostics?.needs_mapping ?? requiredFields.filter((field) => mapping[field] === undefined);
  const headers = batch.headers || [];
  const mappedColumns = new Set(Object.values(mapping).filter((column): column is number => column !== undefined));
  const detectedAdditional = new Map((batch.mapping_diagnostics?.additional_fields ?? []).map((item) => [item.column, item]));
  const additionalFields = headers
    .map((header, column) => ({ column, header: header || t("imports.unnamedColumn"), key: detectedAdditional.get(column)?.key || header || `Additional field ${column + 1}` }))
    .filter((item) => !mappedColumns.has(item.column));
  const fieldsToReview = optionalReview ? fields : needs;

  function keepAsCustom(next: Record<number, { action: "custom" | "ignore"; key?: string }>, column: number) {
    next[column] = { action: "custom", key: next[column]?.key || headers[column] || `Additional field ${column + 1}` };
  }

  function mapStandard(field: CustomerField, column: number | undefined) {
    const nextMapping = { ...mapping };
    const nextAdditional = { ...additional };
    const previousColumn = nextMapping[field];
    if (column === undefined) {
      delete nextMapping[field];
      if (previousColumn !== undefined) keepAsCustom(nextAdditional, previousColumn);
    } else {
      if (previousColumn !== undefined && previousColumn !== column) keepAsCustom(nextAdditional, previousColumn);
      for (const [otherField, mappedColumn] of Object.entries(nextMapping)) {
        if (otherField !== field && mappedColumn === column) delete nextMapping[otherField as CustomerField];
      }
      nextMapping[field] = column;
      delete nextAdditional[column];
    }
    setMapping(nextMapping);
    setAdditional(nextAdditional);
  }

  function setColumn(column: number, value: string) {
    if (value.startsWith("standard:")) {
      mapStandard(value.slice(9) as CustomerField, column);
      return;
    }
    setAdditional((previous) => ({ ...previous, [column]: { action: value === "ignore" ? "ignore" : "custom", key: previous[column]?.key || headers[column] || `Additional field ${column + 1}` } }));
  }

  async function save() {
    setBusy(true);
    try {
      const result = await api.request<{ data: CustomerImport }>("/customer-imports/" + batch.id + "/mapping", { method: "PATCH", body: JSON.stringify({ version: batch.version, mapping, additional_mapping: additional, date_format: dateFormat }) });
      toast.success(t("imports.mappingSaved"));
      onSaved(result.data);
    } catch (cause) {
      toast.error(errorText(cause, t("imports.actionFailed"), translateError));
    } finally {
      setBusy(false);
    }
  }

  return <Card><CardHeader><CardTitle><h2>{optionalReview ? t("imports.mappingReviewTitle") : t("imports.mappingNeedsReview")}</h2></CardTitle></CardHeader><CardContent className="space-y-5"><p className="text-muted-foreground">{optionalReview ? t("imports.mappingReviewHelp") : t("imports.mappingOnlyNeeded")}</p>{fieldsToReview.map((field) => { const inputId = `customer-import-${field}`; return <div key={field}><Label htmlFor={inputId}>{t(fieldLabels[field])}{requiredFields.includes(field) ? " *" : ""}</Label><select id={inputId} className={selectClass} value={mapping[field] ?? ""} onChange={(event) => mapStandard(field, event.target.value === "" ? undefined : Number(event.target.value))}><option value="">{t("imports.selectColumn")}</option>{headers.map((header, column) => <option key={column} value={column}>{column + 1}. {header || t("imports.unnamedColumn")}</option>)}</select></div>; })}{batch.mapping_diagnostics?.date_format_confidence !== undefined && (batch.mapping_diagnostics.date_format_confidence < 0.72 || optionalReview && mapping.date_of_birth !== undefined) && <div><Label htmlFor="customer-import-date-format">{t("imports.dateFormatLabel")}</Label><select id="customer-import-date-format" className={selectClass} value={dateFormat} onChange={(event) => setDateFormat(event.target.value)}><option value="Y-m-d">{t("imports.dateFormatYmd")}</option><option value="d/m/Y">{t("imports.dateFormatDmy")}</option><option value="m/d/Y">{t("imports.dateFormatMdy")}</option><option value="excel">{t("imports.dateFormatExcel")}</option></select></div>}{additionalFields.length > 0 && <details><summary className="cursor-pointer font-medium">{t("imports.adjustAdditionalFields")}</summary><div className="mt-3 space-y-3">{additionalFields.map((item) => <div className="grid gap-2 rounded border p-3 sm:grid-cols-[1fr_180px_1fr]" key={item.column}><span>{item.header}</span><select className={selectClass} value={additional[item.column]?.action === "ignore" ? "ignore" : "custom"} onChange={(event) => setColumn(item.column, event.target.value)}><option value="custom">{t("imports.storeCustomField")}</option><option value="ignore">{t("imports.ignoreColumn")}</option>{fields.map((field) => <option key={field} value={'standard:' + field}>{t("imports.useAs", { field: t(fieldLabels[field]) })}</option>)}</select><Input value={additional[item.column]?.key || item.key} disabled={additional[item.column]?.action === "ignore"} onChange={(event) => setAdditional((previous) => ({ ...previous, [item.column]: { action: previous[item.column]?.action || "custom", key: event.target.value } }))} /></div>)}</div></details>}<Button disabled={busy || requiredFields.some((field) => mapping[field] === undefined)} onClick={() => void save()}>{busy ? t("common.loading") : t("imports.continueValidation")}</Button></CardContent></Card>;
}

function ProblemRows({ batch, onClose, onSaved }: { batch: CustomerImport; onClose: () => void; onSaved: (batch?: CustomerImport) => void }) {
  const { t, translateError } = useTranslation(); const rows = useApiResource<Page<ImportRow>>("/customer-imports/" + batch.id + "/rows?attention=true"); const [selected, setSelected] = useState<ImportRow | null>(null);
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>{t("imports.reviewProblems")}</DialogTitle><DialogDescription>{t("imports.problemHelp")}</DialogDescription></DialogHeader>{rows.error && <p role="alert" className="text-destructive">{translateError(rows.error)}</p>}<div className="space-y-3">{rows.data?.data.map((row) => <div key={row.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{t("imports.rowNumber", { row: row.row_number })}</p><p>{[row.payload?.first_name, row.payload?.last_name].filter(Boolean).join(" ") || row.raw_values.slice(0, 2).join(" ")}</p>{row.errors?.map((error) => <p key={error} className="text-sm text-destructive">{error}</p>)}{row.file_duplicate && <p className="text-sm text-amber-700">{t("imports.possibleDuplicates")}</p>}{row.matches?.length ? <p className="text-sm text-amber-700">{t("imports.matchingCustomers", { count: row.matches.length })}</p> : null}</div><Button size="sm" variant="outline" onClick={() => setSelected(row)}>{t("imports.reviewFix")}</Button></div></div>)}</div>{!rows.data?.data.length && <p className="py-5 text-center text-muted-foreground">{t("imports.noProblems")}</p>}{selected && <ProblemEditor row={selected} batch={batch} onClose={() => setSelected(null)} onSaved={(updated) => { onSaved(updated); rows.reload(); setSelected(null); }} />}</DialogContent></Dialog>;
}

function ProblemEditor({ row, batch, onClose, onSaved }: { row: ImportRow; batch: CustomerImport; onClose: () => void; onSaved: (batch?: CustomerImport) => void }) {
  const { t, translateError } = useTranslation(); const [payload, setPayload] = useState<Record<CustomerField, string>>(() => Object.fromEntries(fields.map((field) => [field, row.payload?.[field] || ""])) as Record<CustomerField, string>); const [custom, setCustom] = useState<Record<string, string>>(row.custom_fields || {}); const [busy, setBusy] = useState(false);
  async function correct() { setBusy(true); try { const result = await api.request<{ data: CustomerImport }>("/customer-imports/" + batch.id + "/rows/" + row.id, { method: "PATCH", body: JSON.stringify({ version: batch.version, payload, custom_fields: custom }) }); toast.success(t("imports.rowCorrected")); onSaved(result.data); } catch (cause) { toast.error(errorText(cause, t("imports.actionFailed"), translateError)); } finally { setBusy(false); } }
  async function decide(decision: "skip" | "create_distinct" | "update") { setBusy(true); try { const match = row.matches?.[0]; const result = await api.request<{ data: CustomerImport }>("/customer-imports/" + batch.id + "/decisions", { method: "PATCH", body: JSON.stringify({ version: batch.version, rows: [{ id: row.id, decision, target_customer_id: decision === "update" ? match?.id : undefined, target_version: decision === "update" ? match?.version : undefined, reason: decision === "skip" ? undefined : t("imports.reviewedReason") }] }) }); toast.success(t("imports.decisionSaved")); onSaved(result.data); } catch (cause) { toast.error(errorText(cause, t("imports.actionFailed"), translateError)); } finally { setBusy(false); } }
  return <div className="mt-5 rounded-lg border bg-muted/20 p-4"><div className="mb-3 flex items-center justify-between"><p className="font-medium">{t("imports.reviewRowTitle", { row: row.row_number })}</p><Button size="sm" variant="ghost" onClick={onClose}>{t("common.close")}</Button></div><div className="grid gap-3 sm:grid-cols-2">{fields.map((field) => <div key={field} className={field === "street_address" ? "sm:col-span-2" : ""}><Label>{t(fieldLabels[field])}{requiredFields.includes(field) ? " *" : ""}</Label><Input type={field === "date_of_birth" ? "date" : "text"} value={payload[field]} onChange={(event) => setPayload((previous) => ({ ...previous, [field]: event.target.value }))} /></div>)}</div>{Object.keys(custom).length > 0 && <div className="mt-3 space-y-2"><Label>{t("imports.extraInformation")}</Label>{Object.entries(custom).map(([key, value]) => <div className="flex gap-2" key={key}><Input value={key} disabled /><Input value={value} onChange={(event) => setCustom((previous) => ({ ...previous, [key]: event.target.value }))} /></div>)}</div>}<div className="mt-4 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void correct()}>{t("imports.saveCorrection")}</Button><Button disabled={busy} variant="outline" onClick={() => void decide("skip")}>{t("imports.decisionSkip")}</Button>{row.matches?.[0] && <Button disabled={busy} variant="outline" onClick={() => void decide("update")}>{t("imports.updateMatchingCustomer")}</Button>}{(row.matches?.length || row.file_duplicate) ? <Button disabled={busy} variant="outline" onClick={() => void decide("create_distinct")}>{t("imports.decisionCreateDistinct")}</Button> : null}</div></div>;
}

import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { ApiError } from "../../../../contracts/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import type { Customer, Page } from "../../../../contracts/customers";
import type {
  OpticalDefinition,
  OpticalField,
  OpticalRecord,
} from "../../../../contracts/optical";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import OpticalForm from "./OpticalForm";
export default function OpticalCare({
  customer,
  onChange,
}: {
  customer: Customer;
  onChange: () => void;
}) {
  const { user } = useSession();
  const { t, translateError, formatDate } = useTranslation();
  const [kind, setKind] = useState("prescription");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [editor, setEditor] = useState<OpticalRecord | "new" | null>(null);
  const [selected, setSelected] = useState<OpticalRecord | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [amendKey, setAmendKey] = useState(() => crypto.randomUUID());
  const definitions = useApiResource<{ data: OpticalDefinition[] }>(
    "/optical/dictionary",
  );
  const records = useApiResource<Page<OpticalRecord>>(
    "/customers/" +
      customer.id +
      "/optical?" +
      new URLSearchParams({ kind, status, page: String(page) }),
  );
  const definition = definitions.data?.data.find((d) => d.kind === kind);
  const kindLabel = (value: string, fallback: string) => {
    const key = "optical.kind." + value;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  const fieldLabel = (name: string, field: OpticalField) => {
    const key = "optical.field." + name;
    const translated = t(key);
    return translated === key ? field.label : translated;
  };
  const canWrite =
    customer.status === "active" && user?.permissions.includes("optical.write");
  const refresh = () => {
    records.reload();
    onChange();
  };
  const action = async (type: "finalize" | "amend") => {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await api.post<{ data: OpticalRecord }>(
        "/customers/" + customer.id + "/optical/" + selected.id + "/" + type,
        {
          version: selected.version,
          ...(type === "amend" ? { reason, creation_key: amendKey } : {}),
        },
      );
      refresh();
      if (type === "amend") {
        setSelected(null);
        setEditor(result.data);
        setReason("");
        setAmendKey(crypto.randomUUID());
      } else setSelected(result.data);
    } catch (e) {
      setMessage(
        e instanceof ApiError
          ? translateError(
              [e.message, ...Object.values(e.errors).flat()].join(" "),
            )
          : e instanceof Error
            ? translateError(e.message)
            : t("optical.error.operationFailed"),
      );
    } finally {
      setBusy(false);
    }
  };
  const open = async (id: number) => {
    setBusy(true);
    setMessage("");
    try {
      const result = await api.request<{ data: OpticalRecord }>(
        "/customers/" + customer.id + "/optical/" + id,
      );
      setSelected(result.data);
      setKind(result.data.kind);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? translateError(e.message)
          : t("optical.error.recordUnavailable"),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("optical.care.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <OperationsWorkspace module="output-optical" customerId={customer.id} />
        <div className="flex flex-wrap gap-3">
          <select
            aria-label={t("optical.care.recordTypeAriaLabel")}
            value={kind}
            className="h-9 rounded-md border border-input bg-background px-3"
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
          >
            {definitions.data?.data.map((d) => (
              <option key={d.kind} value={d.kind}>
                {kindLabel(d.kind, d.label)}
              </option>
            ))}
          </select>
          <select
            aria-label={t("optical.care.statusAriaLabel")}
            value={status}
            className="h-9 rounded-md border border-input bg-background px-3"
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("optical.care.allStatuses")}</option>
            <option value="draft">{t("status.draft")}</option>
            <option value="finalized">{t("status.finalized")}</option>
          </select>
          {canWrite && user?.permissions.includes("optical.create") && definition && (
            <Button onClick={() => setEditor("new")}>
              {t("optical.care.newRecord", {
                kind: kindLabel(definition.kind, definition.label),
              })}
            </Button>
          )}
          <Button variant="outline" onClick={records.reload}>
            {t("optical.care.refreshRecords")}
          </Button>
        </div>
        {(definitions.error || records.error) && (
          <p role="alert">
            {translateError(definitions.error || records.error)}
          </p>
        )}
        {message && !selected && (
          <p role="alert" className="text-destructive">
            {message}
          </p>
        )}
        {records.loading && (
          <p role="status">{t("optical.care.loadingRecords")}</p>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              {[
                t("optical.care.columnRecord"),
                t("optical.care.columnRecordedOn"),
                t("optical.care.columnPractitioner"),
                t("common.status"),
                t("common.actions"),
              ].map((v) => (
                <TableHead key={v}>{v}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.data?.data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {t("optical.care.recordRef", {
                    id: r.id,
                    revision: r.revision,
                  })}
                  {r.amendment?.status === "finalized" && (
                    <p className="text-muted-foreground">
                      {t("optical.care.supersededBy", { id: r.amendment.id })}
                    </p>
                  )}
                </TableCell>
                <TableCell>{formatDate(r.recorded_on)}</TableCell>
                <TableCell>{r.practitioner}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {t("status." + r.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void open(r.id)}
                  >
                    {t("optical.care.openRecord")}
                  </Button>
                  {r.status === "finalized" && r.amendment?.status !== "finalized" && user?.permissions.includes("reminders.write") && canWrite && ["optometry", "examination", "contact_lens"].includes(r.kind) && <Button asChild variant="outline" size="sm"><Link to={"/reminders?customer=" + customer.id + "&kind=" + (r.kind === "contact_lens" ? "contact_lens" : "checkup") + "&care=" + r.id + "&create=1"}>{t(r.kind === "contact_lens" ? "ops.contact_lens" : "ops.nextCheckup")}</Link></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!records.loading && !records.data?.data.length && (
          <p className="p-4 text-muted-foreground text-center">
            {t("optical.care.emptyRecords", {
              kind: definition
                ? kindLabel(definition.kind, definition.label).toLowerCase()
                : "",
            })}
          </p>
        )}
        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            disabled={page <= 1 || records.loading}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("optical.care.previousRecords")}
          </Button>
          <span>
            {page} / {records.data?.last_page || 1}
          </span>
          <Button
            variant="outline"
            disabled={page >= (records.data?.last_page || 1) || records.loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("optical.care.nextRecords")}
          </Button>
        </div>
        {editor && definition && (
          <OpticalForm
            key={typeof editor === "string" ? "new" : editor.id}
            customerId={customer.id}
            definition={definition}
            record={editor === "new" ? undefined : editor}
            onClose={() => setEditor(null)}
            onSaved={(r) => {
              setEditor(null);
              setSelected(r);
              refresh();
            }}
          />
        )}
        <Dialog
          open={!!selected}
          onOpenChange={(v) => {
            if (!v && !busy) {
              setSelected(null);
              setMessage("");
              setReason("");
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t("optical.care.recordTitle", {
                  kind: definition
                    ? kindLabel(definition.kind, definition.label)
                    : "",
                  id: selected?.id ?? "",
                  revision: selected?.revision ?? "",
                })}
              </DialogTitle>
              <DialogDescription>
                {selected?.status === "finalized"
                  ? t("optical.care.finalizedDescription")
                  : t("optical.care.draftDescription")}
              </DialogDescription>
            </DialogHeader>
            {selected && (
              <>
                <p>
                  {formatDate(selected.recorded_on)} · {selected.practitioner}{" "}
                  · <Badge>{t("status." + selected.status)}</Badge>
                </p>
                {selected.amends_id && (
                  <p>
                    {t("optical.care.amendsRecord", {
                      id: selected.amends_id,
                    })}
                    : {selected.amendment_reason}
                  </p>
                )}
                {selected.source_record_id && (
                  <Button
                    variant="link"
                    onClick={() => void open(selected.source_record_id!)}
                  >
                    {t("optical.care.openSourceRecord", {
                      id: selected.source_record_id,
                    })}
                  </Button>
                )}
                {selected.prescription_id && (
                  <p>
                    {t("optical.care.linkedPrescription", {
                      id: selected.prescription_id,
                    })}
                  </p>
                )}
                <dl className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(definition?.fields || {})
                    .filter(
                      ([key]) =>
                        selected.data[key] !== null &&
                        selected.data[key] !== undefined &&
                        selected.data[key] !== "",
                    )
                    .map(([key, field]) => (
                      <div
                        key={key}
                        className={
                          field.type === "textarea" ? "sm:col-span-2" : ""
                        }
                      >
                        <dt className="text-muted-foreground">
                          {fieldLabel(key, field)}
                        </dt>
                        <dd className="font-medium whitespace-pre-wrap">
                          {selected.data[key]} {field.unit}
                        </dd>
                      </div>
                    ))}
                </dl>
                <div className="flex flex-wrap gap-2">
                  {user?.permissions.includes("optical.print") && (                  <Button variant="outline" asChild>
                    <Link
                      target="_blank"
                      rel="noopener"
                      to={
                        "/customers/" +
                        customer.id +
                        "/optical/" +
                        selected.id +
                        "/print"
                      }
                    >
                      {t("optical.care.printSheet")}
                    </Link>
                  </Button>)}
                  {canWrite && user?.permissions.includes("optical.edit") && selected.status === "draft" && (
                    <Button
                      onClick={() => {
                        setEditor(selected);
                        setSelected(null);
                      }}
                    >
                      {t("optical.care.editDraft")}
                    </Button>
                  )}
                  {selected.status === "draft" &&
                    customer.status === "active" &&
                    user?.permissions.includes("optical.finalize") && (
                      <Button
                        disabled={busy}
                        onClick={() => void action("finalize")}
                      >
                        {t("optical.care.finalizeLock")}
                      </Button>
                    )}
                  {selected.amendment && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => void open(selected.amendment!.id)}
                    >
                      {t("optical.care.openAmendment", {
                        id: selected.amendment.id,
                      })}
                    </Button>
                  )}
                </div>
                {canWrite && user?.permissions.includes("optical.create") &&
                  selected.status === "finalized" &&
                  !selected.amendment && (
                    <div className="space-y-2 border-t pt-4">
                      <Label htmlFor="amendment-reason">
                        {t("optical.care.amendmentReason")}
                      </Label>
                      <Textarea
                        id="amendment-reason"
                        value={reason}
                        maxLength={2000}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <Button
                        disabled={busy || reason.trim().length < 3}
                        onClick={() => void action("amend")}
                      >
                        {t("optical.care.createAmendment")}
                      </Button>
                    </div>
                  )}
                {message && (
                  <p role="alert" className="text-destructive">
                    {message}
                  </p>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

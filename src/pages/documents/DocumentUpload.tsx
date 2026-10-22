import { useState, type FormEvent } from "react";
import { api } from "@/auth/session";
import { ApiError } from "../../../../contracts/session";
import type { OpticalRecord } from "../../../../contracts/optical";
import type { Page } from "../../../../contracts/customers";
import { useApiResource } from "@/hooks/use-api-resource";
import CustomerPicker from "@/components/customer-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";

function RecordPicker({
  customer,
  category,
  value,
  onChange,
}: {
  customer: number;
  category: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const { t, translateError } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, error } = useApiResource<Page<OpticalRecord>>(
    "/customers/" +
      customer +
      "/optical?" +
      new URLSearchParams({
        page: String(page),
        kind: category === "glasses_image" ? "glasses" : "",
      }),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="document-optical-record">
        {t(category === "glasses_image" ? "documents.linkedRecordRequired" : "documents.linkedRecordOptional")}
      </Label>
      <select
        id="document-optical-record"
        required={category === "glasses_image"}
        className="h-9 w-full rounded-md border bg-background px-3"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">{t("documents.noLinkedRecord")}</option>
        {value && !data?.data.some((r) => r.id === value) && (
          <option value={value}>{t("documents.recordNumber", { id: value })}</option>
        )}
        {data?.data.map((r) => (
          <option key={r.id} value={r.id}>
            {t("optical.kind." + r.kind.replace(/_/g, "_"))} #{r.id} · {r.recorded_on.slice(0, 10)} ·
            rev {r.revision}
          </option>
        ))}
      </select>
      {error && <p role="alert">{translateError(error)}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("documents.previousRecords")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= (data?.last_page || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("documents.moreRecords")}
        </Button>
      </div>
    </div>
  );
}

export default function DocumentUpload({
  customerId,
  onClose,
  onSaved,
}: {
  customerId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, translateError } = useTranslation();
  const [key] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("document");
  const [customer, setCustomer] = useState<number | null>(customerId || null);
  const [record, setRecord] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setMessageKey(null);
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setMessageKey("documents.fileTooLarge");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("title", title);
      body.set("description", description);
      body.set("category", category);
      body.set("upload_key", key);
      if (customer) body.set("customer_id", String(customer));
      if (record) body.set("optical_record_id", String(record));
      await api.request("/documents", { method: "POST", body });
      onSaved();
} catch (e) {
      setMessage(
        e instanceof ApiError
          ? translateError([e.message, ...Object.values(e.errors).flat()].join(" "))
          : e instanceof Error
            ? translateError(e.message)
            : t("documents.uploadFailed"),
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
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("documents.uploadTitle")}</DialogTitle>
          <DialogDescription>
            {t("documents.uploadDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div>
              <Label htmlFor="document-file">{t("documents.file")}</Label>
              <Input
                id="document-file"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,.xlsx"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  if (!title && f) setTitle(f.name);
                }}
              />
              <p className="text-sm text-muted-foreground">
                {t("documents.acceptedTypes")} {t("documents.max25Mp")}.
              </p>
            </div>
            <div>
              <Label htmlFor="document-title">{t("documents.titleLabel")}</Label>
              <Input
                id="document-title"
                required
                maxLength={255}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="document-category">{t("documents.category")}</Label>
              <select
                id="document-category"
                className="h-9 w-full rounded-md border bg-background px-3"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setRecord(null);
                }}
              >
                <option value="document">{t("documents.categoryDocument")}</option>
                <option value="customer_image">{t("documents.categoryCustomerImage")}</option>
                <option value="glasses_image">{t("documents.categoryGlassesImage")}</option>
              </select>
            </div>
            {!customerId && (
              <CustomerPicker
                id="document-customer"
                value={customer}
                onChange={(v) => {
                  setCustomer(v);
                  setRecord(null);
                }}
              />
            )}
            {customer && (
              <RecordPicker
                key={customer + category}
                customer={customer}
                category={category}
                value={record}
                onChange={setRecord}
              />
            )}
            <div>
              <Label htmlFor="document-description">{t("documents.description")}</Label>
              <Textarea
                id="document-description"
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </fieldset>
          {message && (
            <p role="alert" className="text-destructive">
              {message}
            </p>
          )}
          {messageKey && (
            <p role="alert" className="text-destructive">
              {t(messageKey)}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !file}>
              {busy ? t("documents.uploadingText") : t("documents.uploadDocumentBtn")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { Link, useParams } from "react-router-dom";
import { useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import type { Customer } from "../../../../contracts/customers";
import type {
  OpticalRecord,
  OpticalDefinition,
  OpticalField,
} from "../../../../contracts/optical";
import { Button } from "@/components/ui/button";
export default function OpticalSheet() {
  const { id, recordId } = useParams();
  const { user } = useSession();
  const { t, translateError, formatDate, formatDateTime } = useTranslation();
  const customer = useApiResource<{ data: Customer }>("/customers/" + id);
  const record = useApiResource<{ data: OpticalRecord }>(
    "/customers/" + id + "/optical/" + recordId + "?purpose=print",
  );
  const definitions = useApiResource<{ data: OpticalDefinition[] }>(
    "/optical/dictionary",
  );
  const c = customer.data?.data;
  const r = record.data?.data;
  const definition = definitions.data?.data.find((d) => d.kind === r?.kind);
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
  const unitLabel = (unit?: string) => {
    if (!unit) return "";
    const key = "optical.unit." + unit;
    const translated = t(key);
    return translated === key ? unit : translated;
  };
  const failure =
    customer.error || record.error || definitions.error || null;
  if (!c || !r || !definition)
    return (
      <p role={failure ? "alert" : "status"}>
        {translateError(failure) || t("optical.sheet.loading")}
      </p>
    );
  return (
    <>
      <style>
        {
          "@media print { body * { visibility:hidden } #optical-sheet, #optical-sheet * { visibility:visible } #optical-sheet { position:absolute;left:0;top:0;width:100%;color:#000;background:#fff;padding:20px } }"
        }
      </style>
      <div className="flex gap-3 mb-5 print:hidden">
        <Button onClick={() => window.print()}>{t("optical.sheet.print")}</Button>
        <Button variant="outline" asChild>
          <Link to={"/customers/" + id}>
            {t("optical.sheet.backToCustomer")}
          </Link>
        </Button>
      </div>
      <article
        id="optical-sheet"
        className="rounded-lg border p-6 space-y-6 bg-card"
      >
        <header>
          <h1 className="text-2xl font-semibold">
            {user?.shop?.name} · {kindLabel(r.kind, definition.label)}
          </h1>
          <p>
            {c.first_name} {c.last_name} ·{" "}
            {t("optical.sheet.customerRef", { id: c.id })}
          </p>
          <p>
            {t("optical.sheet.dateOfBirth", {
              date: c.date_of_birth
                ? formatDate(c.date_of_birth)
                : t("common.notSupplied"),
            })}
          </p>
          <p>
            {t("optical.sheet.recordLine", {
              id: r.id,
              revision: r.revision,
              status: t("status." + r.status).toUpperCase(),
            })}
          </p>
          <p>
            {t("optical.sheet.recordedBy", {
              date: formatDate(r.recorded_on),
              practitioner: r.practitioner,
            })}
          </p>
          {r.amendment && (
            <p>
              {t("optical.sheet.laterAmendment", {
                id: r.amendment.id,
                status: t("status." + r.amendment.status),
              })}
            </p>
          )}
          {r.amends_id && (
            <p>
              {t("optical.sheet.amends", {
                id: r.amends_id,
                reason: r.amendment_reason ?? "",
              })}
            </p>
          )}
        </header>
        <dl className="grid grid-cols-2 gap-4">
          {Object.entries(definition.fields).map(([name, field]) => (
            <div
              key={name}
              className={field.type === "textarea" ? "col-span-2" : ""}
            >
              <dt className="text-sm">
                {fieldLabel(name, field)}
                {field.unit ? " (" + unitLabel(field.unit) + ")" : ""}
              </dt>
              <dd className="font-medium whitespace-pre-wrap">
                {r.data[name] ?? t("optical.notRecorded")}
              </dd>
            </div>
          ))}
        </dl>
        <footer className="border-t pt-3 text-sm">
          {r.finalized_at
            ? t("optical.sheet.finalizedOn", {
                date: formatDateTime(r.finalized_at),
              })
            : t("optical.sheet.draftNotFinalized")}
          {r.source_record_id && (
            <p>
              {t("optical.sheet.sourceRecord", { id: r.source_record_id })}
            </p>
          )}
          {r.prescription_id && (
            <p>
              {t("optical.sheet.linkedPrescription", {
                id: r.prescription_id,
              })}
            </p>
          )}
          </footer>
      </article>
    </>
  );
}

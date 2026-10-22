import { useState } from "react";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { OpticalRecord, OpticalKind } from "../../../contracts/optical";
import type { Page } from "../../../contracts/customers";
export default function OpticalRecordPicker({
  customerId,
  value,
  onChange,
  kinds,
  finalized = false,
  label,
}: {
  customerId: number;
  value: number | null;
  onChange: (value: number | null) => void;
  kinds?: OpticalKind[];
  finalized?: boolean;
  label?: string;
}) {
  const [page, setPage] = useState(1);
  const { t, translateError, formatDate } = useTranslation();
  const { data, error } = useApiResource<Page<OpticalRecord>>(
    "/customers/" +
      customerId +
      "/optical?" +
      new URLSearchParams({
        page: String(page),
        status: finalized ? "finalized" : "",
      }),
  );
  const rows = data?.data.filter((r) => !kinds || kinds.includes(r.kind)) || [];
  const kindLabel = (value: string) => {
    const key = "optical.kind." + value;
    const translated = t(key);
    return translated === key ? value.replace(/_/g, " ") : translated;
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="linked-care-record">
        {label ?? t("optical.linkedRecordOptional")}
      </Label>
      <select
        id="linked-care-record"
        className="h-9 w-full rounded-md border bg-background px-3"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">{t("optical.picker.noLinkedRecord")}</option>
        {value && !rows.some((r) => r.id === value) && (
          <option value={value}>
            {t("optical.picker.recordOption", { id: value })}
          </option>
        )}
        {rows.map((r) => (
          <option
            key={r.id}
            value={r.id}
            disabled={finalized && r.amendment?.status === "finalized"}
          >
            {t("optical.picker.recordOptionLine", {
              kind: kindLabel(r.kind),
              id: r.id,
              date: formatDate(r.recorded_on),
              revision: r.revision,
            })}
            {r.amendment?.status === "finalized"
              ? t("optical.supersededSuffix")
              : ""}
          </option>
        ))}
      </select>
      {error && <p role="alert">{translateError(error)}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("optical.picker.previousCareRecords")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= (data?.last_page || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("optical.picker.moreCareRecords")}
        </Button>
      </div>
    </div>
  );
}

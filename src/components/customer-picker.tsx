import { useState } from "react";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import type { Customer, ResourcePage } from "../../../contracts/customers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
export default function CustomerPicker({
  id,
  value,
  onChange,
  initial,
  required = false,
}: {
  id: string;
  required?: boolean;
  value: number | null;
  onChange: (value: number | null) => void;
  initial?: { id: number; first_name: string; last_name: string } | null;
}) {
  const { t, translateError } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApiResource<ResourcePage<Customer>>(
    "/customers?" +
      new URLSearchParams({
        search,
        page: String(page),
        per_page: "20",
        status: "active",
      }),
  );
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {required ? t("customers.pickerLabel") : t("customers.pickerOptional")}
      </Label>
      <Input
        aria-label={t("customers.pickerAria")}
        placeholder={t("customers.searchLabel")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <select
        id={id}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">
          {required
            ? t("customers.pickerChoose")
            : t("customers.pickerNone")}
        </option>
        {value && !data?.data.some((c) => c.id === value) && (
          <option value={value}>
            {initial?.id === value
              ? initial.first_name + " " + initial.last_name
              : t("customers.pickerNumber", { value })}
          </option>
        )}
        {data?.data.map((c) => (
          <option key={c.id} value={c.id}>
            {c.first_name} {c.last_name} · #{c.id}
          </option>
        ))}
      </select>
      {error && <p role="alert">{translateError(error)}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("customers.pickerPrevious")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || page >= (data?.meta.last_page || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("customers.pickerMore")}
        </Button>
      </div>
    </div>
  );
}

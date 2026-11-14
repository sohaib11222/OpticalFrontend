import { useState } from "react";
import { useTranslation } from "@/i18n";
import { useState } from "react";
import { useApiResource } from "@/hooks/use-api-resource";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Box } from "lucide-react";
import type { Category, Product } from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export function Paging({
  data,
  page,
  loading,
  onChange,
}: {
  data: { last_page: number; total: number } | null;
  page: number;
  loading: boolean;
  onChange: (p: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {t("common.recordsAndPage", {
          total: data?.total ?? 0,
          page,
          last: data?.last_page ?? 1,
        })}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          {t("common.previous")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading || page >= (data?.last_page ?? 1)}
          onClick={() => onChange(page + 1)}
        >
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
export function ProductPhoto({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return product.primary_image_id ? (
    <img
      src={"/api/v1/catalog-images/" + product.primary_image_id}
      alt={product.name}
      loading="lazy"
      className={
        large
          ? "w-full h-48 object-contain rounded-lg bg-muted/30"
          : "h-12 w-12 object-contain rounded-lg border bg-muted/30"
      }
    />
  ) : (
    <div
      className={
        "flex items-center justify-center bg-muted/30 rounded-lg " +
        (large ? "h-48" : "h-12 w-12")
      }
    >
      <Box className="text-muted-foreground" />
    </div>
  );
}
export function CategoryPicker({
  value,
  onChange,
  initial,
  all = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  initial?: Category;
  all?: boolean;
}) {
  const { t, translateError } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const r = useApiResource<Page<Category>>(
    "/product-categories?" +
      new URLSearchParams({
        search,
        page: String(page),
        ...(all ? {} : { status: "active" }),
      }),
  );
  return (
    <div className="space-y-2">
      <Label htmlFor="category-picker">{t("products.category")}</Label>
      <Input
        aria-label={t("products.searchCategoriesAria")}
        placeholder={t("products.findCategory")}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <div
        id="category-picker"
        className="max-h-48 overflow-y-auto rounded-md border border-input bg-background p-1"
        role="listbox"
        aria-label={t("products.category")}
      >
        {all && (
          <button
            type="button"
            role="option"
            aria-selected={value === null}
            className={`block w-full rounded px-3 py-2 text-left text-sm transition ${
              value === null ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            onClick={() => onChange(null)}
          >
            {t("products.allCategories")}
          </button>
        )}
        {value && !r.data?.data.some((c) => c.id === value) && (
          <button
            type="button"
            role="option"
            aria-selected
            className="block w-full rounded bg-primary px-3 py-2 text-left text-sm text-primary-foreground"
            onClick={() => onChange(value)}
          >
            {initial?.name ?? t("products.categoryNumber", { id: value })}
          </button>
        )}
        {r.data?.data.map((c) => (
          <button
            type="button"
            role="option"
            aria-selected={value === c.id}
            className={`block w-full rounded px-3 py-2 text-left text-sm transition ${
              value === c.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            key={c.id}
            onClick={() => onChange(c.id)}
          >
            {c.name}
            {c.status === "archived" ? t("products.archivedSuffix") : ""}
          </button>
        ))}
        {!r.loading && !r.data?.data.length && (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            {t("common.noResults")}
          </p>
        )}
      </div>
      {r.error && <p role="alert">{translateError(r.error)}</p>}
      {(r.data?.last_page ?? 1) > 1 && (
        <Paging
          data={r.data}
          page={page}
          loading={r.loading}
          onChange={setPage}
        />
      )}
    </div>
  );
}

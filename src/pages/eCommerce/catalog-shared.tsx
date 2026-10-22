import { useState } from "react";
import { useTranslation } from "@/i18n";
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
      <select
        id="category-picker"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">
          {all ? t("products.allCategories") : t("products.chooseCategory")}
        </option>
        {value && !r.data?.data.some((c) => c.id === value) && (
          <option value={value}>
            {initial?.name ?? t("products.categoryNumber", { id: value })}
          </option>
        )}
        {r.data?.data.map((c) => (
          <option value={c.id} key={c.id}>
            {c.name}
            {c.status === "archived" ? t("products.archivedSuffix") : ""}
          </option>
        ))}
      </select>
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

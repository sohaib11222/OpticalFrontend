import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Choice, Paging } from "./catalog-shared";
import type { Category } from "../../../../contracts/commerce";
import type { Page } from "../../../../contracts/customers";
import { ApiError } from "../../../../contracts/session";
export default function CategoryList() {
  const { t, translateError } = useTranslation();
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Category | null | undefined>();
  const q = new URLSearchParams({ search, page: String(page) });
  if (status !== "all") q.set("status", status);
  const r = useApiResource<Page<Category>>("/product-categories?" + q);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("products.productCategories")}</h1>
        <Button variant="outline" asChild>
          <Link to="/products">{t("nav.products")}</Link>
        </Button>
        {user?.permissions.includes("products.write") && user.permissions.includes("products.create") && (
          <Button onClick={() => setEditing(null)}>
            {t("products.newCategory")}
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("nav.categories")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="category-search">
                {t("products.searchCategories")}
              </Label>
              <Input
                id="category-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Choice
              label={t("products.categoryStatus")}
              value={status}
              options={[
                ["all", t("common.all")],
                ["active", t("status.active")],
                ["archived", t("status.archived")],
              ]}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            />
            <Button variant="outline" onClick={r.reload}>
              {t("common.refresh")}
            </Button>
          </div>
          {r.error && <p role="alert">{translateError(r.error)}</p>}
          {r.loading && (
            <p role="status">{t("products.loadingCategories")}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.description")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.data?.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="max-w-md whitespace-pre-wrap break-words">
                    {c.description}
                  </TableCell>
                  <TableCell>{t("status." + c.status)}</TableCell>
                  <TableCell>
                    {user?.permissions.includes("products.write") && user.permissions.includes("products.edit") && (
                      <Button variant="outline" onClick={() => setEditing(c)}>
                        {t("common.edit")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Paging
            data={r.data}
            page={page}
            loading={r.loading}
            onChange={setPage}
          />
        </CardContent>
      </Card>
      {editing !== undefined && (
        <CategoryForm
          category={editing}
          close={() => setEditing(undefined)}
          saved={() => {
            setEditing(undefined);
            r.reload();
          }}
        />
      )}
    </div>
  );
}
function CategoryForm({
  category,
  close,
  saved,
}: {
  category: Category | null;
  close: () => void;
  saved: () => void;
}) {
  const { t, translateError } = useTranslation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{
    name: string;
    description: string;
    status: "active" | "archived";
  }>({
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
      status: category?.status ?? "active",
    },
  });
  const [error, setMessage] = useState("");
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !isSubmitting) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category
              ? t("products.editCategory")
              : t("products.newCategory")}
          </DialogTitle>
          <DialogDescription>
            {t("products.categoryDialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (d) => {
            setMessage("");
            try {
              await api.request(
                "/product-categories" + (category ? "/" + category.id : ""),
                {
                  method: category ? "PATCH" : "POST",
                  body: JSON.stringify({
                    ...d,
                    ...(category ? { version: category.version } : {}),
                  }),
                },
              );
              saved();
            } catch (e) {
              setMessage(
                e instanceof Error
                  ? translateError(e.message)
                  : t("products.unableToSaveCategory"),
              );
              if (e instanceof ApiError)
                for (const [k, v] of Object.entries(e.errors))
                  setError(k as "name", {
                    message: translateError(v[0]),
                  });
            }
          })}
        >
          <Label htmlFor="category-name">
            {t("products.categoryName")}
          </Label>
          <Input
            id="category-name"
            maxLength={100}
            {...register("name", {
              required: t("products.nameRequired"),
            })}
          />
          {errors.name && <p role="alert">{errors.name.message}</p>}
          <Label htmlFor="category-description">
            {t("common.description")}
          </Label>
          <Textarea
            id="category-description"
            maxLength={2000}
            {...register("description")}
          />
          <Label htmlFor="category-state">{t("common.status")}</Label>
          <select
            id="category-state"
            className="h-9 w-full rounded-md border bg-background px-3"
            {...register("status")}
          >
            <option value="active">{t("status.active")}</option>
            <option value="archived">{t("status.archived")}</option>
          </select>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <Button disabled={isSubmitting} type="submit">
            {t("products.saveCategory")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

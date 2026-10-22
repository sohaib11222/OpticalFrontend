import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { ApiError } from "../../../../contracts/session";
import type { Customer } from "../../../../contracts/customers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
type Values = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  street_address: string;
  city: string;
  postal_code: string;
  sex: string;
};
const FIELD_KEYS: Record<keyof Values, string> = {
  first_name: "customers.field.first_name",
  last_name: "customers.field.last_name",
  date_of_birth: "customers.field.date_of_birth",
  phone: "customers.field.phone",
  email: "customers.field.email",
  street_address: "customers.field.street_address",
  city: "customers.field.city",
  postal_code: "customers.field.postal_code",
  sex: "customers.field.sex",
};
export default function CustomerForm({
  customer,
  onClose,
  onSaved,
}: {
  customer?: Customer;
  onClose: () => void;
  onSaved: (c: Customer) => void;
}) {
  const { t, translateError } = useTranslation();
  const [creationKey] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Customer[]>([]);
  const [distinct, setDistinct] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        first_name: z
          .string()
          .trim()
          .min(1, t("customers.error.firstNameRequired"))
          .max(100),
        last_name: z
          .string()
          .trim()
          .min(1, t("customers.error.lastNameRequired"))
          .max(100),
        date_of_birth: z.string(),
        phone: z.string().max(40),
        email: z.union([z.email(), z.literal("")]),
        street_address: z.string().max(255),
        city: z.string().max(100),
        postal_code: z.string().max(32),
        sex: z.string().max(40),
      }),
    [t],
  );
  const labels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(FIELD_KEYS).map(([key, labelKey]) => [
          key,
          t(labelKey),
        ]),
      ) as Record<keyof Values, string>,
    [t],
  );
  const defaults = Object.fromEntries(
    Object.keys(FIELD_KEYS).map((key) => [
      key,
      customer?.[key as keyof Values] ?? "",
    ]),
  ) as Values;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const save = handleSubmit(async (values) => {
    setMessage("");
    setMessageKey(null);
    try {
      const matches = await api.post<{ data: Customer[] }>(
        "/customers/duplicate-check",
        { ...values, exclude_id: customer?.id },
      );
      setDuplicates(matches.data);
      if (matches.data.length && !distinct) {
        setMessageKey("customers.reviewMatches");
        return;
      }
      const result = await api.request<{ data: Customer }>(
        "/customers" + (customer ? "/" + customer.id : ""),
        {
          method: customer ? "PATCH" : "POST",
          body: JSON.stringify({
            ...values,
            creation_key: creationKey,
            version: customer?.version,
            confirm_distinct: distinct,
          }),
        },
      );
      onSaved(result.data);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("customers.saveFailed"));
      if (e instanceof ApiError)
        for (const [field, messages] of Object.entries(e.errors))
          if (field in FIELD_KEYS)
            setError(field as keyof Values, {
              message: translateError(messages[0]),
            });
    }
  });
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {customer ? t("customers.edit") : t("customers.new")}
          </SheetTitle>
          <SheetDescription>
            {t("customers.formDescription")}
          </SheetDescription>
        </SheetHeader>
        <form noValidate onSubmit={save} className="mt-6 space-y-4">
          <fieldset
            onChange={() => setDistinct(false)}
            disabled={isSubmitting}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {Object.entries(labels).map(([key, label]) => (
              <div
                className={key === "street_address" ? "sm:col-span-2" : ""}
                key={key}
              >
                <Label htmlFor={"customer-form-" + key}>{label}</Label>
                <Input
                  id={"customer-form-" + key}
                  type={
                    key === "date_of_birth"
                      ? "date"
                      : key === "email"
                        ? "email"
                        : key === "phone"
                          ? "tel"
                          : "text"
                  }
                  {...register(key as keyof Values)}
                  aria-invalid={!!errors[key as keyof Values]}
                  aria-describedby={
                    errors[key as keyof Values] ? key + "-error" : undefined
                  }
                />
                {errors[key as keyof Values] && (
                  <p
                    id={key + "-error"}
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {errors[key as keyof Values]?.message}
                  </p>
                )}
              </div>
            ))}
          </fieldset>
          {duplicates.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">
                {t("customers.possibleDuplicates")}
              </h3>
              <ul className="space-y-2">
                {duplicates.map((c) => (
                  <li key={c.id}>
                    <Link
                      className="underline"
                      target="_blank"
                      rel="noopener"
                      to={"/customers/" + c.id}
                    >
                      {c.first_name} {c.last_name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {c.email} · {c.phone} · {c.status}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="distinct-customer"
                  checked={distinct}
                  onCheckedChange={(v) => setDistinct(v === true)}
                />
                <Label htmlFor="distinct-customer">
                  {t("customers.confirmDistinct")}
                </Label>
              </div>
            </div>
          )}
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
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("customers.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

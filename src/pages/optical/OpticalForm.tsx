import { useState } from "react";
import OpticalRecordPicker from "@/components/optical-record-picker";
import { Controller, useForm } from "react-hook-form";
import { api } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import { ApiError } from "../../../../contracts/session";
import type { Page } from "../../../../contracts/customers";
import type {
  OpticalDefinition,
  OpticalField,
  OpticalRecord,
} from "../../../../contracts/optical";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
interface Values {
  recorded_on: string;
  practitioner: string;
  prescription_id: string;
  source_record_id: number | null;
  data: Record<string, string | number | null>;
}
const selectStyle =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm";
export default function OpticalForm({
  customerId,
  definition,
  record,
  onClose,
  onSaved,
}: {
  customerId: number;
  definition: OpticalDefinition;
  record?: OpticalRecord;
  onClose: () => void;
  onSaved: (record: OpticalRecord) => void;
}) {
  const [key] = useState(() => crypto.randomUUID());
  const { t, translateError, formatDate } = useTranslation();
  const [message, setMessage] = useState("");
  const [rxPage, setRxPage] = useState(1);
  const links =
    definition.kind === "glasses" || definition.kind === "contact_lens";
  const kindLabel = () => {
    const key = "optical.kind." + definition.kind;
    const translated = t(key);
    return translated === key ? definition.label : translated;
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
  const optionLabel = (value: string) => {
    const key = "optical.option." + value;
    const translated = t(key);
    return translated === key ? value.replace(/_/g, " ") : translated;
  };
  const prescriptions = useApiResource<Page<OpticalRecord>>(
    "/customers/" +
      customerId +
      "/optical?kind=prescription&status=finalized&page=" +
      rxPage,
  );
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      recorded_on:
        record?.recorded_on.slice(0, 10) ||
        new Date().toLocaleDateString("en-CA"),
      practitioner: record?.practitioner || "",
      source_record_id: record?.source_record_id || null,
      prescription_id: record?.prescription_id
        ? String(record.prescription_id)
        : "",
      data: record?.data || {},
    },
  });
  const save = handleSubmit(async (values) => {
    setMessage("");
    try {
      const result = await api.request<{ data: OpticalRecord }>(
        "/customers/" +
          customerId +
          "/optical/" +
          (record?.id || definition.kind),
        {
          method: record ? "PATCH" : "POST",
          body: JSON.stringify({
            ...values,
            prescription_id: values.prescription_id
              ? Number(values.prescription_id)
              : null,
            creation_key: record ? undefined : key,
            version: record?.version,
          }),
        },
      );
      onSaved(result.data);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? translateError(e.message)
          : t("optical.error.saveFailed"),
      );
      if (e instanceof ApiError)
        for (const [field, errors] of Object.entries(e.errors))
          setError(field as "recorded_on", {
            message: translateError(errors[0]),
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
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {record
              ? t("optical.form.editDraft")
              : t("optical.form.newRecord", { kind: kindLabel() })}
          </SheetTitle>
          <SheetDescription>
            {t("optical.form.description")}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={save} className="mt-6 space-y-6">
          <fieldset disabled={isSubmitting} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="optical-date">
                  {t("optical.form.recordedOn")}
                </Label>
                <Input
                  id="optical-date"
                  type="date"
                  placeholder={t("optical.form.placeholderDate")}
                  {...register("recorded_on", {
                    required: t("optical.form.errors.recordedOnRequired"),
                  })}
                />
                {errors.recorded_on && (
                  <p role="alert">{errors.recorded_on.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="optical-practitioner">
                  {t("optical.form.practitioner")}
                </Label>
                <Input
                  id="optical-practitioner"
                  maxLength={150}
                  placeholder={t("optical.form.placeholderText")}
                  {...register("practitioner", {
                    required: t("optical.form.errors.practitionerRequired"),
                  })}
                />
                {errors.practitioner && (
                  <p role="alert">{errors.practitioner.message}</p>
                )}
              </div>
            </div>
            {["examination", "prescription"].includes(definition.kind) && (
              <Controller
                name="source_record_id"
                control={control}
                render={({ field }) => (
                  <OpticalRecordPicker
                    customerId={customerId}
                    value={field.value}
                    onChange={field.onChange}
                    kinds={
                      definition.kind === "examination"
                        ? ["optometry"]
                        : ["optometry", "examination"]
                    }
                    finalized
                    label={t("optical.form.sourceRecordLabel")}
                  />
                )}
              />
            )}
            {links && (
              <div className="space-y-2">
                <Label htmlFor="optical-rx">
                  {t("optical.form.linkedPrescriptionLabel")}
                </Label>
                <select
                  id="optical-rx"
                  className={selectStyle}
                  {...register("prescription_id")}
                >
                  <option value="">
                    {t("optical.form.noLinkedPrescription")}
                  </option>
                  {record?.prescription_id &&
                    !prescriptions.data?.data.some(
                      (r) => r.id === record.prescription_id,
                    ) && (
                      <option value={record.prescription_id}>
                        {t("optical.form.prescriptionOption", {
                          id: record.prescription_id,
                        })}
                      </option>
                    )}
                  {prescriptions.data?.data.map((rx) => (
                    <option
                      key={rx.id}
                      value={rx.id}
                      disabled={rx.amendment?.status === "finalized"}
                    >
                      {t("optical.form.prescriptionOptionLine", {
                        id: rx.id,
                        date: formatDate(rx.recorded_on),
                        revision: rx.revision,
                      })}
                      {rx.amendment?.status === "finalized"
                        ? t("optical.supersededSuffix")
                        : ""}
                    </option>
                  ))}
                </select>
                {prescriptions.error && (
                  <p role="alert">{translateError(prescriptions.error)}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={rxPage <= 1}
                    onClick={() => setRxPage((p) => p - 1)}
                  >
                    {t("optical.form.previousPrescriptions")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={rxPage >= (prescriptions.data?.last_page || 1)}
                    onClick={() => setRxPage((p) => p + 1)}
                  >
                    {t("optical.form.morePrescriptions")}
                  </Button>
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(definition.fields).map(([name, field]) => {
                const path = ("data." + name) as `data.${string}`;
                const props = register(path, {
                  setValueAs: (v) =>
                    v === "" || v == null
                      ? null
                      : field.type === "number"
                        ? Number(v)
                        : v,
                });
                const label =
                  fieldLabel(name, field) +
                  (field.unit ? " (" + unitLabel(field.unit) + ")" : "");
                const error = errors.data?.[name]?.message;
                return (
                  <div
                    key={name}
                    className={field.type === "textarea" ? "sm:col-span-2" : ""}
                  >
                    <Label htmlFor={"optical-" + name}>{label}</Label>
                    {field.type === "select" ? (
                      <select
                        id={"optical-" + name}
                        className={selectStyle}
                        {...props}
                      >
                        <option value="">{t("optical.notRecorded")}</option>
                        {field.options?.map((value) => (
                          <option key={value} value={value}>
                            {optionLabel(value)}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <Textarea
                        id={"optical-" + name}
                        maxLength={field.maxLength}
                        placeholder={t("optical.form.placeholderTextarea")}
                        {...props}
                      />
                    ) : (
                      <Input
                        id={"optical-" + name}
                        type={field.type}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        maxLength={field.maxLength}
                        placeholder={
                          field.type === "number"
                            ? t("optical.form.placeholderNumber")
                            : field.type === "date"
                              ? t("optical.form.placeholderDate")
                              : t("optical.form.placeholderText")
                        }
                        {...props}
                      />
                    )}{" "}
                    {error && (
                      <p role="alert" className="text-sm text-destructive">
                        {translateError(String(error))}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
          {message && (
            <p role="alert" className="text-destructive">
              {message}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("optical.form.saveDraft")}
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

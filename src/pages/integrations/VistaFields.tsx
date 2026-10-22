import { VistaSpecialField, vistaSpecialTypes } from "../../../../contracts/VistaEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VistaField } from "../../../../contracts/vista";
import type { VistaValues } from "../../../../contracts/vista-form";
import { useTranslation } from "@/i18n";

export function VistaFields({
  fields,
  values,
  onChange,
  prefix = "vista",
}: {
  fields: VistaField[];
  values: VistaValues;
  onChange: (v: VistaValues) => void;
  prefix?: string;
}) {
  const { t } = useTranslation();
  const set = (key: string, value: unknown) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="space-y-4">
      {fields.filter(field => !field.hidden).map((field) => {
        const id = prefix + "-" + field.key;
        const value = values[field.key];

        if (vistaSpecialTypes.includes(field.type)) return <VistaSpecialField key={id} field={field} value={value} onChange={v => set(field.key, v)} />;
        if (field.type === "rows") {
          const rows = (Array.isArray(value) ? value : []) as VistaValues[];
          return (
            <fieldset key={id} className="border rounded p-4 space-y-4">
              <legend>{field.label}</legend>
              {rows.map((row, index) => (
                <div
                  className="border-b pb-4 space-y-3"
                  key={String(row.option_key)}
                >
                  <VistaFields
                    fields={field.fields ?? []}
                    values={row}
                    prefix={id + "-" + index}
                    onChange={(v) =>
                      set(
                        field.key,
                        rows.map((r, i) => (i === index ? v : field.key === "variants" && v.is_default ? { ...r, is_default: false } : r)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      set(
                        field.key,
                        rows.filter((_, i) => i !== index),
                      )
                    }
                  >
                    {t("vista.removeOption", { label: field.label, index: index + 1 })}
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                disabled={rows.length >= (field.maxItems ?? 50)}
                onClick={() =>
                  set(field.key, [
                    ...rows,
                    {
                      option_key: crypto.randomUUID(),
                      ...Object.fromEntries(
                        (field.fields ?? [])
                          .filter(
                            (f) =>
                              f.type === "boolean" || f.key === "stock_quantity",
                          )
                          .map((f) => [
                            f.key,
                            f.type === "boolean"
                              ? f.key === "is_active"
                              : 0,
                          ]),
                      ),
                    },
                  ])
                }
              >
                {t("vista.addOption", { label: field.label })}
              </Button>
            </fieldset>
          );
        }

        if (field.type === "boolean")
          return (
            <label key={id} htmlFor={id} className="flex items-center gap-2">
              <input
                id={id}
                type="checkbox"
                checked={value === true}
                onChange={(e) => set(field.key, e.target.checked)}
              />
              {field.label}
            </label>
          );

        if (field.type === "multiselect")
          return (
            <fieldset key={id}>
              <legend>{field.label}</legend>
              <div className="flex flex-wrap gap-3">
                {field.options?.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Array.isArray(value) && value.includes(option)}
                      onChange={(e) =>
                        set(
                          field.key,
                          e.target.checked
                            ? [...(Array.isArray(value) ? value : []), option]
                            : (Array.isArray(value) ? value : []).filter(
                                (v) => v !== option,
                              ),
                          )
                      }
                    />
                    {option.split("_").join(" ")}
                  </label>
                ))}
              </div>
            </fieldset>
          );

        return (
          <div key={id} className="space-y-2">
            <label htmlFor={id}>
              {field.label}
              {field.required ? " *" : ""}
            </label>
            {field.type === "select" ? (
              <select
                id={id}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required={field.required}
                value={String(value ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
              >
                <option value="">{t("vista.selectPlaceholder")}</option>
                {field.allowLegacy && Boolean(value) && !field.options?.includes(String(value)) && <option value={String(value)}>{String(value)}</option>}
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option.split("_").join(" ")}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                id={id}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required={field.required}
                maxLength={field.maxLength}
                value={String(value ?? "")}
                onChange={(e) => set(field.key, e.target.value)}
              />
            ) : (
              <Input
                id={id}
                type={
                  ["number", "date"].includes(field.type) ? field.type : "text"
                }
                required={field.required}
                min={field.min}
                max={field.max}
                step={field.step ?? "any"}
                maxLength={field.maxLength}
                pattern={field.pattern}
                value={
                  Array.isArray(value) ? value.join(", ") : String(value ?? "")
                }
                onChange={(e) =>
                  set(
                    field.key,
                    field.type === "number" && e.target.value !== ""
                      ? Number(e.target.value)
                      : e.target.value,
                  )
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
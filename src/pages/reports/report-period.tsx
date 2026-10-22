import { useState } from "react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export default function ReportPeriod({
  value,
  zone,
  onChange,
}: {
  value: { from: string; to: string };
  zone: string;
  onChange: (v: { from: string; to: string }) => void;
}) {
  const { t } = useTranslation();
  const [from, setFrom] = useState(value.from);
  const [to, setTo] = useState(value.to);
  return (
    <form
      className="flex items-end flex-wrap gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onChange({ from, to });
      }}
    >
      <div>
        <Label htmlFor="report-from">{t("period.fromDate")}</Label>
        <Input
          id="report-from"
          type="date"
          required
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="report-to">{t("period.throughDate")}</Label>
        <Input
          id="report-to"
          type="date"
          required
          min={from}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <Button type="submit">{t("period.apply")}</Button>
      <p className="text-sm text-muted-foreground pb-2">
        {t("period.inclusive", { zone })}
      </p>
    </form>
  );
}

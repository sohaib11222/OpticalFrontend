import { useEffect, useState } from "react";
import { api } from "@/auth/session";
import { useTranslation } from "@/i18n";

export default function UploadProcessingStatus() {
  const { t, translateError, language } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      void api
        .request<{ data: { message: string } }>("/uploads/processing")
        .then((r) => {
          if (alive) setMessage(r.data.message);
        })
        .catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [language]);
  return (
    <p
      className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground"
      role="status"
    >
      {translateError(message ?? t("uploads.defaultMessage"))}{" "}
      {t("uploads.trailingMessage")}
    </p>
  )
}
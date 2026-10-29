import { Link, useParams } from "react-router-dom";
import { useApiResource } from "@/hooks/use-api-resource";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import type { Product } from "../../../../contracts/commerce";
import VistaPublish from "./VistaPublish";
export default function VistaPublishPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const q = useApiResource<{ data: Product }>("/products/" + id);
  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link to={"/products/" + id}>{t("nav.products")}</Link>
      </Button>
      {q.error && <p role="alert">{q.error}</p>}
      {q.loading && <p role="status">{t("common.loading")}</p>}
      {q.data && (
        <VistaPublish
          key={id}
          editor
          product={q.data.data}
          refresh={q.reload}
        />
      )}
    </div>
  );
}

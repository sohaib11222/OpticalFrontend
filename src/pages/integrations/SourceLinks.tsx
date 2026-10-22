import { Link } from "react-router-dom";
import { useSession } from "@/auth/session";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";

export default function SourceLinks({
  kind,
}: {
  kind: "products" | "orders" | "customers";
}) {
  const { user } = useSession();
  const { t } = useTranslation();

  if (!user?.permissions.includes("integrations.read")) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-muted-foreground">{t("vista.sourceLabel")}</span>
      <Button asChild size="sm" variant="outline">
        <Link to={"/integrations/vista?source=" + kind}>
          {kind === "products"
            ? t("vista.viewProducts")
            : t("vista.view" + kind.charAt(0).toUpperCase() + kind.slice(1))}
        </Link>
      </Button>
    </div>
  );
}
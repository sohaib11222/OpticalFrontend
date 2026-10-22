import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "./session";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
export default function ProtectedRoute() {
  const { t, translateError } = useTranslation();
  const { user, loading, error, refresh } = useSession();
  const location = useLocation();
  if (loading)
    return (
      <p role="status" className="p-8">
        {t("user.sessionLoading")}
      </p>
    );
  if (error && !user)
    return (
      <div className="p-8">
        <p role="alert">{translateError(error)}</p>
        <Button onClick={() => void refresh()}>{t("common.retry")}</Button>
      </div>
    );
  if (!user)
    return (
      <Navigate
        to={"/auth/login?redirectTo=" + encodeURIComponent(location.pathname)}
        replace
      />
    );
  return (
    <>
      {error && (
        <p role="alert" className="p-4 text-destructive">
          {translateError(error)}{" "}
          <Button variant="outline" onClick={() => void refresh()}>
            {t("common.retryConnection")}
          </Button>
        </p>
      )}
      <Outlet key={user.id + ":" + user.shop?.id} />
    </>
  );
}
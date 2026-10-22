import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import type { Page } from "../../../contracts/customers";
interface Notice {
  id: number;
  title: string;
  url: string;
  created_at: string;
  read_at: string | null;
}
export function NotificationDropdown() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { t, translateError, formatDateTime } = useTranslation();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const r = useApiResource<{ notices: Page<Notice>; unread: number }>(
    "/notices?page=" + page,
  );
  const reload = r.reload;
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) reload();
    }, 60000);
    return () => clearInterval(timer);
  }, [reload]);
  const unread = r.data?.unread ?? 0;
  return (
    <DropdownMenu
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) r.reload();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("notifications.ariaLabel", { count: unread })}
          className="relative rounded-full h-10 w-10"
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 rounded-xl border shadow-xl"
      >
        <DropdownMenuLabel className="flex justify-between px-4 py-3">
          <span>{t("notifications.title")}</span>
          <span className="text-xs text-muted-foreground">
            {t("common.unread", { count: unread })}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(error || r.error) && (
          <p className="p-3 text-sm text-destructive" role="alert">
            {error || r.error}
          </p>
        )}
        <div className="h-80 overflow-y-auto">
          <div className="flex flex-col">
            {r.loading && !r.data && <p className="p-4">{t("common.loading")}</p>}
            {r.data?.notices.data.length === 0 && (
              <p className="p-4 text-muted-foreground">
                {t("notifications.empty")}
              </p>
            )}
            {r.data?.notices.data.map((n) => (
              <button
                key={n.id}
                type="button"
                disabled={busy}
                className={cn(
                  "flex text-left gap-3 px-4 py-3 transition-colors",
                  !n.read_at
                    ? "bg-muted/50 hover:bg-muted"
                    : "hover:bg-muted/50",
                )}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    if (
                      !n.read_at &&
                      user?.permissions.includes("notices.write")
                    )
                      await api.post("/notices/" + n.id + "/read");
                    r.reload();
                    setOpen(false);
                    if (
                      /^\/(products|orders|customer-imports|agenda)(\/|[?]|$)/.test(
                        n.url,
                      )
                    )
                      navigate(n.url);
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? translateError(e.message)
                        : t("notifications.openFailed"),
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                    <Bell className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(
                      n.created_at,
                      user?.shop?.timezone ?? "UTC",
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-2 border-t space-y-2">
          {(r.data?.notices.last_page ?? 1) > 1 && (
            <div className="flex justify-between">
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1 || r.loading}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("notifications.previous")}
              </Button>
              <span className="text-sm">
                {t("common.pageOf", {
                  page,
                  total: r.data?.notices.last_page ?? 1,
                })}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={page >= (r.data?.notices.last_page ?? 1) || r.loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("notifications.next")}
              </Button>
            </div>
          )}
          {user?.permissions.includes("notices.write") && (
            <Button
              variant="ghost"
              className="w-full"
              disabled={busy || !unread}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api.post("/notices/read-all");
                  r.reload();
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? translateError(e.message)
                      : t("notifications.updateFailed"),
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

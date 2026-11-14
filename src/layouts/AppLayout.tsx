import { canAccessVerifiedAccount } from "../../../contracts/session";
import { useSession } from "@/auth/session";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { UserDropdown } from "@/components/UserDropdown";
import ThemeCustomizer from "@/components/theme-customizer";
import Footer from "@/layouts/Footer";
import { useTranslation } from "@/i18n";
export default function AppLayout() {
  const { user } = useSession();
  const { t } = useTranslation();
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [hovered, setHovered] = useState(false);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState<{
    renewalUrl: string | null;
    messageKey: "vista.subscriptionInactive" | "vista.subscriptionAccessLost";
  } | null>(() => {
    const renewalUrl = user?.vista_subscription?.renewal_url;
    return user?.vista_subscription && !user.vista_subscription.active
      ? {
          renewalUrl: typeof renewalUrl === "string" && /^https:\/\//.test(renewalUrl) ? renewalUrl : null,
          messageKey: "vista.subscriptionInactive",
        }
      : null;
  });

  // A paid Vista connection is re-checked by the backend for every protected
  // workspace API.  Turn an expiry/suspension response into a clear, blocking
  // renewal handoff rather than leaving a partially usable screen behind.
  useEffect(() => {
    const handleBlocked = (event: Event) => {
      const detail = (event as CustomEvent<{
        entitlement?: { renewal_url?: unknown };
        renewal_url?: unknown;
      }>).detail;
      const candidate = detail?.entitlement?.renewal_url ?? detail?.renewal_url;
      setSubscriptionBlocked({
        renewalUrl: typeof candidate === "string" && /^https:\/\//.test(candidate) ? candidate : null,
        messageKey: "vista.subscriptionAccessLost",
      });
    };
    window.addEventListener("optical:vista-subscription-required", handleBlocked);
    return () => window.removeEventListener("optical:vista-subscription-required", handleBlocked);
  }, []);
  return (
    <SidebarProvider open={open || hovered} onOpenChange={setOpen}>
      <AppSidebar onHoverChange={setHovered} />
      <SidebarInset>
        <header className="px-6 sticky top-0 z-40 flex h-16 w-full shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur">
          <SidebarTrigger className="-ml-1 rounded-full h-10 w-10" />
          <div className="ml-auto flex items-center gap-1">
            {canAccessVerifiedAccount(user) &&
              user.shop?.status === "active" &&
              user.permissions.includes("notices.read") && (
                <NotificationDropdown />
              )}
            <LanguageToggle />
            <ThemeToggle />
            <UserDropdown />
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        <Footer />
        <ThemeCustomizer />
      </SidebarInset>
      {subscriptionBlocked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-label={t("vista.subscriptionRequired")}>
          <div className="w-full max-w-lg rounded-2xl border border-blue-100 bg-background p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Vista Express 360</p>
            <h2 className="mt-2 text-2xl font-bold">{t("vista.subscriptionRenewalTitle")}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(subscriptionBlocked.messageKey)} {t("vista.subscriptionRenewalDescription")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {subscriptionBlocked.renewalUrl && <a className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90" href={subscriptionBlocked.renewalUrl}>{t("vista.manageSubscription")}</a>}
              <button type="button" className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-semibold shadow-sm transition hover:bg-accent" onClick={() => window.location.assign("/auth/login")}>{t("vista.returnToSignIn")}</button>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

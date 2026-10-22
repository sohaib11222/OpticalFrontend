import { canAccessVerifiedAccount } from "../../../contracts/session";
import { useSession } from "@/auth/session";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { useState } from "react";
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
export default function AppLayout() {
  const { user } = useSession();
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);
  const [hovered, setHovered] = useState(false);
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
    </SidebarProvider>
  );
}

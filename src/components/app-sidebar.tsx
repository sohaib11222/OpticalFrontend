import { canAccessVerifiedAccount } from "../../../contracts/session";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, ChartNoAxesCombined, ShoppingBag, Box, PackageSearch,
  Settings, Glasses, Home, ShieldCheck, Users, CalendarDays, Files,
  FileSpreadsheet, UserCog, AlarmClock, Workflow, MessagesSquare,
  WalletCards, History, PlugZap,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
type Props = React.ComponentProps<typeof Sidebar> & {
  onHoverChange?: (value: boolean) => void;
};
const TRANSLATED_ROLES = ["owner", "system_admin"] as const;
export function AppSidebar({ onHoverChange, ...props }: Props) {
  const { user } = useSession();
  const { t } = useTranslation();
  const role = user?.role ?? "owner";
  const roleLabel = (TRANSLATED_ROLES as readonly string[]).includes(role)
    ? t("role." + role)
    : role;
  const active = canAccessVerifiedAccount(user) && user.shop?.status === "active";
  const can = (permission: string) => !!active && user!.permissions.includes(permission);
  const groups = [
    { label: "nav.groupOverview", items: [
      { to: "/dashboard", label: "nav.dashboard", Icon: LayoutDashboard, show: can("reports.read") || can("operations.read") },
    ] },
    { label: "nav.groupCustomers", items: [
      { to: "/customers", label: "nav.customers", Icon: Users, show: can("customers.read") },
      { to: "/agenda", label: "nav.agenda", Icon: CalendarDays, show: can("agenda.read") },
      { to: "/reminders", label: "ops.reminders", Icon: AlarmClock, show: can("reminders.read") },
      { to: "/followups", label: "ops.followups", Icon: Workflow, show: can("followups.read") },
      { to: "/communications", label: "ops.communications", Icon: MessagesSquare, show: can("communications.read") },
    ] },
    { label: "nav.groupCommerce", items: [
      { to: "/products", label: "nav.products", Icon: Box, show: can("products.read") },
      { to: "/inventory", label: "nav.inventory", Icon: PackageSearch, show: can("stock.read") },
      { to: "/orders", label: "nav.orders", Icon: ShoppingBag, show: can("orders.read") },
      { to: "/payments", label: "ops.payments", Icon: WalletCards, show: can("payments.read") },
      { to: "/reports/sales", label: "nav.salesReport", Icon: ChartNoAxesCombined, show: can("reports.read") },
      { to: "/integrations/vista", label: "nav.vista", Icon: PlugZap, show: can("integrations.read") },
    ] },
    { label: "nav.groupRecords", items: [
      { to: "/documents", label: "nav.documents", Icon: Files, show: can("files.read") },
      { to: "/customer-imports", label: "nav.customerImports", Icon: FileSpreadsheet, show: can("imports.read") },
      { to: "/activity", label: "ops.audit", Icon: History, show: can("audit.read") },
    ] },
    { label: "nav.groupAdministration", items: [
      { to: "/employees", label: "ops.employees", Icon: UserCog, show: can("employees.read") },
      { to: "/shop/settings", label: "nav.shopSettings", Icon: Settings, show: can("shop.view") },
      { to: "/", label: "nav.shopAccount", Icon: Home, show: true },
      { to: "/account/security", label: "nav.accountSecurity", Icon: ShieldCheck, show: true },
    ] },
  ].map(group => ({ ...group, items: group.items.filter(item => item.show) })).filter(group => group.items.length);
  return (
    <div
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <Sidebar collapsible="icon" {...props} className="h-screen z-50">
        <SidebarHeader className="border-b h-16">
          <SidebarMenuButton size="lg" asChild>
            <Link to="/">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Glasses className="size-4" />
              </div>
              <span className="truncate font-medium">{t("app.name")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarHeader>
        <SidebarContent>
          {groups.map(group => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map(({ to, label, Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild tooltip={t(label)}>
                      <Link to={to}><Icon /><span>{t(label)}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t h-16 justify-center">
          <p className="truncate text-sm">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </div>
  );
}
import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import SourceLinks from "@/pages/integrations/SourceLinks";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Users } from "lucide-react";
import { useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import CustomerForm from "./CustomerForm";
import type { Customer, ResourcePage } from "../../../../contracts/customers";
export default function CustomerList() {
  const { user } = useSession();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const canMessage = !!user?.permissions.includes('communications.send') && user.permissions.includes('communications.read');
  const [sort, setSort] = useState("last_name");
  const query = new URLSearchParams({
    search,
    status,
    city,
    page: String(page),
    sort,
    per_page: "20",
  });
  const { data, error, loading, reload } = useApiResource<
    ResourcePage<Customer>
  >("/customers?" + query);
  return (
    <div className="space-y-6">
      <SourceLinks kind="customers" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <OperationsWorkspace module="output-customers" />
          <h1 className="text-2xl font-semibold">{t("nav.customers")}</h1>
          <p className="text-muted-foreground">
            {t("customers.subtitle")}
          </p>
        </div>
        {user?.permissions.includes("imports.read") && (
          <Button asChild variant="outline">
            <Link to="/customer-imports">{t("nav.customerImports")}</Link>
          </Button>
        )}
        {user?.permissions.includes("customers.write") && user.permissions.includes("customers.create") && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> {t("customers.new")}
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("customers.listTitle")}{" "}
            {data && <Badge variant="secondary">{data.meta.total}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-52">
              <Label htmlFor="customer-search">
                {t("customers.searchLabel")}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer-search"
                  className="pl-9"
                  placeholder={t("customers.searchPlaceholder")}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="customer-city">{t("customers.city")}</Label>
              <Input
                id="customer-city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Label>{t("common.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  aria-label={t("customers.ariaStatus")}
                  className="w-36"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    {t("status.active")}
                  </SelectItem>
                  <SelectItem value="archived">
                    {t("status.archived")}
                  </SelectItem>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("customers.sortBy")}</Label>
              <Select
                value={sort}
                onValueChange={(v) => {
                  setSort(v);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  aria-label={t("customers.ariaSort")}
                  className="w-36"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_name">
                    {t("customers.sort.lastName")}
                  </SelectItem>
                  <SelectItem value="first_name">
                    {t("customers.sort.firstName")}
                  </SelectItem>
                  <SelectItem value="created_at">
                    {t("customers.sort.createdAt")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={reload} disabled={loading}>
              {t("common.refresh")}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          {loading && <p role="status">{t("customers.loading")}</p>}
          {canMessage && <div className="flex flex-wrap items-center gap-2">
            <span>{t('ops.selectedCustomers')}: {selectedIds.length} / 100</span>
            <Button variant="outline" onClick={() => setSelectedIds([...new Set([...selectedIds, ...(data?.data.filter(c => c.status === 'active').map(c => c.id) ?? [])])].slice(0, 100))}>{t('ops.selectPage')}</Button>
            <Button variant="outline" onClick={() => setSelectedIds([])}>{t('ops.clearSelection')}</Button>
            {['sms', 'email'].map(channel => <Button key={channel} disabled={!selectedIds.length} onClick={() => navigate('/communications?' + new URLSearchParams({compose: channel, customers: selectedIds.join(',')}))}>{t(channel === 'sms' ? 'ops.bulkSms' : 'ops.bulkEmail')}</Button>)}
          </div>}
          <Table>
            <TableHeader>
              <TableRow>
                {canMessage && <TableHead>{t('ops.selectCustomer')}</TableHead>}
                {[
                  t("customers.colCustomer"),
                  t("customers.colContact"),
                  t("customers.colDateOfBirth"),
                  t("customers.colCityCap"),
                  t("common.status"),
                  t("common.actions"),
                ].map((v) => (
                  <TableHead key={v}>{v}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((c) => (
                <TableRow key={c.id}>
                  {canMessage && <TableCell><input type="checkbox" aria-label={t('ops.selectCustomer') + ' ' + c.first_name + ' ' + c.last_name} checked={selectedIds.includes(c.id)} disabled={c.status !== 'active' || (!selectedIds.includes(c.id) && selectedIds.length >= 100)} onChange={e => setSelectedIds(e.target.checked ? [...selectedIds, c.id] : selectedIds.filter(id => id !== c.id))} /></TableCell>}
                  <TableCell className="font-medium">
                    <Link className="hover:underline" to={"/customers/" + c.id}>
                      {c.first_name} {c.last_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p>{c.email || t("common.dash")}</p>
                    <p className="text-muted-foreground">
                      {c.phone || t("common.dash")}
                    </p>
                  </TableCell>
                  <TableCell>{c.date_of_birth || t("common.dash")}</TableCell>
                  <TableCell>
                    {[c.city, c.postal_code].filter(Boolean).join(" · ") ||
                      t("common.dash")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "active" ? "secondary" : "outline"}
                    >
                      {t("status." + c.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={"/customers/" + c.id}>
                        {t("customers.view")}
                      </Link>
                    </Button>
                    {canMessage && c.status === 'active' && <div className="flex flex-wrap gap-1 mt-2">{['sms', 'whatsapp', 'email'].map(channel => <Button key={channel} variant="outline" size="sm" disabled={channel === 'email' ? !c.email : !c.phone} onClick={() => navigate('/communications?' + new URLSearchParams({customer: String(c.id), compose: channel}))}>{t('ops.' + channel)}</Button>)}</div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!loading && !error && !data?.data.length && (
            <div className="rounded-md border p-6 text-center text-muted-foreground">
              {t("customers.noneMatching")}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage((v) => v - 1)}
            >
              {t("common.previous")}
            </Button>
            <span>
              {t("common.pageOf", {
                page,
                total: data?.meta.last_page || 1,
              })}
            </span>
            <Button
              variant="outline"
              disabled={loading || page >= (data?.meta.last_page || 1)}
              onClick={() => setPage((v) => v + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </CardContent>
      </Card>
      {open && (
        <CustomerForm
          onClose={() => setOpen(false)}
          onSaved={(c) => navigate("/customers/" + c.id)}
        />
      )}
    </div>
  );
}

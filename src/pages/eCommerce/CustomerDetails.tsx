import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import CustomerSales from "./CustomerSales";
import ShadcnFullCalendar from "@/components/calendar/shadcn-full-calendar";
import DocumentsPanel from "@/pages/documents/DocumentsPanel";
import OpticalCare from "@/pages/optical/OpticalCare";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit2, Mail, Phone, MapPin } from "lucide-react";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { useApiResource } from "@/hooks/use-api-resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type {
  Customer,
  CustomerEvent,
  Page,
} from "../../../../contracts/customers";
import CustomerForm from "./CustomerForm";
export default function CustomerDetails() {
  const { id } = useParams();
  const { user } = useSession();
  const { t, translateError, formatDate, formatDateTime } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const record = useApiResource<{ data: Customer }>("/customers/" + id);
  const history = useApiResource<Page<CustomerEvent>>(
    "/customers/" + id + "/history?page=" + historyPage,
  );
  const c = record.data?.data;
  const canWrite = user?.permissions.includes("customers.write");
  /** Raw API enum ("file_import", "vista_express", …) with a safe fallback. */
  const sourceLabel = (value: string) => {
    const key = "customers.source." + value;
    const translated = t(key);
    return translated !== key ? translated : value;
  };
  /** Clinical value ("female", "male", …) translated only when known. */
  const sexLabel = (value: string) => {
    const key = "customers.sex." + value.toLowerCase();
    const translated = t(key);
    return translated !== key ? translated : value;
  };
  const eventLabel = (action: string) => {
    const key = "customers.event." + action;
    const translated = t(key);
    return translated !== key
      ? translated
      : action.replace(/\./g, " ").replace(/_/g, " ");
  };
  const fieldLabel = (field: string) => {
    const key = "customers.field." + field;
    const translated = t(key);
    return translated !== key ? translated : field.replace(/_/g, " ");
  };
  const changeStatus = async () => {
    if (!c) return;
    setBusy(true);
    setMessage("");
    try {
      await api.request("/customers/" + id + "/status", {
        method: "PATCH",
        body: JSON.stringify({
          status: c.status === "active" ? "archived" : "active",
          version: c.version,
          reason,
        }),
      });
      setStatusOpen(false);
      setReason("");
      record.reload();
      history.reload();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : t("customers.statusChangeFailed"),
      );
    } finally {
      setBusy(false);
    }
  };
  if (!c)
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link to="/customers">{t("customers.back")}</Link>
        </Button>
        {record.error ? (
          <>
            <p role="alert">{record.error}</p>
            <Button onClick={record.reload}>{t("common.retry")}</Button>
          </>
        ) : (
          <p role="status">{t("customers.loadingCustomer")}</p>
        )}
      </div>
    );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link to="/customers" aria-label={t("customers.back")}>
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {c.first_name} {c.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("customers.customerCreated", {
                id: c.id,
                date: formatDate(c.created_at),
              })}
            </p>
          </div>
          <Badge variant="secondary">{t("status." + c.status)}</Badge>
        </div>
        {c.status === 'active' && user?.permissions.includes('communications.send') && user.permissions.includes('communications.read') && <div className="flex flex-wrap gap-2">{['sms', 'whatsapp', 'email'].map(channel => <Button key={channel} variant="outline" asChild><Link to={'/communications?' + new URLSearchParams({customer: String(c.id), compose: channel})}>{t('ops.' + channel)}</Link></Button>)}</div>}
        {canWrite && (
          <div className="flex gap-2">
            {c.status === "active" && user?.permissions.includes("customers.edit") && (
              <Button onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4" />
                {t("customers.edit")}
              </Button>
            )}
{user?.permissions.includes("customers.archive") && (            <Button
              variant="outline"
              onClick={() => {
                setMessage("");
                setStatusOpen(true);
              }}
            >
              {c.status === "active"
                ? t("customers.archive")
                : t("customers.restore")}
            </Button>)}
          </div>
        )}
      </div>
      {record.error && <p role="alert">{record.error}</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("customers.profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="flex gap-2 break-all">
              <Mail className="h-4 w-4 shrink-0" />
              {c.email || t("customers.emailMissing")}
            </p>
            <p className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              {c.phone || t("customers.phoneMissing")}
            </p>
            <p className="flex gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {[c.street_address, c.city, c.postal_code]
                .filter(Boolean)
                .join(", ") || t("customers.addressMissing")}
            </p>
            <dl className="space-y-3">
              <div>
                <dt className="text-muted-foreground">
                  {t("customers.dateOfBirth")}
                </dt>
                <dd>{c.date_of_birth || t("common.notSupplied")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("customers.sex")}</dt>
                <dd>{c.sex ? sexLabel(c.sex) : t("common.notSupplied")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  {t("customers.source")}
                </dt>
                <dd>{sourceLabel(c.source)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <Tabs defaultValue="history">
            <TabsList className="flex-wrap h-auto">
              {[ ["communications", "communications.read"], ["reminders", "reminders.read"], ["payments", "payments.read"] ].map(([module, permission]) => user?.permissions.includes(permission) && <TabsTrigger key={module} value={module}>{t("ops." + module)}</TabsTrigger>)}
              {user?.permissions.includes("agenda.read") && (
                <TabsTrigger value="agenda">{t("nav.agenda")}</TabsTrigger>
              )}
              <TabsTrigger value="history">
                {t("customers.tabHistory")}
              </TabsTrigger>
              {user?.permissions.includes("orders.read") && (
                <TabsTrigger value="sales">
                  {t("customers.tabSales")}
                </TabsTrigger>
              )}
              {user?.permissions.includes("files.read") && (
                <TabsTrigger value="documents">
                  {t("nav.documents")}
                </TabsTrigger>
              )}
              {user?.permissions.includes("optical.read") && (
                <TabsTrigger value="optical">
                  {t("customers.tabOptical")}
                </TabsTrigger>
              )}
            </TabsList>
            {["communications", "reminders", "payments"].map(module => <TabsContent key={module} value={module}><OperationsWorkspace module={module} customerId={c.id} /></TabsContent>)}
            <TabsContent value="sales">
              <CustomerSales customerId={c.id} />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsPanel customerId={c.id} onChange={history.reload} />
            </TabsContent>
            <TabsContent value="optical">
              <OpticalCare customer={c} onChange={history.reload} />
            </TabsContent>
            <TabsContent value="agenda">
              <Card>
                <CardContent className="pt-6">
                  <ShadcnFullCalendar customerId={c.id} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>{t("customers.historyTitle")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {history.error && (
                    <p role="alert">{translateError(history.error)}</p>
                  )}
                  {history.loading && (
                    <p role="status">{t("customers.loadingHistory")}</p>
                  )}
                  <ol className="space-y-4">
                    {history.data?.data.map((event) => (
                      <li key={event.id} className="border-l-2 pl-4">
                        <p className="font-medium">{eventLabel(event.action)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(event.created_at)} ·{" "}
                          {event.actor?.name || t("common.system")}
                        </p>
                        {!!event.changed_fields?.length && (
                          <p className="text-sm">
                            {t("customers.fieldsChanged", {
                              list: event.changed_fields
                                .map(fieldLabel)
                                .join(", "),
                            })}
                          </p>
                        )}
                        {event.reason && <p>{event.reason}</p>}
                        {event.subject_type === "order" &&
                          user?.permissions.includes("orders.read") && (
                            <Link
                              className="underline text-sm"
                              to={"/orders/" + event.subject_id}
                            >
                              {t("customers.openOrder")}
                            </Link>
                          )}
                        {event.subject_type === "customer_import" &&
                          user?.permissions.includes("imports.read") && (
                            <Link
                              className="underline text-sm"
                              to={"/customer-imports/" + event.subject_id}
                            >
                              {t("customers.openImport")}
                            </Link>
                          )}
                        {event.subject_type === "optical_record" &&
                          user?.permissions.includes("optical.read") && (
                            <Link
                              className="underline text-sm"
                              to={
                                "/customers/" +
                                c.id +
                                "/optical/" +
                                event.subject_id +
                                "/print"
                              }
                            >
                              {t("customers.openCareSheet")}
                            </Link>
                          )}
                      </li>
                    ))}
                  </ol>
                  <div className="flex gap-3 items-center">
                    <Button
                      variant="outline"
                      disabled={historyPage <= 1 || history.loading}
                      onClick={() => setHistoryPage((p) => p - 1)}
                    >
                      {t("customers.previousHistory")}
                    </Button>
                    <span>
                      {t("customers.historyPaging", {
                        page: historyPage,
                        total: history.data?.last_page || 1,
                      })}
                    </span>
                    <Button
                      variant="outline"
                      disabled={
                        history.loading ||
                        historyPage >= (history.data?.last_page || 1)
                      }
                      onClick={() => setHistoryPage((p) => p + 1)}
                    >
                      {t("customers.nextHistory")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {editing && (
        <CustomerForm
          customer={c}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            record.reload();
            history.reload();
          }}
        />
      )}
      <Dialog
        open={statusOpen}
        onOpenChange={(open) => {
          if (!busy) setStatusOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {c.status === "active"
                ? t("customers.archive")
                : t("customers.restore")}
            </DialogTitle>
            <DialogDescription>
              {t("customers.statusDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="status-reason">{t("common.reason")}</Label>
          <Textarea
            id="status-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={1000}
          />
          {message && (
            <p role="alert" className="text-destructive">
              {message}
            </p>
          )}
          <Button
            disabled={busy || reason.trim().length < 3}
            onClick={() => void changeStatus()}
          >
            {t("customers.confirmStatusChange")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

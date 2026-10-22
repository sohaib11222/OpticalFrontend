import { useSearchParams } from "react-router-dom";
import CustomerPicker from "@/components/customer-picker";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import itLocale from "@fullcalendar/core/locales/it";
import enGbLocale from "@fullcalendar/core/locales/en-gb";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { useTranslation } from "@/i18n";
import { wallTime } from "../../../../contracts/timezone";
import type { Appointment } from "../../../../contracts/agenda";
import { EventDialog } from "./event-dialog";
const colors = {
  scheduled: "#3b82f6",
  completed: "#15803d",
  cancelled: "#64748b",
  no_show: "#be123c",
};
type View = "dayGridMonth" | "timeGridWeek" | "timeGridDay";
export default function ShadcnFullCalendar({
  customerId,
}: {
  customerId?: number;
}) {
  const { user } = useSession();
  const { t, translateError, language } = useTranslation();
  const calendarLocale =
    language === "it" ? itLocale : enGbLocale;
  const [params] = useSearchParams();
  const linkedAppointment = params.get("appointment_id");
  const zone = user?.shop?.timezone || "UTC";
  const today = wallTime(new Date().toISOString(), zone).slice(0, 10);
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<View>("dayGridMonth");
  const [title, setTitle] = useState("");
  const [range, setRange] = useState({
    from: today.slice(0, 8) + "01",
    to:
      new Date(Date.parse(today.slice(0, 8) + "01T00:00:00Z") + 32 * 86400000)
        .toISOString()
        .slice(0, 8) + "01",
  });
  const [status, setStatus] = useState("");
  const [customerFilter, setCustomerFilter] = useState<number | null>(
    customerId || null,
  );
  const [editor, setEditor] = useState<{
    date: string;
    event?: Appointment;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const records = useApiResource<{ data: Appointment[]; timezone: string }>(
    "/appointments?" +
      new URLSearchParams({
        ...range,
        status,
        customer_id: customerFilter ? String(customerFilter) : "",
      }),
  );
  useEffect(() => {
    if (
      customerId ||
      !linkedAppointment ||
      !/^[1-9][0-9]*$/.test(linkedAppointment)
    )
      return;
    const controller = new AbortController();
    void api
      .request<{ data: Appointment }>("/appointments/" + linkedAppointment, {
        signal: controller.signal,
      })
      .then((r) => {
        if (controller.signal.aborted) return;
        const localDate = wallTime(r.data.starts_at, zone).slice(0, 10);
        calendarRef.current?.getApi().gotoDate(localDate);
        setEditor({ date: localDate, event: r.data });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? translateError(e.message)
              : t("agenda.appointment.unavailable"),
          );
      });
    return () => controller.abort();
  }, [linkedAppointment, customerId, zone, t, translateError]);
  const canWrite = user?.permissions.includes("agenda.write");
  const changeView = (next: View) => {
    calendarRef.current?.getApi().changeView(next);
    setView(next);
  };
  const open = async (id: number) => {
    setBusy(true);
    setError("");
    try {
      const r = await api.request<{ data: Appointment }>("/appointments/" + id);
      setEditor({ date: today, event: r.data });
    } catch (e) {
      setError(
        e instanceof Error
          ? translateError(e.message)
          : t("agenda.appointment.unavailable"),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("agenda.calendar.previousPeriod")}
            onClick={() => calendarRef.current?.getApi().prev()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("agenda.calendar.nextPeriod")}
            onClick={() => calendarRef.current?.getApi().next()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => calendarRef.current?.getApi().gotoDate(today)}
          >
            {t("agenda.calendar.today")}
          </Button>
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {t("agenda.calendar.zoneHint", { zone })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["dayGridMonth", "agenda.view.month"],
              ["timeGridWeek", "agenda.view.week"],
              ["timeGridDay", "agenda.view.day"],
            ] as [View, string][]
          ).map(([value, label]) => (
            <Button
              key={value}
              variant={view === value ? "default" : "outline"}
              onClick={() => changeView(value)}
            >
              {t(label)}
            </Button>
          ))}
          {canWrite && (
            <Button onClick={() => setEditor({ date: today })}>
              {t("agenda.calendar.new")}
            </Button>
          )}
        </div>
      </div>
      {!customerId && (
        <div className="mb-4 max-w-lg">
          <CustomerPicker
            id="calendar-customer-filter"
            value={customerFilter}
            onChange={setCustomerFilter}
          />
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <select
          aria-label={t("agenda.filter.statusAria")}
          className="h-9 rounded-md border bg-background px-3"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{t("agenda.filter.allOutcomes")}</option>
          {Object.keys(colors).map((s) => (
            <option key={s} value={s}>
              {t("status." + s)}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          disabled={records.loading}
          onClick={records.reload}
        >
          {t("agenda.calendar.refresh")}
        </Button>
        {records.loading && (
          <span role="status">{t("agenda.calendar.loading")}</span>
        )}
        {Object.entries(colors).map(([name, color]) => (
          <span key={name} className="text-sm">
            <span style={{ color }}>●</span> {t("status." + name)}
          </span>
        ))}
      </div>
      {(records.error || error) && (
        <p role="alert" className="text-destructive mb-3">
          {translateError(records.error || error)}
        </p>
      )}
      <FullCalendar
        ref={calendarRef}
        locale={calendarLocale}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={today}
        headerToolbar={false}
        height="auto"
        timeZone="UTC"
        events={(records.data?.data || []).map((a) => ({
          id: String(a.id),
          title:
            a.title +
            (a.customer
              ? " · " + a.customer.first_name + " " + a.customer.last_name
              : ""),
          start: wallTime(a.starts_at, zone) + ":00Z",
          end: wallTime(a.ends_at, zone) + ":00Z",
          backgroundColor: colors[a.status],
          borderColor: colors[a.status],
        }))}
        editable={false}
        datesSet={(arg) => {
          setTitle(arg.view.title);
          const next = {
            from: arg.startStr.slice(0, 10),
            to: arg.endStr.slice(0, 10),
          };
          setRange((old) =>
            old.from === next.from && old.to === next.to ? old : next,
          );
        }}
        dateClick={(info) => {
          if (canWrite) setEditor({ date: info.dateStr });
        }}
        eventClick={(info) => {
          if (!busy) void open(Number(info.event.id));
        }}
      />
      {editor && (
        <EventDialog
          key={editor.event?.id || "new"}
          event={editor.event}
          date={editor.date}
          zone={zone}
          customerId={customerFilter || undefined}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            records.reload();
          }}
        />
      )}
    </>
  );
}

import OrderPicker from "@/components/order-picker";
import OpticalRecordPicker from "@/components/optical-record-picker";
import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { api, useSession } from "@/auth/session";
import { useApiResource } from "@/hooks/use-api-resource";
import { ApiError } from "../../../../contracts/session";
import { wallTime, timeOptions } from "../../../../contracts/timezone";
import type {
  Appointment,
  AppointmentEvent,
} from "../../../../contracts/agenda";
import type { Page } from "../../../../contracts/customers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import CustomerPicker from "@/components/customer-picker";
import { useTranslation } from "@/i18n";
interface Values {
  title: string;
  notes: string;
  customer_id: number | null;
  optical_record_id: number | null;
  order_id: number | null;
  start: string;
  end: string;
  reason: string;
}
/** API action codes recorded in the appointment history, mapped to their keys. */
const HISTORY_ACTIONS: Record<string, string> = {
  created: "agenda.history.action.created",
  rescheduled: "agenda.history.action.rescheduled",
  scheduled: "status.scheduled",
  completed: "status.completed",
  cancelled: "status.cancelled",
  no_show: "status.no_show",
};
function AppointmentHistory({ id }: { id: number }) {
  const { t, translateError, formatDateTime } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, error } = useApiResource<Page<AppointmentEvent>>(
    "/appointments/" + id + "/history?page=" + page,
  );
  return (
    <section className="border-t pt-4 space-y-3">
      <h3 className="font-semibold">{t("agenda.history.title")}</h3>
      {error && <p role="alert">{translateError(error)}</p>}
      <ol className="space-y-2">
        {data?.data.map((e) => {
          const actionKey = HISTORY_ACTIONS[e.action];
          return (
            <li key={e.id}>
              <p>
                {actionKey ? t(actionKey) : e.action.replace(/_/g, " ")} ·{" "}
                {e.actor?.name ?? t("common.system")}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(e.created_at)}{" "}
                {e.reason && " · " + e.reason}
                {e.overlap_confirmed &&
                  " · " + t("agenda.history.overlapConfirmed")}
              </p>
            </li>
          );
        })}
      </ol>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("agenda.history.previous")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= (data?.last_page || 1)}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("agenda.history.next")}
        </Button>
      </div>
    </section>
  );
}
export function EventDialog({
  event,
  date,
  zone,
  customerId,
  onClose,
  onSaved,
}: {
  event?: Appointment;
  date: string;
  zone: string;
  customerId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useSession();
  const { t, translateError } = useTranslation();
  const [key] = useState(() => crypto.randomUUID());
  const [message, setMessage] = useState("");
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [overlap, setOverlap] = useState(false);
  const [startChoice, setStartChoice] = useState(event?.starts_at || "");
  const [endChoice, setEndChoice] = useState(event?.ends_at || "");
  const [busy, setBusy] = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  const editable =
    user?.permissions.includes("agenda.write") && user.permissions.includes(event ? "agenda.edit" : "agenda.create") &&
    (!event || event.status === "scheduled");
  const {
    register,
    control,
    getValues,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      title: event?.title || "",
      notes: event?.notes || "",
      customer_id: event?.customer_id || customerId || null,
      optical_record_id: event?.optical_record_id || null,
      order_id: event?.order_id || null,
      start: event
        ? wallTime(event.starts_at, zone)
        : date.slice(0, 10) + "T09:00",
      end: event ? wallTime(event.ends_at, zone) : date.slice(0, 10) + "T09:30",
      reason: "",
    },
  });
  const [start, end, watchedCustomer, reason] = useWatch({control, name: ["start", "end", "customer_id", "reason"]});
  const startOptions = timeOptions(start, zone);
  const endOptions = timeOptions(end, zone);
  const working = busy || isSubmitting;
  const save = handleSubmit(async (values) => {
    setMessage("");
    setMessageKey(null);
    const startsAt =
      startOptions.length === 1
        ? startOptions[0].instant
        : startOptions.find((o) => o.instant === startChoice)?.instant;
    const endsAt =
      endOptions.length === 1
        ? endOptions[0].instant
        : endOptions.find((o) => o.instant === endChoice)?.instant;
    if (!startsAt || !endsAt) {
      setMessageKey("agenda.dst.missingTimes");
      return;
    }
    try {
      await api.request("/appointments" + (event ? "/" + event.id : ""), {
        method: event ? "PATCH" : "POST",
        body: JSON.stringify({
          title: values.title,
          notes: values.notes,
          customer_id: values.customer_id,
          optical_record_id: values.optical_record_id,
          order_id: values.order_id,
          starts_at: startsAt,
          ends_at: endsAt,
          reason: values.reason,
          allow_overlap: overlap,
          creation_key: event ? undefined : key,
          version: event?.version,
        }),
      });
      onSaved();
    } catch (e) {
      if (e instanceof ApiError) {
        setMessage(
          [
            translateError(e.message),
            ...Object.values(e.errors)
              .flat()
              .map((m) => translateError(m)),
          ].join(" "),
        );
      } else if (e instanceof Error) {
        setMessage(translateError(e.message));
      } else {
        setMessageKey("agenda.dialog.saveFailed");
      }
    }
  });
  const changeStatus = async () => {
    if (!event) return;
    setBusy(true);
    setMessage("");
    setMessageKey(null);
    try {
      await api.request("/appointments/" + event.id + "/status", {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          version: event.version,
          reason: getValues("reason"),
        }),
      });
      onSaved();
    } catch (e) {
      if (e instanceof ApiError) {
        setMessage(
          [
            translateError(e.message),
            ...Object.values(e.errors)
              .flat()
              .map((m) => translateError(m)),
          ].join(" "),
        );
      } else if (e instanceof Error) {
        setMessage(translateError(e.message));
      } else {
        setMessageKey("agenda.dialog.saveFailed");
      }
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !working) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Appointment #" + event.id : "New appointment"}
          </DialogTitle>
          <DialogDescription>
            Shared shop calendar · {zone}
            {event ? " · " + event.status.replace(/_/g, " ") : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <fieldset disabled={!editable || working} className="space-y-4">
            <div>
              <Label htmlFor="appointment-title">Title</Label>
              <Input
                id="appointment-title"
                maxLength={150}
                required
                {...register("title")}
              />
            </div>
            <Controller
              name="customer_id"
              control={control}
              render={({ field }) => (
                <CustomerPicker
                  id="appointment-customer"
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("optical_record_id", null);
                    setValue("order_id", null);
                  }}
                  initial={event?.customer}
                />
              )}
            />
            {watchedCustomer && (
              <Controller
                name="optical_record_id"
                control={control}
                render={({ field }) => (
                  <OpticalRecordPicker
                    key={watchedCustomer}
                    customerId={watchedCustomer!}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            )}
            {watchedCustomer &&
              user?.permissions.includes("orders.read") && (
                <Controller
                  name="order_id"
                  control={control}
                  render={({ field }) => (
                    <OrderPicker
                      key={watchedCustomer}
                      customerId={watchedCustomer!}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["start", "Start", startOptions, startChoice, setStartChoice],
                ["end", "End", endOptions, endChoice, setEndChoice],
              ].map(([name, label, options, choice, setChoice]) => {
                const opts = options as typeof startOptions;
                return (
                  <div key={String(name)}>
                    <Label htmlFor={"appointment-" + name}>
                      {String(label)} ({zone})
                    </Label>
                    <Input
                      id={"appointment-" + name}
                      type="datetime-local"
                      required
                      {...register(name as "start" | "end")}
                      onInput={() => setOverlap(false)}
                    />
                    {opts.length === 0 && (
                      <p className="text-sm text-destructive">
                        This local time does not exist or is incomplete.
                      </p>
                    )}
                    {opts.length > 1 && (
                      <select
                        aria-label={String(label) + " UTC offset"}
                        className="mt-2 h-9 w-full rounded-md border bg-background"
                        value={choice as string}
                        onChange={(e) =>
                          (setChoice as (v: string) => void)(e.target.value)
                        }
                      >
                        <option value="">Choose repeated-hour offset</option>
                        {opts.map((o) => (
                          <option key={o.instant} value={o.instant}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
            <div>
              <Label htmlFor="appointment-notes">Notes</Label>
              <Textarea
                id="appointment-notes"
                maxLength={5000}
                {...register("notes")}
              />
            </div>
            {event && (
              <div>
                <Label htmlFor="appointment-reason">Reason for change</Label>
                <Textarea
                  id="appointment-reason"
                  maxLength={2000}
                  {...register("reason")}
                />
              </div>
            )}
            <div className="flex gap-2 items-start">
              <Checkbox
                id="appointment-overlap"
                checked={overlap}
                onCheckedChange={(v) => setOverlap(v === true)}
              />
              <Label htmlFor="appointment-overlap">
                I reviewed the calendar and allow an overlapping appointment.
              </Label>
            </div>
          </fieldset>
          {message && (
            <p role="alert" className="text-destructive">
              {message}
            </p>
          )}
          {messageKey && (
            <p role="alert" className="text-destructive">
              {t(messageKey)}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={working}
            >
              Close
            </Button>
            {editable && (
              <Button disabled={working} type="submit">
                {working
                  ? "Saving…"
                  : event
                    ? "Save appointment changes"
                    : "Create appointment"}
              </Button>
            )}
          </DialogFooter>
          {event && editable && (
            <div className="border-t pt-4 flex flex-wrap gap-2">
              <select
                aria-label="New appointment status"
                className="h-9 rounded-md border bg-background px-3"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                <option value="">Choose outcome</option>
                <option value="completed">Completed</option>
                {user?.permissions.includes("agenda.archive") && <option value="cancelled">Cancelled</option>}
                <option value="no_show">No show</option>
              </select>
              <Button
                type="button"
                variant="outline"
                disabled={
                  working || !nextStatus || reason.trim().length < 3
                }
                onClick={() => void changeStatus()}
              >
                Record outcome
              </Button>
            </div>
          )}
        </form>
        {event && <AppointmentHistory id={event.id} />}
      </DialogContent>
    </Dialog>
  );
}

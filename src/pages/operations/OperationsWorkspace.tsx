import ProductVariations from "../../../../contracts/operations/ProductVariations";
import type { Product } from "../../../../contracts/commerce";
import LanguageToggle from "@/components/LanguageToggle";
import Output from "../../../../contracts/operations/Output";
import { useId, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, useSession } from "@/auth/session";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Context, type UI } from "../../../../contracts/operations/shared";
import Employees, {
  ActivityLog,
} from "../../../../contracts/operations/Employees";
import Reminders, {
  Followups,
} from "../../../../contracts/operations/Reminders";
import Communications from "../../../../contracts/operations/Communications";
import Payments from "../../../../contracts/operations/Payments";
import Daily from "../../../../contracts/operations/Daily";

const ui: UI = {
  Panel: ({ title, children, actions }) => (
    <Card>
      {(title || actions) && (
        <CardHeader>
          <div className="flex flex-wrap justify-between items-center gap-3">
            <CardTitle>{title}</CardTitle>
            {actions}
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  ),
  Stack: ({ children, inline }) => (
    <div className={inline ? "flex flex-wrap items-end gap-3" : "space-y-4"}>
      {children}
    </div>
  ),
  Button: ({ children, secondary, ...props }) => (
    <Button
      variant={secondary ? "outline" : "default"}
      type="button"
      {...props}
    >
      {children}
    </Button>
  ),
  Field: function Field({
    label,
    value,
    onChange,
    type = "text",
    options,
    required,
    disabled,
    min,
    max,
    hint,
  }) {
    const id = useId();
    return (
      <div className="space-y-2 min-w-40 flex-1">
        <Label htmlFor={id}>{label}</Label>
        {type === "select" ? (
          <select
            id={id}
            className="border border-input rounded-md bg-background w-full p-2 text-sm"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
          >
            {options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            rows={4}
          />
        ) : (
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            type={type}
            required={required}
            disabled={disabled}
            min={min}
            max={type === "number" ? max : undefined}
            maxLength={type === "text" ? max : undefined}
          />
        )}
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
    );
  },
  Table: function Records({ headers, rows }) {
    const { t } = useTranslation();
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={i}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row, n) => (
                <TableRow key={n}>
                  {row.map((cell, i) => (
                    <TableCell key={i}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length}>
                  {t("ops.noRecords")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  },
  Dialog: ({ title, children, onClose }) => (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <LanguageToggle />
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  ),
  Alert: ({ children, error }) => (
    <div
      role={error ? "alert" : "status"}
      className={
        error
          ? "rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm"
          : "rounded-md border bg-muted/40 p-3 text-sm"
      }
    >
      {children}
    </div>
  ),
  Link: ({ to, children }) => (
    <Link to={to} className="text-primary underline underline-offset-2">
      {children}
    </Link>
  ),
};
const permissions: Record<string, string> = {
  employees: "employees.read",
  activity: "audit.read",
  reminders: "reminders.read",
  followups: "followups.read",
  communications: "communications.read",
  payments: "payments.read",
  daily: "operations.read",
  variations: "products.read",
};
export default function OperationsWorkspace({
  module = "daily",
  customerId,
  compact = false,
  product,
}: {
  module?: string;
  customerId?: number;
  compact?: boolean;
  product?: Product;
}) {
  const { user } = useSession();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const value = useMemo(
    () => ({
      ui,
      request: api.request,
      can: (p: string) => !!user?.permissions.includes(p),
      t,
      params,
      actorId: user?.id ?? 0,
      timezone: user?.shop?.timezone ?? "UTC",
      invitationUrl: (token: string) =>
        window.location.origin + "/pulse-ui/auth/invitation#" + token,
    }),
    [user, t, params],
  );
  if (
    !module.startsWith("output-") &&
    !user?.permissions.includes(permissions[module])
  )
    return null;
  return (
    <Context.Provider value={value}>
      {module === "variations" && product ? <ProductVariations product={product} /> : module.startsWith("output-") ? (
        <Output module={module.slice(7)} customerId={customerId} />
      ) : module === "employees" ? (
        <Employees />
      ) : module === "activity" ? (
        <ActivityLog />
      ) : module === "reminders" ? (
        <Reminders customerId={customerId} />
      ) : module === "followups" ? (
        <Followups />
      ) : module === "communications" ? (
        <Communications customerId={customerId} />
      ) : module === "payments" ? (
        <Payments customerId={customerId} />
      ) : (
        <Daily compact={compact} />
      )}
    </Context.Provider>
  );
}

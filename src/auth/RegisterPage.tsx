import AuthShell from "./AuthShell";
import {
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Store, Check, Eye, EyeOff, Mail } from "lucide-react";
import StepProgress from "@/pages/forms/wizard/StepProgress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { api, useSession } from "./session";
import {
  ApiError,
  type ApiEnvelope,
  type SessionUser,
} from "../../../contracts/session";
type Values = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  shop_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  timezone: string;
};
const fields: FieldPath<Values>[][] = [
  ["name", "email", "password", "password_confirmation"],
  [
    "shop_name",
    "phone",
    "address_line1",
    "address_line2",
    "city",
    "postal_code",
    "country",
    "timezone",
  ],
];
export default function RegisterPage() {
  const { t, translateError } = useTranslation();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [failure, setFailure] = useState("");
  const [failureKey, setFailureKey] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const { accept, loading } = useSession();
  const steps = useMemo(
    () => [
      { id: 1, label: t("auth.register.step1"), icon: User },
      { id: 2, label: t("auth.register.step2"), icon: Store },
      { id: 3, label: t("auth.register.step3"), icon: Check },
    ],
    [t],
  );
  const schema = useMemo(() => {
    const required = (max: number) =>
      z.string().trim().min(1, t("common.required")).max(max);
    return z
      .object({
        name: required(150),
        email: z.email().max(254),
        password: z
          .string()
          .min(12, t("auth.error.passwordMinLength"))
          .regex(/[a-z]/i, t("auth.error.passwordNeedsLetter"))
          .regex(/\d/, t("auth.error.passwordNeedsNumber"))
          .refine(
            (v) => new TextEncoder().encode(v).length <= 72,
            t("auth.error.passwordTooLong"),
          ),
        password_confirmation: z.string(),
        shop_name: required(150),
        phone: required(40)
          .regex(/^\+?[0-9 ()\-.]{7,40}$/, t("auth.error.phoneFormat"))
          .refine(
            (v) =>
              v.replace(/\D/g, "").length >= 7 &&
              v.replace(/\D/g, "").length <= 15,
            t("auth.error.phoneDigits"),
          ),
        address_line1: required(255),
        address_line2: z.string().max(255),
        city: required(100),
        postal_code: required(32),
        country: required(100).min(2),
        timezone: required(80),
      })
      .refine((v) => v.password === v.password_confirmation, {
        path: ["password_confirmation"],
        message: t("auth.error.passwordMismatch"),
      });
  }, [t]);
  const {
    register,
    trigger,
    handleSubmit,
    getValues,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      shop_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      postal_code: "",
      country: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
    shouldUnregister: false,
  });
  const move = (next: number) => {
    setStep(next);
    setFailure("");
    setFailureKey(null);
    requestAnimationFrame(() => heading.current?.focus());
  };
  const next = async () => {
    if (await trigger(fields[step - 1], { shouldFocus: true })) move(step + 1);
  };
  const submit = handleSubmit(
    async (values) => {
      setFailure("");
    setFailureKey(null);
      try {
        const r = await api.auth<ApiEnvelope<SessionUser>>("/register", values);
        accept(r.data);
        navigate("/", { replace: true });
      } catch (e) {
        if (e instanceof ApiError) {
          const names = Object.keys(e.errors) as FieldPath<Values>[];
          const target = names.some((n) => fields[0].includes(n))
            ? 1
            : names.length
              ? 2
              : 3;
          setStep(target);
          setFailure(translateError(e.message));
          for (const name of names)
            setError(name, { message: translateError(e.errors[name][0]) });
          if (names[0]) requestAnimationFrame(() => setFocus(names[0]));
        } else setFailureKey("auth.register.connectionFailed");
      }
    },
    (invalidFields) => {
      const invalid = fields.findIndex((group) =>
        group.some((n) => invalidFields[n]),
      );
      if (invalid >= 0) move(invalid + 1);
    },
  );
  const field = (
    name: FieldPath<Values>,
    label: string,
    props: InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="grid gap-2" key={name}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        {...props}
        {...register(name)}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? name + "-error" : undefined}
      />
      {errors[name] && (
        <p
          id={name + "-error"}
          role="alert"
          className="text-sm text-destructive"
        >
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
  const values = getValues();
  return (
    <AuthShell>
      <div className="w-full max-w-2xl space-y-5">

        <Card>
          <CardHeader>
            <CardTitle>
              <h1 tabIndex={-1} ref={heading} className="outline-none">
                {step === 1
                  ? t("auth.register.heading1")
                  : step === 2
                    ? t("auth.register.heading2")
                    : t("auth.register.heading3")}
              </h1>
            </CardTitle>
            <CardDescription>
              {t("auth.register.progress", { step, total: 3 })} ·{" "}
              {step === 1
                ? t("auth.register.desc1")
                : step === 2
                  ? t("auth.register.desc2")
                  : t("auth.register.desc3")}
            </CardDescription>
            <StepProgress currentStep={step} steps={steps} compact />
          </CardHeader>
          <CardContent>
            <form
              noValidate
              onSubmit={(e) => {
                if (step < 3) {
                  e.preventDefault();
                  void next();
                } else void submit(e);
              }}
              className="space-y-5"
            >
              <fieldset disabled={isSubmitting} className="space-y-5">
                {step === 1 && (
                  <>
                    {field("name", t("auth.field.name"), {
                      autoComplete: "name",
                      maxLength: 150,
                    })}
                    {field("email", t("auth.field.email"), {
                      type: "email",
                      autoComplete: "email",
                    })}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {field("password", t("auth.field.password"), {
                        type: showPassword ? "text" : "password",
                        autoComplete: "new-password",
                      })}
                      {field(
                        "password_confirmation",
                        t("auth.field.passwordConfirm"),
                        {
                          type: showPassword ? "text" : "password",
                          autoComplete: "new-password",
                        },
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {t("auth.register.passwordHint")}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}{" "}
                        {showPassword
                          ? t("auth.register.hidePassword")
                          : t("auth.register.showPassword")}
                      </Button>
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    {field("shop_name", t("auth.field.shopName"), {
                      autoComplete: "organization",
                    })}
                    {field("phone", t("auth.field.businessPhone"), {
                      type: "tel",
                      autoComplete: "tel",
                      placeholder: "+39 06 12345678",
                    })}
                    {field("address_line1", t("auth.field.addressLine1"), {
                      autoComplete: "address-line1",
                    })}
                    {field("address_line2", t("auth.field.addressLine2"), {
                      autoComplete: "address-line2",
                    })}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {field("city", t("auth.field.city"), {
                        autoComplete: "address-level2",
                      })}
                      {field("postal_code", t("auth.field.postalCode"), {
                        autoComplete: "postal-code",
                      })}
                      {field("country", t("auth.field.country"), {
                        autoComplete: "country-name",
                      })}
                      {field("timezone", t("auth.field.shopTimezone"), {
                        list: "shop-timezones",
                      })}
                    </div>
                    <datalist id="shop-timezones">
                      {[
                        "UTC",
                        "Europe/Rome",
                        "Europe/Berlin",
                        "Europe/London",
                        "Europe/Paris",
                        "America/New_York",
                        "America/Los_Angeles",
                        "Asia/Kolkata",
                        "Asia/Dubai",
                        "Australia/Sydney",
                      ].map((zone) => (
                        <option key={zone} value={zone} />
                      ))}
                    </datalist>
                    <p className="text-sm text-muted-foreground">
                      {t("auth.register.timezoneHint")}
                    </p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <div className="rounded-lg border p-4 space-y-4">
                      <section>
                        <h2 className="font-semibold">
                          {t("auth.register.step1")}
                        </h2>
                        <p>{values.name}</p>
                        <p className="break-all text-muted-foreground">
                          {values.email}
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0"
                          onClick={() => move(1)}
                        >
                          {t("auth.register.editOwner")}
                        </Button>
                      </section>
                      <section>
                        <h2 className="font-semibold">{values.shop_name}</h2>
                        <p>{values.phone}</p>
                        <p>
                          {values.address_line1}
                          {values.address_line2 && ", " + values.address_line2}
                        </p>
                        <p>
                          {values.postal_code} {values.city}, {values.country}
                        </p>
                        <p className="text-muted-foreground">
                          {values.timezone}
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0"
                          onClick={() => move(2)}
                        >
                          {t("auth.register.editBusiness")}
                        </Button>
                      </section>
                    </div>
                    <div className="flex gap-3 rounded-lg bg-muted p-4">
                      <Mail className="shrink-0" size={20} />
                      <p className="text-sm">
                        {t("auth.register.verificationNotice")}
                      </p>
                    </div>
                  </>
                )}
              </fieldset>
              {failure && (
                <p role="alert" className="text-sm text-destructive">
                  {failure}
                </p>
              )}
              {failureKey && (
                <p role="alert" className="text-sm text-destructive">
                  {t(failureKey)}
                </p>
              )}
              <div className="flex justify-between gap-3">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => move(step - 1)}
                  >
                    {t("common.back")}
                  </Button>
                ) : (
                  <span />
                )}
                <Button type="submit" disabled={isSubmitting || loading}>
                  {isSubmitting
                    ? t("auth.register.creating")
                    : step < 3
                      ? t("common.continue")
                      : t("auth.submit.register")}
                </Button>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {t("auth.register.alreadyRegistered")}{" "}
                <Link className="underline text-foreground" to="/auth/login">
                  {t("auth.link.login")}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
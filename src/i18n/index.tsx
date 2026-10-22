import operations from '../../../contracts/operations/locale';
/* eslint-disable react-refresh/only-export-components -- Shared i18n module exports its provider, hook and helpers. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import common from "./locales/common";
import auth from "./locales/auth";
import shop from "./locales/shop";
import orders from "./locales/orders";
import products from "./locales/products";
import customers from "./locales/customers";
import optical from "./locales/optical";
import agenda from "./locales/agenda";
import documents from "./locales/documents";
import imports_ from "./locales/imports";
import vista from "./locales/vista";

import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  type Language,
  type LanguageOption,
  type LocaleModule,
} from "./types";

const MODULES: LocaleModule[] = [
  operations,
  common,
  auth,
  shop,
  orders,
  products,
  customers,
  optical,
  agenda,
  documents,
  imports_,
  vista,
];

const DICTIONARIES: Record<Language, Record<string, string>> = MODULES.reduce(
  (acc, module) => {
    (Object.keys(acc) as Language[]).forEach((language) => {
      Object.assign(acc[language], module[language]);
    });
    return acc;
  },
  { en: {}, it: {} } as Record<Language, Record<string, string>>,
);

/**
 * Messages produced by the API client and by Laravel itself. They are not part
 * of the UI dictionary because they arrive as free text at runtime, but they
 * still need to be shown to the user in the active language.
 */
const SERVER_MESSAGES: Record<string, string> = {
  "Unable to establish a secure session. Please try again.":
    "errors.secureSession",
  "The server returned an unexpected response. Please try again.":
    "errors.unexpectedResponse",
  "Unable to complete this request.": "errors.unableToComplete",
  "Cannot connect to the server. Please retry.": "errors.cannotConnect",
  "The credentials you provided are incorrect.": "errors.credentials",
  "The email field is required.": "errors.fieldRequired",
  "The password field is required.": "errors.fieldRequired",
  "The name field is required.": "errors.fieldRequired",
  "The shop name field is required.": "errors.fieldRequired",
  "The first name field is required.": "errors.fieldRequired",
  "The last name field is required.": "errors.fieldRequired",
  "The email has already been taken.": "errors.emailTaken",
  "The password confirmation does not match.": "errors.passwordMismatch",
  "The password must be at least 12 characters.": "errors.passwordLength",
  "The provided password is incorrect.": "errors.currentPassword",
  "Unauthenticated.": "errors.unauthenticated",
  "This action is unauthorized.": "errors.unauthorized",
  "Page not found.": "errors.notFound",
  "Too Many Attempts.": "errors.tooManyAttempts",
  "The resource was updated by another user.": "errors.staleRecord",
  "This record has changed since you loaded it.": "errors.staleRecord",
  "Your session has expired. Please sign in again.": "errors.sessionExpired",
};

const SERVER_ERROR_MESSAGES: Record<string, { en: string; it: string }> = {
  "errors.secureSession": {
    en: "Unable to establish a secure session. Please try again.",
    it: "Impossibile stabilire una sessione sicura. Riprova.",
  },
  "errors.unexpectedResponse": {
    en: "The server returned an unexpected response. Please try again.",
    it: "Il server ha restituito una risposta inattesa. Riprova.",
  },
  "errors.unableToComplete": {
    en: "Unable to complete this request.",
    it: "Impossibile completare la richiesta.",
  },
  "errors.cannotConnect": {
    en: "Cannot connect to the server. Please retry.",
    it: "Impossibile connettersi al server. Riprova.",
  },
  "errors.credentials": {
    en: "The credentials you provided are incorrect.",
    it: "Le credenziali fornite non sono corrette.",
  },
  "errors.fieldRequired": {
    en: "This field is required.",
    it: "Questo campo Ã¨ obbligatorio.",
  },
  "errors.emailTaken": {
    en: "The email has already been taken.",
    it: "Questa email Ã¨ giÃ  registrata.",
  },
  "errors.passwordMismatch": {
    en: "The password confirmation does not match.",
    it: "La conferma password non corrisponde.",
  },
  "errors.passwordLength": {
    en: "The password must be at least 12 characters.",
    it: "La password deve contenere almeno 12 caratteri.",
  },
  "errors.currentPassword": {
    en: "The provided password is incorrect.",
    it: "La password attuale non Ã¨ corretta.",
  },
  "errors.unauthenticated": {
    en: "Unauthenticated.",
    it: "Accesso non autenticato.",
  },
  "errors.unauthorized": {
    en: "This action is unauthorized.",
    it: "Questa azione non Ã¨ autorizzata.",
  },
  "errors.notFound": {
    en: "Page not found.",
    it: "Pagina non trovata.",
  },
  "errors.tooManyAttempts": {
    en: "Too many attempts. Please wait a moment and try again.",
    it: "Troppi tentativi. Attendi qualche istante e riprova.",
  },
  "errors.staleRecord": {
    en: "This record has changed since you loaded it. Refresh and try again.",
    it: "Questo record Ã¨ stato modificato. Aggiorna e riprova.",
  },
  "errors.sessionExpired": {
    en: "Your session has expired. Please sign in again.",
    it: "La sessione Ã¨ scaduta. Accedi di nuovo.",
  },
};

export type TranslateVars = Record<string, string | number>;
export type TranslateFn = (key: string, vars?: TranslateVars) => string;

interface TranslationState {
  language: Language;
  languages: LanguageOption[];
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: TranslateFn;
  /** Maps a raw API/Laravel message to the active language when known. */
  translateError: (message: string | null | undefined) => string;
  formatDate: (value: string | number | Date, zone?: string) => string;
  formatDateTime: (value: string | number | Date, zone?: string) => string;
  formatNumber: (value: number, digits?: number) => string;
  formatDateInput: (value: string | number | Date, zone?: string) => string;
}

const Context = createContext<TranslationState | null>(null);

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "en" || stored === "it" ? stored : DEFAULT_LANGUAGE;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies, sandboxed
    // frame, exceeded quota). Fall back to the default instead of crashing.
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Persistence is best-effort. React state is the source of truth, so a
 * failure here must never interrupt the language switch.
 */
function persistLanguage(language: Language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    return true;
  } catch {
    return false;
  }
}

function interpolate(template: string, vars?: TranslateVars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    persistLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    document.title = language === "it"
      ? "Optical Shop â€” Gestione negozio ottico"
      : "Optical Shop â€” Optical shop management";
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    // Persist synchronously with the user's action, not only in the effect
    // below. If the tree is torn down right after (HMR, reload, crash) the
    // choice is already saved and survives, instead of reverting to default.
    persistLanguage(next);
    setLanguageState(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => {
      const next = current === "it" ? "en" : "it";
      persistLanguage(next);
      return next;
    });
  }, []);

  const t = useCallback<TranslateFn>(
    (key, vars) => {
      const localized = DICTIONARIES[language][key];
      const fallback = DICTIONARIES.en[key];
      const template = localized ?? fallback ?? key;
      return interpolate(template, vars);
    },
    [language],
  );

  const translateError = useCallback(
    (message: string | null | undefined) => {
      if (!message) return "";
      const mapped = SERVER_MESSAGES[message.trim()];
      if (mapped) {
        const entry = SERVER_ERROR_MESSAGES[mapped];
        return entry ? entry[language] : mapped;
      }
      return message;
    },
    [language],
  );

  const intl = useMemo(
    () => LANGUAGES.find((l) => l.code === language)!.intl,
    [language],
  );

  const formatDate = useCallback(
    (value: string | number | Date, zone?: string) =>
      new Date(value).toLocaleDateString(intl, {
        timeZone: zone || undefined,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [intl],
  );

  const formatDateTime = useCallback(
    (value: string | number | Date, zone?: string) =>
      new Date(value).toLocaleString(intl, {
        timeZone: zone || undefined,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [intl],
  );

  const formatDateInput = useCallback(
    (value: string | number | Date, zone?: string) =>
      new Date(value).toLocaleDateString("en-CA", {
        timeZone: zone || undefined,
      }),
    [],
  );

  const formatNumber = useCallback(
    (value: number, digits = 0) =>
      new Intl.NumberFormat(intl, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value),
    [intl],
  );

  const value = useMemo<TranslationState>(
    () => ({
      language,
      languages: LANGUAGES,
      setLanguage,
      toggleLanguage,
      t,
      translateError,
      formatDate,
      formatDateTime,
      formatDateInput,
      formatNumber,
    }),
    [
      language,
      setLanguage,
      toggleLanguage,
      t,
      translateError,
      formatDate,
      formatDateTime,
      formatDateInput,
      formatNumber,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTranslation(): TranslationState {
  const value = useContext(Context);
  if (!value)
    throw new Error("useTranslation must be used within a TranslationProvider");
  return value;
}

/** Convenience hook for components that only need the lookup function. */
export function useT(): TranslateFn {
  return useTranslation().t;
}

export { LANGUAGES, DEFAULT_LANGUAGE } from "./types";
export type { Language } from "./types";
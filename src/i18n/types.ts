export type Language = "it" | "en";

export interface LocaleModule {
  en: Record<string, string>;
  it: Record<string, string>;
}

export interface LanguageOption {
  code: Language;
  /** Label shown in the toggle, always in the language itself. */
  label: string;
  /** Value for <html lang> and Intl.* constructors. */
  intl: string;
}

export const DEFAULT_LANGUAGE: Language = "it";

export const LANGUAGE_STORAGE_KEY = "optical-shop-language";

export const LANGUAGES: LanguageOption[] = [
  { code: "it", label: "Italiano", intl: "it-IT" },
  { code: "en", label: "English", intl: "en-GB" },
];
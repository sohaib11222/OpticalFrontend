import type { ReactNode } from "react";
import AuthExperience from "../../../contracts/AuthExperience";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/i18n";
export default function AuthShell({ children }: { children: ReactNode }) {
  const { language } = useTranslation();
  return <AuthExperience language={language} languageControl={<LanguageToggle />} image={`${import.meta.env.BASE_URL}images/auth-editorial.webp`}>{children}</AuthExperience>;
}

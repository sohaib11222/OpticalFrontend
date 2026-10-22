import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/i18n";

export function LanguageToggle() {
  const { language, languages, setLanguage, t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("nav.changeLanguage")}
          title={t("nav.changeLanguage")}
          className="rounded-full h-10 w-10"
          data-testid="language-toggle"
        >
          <Languages className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("nav.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onSelect={() => setLanguage(option.code)}
            aria-current={option.code === language}
            data-testid={`language-option-${option.code}`}
          >
            <span className={option.code === language ? "font-semibold" : ""}>
              {option.label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageToggle;
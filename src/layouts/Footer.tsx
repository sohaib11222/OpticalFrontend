import { useTranslation } from "@/i18n";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t">
      <div className="container flex h-14 items-center justify-between text-sm text-muted-foreground">
        <a href="https://codervent.com/" rel="noopener noreferrer" className="hover:underline">
         <span>
            © {new Date().getFullYear()}{" "}
            <span className="font-medium text-foreground">Codervent</span>.{" "}
            {t("footer.rights")}
          </span>
        </a>
        <span>
          {t("footer.builtWith")} ❤️ {t("footer.by")}{" "}
          <span className="font-medium text-foreground"><a href="https://codervent.com/" rel="noopener noreferrer" className="hover:underline">Codervent</a></span>
        </span>
      </div>
    </footer>
  )
}
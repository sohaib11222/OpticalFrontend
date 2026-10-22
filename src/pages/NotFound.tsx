import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "@/i18n"

export default function NotFound() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">{t("notFound.message")}</p>

      <Button className="mt-6" onClick={() => navigate("/")}>
        {t("notFound.goHome")}
      </Button>
    </div>
  )
}
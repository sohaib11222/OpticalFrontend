import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import { useTranslation } from "@/i18n";
import ShadcnFullCalendar from "@/components/calendar/shadcn-full-calendar";
import { Card, CardContent } from "@/components/ui/card";
export default function CalendarPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <OperationsWorkspace module="output-agenda" />
          <h1 className="text-2xl font-semibold">{t("nav.agenda")}</h1>
      <Card>
        <CardContent className="pt-6 full-calendar-container">
          <ShadcnFullCalendar />
        </CardContent>
      </Card>
    </div>
  );
}

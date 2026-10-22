import OperationsWorkspace from "@/pages/operations/OperationsWorkspace";
import { useTranslation } from "@/i18n";
import DocumentsPanel from "@/pages/documents/DocumentsPanel";
export default function FileManager() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <OperationsWorkspace module="output-files" />
          <h1 className="text-2xl font-semibold">{t("nav.documents")}</h1>
      <DocumentsPanel />
    </div>
  );
}

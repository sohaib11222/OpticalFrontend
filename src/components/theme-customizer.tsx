import { useUIThemeStore } from "@/store/ui-theme.store"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Settings } from "lucide-react"
import { useTranslation } from "@/i18n"

const themes = [
  {
    id: "dark-blue",
    labelKey: "theme.darkBlue",
    preview: "dark-blue-preview",
  },
  {
    id: "gaussian-black",
    labelKey: "theme.gaussianBlack",
    preview: "gaussian-black-preview",
  },
  {
    id: "classic-light",
    labelKey: "theme.classicLight",
    preview: "bg-gradient-to-r from-gray-100 to-gray-200",
  },
  {
    id: "semi-dark",
    labelKey: "theme.semiDark",
    preview: "bg-gradient-to-r from-gray-300 to-gray-900",
  },
]

export default function ThemeCustomizer() {
  const { setTheme: setMode } = useTheme()        // next-themes
  const { theme, setTheme } = useUIThemeStore()   // custom themes
  const { t } = useTranslation()

  return (
    <Sheet>
      {/* Trigger */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="
                  rounded-full h-10 w-10 fixed bottom-4 right-4 z-50 
                  shadow-lg cursor-pointer [&_svg]:size-5
                  hover:bg-primary/90 transition
                "
              >
                <Settings className="animate-spin" />
              </Button>
            </SheetTrigger>
          </TooltipTrigger>

          <TooltipContent side="left">
            {t("theme.customizerTooltip")}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Panel */}
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>
            {t("theme.customizer")}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {themes.map((themeOption) => (
            <div
              key={themeOption.id}
              onClick={() => {
                setMode("light")
                setTheme(themeOption.id)
              }}
              className={`relative h-16 rounded-lg cursor-pointer transition hover:scale-105 overflow-hidden
                  ${theme === themeOption.id ? "ring-2 ring-blue-500 scale-105" : ""}
                  ${themeOption.preview}
                `}
            >
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20" />

              {/* Theme Name */}
              <span className="absolute bottom-1 left-2 text-[11px] font-medium text-white bg-black/40 px-2 py-0.5 rounded">
                {t(themeOption.labelKey)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={() => {
              setTheme("")        // ❌ remove custom theme
              setMode("system")   // ✅ reset to system theme
            }}
            className="w-full py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition"
          >
            {t("theme.reset")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
import React from "react";
import { SessionProvider } from "@/auth/session";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import UIThemeProvider from "@/providers/ui-theme-provider";
import { TranslationProvider } from "@/i18n";

import { router } from "@/routes";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark-blue"
      enableSystem
      disableTransitionOnChange
    >
      <UIThemeProvider>
        <TranslationProvider>
          <SessionProvider>
            <RouterProvider router={router} />
          </SessionProvider>
        </TranslationProvider>
      </UIThemeProvider>
    </ThemeProvider>
    <Toaster position="top-right" richColors closeButton />
  </React.StrictMode>,
);

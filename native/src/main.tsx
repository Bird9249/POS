import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { configureZodLao } from "@/lib/zod/lao-locale";
import { applyAndroidSafeAreaFallback } from "@/lib/safe-area";
import { queryClient } from "@/lib/query-client";
import { router } from "./router";
import "./index.css";

configureZodLao();
applyAndroidSafeAreaFallback();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>,
);

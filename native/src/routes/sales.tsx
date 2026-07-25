import { createFileRoute } from "@tanstack/react-router";
import { SalesHistoryPage } from "@/features/sales/sales-history-page";

export const Route = createFileRoute("/sales")({
  component: Page,
});

function Page() {
  return <SalesHistoryPage />;
}

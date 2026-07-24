import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/products")({
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="ສິນຄ້າ"
      description="ລາຍການສິນຄ້າ — ຈະພັດທະນາໃນ Phase 1"
    />
  );
}

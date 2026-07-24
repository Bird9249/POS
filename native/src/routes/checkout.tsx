import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/checkout")({
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="ຂາຍ"
      description="ໜ້າຂາຍ — ຈະພັດທະນາໃນ Phase 3"
    />
  );
}

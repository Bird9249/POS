import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/reports")({
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="ລາຍງານ"
      description="ລາຍງານການຂາຍ — ຈະພັດທະນາໃນ Phase 6"
    />
  );
}

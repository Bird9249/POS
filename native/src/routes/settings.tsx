import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/settings")({
  component: Page,
});

function Page() {
  return (
    <PlaceholderPage
      title="ຕັ້ງຄ່າ"
      description="ຕັ້ງຄ່າຮ້ານ / ໃບເສຣັດ — ຈະພັດທະນາໃນ Phase 5"
    />
  );
}

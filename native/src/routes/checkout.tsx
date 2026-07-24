import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/features/checkout/checkout-page";

export const Route = createFileRoute("/checkout")({
  component: Page,
});

function Page() {
  return <CheckoutPage />;
}

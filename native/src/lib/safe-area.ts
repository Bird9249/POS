/**
 * System bar insets are handled by MainActivity (WebView padding).
 * Keep --sab at 0 on Android so the bottom bar sits flush above the OS nav.
 */
export function applyAndroidSafeAreaFallback() {
  const root = document.documentElement;
  root.style.setProperty("--sat", "env(safe-area-inset-top, 0px)");
  root.style.setProperty("--sar", "env(safe-area-inset-right, 0px)");
  root.style.setProperty("--sab", "0px");
  root.style.setProperty("--sal", "env(safe-area-inset-left, 0px)");

  root.style.paddingTop = "";
  root.style.paddingBottom = "";
  const app = document.getElementById("root");
  if (app) {
    app.style.paddingTop = "";
    app.style.paddingBottom = "";
  }
}

import type { RenderedReceipt } from "./render-receipt";

/** Open system print dialog with monospace receipt (thermal driver / PDF). */
export function printReceiptText(receipt: RenderedReceipt) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt</title>
  <style>
    @page { margin: 4mm; size: auto; }
    body {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: ${receipt.widthMm === 58 ? "11px" : "12px"};
      line-height: 1.25;
      white-space: pre;
    }
  </style>
</head>
<body>${escapeHtml(receipt.text)}</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(iframe);
    throw new Error("PRINT_UNAVAILABLE");
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    try {
      document.body.removeChild(iframe);
    } catch {
      // already removed
    }
  };

  win.focus();
  win.onafterprint = cleanup;
  setTimeout(() => {
    try {
      win.print();
    } catch {
      cleanup();
      throw new Error("PRINT_FAILED");
    }
    // Fallback cleanup if afterprint never fires
    setTimeout(cleanup, 60_000);
  }, 50);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

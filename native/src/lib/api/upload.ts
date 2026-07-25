import { apiFetch } from "./fetcher";

async function uploadImage(
  file: File,
  keyPrefix: string,
): Promise<string | null> {
  const safeName = file.name.replace(/\s+/g, "-") || "image.jpg";
  const key = `${keyPrefix}/${Date.now()}-${safeName}`;
  try {
    const contentType = file.type || "image/jpeg";
    const presign = await apiFetch<{ uploadUrl: string; key: string }>(
      "/api/upload/presign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, contentType }),
      },
    );
    const put = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!put.ok) return null;
    return presign.key;
  } catch {
    return null;
  }
}

export function uploadProductImage(file: File) {
  return uploadImage(file, "uploads/products");
}

/** Transfer slip photo attached to a sale. */
export function uploadSaleSlip(file: File) {
  return uploadImage(file, "uploads/sales/slips");
}

export function uploadStoreLogo(file: File) {
  return uploadImage(file, "uploads/store/logo");
}

export function uploadStoreQr(file: File) {
  return uploadImage(file, "uploads/store/qr");
}

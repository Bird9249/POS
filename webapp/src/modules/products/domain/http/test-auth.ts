import { auth } from "@/modules/auth/domain/better-auth";

export async function signInCookie(email: string, password: string) {
  const res = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  const raw =
    setCookie.length > 0
      ? setCookie
      : [res.headers.get("set-cookie")].filter(Boolean);
  const cookie = raw
    .map((c) => String(c).split(";")[0])
    .filter(Boolean)
    .join("; ");
  if (!cookie) {
    throw new Error(`sign-in failed for ${email}: no cookie`);
  }
  return cookie;
}

export function authedRequest(
  url: string,
  cookie: string,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers);
  headers.set("Cookie", cookie);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return new Request(url, { ...init, headers });
}

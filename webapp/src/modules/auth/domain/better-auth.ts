import { getEffectivePermissionsService } from "@/modules/roles/domain/service/user-permissions";
import { db } from "@/server/platform/db/client";
import * as schema from "@/server/platform/db/schema";
import { parseCorsOrigins } from "@/server/platform/http/cors-origins";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  admin,
  customSession,
  openAPI,
  phoneNumber,
} from "better-auth/plugins";
import { bcryptLikeHasher } from "./services";

const baseURL =
  process.env.BETTER_AUTH_BASE_URL ||
  parseCorsOrigins(process.env.CORS_ORIGIN)[0] ||
  "http://localhost:3000";

const trustedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);
const useSecureCookies = baseURL.startsWith("https://");

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    password: {
      hash: bcryptLikeHasher.hash,
      async verify({ password, hash }) {
        return await bcryptLikeHasher.verify(password, hash);
      },
    },
  },
  advanced: {
    // Native uses Vite same-origin proxy on http://localhost — Secure+None
    // cookies are often dropped by Tauri WebView, so session never sticks.
    // HTTPS production: None + Secure for cross-site; local HTTP: Lax.
    defaultCookieAttributes: {
      sameSite: useSecureCookies ? "none" : "lax",
      secure: useSecureCookies,
      httpOnly: true,
    },
    cookiePrefix: "admin-",
  },
  plugins: [
    admin(),
    phoneNumber(),
    customSession(async ({ user, session }) => {
      const perms = await getEffectivePermissionsService(db, user.id);
      return {
        user,
        session,
        permissions: perms.map((p) => p.id),
      };
    }),
    openAPI(),
  ],
});

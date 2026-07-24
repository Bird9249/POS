import { apiFetch } from "./fetcher";

export type MeUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export function fetchMe() {
  return apiFetch<{ user: MeUser }>("/api/me");
}

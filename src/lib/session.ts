import { headers } from "next/headers";
import { auth } from "./auth";
import type { Session } from "./auth";

export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

// API-route guard: returns the session when the caller is an admin, else null.
export async function getAdminSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

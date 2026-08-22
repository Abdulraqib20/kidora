import { headers } from "next/headers";
import { auth } from "./auth";
import type { Session } from "./auth";

/** Retrieve the active Better Auth session from incoming request headers. */
export async function getSession(): Promise<Session | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/** Authenticate caller and return session only when role is admin, else null. */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return null;
  return session;
}


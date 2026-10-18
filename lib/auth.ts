import { API_BASE, request } from "./api";
import {
  clearSessionToken,
  setSessionToken,
  tokenFromSetCookie,
} from "./session";

export async function signIn(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText);
    throw new Error(t || `sign-in failed (${res.status})`);
  }
  const token =
    tokenFromSetCookie(res.headers.get("set-cookie")) ??
    // some runtimes expose getSetCookie()
    (typeof res.headers.getSetCookie === "function"
      ? tokenFromSetCookie(res.headers.getSetCookie().join("; "))
      : null);
  if (!token) {
    throw new Error("No session cookie in sign-in response");
  }
  await setSessionToken(token);
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText);
    throw new Error(t || `sign-up failed (${res.status})`);
  }
  // sign-in after sign-up for a reliable Set-Cookie
  await signIn(email, password);
}

export async function signOut(): Promise<void> {
  try {
    await request("/api/auth/sign-out", { method: "POST" });
  } catch {
    /* ignore */
  }
  await clearSessionToken();
}

export async function getSessionUser(): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const s = await request<{ user: { id: string; email: string; name: string } }>(
      "/api/auth/get-session",
    );
    return s?.user ?? null;
  } catch {
    return null;
  }
}

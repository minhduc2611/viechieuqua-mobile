import * as SecureStore from "expo-secure-store";

const KEY = "better-auth.session_token";

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}

/** Pull session token from Set-Cookie (better-auth sign-in). */
export function tokenFromSetCookie(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/better-auth\.session_token=([^;]+)/);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

import { getSessionToken } from "./session";
import { getCompanyId } from "./companyId";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface Meta {
  totalCount: number;
  page: number;
  pageCount: number;
  perPage: number;
}

export async function request<T>(
  path: string,
  opts: RequestInit & { companyId?: string; skipAuth?: boolean } = {},
): Promise<T> {
  const { companyId, skipAuth, headers: extra, ...init } = opts;
  const headers = new Headers(extra);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = await getSessionToken();
    if (token) headers.set("Cookie", `better-auth.session_token=${token}`);
  }
  const cid = companyId ?? getCompanyId();
  if (cid) headers.set("x-company-id", cid);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.headers.get("content-type")?.includes("application/json")) {
    return (await res.json()) as T;
  }
  return undefined as T;
}

export { BASE as API_BASE };

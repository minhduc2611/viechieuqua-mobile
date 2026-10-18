import { request, type Meta } from "./api";
import type { HourRow } from "./hours";

export async function listPendingHours(companyId: string) {
  const q = new URLSearchParams({ status: "0", perPage: "100" });
  return request<{ data: (HourRow & { userId: string })[]; meta: Meta }>(
    `/api/hours?${q}`,
    { companyId },
  );
}

export async function setHoursStatus(
  companyId: string,
  id: string,
  status: 1 | -1,
) {
  return request(`/api/hours/${id}`, {
    method: "PATCH",
    companyId,
    body: JSON.stringify({ status }),
  });
}

/** Matches backend `MANAGER_ROLES` in scope.ts */
export function isManagerRole(role: string | undefined | null) {
  return role === "owner" || role === "admin" || role === "superadmin";
}

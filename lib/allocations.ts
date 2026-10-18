import { request } from "./api";

export interface AllocationRow {
  id: string;
  projectId: string;
  userId: string;
  startDate: string;
  endDate: string;
  hours: string;
  jobtypeId: string | null;
  taskId: string | null;
}

export interface AllocWarningUser {
  userId: string;
  name: string;
  allocated: string;
  target: string;
  balance: string;
  status: "over" | "under" | "ok";
  overloadedDays: string[];
}

export async function listAllocations(
  companyId: string,
  startDate: string,
  endDate: string,
) {
  const q = new URLSearchParams({ startDate, endDate });
  return request<AllocationRow[]>(`/api/allocations?${q}`, { companyId });
}

export async function allocationWarnings(
  companyId: string,
  startDate: string,
  endDate: string,
) {
  const q = new URLSearchParams({ startDate, endDate });
  return request<{
    startDate: string;
    endDate: string;
    users: AllocWarningUser[];
  }>(`/api/allocations/warnings?${q}`, { companyId });
}

import { request, type Meta } from "./api";

export interface HourRow {
  id: string;
  projectId: string;
  userId?: string;
  taskId: string | null;
  date: string;
  hours: string;
  description: string | null;
  billable: boolean;
  status: number;
}

export interface ProjectOpt {
  id: string;
  name: string;
}

export interface TaskOpt {
  id: string;
  title: string;
}

function mondayOf(d: Date): string {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const x = new Date(iso + "T12:00:00");
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}

export function weekRange(anchor = new Date()) {
  const from = mondayOf(anchor);
  return { from, to: addDays(from, 6), weekStart: from };
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export type HoursFilter = {
  /** Override week defaults */
  from?: string;
  to?: string;
  projectId?: string | null;
  userId?: string | null;
  billable?: boolean | null;
  /** undefined = all; 0 pending, 1 approved, -1 declined */
  status?: number | null;
};

export async function listWeekHours(companyId: string, filter: HoursFilter = {}) {
  const week = weekRange();
  const q = new URLSearchParams({
    from: filter.from ?? week.from,
    to: filter.to ?? week.to,
    perPage: "100",
  });
  if (filter.projectId) q.set("projectId", filter.projectId);
  if (filter.userId) q.set("userId", filter.userId);
  if (filter.billable === true || filter.billable === false) {
    q.set("billable", String(filter.billable));
  }
  if (filter.status !== undefined && filter.status !== null) {
    q.set("status", String(filter.status));
  }
  return request<{ data: HourRow[]; meta: Meta }>(`/api/hours?${q}`, {
    companyId,
  });
}

export async function createHour(
  companyId: string,
  input: {
    projectId: string;
    taskId?: string;
    date: string;
    hours: number;
    description?: string;
    billable?: boolean;
  },
) {
  return request<HourRow>("/api/hours", {
    method: "POST",
    companyId,
    body: JSON.stringify(input),
  });
}

export async function updateHour(
  companyId: string,
  id: string,
  input: {
    projectId?: string;
    taskId?: string | null;
    date?: string;
    hours?: number;
    description?: string | null;
    billable?: boolean;
  },
) {
  return request<HourRow>(`/api/hours/${id}`, {
    method: "PATCH",
    companyId,
    body: JSON.stringify(input),
  });
}

export async function deleteHour(companyId: string, id: string) {
  return request<void>(`/api/hours/${id}`, { method: "DELETE", companyId });
}

export async function weekBalance(companyId: string, weekStart?: string) {
  const start = weekStart ?? weekRange().weekStart;
  return request<{
    weekStart: string;
    weekEnd: string;
    target: string;
    tracked: string;
    billable: string;
    balance: string;
    remaining: string;
  }>(`/api/hours/week-balance?weekStart=${start}`, { companyId });
}

export async function listProjects(companyId: string) {
  const res = await request<{ data: ProjectOpt[] } | ProjectOpt[]>(
    "/api/projects?perPage=100",
    { companyId },
  );
  return Array.isArray(res) ? res : (res.data ?? []);
}

export async function listTasks(companyId: string, projectId: string) {
  const res = await request<{ data: TaskOpt[] } | TaskOpt[]>(
    `/api/tasks?projectId=${projectId}&perPage=100`,
    { companyId },
  );
  return Array.isArray(res) ? res : (res.data ?? []);
}

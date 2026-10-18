import { request } from "./api";

export interface Timer {
  id: string;
  companyId: string;
  userId: string;
  projectId: string;
  taskId: string | null;
  jobtypeId: string | null;
  description: string | null;
  billable: boolean;
  startedAt: string;
  elapsedSeconds: number;
}

export async function getActiveTimer(companyId: string) {
  const r = await request<{ timer: Timer | null }>("/api/timers/active", {
    companyId,
  });
  return r.timer;
}

export async function startTimer(
  companyId: string,
  input: {
    projectId: string;
    taskId?: string;
    description?: string;
    billable?: boolean;
  },
) {
  return request<Timer>("/api/timers/start", {
    method: "POST",
    companyId,
    body: JSON.stringify(input),
  });
}

export async function stopTimer(
  companyId: string,
  input?: { description?: string | null },
) {
  return request<{ timer: null; hours: { id: string } }>("/api/timers/stop", {
    method: "POST",
    companyId,
    body: JSON.stringify(input ?? {}),
  });
}

export async function discardTimer(companyId: string) {
  return request<void>("/api/timers/active", { method: "DELETE", companyId });
}

export function formatElapsed(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

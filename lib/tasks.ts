import { request, type Meta } from "./api";

export interface TaskRow {
  id: string;
  projectId: string;
  title: string;
  status: string;
  priority: number;
  dueDate: string | null;
  assigneeUserId: string | null;
}

export interface TaskStatus {
  id: string;
  key: string;
  name: string;
  color: string;
  orderNr: number;
  isDone: boolean;
}

export interface MemberOpt {
  userId: string;
  name: string;
  email: string;
}

export async function listTaskStatuses(companyId: string) {
  return request<TaskStatus[]>("/api/task-statuses", { companyId });
}

export async function listProjectTasks(companyId: string, projectId: string) {
  const res = await request<{ data: TaskRow[]; meta: Meta } | TaskRow[]>(
    `/api/tasks?projectId=${projectId}&perPage=100`,
    { companyId },
  );
  return Array.isArray(res) ? res : (res.data ?? []);
}

export async function updateTask(
  companyId: string,
  id: string,
  input: {
    title?: string;
    status?: string;
    priority?: number;
    dueDate?: string | null;
    assigneeUserId?: string | null;
  },
) {
  return request<TaskRow>(`/api/tasks/${id}`, {
    method: "PATCH",
    companyId,
    body: JSON.stringify(input),
  });
}

export async function listMembers(companyId: string) {
  const res = await request<{
    data: { userId: string; name: string; email: string }[];
  }>("/api/companies/members", { companyId });
  return res.data ?? [];
}

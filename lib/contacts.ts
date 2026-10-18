import { request, type Meta } from "./api";

export interface ContactRow {
  id: string;
  companyId: string;
  accountId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
}

export type ContactInput = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  accountId?: string | null;
};

export function displayName(c: ContactRow) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
}

export async function listContacts(companyId: string, accountId?: string) {
  const q = accountId ? `?accountId=${accountId}` : "";
  return request<{ data: ContactRow[]; meta: Meta }>(`/api/contacts${q}`, {
    companyId,
  });
}

export async function getContact(companyId: string, id: string) {
  return request<ContactRow>(`/api/contacts/${id}`, { companyId });
}

export async function createContact(companyId: string, input: ContactInput) {
  return request<ContactRow>("/api/contacts", {
    method: "POST",
    companyId,
    body: JSON.stringify(input),
  });
}

export async function updateContact(
  companyId: string,
  id: string,
  input: Partial<ContactInput>,
) {
  return request<ContactRow>(`/api/contacts/${id}`, {
    method: "PATCH",
    companyId,
    body: JSON.stringify(input),
  });
}

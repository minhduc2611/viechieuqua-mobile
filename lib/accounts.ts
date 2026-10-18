import { request, type Meta } from "./api";

export interface AccountRow {
  id: string;
  name: string;
  vatId: string | null;
  status: number;
  accountTypeName: string | null;
  accountGroupName: string | null;
  industry: string | null;
  tags: string | null;
  managerIds: string[];
  billing?: {
    street: string | null;
    city: string | null;
    zip: string | null;
    country: string | null;
  };
  visiting?: {
    street: string | null;
    city: string | null;
    zip: string | null;
    country: string | null;
  };
}

export async function listAccounts(companyId: string, opts?: { mine?: boolean }) {
  const q = new URLSearchParams({ perPage: "100" });
  if (opts?.mine) q.set("mine", "1");
  return request<{ data: AccountRow[]; meta: Meta }>(`/api/accounts?${q}`, {
    companyId,
  });
}

export async function getAccount(companyId: string, id: string) {
  return request<AccountRow>(`/api/accounts/${id}`, { companyId });
}

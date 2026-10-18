import { request, type Meta } from "./api";

export interface InvoiceRow {
  id: string;
  text: string;
  quantity: string;
  unitPrice: string;
  netTotal: string;
  vatTotal: string;
  grossTotal: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: number;
  invoiceDate: string;
  dueDate: string | null;
  netTotal: string;
  vatTotal: string;
  grossTotal: string;
  currencyCode: string;
  notes: string | null;
  accountId: string | null;
  projectId: string | null;
  rows: InvoiceRow[];
}

export interface CostRow {
  id: string;
  projectId: string;
  type: string;
  amount: string;
  description: string | null;
  invoiceNr: string | null;
  date: string;
}

/** Common sales invoice statuses used in the web UI. */
export function invoiceStatusLabel(s: number) {
  if (s === 0) return "draft";
  if (s === 1) return "sent";
  if (s === 2) return "paid";
  if (s === 3) return "credited";
  return `status ${s}`;
}

export async function listInvoices(companyId: string, status?: number) {
  const q = new URLSearchParams({ page: "1", perPage: "50" });
  if (status !== undefined) q.set("status", String(status));
  return request<{ data: Invoice[]; meta: Meta }>(`/api/invoices?${q}`, {
    companyId,
  });
}

export async function getInvoice(companyId: string, id: string) {
  return request<Invoice>(`/api/invoices/${id}`, { companyId });
}

export async function listCosts(companyId: string) {
  return request<{ data: CostRow[]; meta: Meta }>("/api/costs?page=1&perPage=50", {
    companyId,
  });
}

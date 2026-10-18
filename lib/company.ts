import { create } from "zustand";
import { request } from "./api";
import { getCompanyId, setCompanyId } from "./companyId";

export interface Company {
  id: string;
  name: string;
  role: string;
}

interface CompanyState {
  selectedId: string | null;
  companies: Company[];
  setSelectedId: (id: string | null) => void;
  loadCompanies: () => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  selectedId: getCompanyId(),
  companies: [],
  setSelectedId: (id) => {
    setCompanyId(id);
    set({ selectedId: id });
  },
  loadCompanies: async () => {
    const res = await request<{ data: Company[] } | Company[]>("/api/companies");
    const list = Array.isArray(res) ? res : (res.data ?? []);
    set({ companies: list });
    const cur = get().selectedId;
    if (!cur && list[0]) get().setSelectedId(list[0].id);
    else if (cur && !list.some((c) => c.id === cur) && list[0]) {
      get().setSelectedId(list[0].id);
    }
  },
}));

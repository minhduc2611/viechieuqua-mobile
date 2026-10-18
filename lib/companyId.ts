let selectedId: string | null = null;

export function getCompanyId(): string | null {
  return selectedId;
}

export function setCompanyId(id: string | null): void {
  selectedId = id;
}

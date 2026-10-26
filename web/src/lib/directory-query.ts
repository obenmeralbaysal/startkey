export interface DirectoryQueryState {
  q: string;
  il: string;
  ilce: string;
  ofis: string;
}

export function directoryHref(basePath: string, query: DirectoryQueryState, page = 1): string {
  const params = new URLSearchParams();
  if (query.q) {
    params.set("q", query.q);
  }
  if (query.il) {
    params.set("il", query.il);
  }
  if (query.ilce) {
    params.set("ilce", query.ilce);
  }
  if (query.ofis) {
    params.set("ofis", query.ofis);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

/** Shapes returned by PortalNetworkController. */

export type NetworkRole = "franchise_admin" | "franchise_staff";

export type NetworkSection = "summary" | "offices" | "consultants";

export type NetworkSummary = {
  offices: number;
  consultants: number;
  active_portfolios: number;
  branches: number;
  updated_at: string | null;
};

export type NetworkOffice = {
  id: number;
  name: string;
  city: string | null;
  logo: string | null;
  consultant_count: number;
  portfolio_count: number;
};

export type NetworkConsultantOffice = {
  id: number;
  name: string;
};

export type NetworkConsultant = {
  id: number;
  name: string;
  title: string | null;
  office: NetworkConsultantOffice | null;
  photo: string | null;
  portfolio_count: number;
};

/** Paged list envelope from PortalNetworkController. */
export type NetworkPagination = {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
};

export type NetworkPage<T> = {
  data: T[];
  pagination: NetworkPagination;
};

export type NetworkQuery = {
  page?: string;
  q?: string;
  office_id?: string;
  lang?: string;
};

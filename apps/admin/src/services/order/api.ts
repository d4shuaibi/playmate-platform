import { appEnv } from "../../config/env";
import { getAdminAuthSession } from "../auth/session";
import { type ApiEnvelope } from "../auth/types";
import { type Order, type OrderStatus } from "./types";

const buildUrl = (path: string) => {
  return `${appEnv.apiBaseUrl}${path}`;
};

const buildAuthHeader = (accessToken: string) => {
  return {
    Authorization: `Bearer ${accessToken}`
  };
};

const ensureAccessToken = (accessToken?: string) => {
  if (accessToken && accessToken.trim()) return accessToken;
  const session = getAdminAuthSession();
  if (session?.accessToken) return session.accessToken;
  throw new Error("未登录或登录已失效");
};

const unwrapEnvelope = async <TData>(response: Response) => {
  const json = (await response.json()) as ApiEnvelope<TData>;
  if (!response.ok || json.code !== 0 || json.data == null) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }
  return json.data;
};

export const requestOrders = async (
  accessToken: string,
  filters?: { keyword?: string; status?: OrderStatus; page?: number; pageSize?: number }
) => {
  const token = ensureAccessToken(accessToken);
  const search = new URLSearchParams();
  if (filters?.keyword?.trim()) search.set("keyword", filters.keyword.trim());
  if (filters?.status) search.set("status", filters.status);
  if (filters?.page) search.set("page", String(filters.page));
  if (filters?.pageSize) search.set("pageSize", String(filters.pageSize));
  const query = search.toString();
  const url = query ? `/orders?${query}` : "/orders";

  const response = await fetch(buildUrl(url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ items: Order[]; total: number }>(response);
};

export const requestOrderDetail = async (accessToken: string, orderId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/orders/${encodeURIComponent(orderId)}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<Order>(response);
};

import { appEnv } from "../../config/env";
import { getAdminAuthSession } from "../auth/session";
import { type ApiEnvelope } from "../auth/types";
import { type Product, type ProductNotice, type ProductStatus } from "./types";

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

export const requestProducts = async (
  accessToken: string,
  filters?: {
    name?: string;
    categoryId?: string;
    status?: ProductStatus;
    page?: number;
    pageSize?: number;
  }
) => {
  const token = ensureAccessToken(accessToken);
  const search = new URLSearchParams();
  if (filters?.name?.trim()) {
    search.set("name", filters.name.trim());
  }
  if (filters?.categoryId?.trim()) {
    search.set("categoryId", filters.categoryId.trim());
  }
  if (filters?.status) {
    search.set("status", filters.status);
  }
  if (filters?.page) {
    search.set("page", String(filters.page));
  }
  if (filters?.pageSize) {
    search.set("pageSize", String(filters.pageSize));
  }
  const query = search.toString();
  const url = query ? `/products?${query}` : "/products";

  const response = await fetch(buildUrl(url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ items: Product[]; total: number }>(response);
};

export const requestCreateProduct = async (
  accessToken: string,
  body: {
    name: string;
    imageUrl: string;
    heroImages: string[];
    titleAccent: string;
    categoryId: string;
    categoryName: string;
    price: number;
    originPrice: number | null;
    stockText: string;
    badges: string[];
    descriptionLines: string[];
    notices: ProductNotice[];
  }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl("/products"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<Product>(response);
};

export const requestProductDetail = async (accessToken: string, productId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/products/${encodeURIComponent(productId)}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<Product>(response);
};

export const requestUpdateProduct = async (
  accessToken: string,
  productId: string,
  body: {
    name: string;
    imageUrl: string;
    heroImages: string[];
    titleAccent: string;
    categoryId: string;
    categoryName: string;
    price: number;
    originPrice: number | null;
    stockText: string;
    badges: string[];
    descriptionLines: string[];
    notices: ProductNotice[];
  }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/products/${encodeURIComponent(productId)}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<Product>(response);
};

export const requestDisableProduct = async (accessToken: string, productId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/products/${encodeURIComponent(productId)}/disable`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ success: true }>(response);
};

export const requestEnableProduct = async (accessToken: string, productId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/products/${encodeURIComponent(productId)}/enable`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ success: true }>(response);
};

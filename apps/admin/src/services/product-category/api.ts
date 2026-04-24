import { appEnv } from "../../config/env";
import { getAdminAuthSession } from "../auth/session";
import { type ApiEnvelope } from "../auth/types";
import { type ProductCategory } from "./types";

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

export const requestProductCategories = async (
  accessToken: string,
  filters?: { keyword?: string; disabled?: boolean; page?: number; pageSize?: number }
) => {
  const token = ensureAccessToken(accessToken);
  const search = new URLSearchParams();
  if (filters?.keyword?.trim()) {
    search.set("keyword", filters.keyword.trim());
  }
  if (filters?.disabled !== undefined) {
    search.set("disabled", filters.disabled ? "true" : "false");
  }
  if (filters?.page) {
    search.set("page", String(filters.page));
  }
  if (filters?.pageSize) {
    search.set("pageSize", String(filters.pageSize));
  }
  const query = search.toString();
  const url = query ? `/product-categories?${query}` : "/product-categories";

  const response = await fetch(buildUrl(url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ items: ProductCategory[]; total: number }>(response);
};

export const requestCreateProductCategory = async (accessToken: string, body: { name: string }) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl("/product-categories"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<ProductCategory>(response);
};

export const requestProductCategoryDetail = async (accessToken: string, categoryId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/product-categories/${encodeURIComponent(categoryId)}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<ProductCategory>(response);
};

export const requestUpdateProductCategory = async (
  accessToken: string,
  categoryId: string,
  body: { name: string }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/product-categories/${encodeURIComponent(categoryId)}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<ProductCategory>(response);
};

export const requestDisableProductCategory = async (accessToken: string, categoryId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(
    buildUrl(`/product-categories/${encodeURIComponent(categoryId)}/disable`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeader(token)
      }
    }
  );

  return unwrapEnvelope<{ success: true }>(response);
};

export const requestEnableProductCategory = async (accessToken: string, categoryId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(
    buildUrl(`/product-categories/${encodeURIComponent(categoryId)}/enable`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeader(token)
      }
    }
  );

  return unwrapEnvelope<{ success: true }>(response);
};

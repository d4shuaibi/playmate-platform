import { appEnv } from "../../config/env";
import { getAdminAuthSession } from "../auth/session";
import { type ApiEnvelope } from "../auth/types";
import { type HomeBanner, type HomeNotice } from "./types";

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

// ==================== Banner ====================

export const requestBanners = async (
  accessToken: string,
  filters?: {
    enabled?: boolean;
    page?: number;
    pageSize?: number;
  }
) => {
  const token = ensureAccessToken(accessToken);
  const search = new URLSearchParams();
  if (filters?.enabled !== undefined) {
    search.set("enabled", String(filters.enabled));
  }
  if (filters?.page) {
    search.set("page", String(filters.page));
  }
  if (filters?.pageSize) {
    search.set("pageSize", String(filters.pageSize));
  }
  const query = search.toString();
  const url = query ? `/home-content/banners?${query}` : "/home-content/banners";

  const response = await fetch(buildUrl(url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ items: HomeBanner[]; total: number }>(response);
};

export const requestBannerDetail = async (accessToken: string, bannerId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/home-content/banners/${encodeURIComponent(bannerId)}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<HomeBanner>(response);
};

export const requestCreateBanner = async (
  accessToken: string,
  body: {
    title: string;
    subtitle: string;
    imageUrl: string;
    linkUrl?: string | null;
    sortOrder?: number;
    enabled?: boolean;
  }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl("/home-content/banners"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<HomeBanner>(response);
};

export const requestUpdateBanner = async (
  accessToken: string,
  bannerId: string,
  body: {
    title: string;
    subtitle: string;
    imageUrl: string;
    linkUrl?: string | null;
    sortOrder?: number;
    enabled?: boolean;
  }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/home-content/banners/${encodeURIComponent(bannerId)}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<HomeBanner>(response);
};

export const requestDeleteBanner = async (accessToken: string, bannerId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/home-content/banners/${encodeURIComponent(bannerId)}`), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ success: true }>(response);
};

// ==================== Notice ====================

export const requestNotices = async (
  accessToken: string,
  filters?: {
    enabled?: boolean;
    page?: number;
    pageSize?: number;
  }
) => {
  const token = ensureAccessToken(accessToken);
  const search = new URLSearchParams();
  if (filters?.enabled !== undefined) {
    search.set("enabled", String(filters.enabled));
  }
  if (filters?.page) {
    search.set("page", String(filters.page));
  }
  if (filters?.pageSize) {
    search.set("pageSize", String(filters.pageSize));
  }
  const query = search.toString();
  const url = query ? `/home-content/notices?${query}` : "/home-content/notices";

  const response = await fetch(buildUrl(url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ items: HomeNotice[]; total: number }>(response);
};

export const requestNoticeDetail = async (accessToken: string, noticeId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/home-content/notices/${encodeURIComponent(noticeId)}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<HomeNotice>(response);
};

export const requestCreateNotice = async (
  accessToken: string,
  body: {
    content: string;
    sortOrder?: number;
    enabled?: boolean;
  }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl("/home-content/notices"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<HomeNotice>(response);
};

export const requestUpdateNotice = async (
  accessToken: string,
  noticeId: string,
  body: {
    content: string;
    sortOrder?: number;
    enabled?: boolean;
  }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/home-content/notices/${encodeURIComponent(noticeId)}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<HomeNotice>(response);
};

export const requestDeleteNotice = async (accessToken: string, noticeId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl(`/home-content/notices/${encodeURIComponent(noticeId)}`), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ success: true }>(response);
};

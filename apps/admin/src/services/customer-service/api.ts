import { appEnv } from "../../config/env";
import { getAdminAuthSession } from "../auth/session";
import { type ApiEnvelope } from "../auth/types";
import { type CustomerServiceAgent } from "./types";

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

export const requestCustomerServiceAgents = async (
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
  const url = query ? `/customer-service/agents?${query}` : "/customer-service/agents";

  const response = await fetch(buildUrl(url), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    }
  });

  return unwrapEnvelope<{ items: CustomerServiceAgent[]; total: number }>(response);
};

export const requestUploadFile = async (accessToken: string, file: File) => {
  const token = ensureAccessToken(accessToken);
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildUrl("/files/upload"), {
    method: "POST",
    headers: {
      ...buildAuthHeader(token)
    },
    body: formData
  });

  return unwrapEnvelope<{ id: string; url: string; originalName: string; mimeType: string }>(
    response
  );
};

export const requestCreateCustomerServiceAgent = async (
  accessToken: string,
  body: { nickname: string; wechatId: string; avatarUrl: string; wechatQrUrl: string }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(buildUrl("/customer-service/agents"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify(body)
  });

  return unwrapEnvelope<CustomerServiceAgent>(response);
};

export const requestCustomerServiceAgent = async (accessToken: string, agentId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(
    buildUrl(`/customer-service/agents/${encodeURIComponent(agentId)}`),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeader(token)
      }
    }
  );

  return unwrapEnvelope<CustomerServiceAgent>(response);
};

export const requestUpdateCustomerServiceAgent = async (
  accessToken: string,
  agentId: string,
  body: { nickname: string; wechatId: string; avatarUrl: string; wechatQrUrl: string }
) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(
    buildUrl(`/customer-service/agents/${encodeURIComponent(agentId)}`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeader(token)
      },
      body: JSON.stringify(body)
    }
  );

  return unwrapEnvelope<CustomerServiceAgent>(response);
};

export const requestDisableCustomerServiceAgent = async (accessToken: string, agentId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(
    buildUrl(`/customer-service/agents/${encodeURIComponent(agentId)}/disable`),
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

export const requestEnableCustomerServiceAgent = async (accessToken: string, agentId: string) => {
  const token = ensureAccessToken(accessToken);
  const response = await fetch(
    buildUrl(`/customer-service/agents/${encodeURIComponent(agentId)}/enable`),
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

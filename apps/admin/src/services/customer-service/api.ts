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

type UploadResult = { id: string; url: string; originalName: string; mimeType: string };

type UploadUrlData =
  | { mode: "direct" }
  | {
      mode: "cos";
      uploadUrl: string;
      formFields: Record<string, string>;
      fileId: string;
      accessUrl: string;
    };

/**
 * 上传文件。优先走云托管对象存储直传（绕开服务网关 1MB 请求体限制）：
 * 先向后端换取直传凭证，再把文件直接 POST 到对象存储；后端不可用对象存储时
 * 自动回退到 /files/upload 内存直传（本地联调）。
 */
export const requestUploadFile = async (accessToken: string, file: File): Promise<UploadResult> => {
  const token = ensureAccessToken(accessToken);

  const metaResponse = await fetch(buildUrl("/files/upload-url"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeader(token)
    },
    body: JSON.stringify({ filename: file.name })
  });
  const meta = await unwrapEnvelope<UploadUrlData>(metaResponse);

  if (meta.mode === "cos") {
    const cosForm = new FormData();
    Object.entries(meta.formFields).forEach(([key, value]) => cosForm.append(key, value));
    // file 字段必须最后追加（COS 要求 file 在表单字段之后）。
    cosForm.append("file", file);

    const cosResponse = await fetch(meta.uploadUrl, { method: "POST", body: cosForm });
    if (!cosResponse.ok) {
      throw new Error(`上传到对象存储失败：${cosResponse.status}`);
    }
    return {
      id: meta.fileId,
      url: meta.accessUrl,
      originalName: file.name,
      mimeType: file.type
    };
  }

  // 本地回退：直接 multipart 上传到后端内存存储。
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(buildUrl("/files/upload"), {
    method: "POST",
    headers: {
      ...buildAuthHeader(token)
    },
    body: formData
  });
  return unwrapEnvelope<UploadResult>(response);
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

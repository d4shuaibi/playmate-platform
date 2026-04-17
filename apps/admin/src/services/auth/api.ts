import { appEnv } from "../../config/env";
import {
  type AdminAuthProfile,
  type AdminAuthTokens,
  type AdminManager,
  type AdminManagerStatus,
  type ApiEnvelope
} from "./types";

type ChallengeResponseData = {
  challengeId: string;
  nonce: string;
  expiresIn: number;
};

const buildUrl = (path: string) => {
  return `${appEnv.apiBaseUrl}${path}`;
};

const postJson = async <TData>(path: string, body: Record<string, unknown>) => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const json = (await response.json()) as ApiEnvelope<TData>;
  if (!response.ok || json.code !== 0 || !json.data) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }
  return json.data;
};

const getAuthed = async <TData>(path: string, accessToken: string) => {
  const response = await fetch(buildUrl(path), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    }
  });
  const json = (await response.json()) as ApiEnvelope<TData>;
  if (!response.ok || json.code !== 0 || !json.data) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }
  return json.data;
};

const postAuthed = async <TData>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>
) => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(body)
  });
  const json = (await response.json()) as ApiEnvelope<TData>;
  if (!response.ok || json.code !== 0 || !json.data) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }
  return json.data;
};

const patchAuthed = async <TData>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>
) => {
  const response = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(body)
  });
  const json = (await response.json()) as ApiEnvelope<TData>;
  if (!response.ok || json.code !== 0 || !json.data) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }
  return json.data;
};

export const requestAdminChallenge = (username: string) => {
  return postJson<ChallengeResponseData>("/auth/admin/challenge", { username });
};

export const requestAdminLogin = (params: {
  username: string;
  challengeId: string;
  proof: string;
}) => {
  return postJson<AdminAuthTokens>("/auth/admin/login", params);
};

export const requestAdminRefresh = (refreshToken: string) => {
  return postJson<AdminAuthTokens>("/auth/admin/refresh", { refreshToken });
};

export const requestAdminLogout = async (refreshToken: string) => {
  try {
    await postJson<{ success: true }>("/auth/admin/logout", { refreshToken });
  } catch {
    // ignore logout failures to keep local cleanup reliable
  }
};

export const requestAdminMe = (accessToken: string) => {
  return getAuthed<{
    username: string;
    role: AdminAuthProfile["role"];
    permissions: AdminAuthProfile["permissions"];
  }>("/auth/admin/me", accessToken);
};

export const requestAdminManagers = async (
  accessToken: string,
  filters?: { name?: string; status?: AdminManagerStatus }
) => {
  const search = new URLSearchParams();
  if (filters?.name?.trim()) {
    search.set("name", filters.name.trim());
  }
  if (filters?.status) {
    search.set("status", filters.status);
  }
  const query = search.toString();
  const url = query ? `/auth/admin/managers?${query}` : "/auth/admin/managers";
  const data = await getAuthed<{ items: AdminManager[] }>(url, accessToken);
  return data.items;
};

export const requestAdminManagerDetail = (accessToken: string, managerId: string) => {
  return getAuthed<AdminManager>(
    `/auth/admin/managers/${encodeURIComponent(managerId)}`,
    accessToken
  );
};

export const requestCreateAdminManager = (
  accessToken: string,
  body: { name: string; username: string; password: string }
) => {
  return postAuthed<AdminManager>("/auth/admin/managers", accessToken, body);
};

export const requestUpdateAdminManager = (
  accessToken: string,
  managerId: string,
  body: { name?: string; password?: string }
) => {
  return patchAuthed<AdminManager>(
    `/auth/admin/managers/${encodeURIComponent(managerId)}`,
    accessToken,
    body
  );
};

export const requestToggleAdminManagerStatus = (
  accessToken: string,
  managerId: string,
  status: AdminManagerStatus
) => {
  return patchAuthed<AdminManager>(
    `/auth/admin/managers/${encodeURIComponent(managerId)}/status`,
    accessToken,
    { status }
  );
};

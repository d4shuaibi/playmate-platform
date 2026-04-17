import { appEnv } from "../../config/env";
import { type AdminAuthProfile, type AdminAuthTokens, type ApiEnvelope } from "./types";

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

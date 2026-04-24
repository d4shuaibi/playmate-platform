import { appEnv } from "../../config/env";
import { type ApiEnvelope } from "../auth/types";
import { getAdminAuthSession } from "../auth/session";
import {
  type Worker,
  type WorkerJoinApplication,
  type WorkerJoinStatus,
  type WorkerStatus
} from "./types";

const buildUrl = (path: string) => {
  return `${appEnv.apiBaseUrl}${path}`;
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

export const requestWorkerApplications = async (
  accessToken: string,
  filters?: { keyword?: string; status?: WorkerJoinStatus; page?: number; pageSize?: number }
) => {
  const token = ensureAccessToken(accessToken);
  const search = new URLSearchParams();
  if (filters?.keyword?.trim()) search.set("keyword", filters.keyword.trim());
  if (filters?.status) search.set("status", filters.status);
  if (filters?.page) search.set("page", String(filters.page));
  if (filters?.pageSize) search.set("pageSize", String(filters.pageSize));
  const qs = search.toString();
  const path = qs ? `/worker-applications?${qs}` : "/worker-applications";
  const res = await fetch(buildUrl(path), {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  });
  return unwrapEnvelope<{ items: WorkerJoinApplication[]; total: number }>(res);
};

export const requestAuditWorkerApplication = async (
  accessToken: string,
  applicationId: string,
  input: { action: "approve" | "reject"; rejectReason?: string }
) => {
  const token = ensureAccessToken(accessToken);
  const res = await fetch(
    buildUrl(`/worker-applications/${encodeURIComponent(applicationId)}/audit`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(input)
    }
  );
  return unwrapEnvelope<{ success: true }>(res);
};

export const requestWorkers = async (
  accessToken: string,
  filters?: {
    keyword?: string;
    joinStatus?: WorkerJoinStatus;
    status?: WorkerStatus;
    page?: number;
    pageSize?: number;
  }
) => {
  const token = ensureAccessToken(accessToken);
  const search = new URLSearchParams();
  if (filters?.keyword?.trim()) search.set("keyword", filters.keyword.trim());
  if (filters?.joinStatus) search.set("joinStatus", filters.joinStatus);
  if (filters?.status) search.set("status", filters.status);
  if (filters?.page) search.set("page", String(filters.page));
  if (filters?.pageSize) search.set("pageSize", String(filters.pageSize));
  const qs = search.toString();
  const path = qs ? `/workers?${qs}` : "/workers";
  const res = await fetch(buildUrl(path), {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  });
  return unwrapEnvelope<{ items: Worker[]; total: number }>(res);
};

export const requestDisableWorker = async (accessToken: string, workerId: string) => {
  const token = ensureAccessToken(accessToken);
  const res = await fetch(buildUrl(`/workers/${encodeURIComponent(workerId)}/disable`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  });
  return unwrapEnvelope<{ success: true }>(res);
};

export const requestEnableWorker = async (accessToken: string, workerId: string) => {
  const token = ensureAccessToken(accessToken);
  const res = await fetch(buildUrl(`/workers/${encodeURIComponent(workerId)}/enable`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  });
  return unwrapEnvelope<{ success: true }>(res);
};

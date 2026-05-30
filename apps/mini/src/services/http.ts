import Taro from "@tarojs/taro";
import { miniEnv } from "../config/env";
import { apiPaths } from "./api-paths";
import { setRole } from "../utils/role";
import {
  clearStoredSession,
  getRefreshToken,
  getStoredSession,
  getToken,
  isAccessTokenExpired,
  setStoredSession
} from "../utils/session";

type ApiResponse<TData> = {
  code: number;
  message: string;
  data: TData;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** 为 true 时不带 Authorization */
  skipAuth?: boolean;
};

type RequestInnerOptions = RequestOptions & {
  __retried401?: boolean;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  role: "user" | "worker";
};

const useCloud = __APP_ENV__ === "production" && !!__CLOUD_ENV_ID__;

/** 底层发送，生产走 callContainer，开发走 Taro.request */
const sendRequest = async <TData>(
  path: string,
  method: string,
  header: Record<string, string>,
  body: unknown
): Promise<{ statusCode: number; data: TData }> => {
  if (useCloud) {
    console.log("[http] callContainer →", method, path, "service=", __CLOUD_SERVICE_NAME__);
    try {
      const res = await Taro.cloud.callContainer<TData>({
        path,
        method: method as "GET" | "POST" | "PATCH",
        header: { ...header, "X-WX-SERVICE": __CLOUD_SERVICE_NAME__ },
        data: body
      });
      console.log(
        "[http] callContainer ←",
        method,
        path,
        "statusCode=",
        (res as { statusCode?: number }).statusCode,
        "data=",
        JSON.stringify(res.data).slice(0, 200)
      );
      return res;
    } catch (err: unknown) {
      console.error("[http] callContainer ERROR", method, path, JSON.stringify(err));
      throw err;
    }
  }

  const url = `${miniEnv.apiBaseUrl}${path}`;
  console.log("[http] Taro.request →", method, url);
  try {
    const res = await Taro.request<TData>({
      url,
      method: method as "GET" | "POST" | "PATCH",
      data: body,
      header
    });
    console.log("[http] Taro.request ←", method, url, "statusCode=", res.statusCode);
    return res;
  } catch (error: unknown) {
    const err = error as { errMsg?: string; message?: string };
    const detail = err.errMsg ?? err.message ?? String(error);
    throw new Error(`网络请求失败：${detail}。请求地址：${url}`);
  }
};

let refreshTask: Promise<boolean> | null = null;
let lastAuthExpiredNotifyAt = 0;

const handleAuthExpired = async () => {
  clearStoredSession();
  setRole("user");

  const now = Date.now();
  if (now - lastAuthExpiredNotifyAt > 5000) {
    lastAuthExpiredNotifyAt = now;
    void Taro.showToast({ title: "登录已过期，请重新登录", icon: "none" });
  }

  const pages = Taro.getCurrentPages();
  const currentRoute = pages[pages.length - 1]?.route;
  if (currentRoute !== "pages/home-user/index") {
    void Taro.reLaunch({ url: "/pages/home-user/index" }).catch(() => undefined);
  }
};

const refreshAccessTokenIfNeeded = async (force = false) => {
  const session = getStoredSession();
  if (!session) return false;

  if (!force && !isAccessTokenExpired()) {
    return true;
  }

  if (refreshTask) {
    return refreshTask;
  }

  refreshTask = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      await handleAuthExpired();
      return false;
    }

    try {
      const refreshRes = await sendRequest<ApiResponse<RefreshResponse>>(
        apiPaths.miniRefresh,
        "POST",
        { "Content-Type": "application/json" },
        { refreshToken }
      );

      const payload = refreshRes.data;
      if (!payload || payload.code !== 0 || !payload.data?.accessToken) {
        await handleAuthExpired();
        return false;
      }

      setStoredSession({
        accessToken: payload.data.accessToken,
        refreshToken: payload.data.refreshToken,
        expiresAt: Date.now() + payload.data.expiresIn * 1000,
        tokenType: payload.data.tokenType,
        role: payload.data.role
      });
      return true;
    } catch {
      await handleAuthExpired();
      return false;
    } finally {
      refreshTask = null;
    }
  })();

  return refreshTask;
};

/**
 * 统一 HTTP：业务成功码 code === 0；已登录时携带 Authorization。
 * 生产环境走微信云托管 callContainer，开发环境走 Taro.request。
 */
export const request = async <TData>(
  path: string,
  options: RequestInnerOptions = {}
): Promise<ApiResponse<TData>> => {
  if (options.skipAuth !== true) {
    await refreshAccessTokenIfNeeded(false);
  }

  const header: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const token = options.skipAuth === true ? "" : getToken();
  if (options.skipAuth !== true && token.length > 0) {
    header.Authorization = `Bearer ${token}`;
  }

  const response = await sendRequest<ApiResponse<TData>>(
    path,
    options.method ?? "GET",
    header,
    options.body
  );

  if (response.statusCode && response.statusCode >= 400) {
    throw new Error(`HTTP ${response.statusCode}：${path}`);
  }

  const payload = response.data;
  if (!payload || typeof payload.code !== "number") {
    throw new Error("响应格式异常");
  }

  if (payload.code === 401 && options.skipAuth !== true && options.__retried401 !== true) {
    const refreshed = await refreshAccessTokenIfNeeded(true);
    if (refreshed) {
      return request<TData>(path, { ...options, __retried401: true });
    }
  }

  if (payload.code !== 0) {
    throw new Error(payload.message || "请求失败");
  }

  return payload;
};

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
  method?: "GET" | "POST";
  body?: unknown;
  /** 为 true 时不带 Authorization（用于登录等接口） */
  skipAuth?: boolean;
  /** 为 true 时 path 为完整 URL，不拼接 miniEnv.apiBaseUrl */
  absoluteUrl?: boolean;
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

let refreshTask: Promise<boolean> | null = null;
let lastAuthExpiredNotifyAt = 0;

/** 全局 401 兜底：清会话、回用户首页并提示重新登录（节流避免多次弹 Toast） */
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
      const refreshUrl = `${miniEnv.apiBaseUrl}${apiPaths.miniRefresh}`;
      const refreshRes = await Taro.request<ApiResponse<RefreshResponse>>({
        url: refreshUrl,
        method: "POST",
        data: { refreshToken },
        header: {
          "Content-Type": "application/json"
        }
      });

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
 * 统一 HTTP：业务成功码 code === 0；已登录时携带 `Authorization: Bearer <token>`（与 Nest 后续鉴权扩展对齐）。
 */
export const request = async <TData>(
  path: string,
  options: RequestInnerOptions = {}
): Promise<ApiResponse<TData>> => {
  const url = options.absoluteUrl === true ? path : `${miniEnv.apiBaseUrl}${path}`;

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

  let response: Taro.request.SuccessCallbackResult<ApiResponse<TData>>;
  try {
    response = await Taro.request<ApiResponse<TData>>({
      url,
      method: options.method ?? "GET",
      data: options.body,
      header
    });
  } catch (error: unknown) {
    const err = error as { errMsg?: string; message?: string };
    const detail = err.errMsg ?? err.message ?? String(error);
    throw new Error(
      `网络请求失败：${detail}。请确认：1) services/api 已启动（如 pnpm dev）；2) 小程序「详情-本地设置」勾选不校验合法域名；3) 真机请用电脑局域网 IP 替代 localhost，且与电脑同网。请求地址：${url}`
    );
  }

  if (response.statusCode && response.statusCode >= 400) {
    throw new Error(`HTTP ${response.statusCode}：${url}`);
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

import Taro from "@tarojs/taro";
import { miniEnv } from "../config/env";
import { getToken } from "../utils/session";

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

/**
 * 统一 HTTP：业务成功码 code === 0；已登录时携带 `Authorization: Bearer <token>`（与 Nest 后续鉴权扩展对齐）。
 */
export const request = async <TData>(path: string, options: RequestOptions = {}) => {
  const url = options.absoluteUrl === true ? path : `${miniEnv.apiBaseUrl}${path}`;

  const token = options.skipAuth === true ? "" : getToken();

  const header: Record<string, string> = {
    "Content-Type": "application/json"
  };

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

  if (payload.code !== 0) {
    throw new Error(payload.message || "请求失败");
  }

  return payload;
};

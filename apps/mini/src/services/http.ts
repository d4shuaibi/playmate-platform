import Taro from "@tarojs/taro";
import { miniEnv } from "../config/env";

type ApiResponse<TData> = {
  code: number;
  message: string;
  data: TData;
};

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  token?: string;
};

export const request = async <TData>(path: string, options: RequestOptions = {}) => {
  // TODO: 当前页面阶段默认走假数据，完成页面后在调用处逐步接入真实接口。
  const response = await Taro.request<ApiResponse<TData>>({
    url: `${miniEnv.apiBaseUrl}${path}`,
    method: options.method ?? "GET",
    data: options.body,
    header: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    }
  });

  return response.data;
};

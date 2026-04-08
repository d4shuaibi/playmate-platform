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

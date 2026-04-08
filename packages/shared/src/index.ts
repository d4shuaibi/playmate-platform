export type AppRuntime = "mini" | "admin" | "api";

export type ApiResponse<TData> = {
  code: number;
  message: string;
  data: TData;
  traceId?: string;
};

export const DEFAULT_API_TIMEOUT_MS = 15000;

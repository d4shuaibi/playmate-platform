import { appEnv } from "../../config/env";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
};

const buildHeaders = (headers: Record<string, string> | undefined) => {
  return {
    "Content-Type": "application/json",
    ...headers
  };
};

export const request = async <TResponse>(path: string, options: RequestOptions = {}) => {
  const response = await fetch(`${appEnv.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: buildHeaders(options.headers),
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as TResponse;
};

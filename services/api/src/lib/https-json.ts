import https from "node:https";
import http from "node:http";

type JsonRequestOptions = {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
};

/**
 * Node.js 内置 http(s).request 封装，返回解析后的 JSON。
 * 替代 native fetch（undici）——在微信云托管 VPC 环境里 undici 出网有兼容性问题。
 * 微信 OpenAPI 的 http/https 地址选择见 lib/wechat-openapi.ts。
 */
export const httpsJson = <T = unknown>(
  url: string | URL,
  options: JsonRequestOptions = {}
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const urlObj = typeof url === "string" ? new URL(url) : url;
    const isHttps = urlObj.protocol === "https:";
    const transport = isHttps ? https : http;

    const reqOptions: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method ?? "GET",
      headers: {
        ...(options.body ? { "Content-Length": Buffer.byteLength(options.body).toString() } : {}),
        ...options.headers
      }
    };

    const req = transport.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        try {
          resolve(JSON.parse(raw) as T);
        } catch {
          reject(
            new Error(`httpsJson: invalid JSON (status ${res.statusCode}): ${raw.slice(0, 200)}`)
          );
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10_000, () => {
      req.destroy(new Error("httpsJson: request timed out"));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
};

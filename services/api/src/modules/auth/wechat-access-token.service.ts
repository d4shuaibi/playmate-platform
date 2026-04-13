import { Injectable, Logger } from "@nestjs/common";

/**
 * 缓存 `client_credential` access_token，供 getuserphonenumber 等接口使用。
 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-access-token/getAccessToken.html
 */
@Injectable()
export class WechatAccessTokenService {
  private readonly logger = new Logger(WechatAccessTokenService.name);

  private cache: { token: string; expiresAtMs: number } | null = null;

  async getAccessToken(): Promise<string> {
    const appid = process.env.WECHAT_MINI_APPID?.trim();
    const secret = process.env.WECHAT_MINI_SECRET?.trim();
    if (!appid || !secret) {
      throw new Error("WECHAT_MINI_APPID / WECHAT_MINI_SECRET not configured");
    }

    const now = Date.now();
    if (this.cache && this.cache.expiresAtMs > now + 60_000) {
      return this.cache.token;
    }

    const url = new URL("https://api.weixin.qq.com/cgi-bin/token");
    url.searchParams.set("grant_type", "client_credential");
    url.searchParams.set("appid", appid);
    url.searchParams.set("secret", secret);

    const res = await fetch(url);
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      errcode?: number;
      errmsg?: string;
    };

    if (typeof data.errcode === "number" && data.errcode !== 0) {
      this.logger.error(`getAccessToken err: ${data.errmsg}`);
      throw new Error(data.errmsg ?? `errcode ${data.errcode}`);
    }

    if (!data.access_token) {
      throw new Error("Invalid getAccessToken response");
    }

    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 7200;
    this.cache = {
      token: data.access_token,
      expiresAtMs: now + expiresIn * 1000
    };

    return data.access_token;
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { httpsJson } from "../../lib/https-json";
import {
  useWechatOpenApiProxy,
  wechatCloudEnvId,
  wechatOpenApiUrl
} from "../../lib/wechat-openapi";

/** /tcb/uploadfile 换来的直传凭证，前端据此把文件 multipart 直传到 COS。 */
export type CosUploadMeta = {
  uploadUrl: string;
  /** 直传时需原样带上的 multipart 表单字段（file 字段由前端追加）。 */
  formFields: Record<string, string>;
  /** 云文件 ID（cloud://...），用于后续换取下载链接。 */
  fileId: string;
};

type TtlCacheEntry = { url: string; expiresAtMs: number };

/**
 * 微信云托管对象存储（底层腾讯云 COS）。
 * 通过云调用「开放接口服务」获取上传凭证 / 下载链接，绕开服务网关 1MB 请求体限制。
 * 需开启开放接口服务（WECHAT_OPENAPI_PROXY=true）、配置 WECHAT_CLOUD_ENV_ID，
 * 并在「微信令牌权限」白名单加入 /tcb/uploadfile、/tcb/batchdownloadfile。
 * @see https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/storage/uploadFile.html
 * @see https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/storage/batchDownloadFile.html
 */
@Injectable()
export class CosStorageService {
  private readonly logger = new Logger(CosStorageService.name);

  /** 下载临时链接缓存：临时 URL 会过期，按 fileId 缓存一段时间避免频繁调用。 */
  private readonly downloadCache = new Map<string, TtlCacheEntry>();

  /** 仅当开放接口服务可用且配置了环境 ID 时启用对象存储；否则回退本地内存上传。 */
  isEnabled(): boolean {
    return useWechatOpenApiProxy() && wechatCloudEnvId().length > 0;
  }

  /** 申请一次直传凭证。path 为对象存储内的存放路径。 */
  async createUploadMeta(originalName: string): Promise<CosUploadMeta> {
    const env = wechatCloudEnvId();
    const ext = this.safeExt(originalName);
    const path = `admin-uploads/${randomUUID()}${ext}`;

    const data = await httpsJson<{
      errcode?: number;
      errmsg?: string;
      url?: string;
      token?: string;
      authorization?: string;
      file_id?: string;
      cos_file_id?: string;
    }>(wechatOpenApiUrl("/tcb/uploadfile"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ env, path })
    });

    if (
      (typeof data.errcode === "number" && data.errcode !== 0) ||
      !data.url ||
      !data.authorization ||
      !data.token ||
      !data.cos_file_id ||
      !data.file_id
    ) {
      this.logger.warn(`uploadfile failed: ${JSON.stringify(data)}`);
      throw new Error(data.errmsg ?? "获取对象存储上传凭证失败");
    }

    return {
      uploadUrl: data.url,
      formFields: {
        key: path,
        Signature: data.authorization,
        "x-cos-security-token": data.token,
        "x-cos-meta-fileid": data.cos_file_id
      },
      fileId: data.file_id
    };
  }

  /** 用云文件 ID 换取临时下载直链（带短缓存）。 */
  async getDownloadUrl(fileId: string): Promise<string> {
    const now = Date.now();
    const cached = this.downloadCache.get(fileId);
    if (cached && cached.expiresAtMs > now + 60_000) {
      return cached.url;
    }

    const env = wechatCloudEnvId();
    const maxAge = 7200;
    const data = await httpsJson<{
      errcode?: number;
      errmsg?: string;
      file_list?: Array<{ status?: number; download_url?: string; errmsg?: string }>;
    }>(wechatOpenApiUrl("/tcb/batchdownloadfile"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ env, file_list: [{ fileid: fileId, max_age: maxAge }] })
    });

    const item = data.file_list?.[0];
    if ((typeof data.errcode === "number" && data.errcode !== 0) || !item?.download_url) {
      this.logger.warn(`batchdownloadfile failed: ${JSON.stringify(data)}`);
      throw new Error(item?.errmsg ?? data.errmsg ?? "获取对象存储下载链接失败");
    }

    this.downloadCache.set(fileId, {
      url: item.download_url,
      expiresAtMs: now + maxAge * 1000
    });
    return item.download_url;
  }

  /** 取小写扩展名（含点），无扩展名返回空串。 */
  private safeExt(name: string): string {
    const dot = name.lastIndexOf(".");
    if (dot < 0) return "";
    const ext = name.slice(dot).toLowerCase();
    return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
  }
}

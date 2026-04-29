import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import * as fs from "fs";
import type { IncomingHttpHeaders } from "http";
import * as path from "path";

/** 读取微信支付回调 HTTP 头（Express 已规范为小写键名） */
const pickHttpHeader = (headers: IncomingHttpHeaders, name: string): string => {
  const raw = headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0] ?? "";
  if (typeof raw === "string") return raw;
  return "";
};

/** 小程序调起支付所需字段（与 wx.requestPayment / Taro.requestPayment 一致） */
export type MiniProgramPaymentParams = {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: "RSA";
  paySign: string;
};

type JsapiCreateResult = {
  prepay_id: string;
};

/**
 * 微信支付商户 API v3（JSAPI/小程序下单 + 调起签名）。
 * 文档：https://pay.weixin.qq.com/doc/v3/merchant/4012791911
 */
@Injectable()
export class WechatPayService {
  private readonly logger = new Logger(WechatPayService.name);

  /** 缓存：微信支付平台公钥 PEM（用于回调验签） */
  private wechatPayPublicKeyPemCache: string | null | undefined;

  /**
   * 是否在本地无商户号时直接视为支付成功（仅开发联调订单状态机，不走真实收银台）。
   */
  private readonly devSimulate =
    (process.env.WECHAT_PAY_DEV_SIMULATE ?? "").toLowerCase() === "true";

  private get mchId(): string {
    return process.env.WECHAT_PAY_MCH_ID ?? "";
  }

  private get appId(): string {
    return process.env.WECHAT_PAY_APP_ID ?? process.env.WECHAT_MINI_APPID ?? "";
  }

  private get merchantSerial(): string {
    return process.env.WECHAT_PAY_MERCHANT_CERT_SERIAL ?? "";
  }

  private get apiV3Key(): string {
    return process.env.WECHAT_PAY_API_V3_KEY ?? "";
  }

  private get notifyUrl(): string {
    return process.env.WECHAT_PAY_NOTIFY_URL ?? "";
  }

  private get privateKeyPem(): string {
    const raw = process.env.WECHAT_PAY_PRIVATE_KEY ?? "";
    return raw.includes("BEGIN") ? raw.replace(/\\n/g, "\n") : raw;
  }

  /** 商户私钥与证书序列号齐备时可调真实下单 */
  isLiveConfigured(): boolean {
    return Boolean(
      this.mchId &&
      this.appId &&
      this.merchantSerial &&
      this.privateKeyPem &&
      this.apiV3Key &&
      this.notifyUrl
    );
  }

  shouldSimulateImmediatePay(): boolean {
    return this.devSimulate || !this.isLiveConfigured();
  }

  /**
   * JSAPI 下单，返回 prepay_id。
   */
  async jsapiCreateOrder(params: {
    /** 商户侧唯一单号，可与业务订单 id 对齐（≤32 字节常用约束） */
    outTradeNo: string;
    description: string;
    /** 单位：分 */
    amountFen: number;
    payerOpenId: string;
  }): Promise<{ prepayId: string }> {
    if (!this.isLiveConfigured()) {
      throw new Error("微信支付商户参数未配置完整（WECHAT_PAY_*）");
    }

    const urlPath = "/v3/pay/transactions/jsapi";
    const host = "https://api.mch.weixin.qq.com";
    const bodyObj = {
      appid: this.appId,
      mchid: this.mchId,
      description: params.description.slice(0, 127),
      out_trade_no: params.outTradeNo,
      notify_url: this.notifyUrl,
      amount: {
        total: params.amountFen,
        currency: "CNY"
      },
      payer: {
        openid: params.payerOpenId
      }
    };
    const bodyStr = JSON.stringify(bodyObj);
    const authorization = this.buildAuthorizationHeader("POST", urlPath, bodyStr);

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
      "User-Agent": "PlaymatePlatform/1.0"
    };

    /** 请求-应答场景：携带微信支付公钥 ID（与商户平台下载的 pub_key 对应） */
    const wechatPubSerial = process.env.WECHAT_PAY_PUBLIC_KEY_ID?.trim() ?? "";
    if (wechatPubSerial) {
      reqHeaders["Wechatpay-Serial"] = wechatPubSerial;
    }

    const res = await fetch(`${host}${urlPath}`, {
      method: "POST",
      headers: reqHeaders,
      body: bodyStr
    });

    const text = await res.text();
    if (!res.ok) {
      this.logger.warn(`Wechat jsapi HTTP ${res.status}: ${text}`);
      throw new Error(`微信支付下单失败（HTTP ${res.status}）`);
    }

    const parsed = JSON.parse(text) as JsapiCreateResult | { message?: string; code?: string };
    if (!parsed || typeof parsed !== "object" || !("prepay_id" in parsed)) {
      this.logger.warn(`Wechat jsapi unexpected body: ${text}`);
      throw new Error(`微信支付返回异常：${(parsed as { message?: string }).message ?? text}`);
    }

    return { prepayId: parsed.prepay_id };
  }

  /**
   * 生成小程序调起支付参数（RSA 签名 paySign）。
   */
  buildMiniProgramPaymentParams(prepayId: string): MiniProgramPaymentParams {
    const privateKey = crypto.createPrivateKey(this.privateKeyPem);
    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = crypto.randomBytes(16).toString("hex");
    const pkg = `prepay_id=${prepayId}`;
    const message = `${this.appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
    const sign = crypto.sign("sha256", Buffer.from(message, "utf8"), privateKey);
    const paySign = sign.toString("base64");

    return {
      timeStamp,
      nonceStr,
      package: pkg,
      signType: "RSA",
      paySign
    };
  }

  /**
   * 解密支付结果通知 resource（AEAD_AES_256_GCM）。
   */
  decryptNotifyResource(resource: {
    algorithm?: string;
    ciphertext?: string;
    associated_data?: string;
    nonce?: string;
  }): Record<string, unknown> | null {
    const key = this.apiV3Key;
    if (!key || key.length !== 32) {
      this.logger.error("WECHAT_PAY_API_V3_KEY 须为 32 字节字符串");
      return null;
    }
    if (!resource.ciphertext || !resource.nonce) return null;

    const attempts = [resource.associated_data ?? "", "transaction"].filter(
      (v, i, arr) => arr.indexOf(v) === i
    );

    for (const aad of attempts) {
      const parsed = this.tryDecryptGcm(key, resource.nonce, resource.ciphertext, aad);
      if (parsed) return parsed;
    }
    return null;
  }

  /**
   * 异步通知验签：使用商户平台「微信支付公钥」与回调头 Wechatpay-Serial / Signature。
   * 参见：https://pay.weixin.qq.com/doc/v3/partner/4012925323
   */
  verifyNotifySignature(headers: IncomingHttpHeaders, rawBody: string): boolean {
    const skip = (process.env.WECHAT_PAY_SKIP_NOTIFY_VERIFY ?? "").toLowerCase() === "true";
    if (skip) {
      this.logger.warn("已跳过微信支付回调验签（WECHAT_PAY_SKIP_NOTIFY_VERIFY=true）");
      return true;
    }

    const pem = this.resolveWechatPayPublicKeyPem();
    if (!pem) {
      this.logger.warn(
        "未配置微信支付公钥（WECHAT_PAY_PUBLIC_KEY_PATH 或 WECHAT_PAY_PUBLIC_KEY_PEM），跳过验签"
      );
      return true;
    }

    const signature = pickHttpHeader(headers, "Wechatpay-Signature");
    const timestamp = pickHttpHeader(headers, "Wechatpay-Timestamp");
    const nonce = pickHttpHeader(headers, "Wechatpay-Nonce");
    const serial = pickHttpHeader(headers, "Wechatpay-Serial");

    if (!signature || !timestamp || !nonce || !serial) {
      this.logger.warn("微信支付回调缺少验签 HTTP 头（Wechatpay-*）");
      return false;
    }

    const allowList = this.wechatPayPublicKeyIdAllowlist();
    if (allowList.length > 0 && !allowList.includes(serial)) {
      this.logger.warn(`Wechatpay-Serial 不在信任列表：${serial}`);
      return false;
    }

    try {
      const publicKey = crypto.createPublicKey(pem);
      const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
      const ok = crypto.verify(
        "RSA-SHA256",
        Buffer.from(message, "utf8"),
        publicKey,
        Buffer.from(signature, "base64")
      );
      if (!ok) this.logger.warn("微信支付回调 RSA-SHA256 验签未通过");
      return ok;
    } catch (e) {
      this.logger.warn(`微信支付回调验签异常：${e instanceof Error ? e.message : String(e)}`);
      return false;
    }
  }

  /**
   * 解析 WECHAT_PAY_PUBLIC_KEY_ID_ALLOWLIST 或 WECHAT_PAY_PUBLIC_KEY_ID（逗号分隔）。
   */
  private wechatPayPublicKeyIdAllowlist(): string[] {
    const raw =
      process.env.WECHAT_PAY_PUBLIC_KEY_ID_ALLOWLIST ?? process.env.WECHAT_PAY_PUBLIC_KEY_ID ?? "";
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * 加载商户平台下载的微信支付公钥 PEM（路径优先于内联）。
   */
  private resolveWechatPayPublicKeyPem(): string | null {
    if (this.wechatPayPublicKeyPemCache !== undefined) {
      return this.wechatPayPublicKeyPemCache;
    }

    const inline = process.env.WECHAT_PAY_PUBLIC_KEY_PEM ?? "";
    if (inline.includes("BEGIN")) {
      this.wechatPayPublicKeyPemCache = inline.replace(/\\n/g, "\n");
      return this.wechatPayPublicKeyPemCache;
    }

    const relPath = process.env.WECHAT_PAY_PUBLIC_KEY_PATH ?? "";
    if (relPath.trim()) {
      try {
        const absolute = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath);
        const buf = fs.readFileSync(absolute, "utf8");
        this.wechatPayPublicKeyPemCache = buf.trim();
        return this.wechatPayPublicKeyPemCache;
      } catch (e) {
        this.logger.warn(
          `读取 WECHAT_PAY_PUBLIC_KEY_PATH 失败：${e instanceof Error ? e.message : String(e)}`
        );
        this.wechatPayPublicKeyPemCache = null;
        return null;
      }
    }

    this.wechatPayPublicKeyPemCache = null;
    return null;
  }

  private tryDecryptGcm(
    apiKey: string,
    nonceStr: string,
    ciphertextB64: string,
    associatedData: string
  ): Record<string, unknown> | null {
    try {
      const ciphertext = Buffer.from(ciphertextB64, "base64");
      const authTag = ciphertext.subarray(ciphertext.length - 16);
      const data = ciphertext.subarray(0, ciphertext.length - 16);
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        Buffer.from(apiKey, "utf8"),
        Buffer.from(nonceStr, "utf8")
      );
      decipher.setAuthTag(authTag);
      const aadBuf = Buffer.from(associatedData, "utf8");
      if (aadBuf.length > 0) {
        decipher.setAAD(aadBuf);
      }

      const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
      return JSON.parse(decrypted.toString("utf8")) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private buildAuthorizationHeader(method: string, urlPath: string, body: string): string {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = crypto.randomBytes(16).toString("hex");
    const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
    const privateKey = crypto.createPrivateKey(this.privateKeyPem);
    const signature = crypto.sign("sha256", Buffer.from(message, "utf8"), privateKey);
    const signBase64 = signature.toString("base64");

    return [
      `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}"`,
      `nonce_str="${nonce}"`,
      `timestamp="${timestamp}"`,
      `serial_no="${this.merchantSerial}"`,
      `signature="${signBase64}"`
    ].join(",");
  }
}

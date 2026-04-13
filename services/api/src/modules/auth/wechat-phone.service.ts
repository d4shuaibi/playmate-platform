import { Injectable, Logger } from "@nestjs/common";
import { WechatAccessTokenService } from "./wechat-access-token.service";

/**
 * 手机号快速验证：用 button getPhoneNumber 回调里的 code 换手机号（与 wx.login 的 code 不同）。
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html
 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-info/phone-number/getPhoneNumber.html
 */
export type PhoneInfo = {
  phoneNumber: string;
  purePhoneNumber: string;
  countryCode: string;
};

@Injectable()
export class WechatPhoneService {
  private readonly logger = new Logger(WechatPhoneService.name);

  constructor(private readonly accessToken: WechatAccessTokenService) {}

  /**
   * POST wxa/business/getuserphonenumber，消费一次性 phoneCode（约 5 分钟内有效）。
   */
  async getPhoneByCode(phoneCode: string): Promise<PhoneInfo> {
    const trimmed = phoneCode.trim();
    if (!trimmed) {
      throw new Error("Missing phone code");
    }

    const accessToken = await this.accessToken.getAccessToken();
    const url = new URL("https://api.weixin.qq.com/wxa/business/getuserphonenumber");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed })
    });

    const data = (await res.json()) as {
      errcode?: number;
      errmsg?: string;
      phone_info?: {
        phoneNumber?: string;
        purePhoneNumber?: string;
        countryCode?: string;
      };
    };

    if (typeof data.errcode === "number" && data.errcode !== 0) {
      this.logger.warn(`getuserphonenumber: ${data.errmsg ?? data.errcode}`);
      throw new Error(data.errmsg ?? `WeChat phone errcode ${data.errcode}`);
    }

    const info = data.phone_info;
    if (!info?.phoneNumber || !info.purePhoneNumber) {
      throw new Error("Invalid phone_info in WeChat response");
    }

    return {
      phoneNumber: info.phoneNumber,
      purePhoneNumber: info.purePhoneNumber,
      countryCode: String(info.countryCode ?? "86")
    };
  }
}

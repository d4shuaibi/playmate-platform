import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { WechatPhoneService } from "./wechat-phone.service";

/** Body.code 为 getPhoneNumber 回调中的动态令牌（与 wx.login 的 code 不同） */
export type MiniLoginRequest = {
  code: string;
};

type MiniLoginResponseData = {
  token: string;
  role: "user" | "worker";
};

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wechatPhone: WechatPhoneService
  ) {}

  /**
   * 仅支持手机号登录：用 getPhoneNumber 的 code 换手机号 → 按手机号查用户，无则新建。
   * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html
   */
  async miniLogin(body: MiniLoginRequest): Promise<ApiEnvelope<MiniLoginResponseData>> {
    const code = body?.code?.trim();
    if (!code) {
      return {
        code: 400,
        message: "Missing code",
        data: null
      };
    }

    const appid = process.env.WECHAT_MINI_APPID?.trim();
    const secret = process.env.WECHAT_MINI_SECRET?.trim();

    let phoneNumber: string;

    try {
      if (appid && secret) {
        const phone = await this.wechatPhone.getPhoneByCode(code);
        phoneNumber = phone.phoneNumber;
      } else {
        if (process.env.NODE_ENV === "production") {
          return {
            code: 503,
            message: "WeChat mini program not configured (WECHAT_MINI_APPID / WECHAT_MINI_SECRET)",
            data: null
          };
        }
        this.logger.warn(
          "WECHAT_MINI_APPID/SECRET unset — using dev-only synthetic phone from code hash"
        );
        phoneNumber = `+8617dev${createHash("sha256").update(code).digest("hex").slice(0, 11)}`;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`phone code exchange failed: ${msg}`);
      return {
        code: 401,
        message: "Invalid or expired phone code",
        data: null
      };
    }

    try {
      const existing = await this.prisma.user.findFirst({
        where: { phone: phoneNumber },
        select: { id: true, role: true }
      });

      const user =
        existing ??
        (await this.prisma.user.create({
          data: { phone: phoneNumber },
          select: { id: true, role: true }
        }));

      return {
        code: 0,
        message: "ok",
        data: {
          token: `dev-${user.id}`,
          role: user.role === "WORKER" ? "worker" : "user"
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`miniLogin prisma error: ${message}`);

      if (process.env.NODE_ENV === "production") {
        return {
          code: 503,
          message: "Database unavailable",
          data: null
        };
      }

      this.logger.warn(
        "Using dev fallback (no DB). Start Postgres and run prisma migrate — see services/api/.env.example"
      );

      const stableId = createHash("sha256").update(phoneNumber).digest("hex").slice(0, 24);
      return {
        code: 0,
        message: "ok",
        data: {
          token: `dev-fallback-${stableId}`,
          role: "user"
        }
      };
    }
  }
}

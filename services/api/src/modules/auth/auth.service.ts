import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { WechatPhoneService } from "./wechat-phone.service";
import { JwtService } from "./jwt.service";

/** Body.code 为 getPhoneNumber 回调中的动态令牌（与 wx.login 的 code 不同） */
export type MiniLoginRequest = {
  code: string;
};

type MiniLoginResponseData = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
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
    private readonly wechatPhone: WechatPhoneService,
    private readonly jwtService: JwtService
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
        select: { id: true, role: true, tokenVersion: true }
      });

      const user =
        existing ??
        (await this.prisma.user.create({
          data: { phone: phoneNumber },
          select: { id: true, role: true, tokenVersion: true }
        }));

      const role = user.role === "WORKER" ? "worker" : "user";
      const access = this.jwtService.issueAccessToken({
        userId: user.id,
        role,
        tokenVersion: user.tokenVersion
      });
      const refresh = this.jwtService.issueRefreshToken({
        userId: user.id,
        tokenVersion: user.tokenVersion
      });

      return {
        code: 0,
        message: "ok",
        data: {
          access_token: access.access_token,
          refresh_token: refresh.refresh_token,
          expires_in: access.expires_in,
          token_type: access.token_type,
          role
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
      // fallback 不落库，无法 refresh/logout；仍返回 access_token 便于开发联调
      const access = this.jwtService.issueAccessToken({
        userId: `fallback-${stableId}`,
        role: "user",
        tokenVersion: 0
      });
      return {
        code: 0,
        message: "ok",
        data: {
          access_token: access.access_token,
          refresh_token: "",
          expires_in: access.expires_in,
          token_type: access.token_type,
          role: "user"
        }
      };
    }
  }

  async refreshToken(input: {
    refresh_token?: string;
  }): Promise<ApiEnvelope<Omit<MiniLoginResponseData, "role"> & { role: "user" | "worker" }>> {
    const token = input.refresh_token?.trim();
    if (!token) {
      return { code: 400, message: "Missing refresh_token", data: null };
    }

    try {
      const payload = this.jwtService.verifyRefreshToken(token);
      const userId = payload.sub;
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, tokenVersion: true }
      });
      if (!user) {
        return { code: 401, message: "Invalid refresh_token", data: null };
      }
      if (user.tokenVersion !== payload.tv) {
        return { code: 401, message: "Token revoked", data: null };
      }

      const role = user.role === "WORKER" ? "worker" : "user";
      const access = this.jwtService.issueAccessToken({
        userId: user.id,
        role,
        tokenVersion: user.tokenVersion
      });
      const refresh = this.jwtService.issueRefreshToken({
        userId: user.id,
        tokenVersion: user.tokenVersion
      });

      return {
        code: 0,
        message: "ok",
        data: {
          access_token: access.access_token,
          refresh_token: refresh.refresh_token,
          expires_in: access.expires_in,
          token_type: access.token_type,
          role
        }
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`refreshToken failed: ${msg}`);
      return { code: 401, message: "Invalid refresh_token", data: null };
    }
  }

  async logout(input: { authorization?: string }): Promise<ApiEnvelope<null>> {
    const auth = input.authorization?.trim() ?? "";
    if (!auth.startsWith("Bearer ")) {
      return { code: 401, message: "Unauthorized", data: null };
    }
    const token = auth.slice(7).trim();
    try {
      const payload = this.jwtService.verifyAccessToken(token);
      const userId = payload.sub;
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, tokenVersion: true }
      });
      if (!user) {
        return { code: 401, message: "Unauthorized", data: null };
      }
      if (user.tokenVersion !== payload.tv) {
        return { code: 0, message: "ok", data: null };
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: user.tokenVersion + 1 }
      });
      return { code: 0, message: "ok", data: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`logout failed: ${msg}`);
      return { code: 401, message: "Unauthorized", data: null };
    }
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthTokenService, type IssuedTokenBundle } from "./auth-token.service";
import { WechatPhoneService } from "./wechat-phone.service";

/** Body.code 为 getPhoneNumber 回调中的动态令牌（与 wx.login 的 code 不同） */
export type MiniLoginRequest = {
  code: string;
};

type MiniLoginResponseData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  role: "user" | "worker";
};

type MiniRefreshRequest = {
  refreshToken: string;
};

type MiniLogoutRequest = {
  refreshToken: string;
};

type MiniRefreshResponseData = IssuedTokenBundle & {
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
    private readonly tokenService: AuthTokenService,
    private readonly wechatPhone: WechatPhoneService
  ) {}

  /** 只落 refresh token 哈希，避免明文泄露风险 */
  private hashRefreshToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  /** 登录/刷新后保存新 refresh token，并可选吊销旧 token（轮换） */
  private async persistRefreshToken(params: {
    userId: string;
    refreshToken: string;
    revokeRefreshToken?: string;
  }) {
    const { userId, refreshToken, revokeRefreshToken } = params;
    const tokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.tokenService.getRefreshExpiresInSec() * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });

    if (revokeRefreshToken) {
      const revokeHash = this.hashRefreshToken(revokeRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: {
          tokenHash: revokeHash,
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      });
    }
  }

  /** 主动退出登录：吊销 refresh token（access token 走短时效自然失效） */
  async miniLogout(body: MiniLogoutRequest): Promise<ApiEnvelope<{ success: true }>> {
    const refreshToken = body?.refreshToken?.trim();
    if (!refreshToken) {
      return {
        code: 400,
        message: "Missing refreshToken",
        data: null
      };
    }

    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });

    return {
      code: 0,
      message: "ok",
      data: { success: true }
    };
  }

  async miniRefresh(body: MiniRefreshRequest): Promise<ApiEnvelope<MiniRefreshResponseData>> {
    const refreshToken = body?.refreshToken?.trim();
    if (!refreshToken) {
      return {
        code: 400,
        message: "Missing refreshToken",
        data: null
      };
    }

    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      const tokenHash = this.hashRefreshToken(refreshToken);
      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        select: { id: true, userId: true }
      });

      if (!tokenRecord || tokenRecord.userId !== payload.sub) {
        return {
          code: 401,
          message: "Refresh token revoked or expired",
          data: null
        };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true }
      });

      if (!user) {
        return {
          code: 401,
          message: "User not found",
          data: null
        };
      }

      const appRole = user.role === "WORKER" ? "worker" : "user";
      const issued = this.tokenService.issueTokens(user.id, appRole);
      await this.persistRefreshToken({
        userId: user.id,
        refreshToken: issued.refreshToken,
        revokeRefreshToken: refreshToken
      });
      return {
        code: 0,
        message: "ok",
        data: {
          ...issued,
          role: appRole
        }
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`miniRefresh failed: ${message}`);
      return {
        code: 401,
        message: "Invalid refresh token",
        data: null
      };
    }
  }

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

      const appRole = user.role === "WORKER" ? "worker" : "user";
      const issued = this.tokenService.issueTokens(user.id, appRole);
      await this.persistRefreshToken({
        userId: user.id,
        refreshToken: issued.refreshToken
      });

      return {
        code: 0,
        message: "ok",
        data: {
          ...issued,
          role: appRole
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
      const issued = this.tokenService.issueTokens(stableId, "user");
      return {
        code: 0,
        message: "ok",
        data: {
          ...issued,
          role: "user"
        }
      };
    }
  }
}

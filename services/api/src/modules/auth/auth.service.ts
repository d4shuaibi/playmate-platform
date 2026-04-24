import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthTokenService, type IssuedTokenBundle } from "./auth-token.service";
import { WechatPhoneService } from "./wechat-phone.service";

/** Body.code 为 getPhoneNumber 回调中的动态令牌（与 wx.login 的 code 不同） */
export type MiniLoginRequest = {
  code: string;
  /** wx.login 的 code（用于换 openid/unionid），可选 */
  wxLoginCode?: string;
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
    const wxLoginCode = body?.wxLoginCode?.trim();

    let phoneNumber: string;
    let wechatOpenId: string | undefined;
    let wechatUnionId: string | undefined;

    /**
     * 用 wx.login 的 code 换 openid/unionid（如未传 wxLoginCode，则跳过）。
     * 说明：unionid 仅在满足条件时返回（如已绑定开放平台等）。
     */
    const resolveWechatSessionIfNeeded = async () => {
      if (!wxLoginCode) return;
      if (appid && secret) {
        const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
        url.searchParams.set("appid", appid);
        url.searchParams.set("secret", secret);
        url.searchParams.set("js_code", wxLoginCode);
        url.searchParams.set("grant_type", "authorization_code");
        const res = await fetch(url);
        const data = (await res.json()) as {
          openid?: string;
          unionid?: string;
          errcode?: number;
          errmsg?: string;
        };
        if (typeof data.errcode === "number" && data.errcode !== 0) {
          this.logger.warn(`code2session err: ${data.errmsg ?? data.errcode}`);
          return;
        }
        if (data.openid) wechatOpenId = data.openid;
        if (data.unionid) wechatUnionId = data.unionid;
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        // dev 环境无 appid/secret 时，合成一个稳定 openid 便于联调（不会写到生产）
        wechatOpenId = `dev-openid-${createHash("sha256").update(wxLoginCode).digest("hex").slice(0, 16)}`;
      }
    };

    try {
      await resolveWechatSessionIfNeeded();
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
      /**
       * 用户识别策略：
       * - 优先用 wechatOpenId 找到同一个微信用户（手机号可能变更）
       * - 找不到再用 phone 兜底（历史数据可能只有手机号）
       */
      const existingByOpenId = wechatOpenId
        ? await this.prisma.user.findFirst({
            where: { wechatOpenId },
            select: { id: true, role: true, phone: true, wechatOpenId: true, wechatUnionId: true }
          })
        : null;

      const existingByPhone = existingByOpenId
        ? null
        : await this.prisma.user.findFirst({
            where: { phone: phoneNumber },
            select: { id: true, role: true, phone: true, wechatOpenId: true, wechatUnionId: true }
          });

      const existing = existingByOpenId ?? existingByPhone;

      if (existingByOpenId && existingByOpenId.phone && existingByOpenId.phone !== phoneNumber) {
        const occupied = await this.prisma.user.findFirst({
          where: { phone: phoneNumber },
          select: { id: true }
        });
        if (occupied && occupied.id !== existingByOpenId.id) {
          return {
            code: 409,
            message: "该手机号已绑定其他账号，请用该手机号绑定的微信登录",
            data: null
          };
        }
      }

      const user = existing
        ? await this.prisma.user.update({
            where: { id: existing.id },
            data: {
              // 只在为空时补齐，避免覆盖历史绑定
              wechatOpenId: existing.wechatOpenId ? undefined : wechatOpenId,
              wechatUnionId: existing.wechatUnionId ? undefined : wechatUnionId,
              // openid 命中时允许手机号随微信返回变更（不覆盖空字符串以外的无效值）
              phone:
                existingByOpenId && phoneNumber && existing.phone !== phoneNumber
                  ? phoneNumber
                  : undefined
            },
            select: { id: true, role: true }
          })
        : await this.prisma.user.create({
            data: {
              phone: phoneNumber,
              wechatOpenId,
              wechatUnionId
            },
            select: { id: true, role: true }
          });

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

      const stableSeed = wechatOpenId || phoneNumber;
      const stableId = createHash("sha256").update(stableSeed).digest("hex").slice(0, 24);
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

import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";

export type TokenType = "Bearer";

type AccessTokenPayload = {
  sub: string;
  role: "user" | "worker";
  tv: number;
  typ: "access";
};

type RefreshTokenPayload = {
  sub: string;
  tv: number;
  typ: "refresh";
};

@Injectable()
export class JwtService {
  private get secret() {
    const s = process.env.JWT_SECRET?.trim();
    if (!s) {
      throw new Error("JWT_SECRET not configured");
    }
    return s;
  }

  /** access token 秒数（默认 86400 = 1 天） */
  private get accessExpiresInSec() {
    const raw = process.env.JWT_ACCESS_EXPIRES_IN?.trim();
    const n = raw ? Number(raw) : 86400;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 86400;
  }

  /** refresh token 秒数（默认 2592000 = 30 天） */
  private get refreshExpiresInSec() {
    const raw = process.env.JWT_REFRESH_EXPIRES_IN?.trim();
    const n = raw ? Number(raw) : 2592000;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 2592000;
  }

  issueAccessToken(input: { userId: string; role: "user" | "worker"; tokenVersion: number }) {
    const payload: AccessTokenPayload = {
      sub: input.userId,
      role: input.role,
      tv: input.tokenVersion,
      typ: "access"
    };
    const access_token = jwt.sign(payload, this.secret, { expiresIn: this.accessExpiresInSec });
    return {
      access_token,
      token_type: "Bearer" as TokenType,
      expires_in: this.accessExpiresInSec
    };
  }

  issueRefreshToken(input: { userId: string; tokenVersion: number }) {
    const payload: RefreshTokenPayload = {
      sub: input.userId,
      tv: input.tokenVersion,
      typ: "refresh"
    };
    const refresh_token = jwt.sign(payload, this.secret, { expiresIn: this.refreshExpiresInSec });
    return { refresh_token };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, this.secret) as AccessTokenPayload;
    if (decoded?.typ !== "access") {
      throw new Error("Invalid access token");
    }
    return decoded;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const decoded = jwt.verify(token, this.secret) as RefreshTokenPayload;
    if (decoded?.typ !== "refresh") {
      throw new Error("Invalid refresh token");
    }
    return decoded;
  }
}

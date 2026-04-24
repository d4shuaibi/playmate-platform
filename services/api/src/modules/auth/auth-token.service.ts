import { Injectable } from "@nestjs/common";
import jwt, { type JwtPayload } from "jsonwebtoken";

type AppRole = "user" | "worker";

type AccessTokenPayload = JwtPayload & {
  sub: string;
  role: AppRole;
  typ: "access";
};

type RefreshTokenPayload = JwtPayload & {
  sub: string;
  role: AppRole;
  typ: "refresh";
};

export type IssuedTokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
};

const parseExpireToSeconds = (value: string) => {
  const trimmed = value.trim();
  const matched = /^(\d+)([smhd])?$/.exec(trimmed);
  if (!matched) return 7200;
  const amount = Number(matched[1]);
  const unit = matched[2] ?? "s";
  if (!Number.isFinite(amount) || amount <= 0) return 7200;
  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 60 * 60;
  return amount * 60 * 60 * 24;
};

@Injectable()
export class AuthTokenService {
  private readonly tokenSecret: string =
    process.env.JWT_SECRET?.trim() || process.env.WECHAT_MINI_SECRET?.trim() || "dev-playmate-jwt";

  private readonly accessExpiresInRaw = process.env.JWT_ACCESS_EXPIRES_IN?.trim() || "2h";
  private readonly refreshExpiresInRaw = process.env.JWT_REFRESH_EXPIRES_IN?.trim() || "30d";

  private readonly accessExpiresInSec = parseExpireToSeconds(this.accessExpiresInRaw);
  private readonly refreshExpiresInSec = parseExpireToSeconds(this.refreshExpiresInRaw);

  getRefreshExpiresInSec() {
    return this.refreshExpiresInSec;
  }

  issueTokens(userId: string, role: AppRole): IssuedTokenBundle {
    const accessPayload: Omit<AccessTokenPayload, "iat" | "exp"> = {
      sub: userId,
      role,
      typ: "access"
    };
    const refreshPayload: Omit<RefreshTokenPayload, "iat" | "exp"> = {
      sub: userId,
      role,
      typ: "refresh"
    };

    const accessToken = jwt.sign(accessPayload, this.tokenSecret, {
      expiresIn: this.accessExpiresInSec
    });
    const refreshToken = jwt.sign(refreshPayload, this.tokenSecret, {
      expiresIn: this.refreshExpiresInSec
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresInSec,
      tokenType: "Bearer"
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = jwt.verify(token, this.tokenSecret) as AccessTokenPayload;
    if (payload.typ !== "access" || typeof payload.sub !== "string") {
      throw new Error("Invalid access token");
    }
    if (payload.role !== "user" && payload.role !== "worker") {
      throw new Error("Invalid access token role");
    }
    return payload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = jwt.verify(token, this.tokenSecret) as RefreshTokenPayload;
    if (payload.typ !== "refresh" || typeof payload.sub !== "string") {
      throw new Error("Invalid refresh token");
    }
    if (payload.role !== "user" && payload.role !== "worker") {
      throw new Error("Invalid refresh token role");
    }
    return payload;
  }
}

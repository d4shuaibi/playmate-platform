import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import {
  type AdminAccessPayload,
  type AdminAccount,
  type AdminAuthProfile,
  type AdminPermission,
  type AdminRefreshPayload,
  type AdminRole
} from "./admin-auth.types";

type AdminChallengeData = {
  challengeId: string;
  nonce: string;
  expiresIn: number;
};

type AdminLoginRequest = {
  username: string;
  challengeId: string;
  proof: string;
};

type AdminRefreshRequest = {
  refreshToken: string;
};

type AdminLogoutRequest = {
  refreshToken: string;
};

type AdminTokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
};

type AdminAuthResponseData = AdminTokenBundle & {
  profile: AdminAuthProfile;
};

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

type ChallengeRecord = {
  challengeId: string;
  username: string;
  nonce: string;
  expiresAt: number;
  used: boolean;
};

type RefreshRecord = {
  username: string;
  role: AdminRole;
  permissions: AdminPermission[];
  expiresAt: number;
  revokedAt?: number;
};

const DEFAULT_CHALLENGE_EXPIRES_IN_SEC = 120;
const DEFAULT_ADMIN_ACCESS_EXPIRES_IN_SEC = 30 * 60;
const DEFAULT_ADMIN_REFRESH_EXPIRES_IN_SEC = 7 * 24 * 60 * 60;

const parseExpireToSeconds = (value: string | undefined, fallbackSec: number) => {
  if (!value || value.trim().length === 0) return fallbackSec;
  const matched = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!matched) return fallbackSec;
  const amount = Number(matched[1]);
  if (!Number.isFinite(amount) || amount <= 0) return fallbackSec;
  const unit = matched[2] ?? "s";
  if (unit === "s") return amount;
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 60 * 60;
  return amount * 60 * 60 * 24;
};

const sha256Hex = (raw: string) => {
  return createHash("sha256").update(raw).digest("hex");
};

const safeCompareHex = (a: string, b: string) => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

const normalizeUsername = (username: string) => {
  return username.trim().toLowerCase();
};

@Injectable()
export class AdminAuthService {
  private readonly challengeExpiresInSec = DEFAULT_CHALLENGE_EXPIRES_IN_SEC;
  private readonly accessExpiresInSec = parseExpireToSeconds(
    process.env.ADMIN_JWT_ACCESS_EXPIRES_IN,
    DEFAULT_ADMIN_ACCESS_EXPIRES_IN_SEC
  );
  private readonly refreshExpiresInSec = parseExpireToSeconds(
    process.env.ADMIN_JWT_REFRESH_EXPIRES_IN,
    DEFAULT_ADMIN_REFRESH_EXPIRES_IN_SEC
  );
  private readonly tokenSecret =
    process.env.ADMIN_JWT_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    "dev-playmate-admin-jwt";

  private readonly challenges = new Map<string, ChallengeRecord>();
  private readonly refreshTokens = new Map<string, RefreshRecord>();
  private readonly accounts: AdminAccount[] = this.loadAccountsFromEnv();
  private readonly authConfigured = this.accounts.length > 0;

  private loadAccountsFromEnv(): AdminAccount[] {
    const envRaw = process.env.ADMIN_AUTH_ACCOUNTS_JSON?.trim();
    if (envRaw) {
      try {
        const parsed = JSON.parse(envRaw) as AdminAccount[];
        return parsed.map((item) => ({
          username: normalizeUsername(item.username),
          displayName: item.displayName?.trim() || item.username,
          passwordHash: item.passwordHash?.trim().toLowerCase(),
          role: item.role,
          permissions: item.permissions ?? []
        }));
      } catch {
        throw new Error("ADMIN_AUTH_ACCOUNTS_JSON is invalid JSON");
      }
    }

    if (process.env.NODE_ENV === "production") return [];

    // dev default account: owner(admin) / Admin#2026
    return [
      {
        username: "admin",
        displayName: "平台老板",
        passwordHash: sha256Hex("Admin#2026"),
        role: "owner",
        permissions: this.resolveRolePermissions("owner")
      }
    ];
  }

  private ensureConfigured() {
    if (!this.authConfigured) {
      return {
        code: 503,
        message: "Admin auth is not configured (missing ADMIN_AUTH_ACCOUNTS_JSON)",
        data: null
      } as const;
    }
    return null;
  }

  private resolveRolePermissions(role: AdminRole): AdminPermission[] {
    if (role === "owner") {
      return [
        "system_overview.view",
        "admin.manage",
        "dashboard.view",
        "product.read",
        "product.write",
        "order.read",
        "order.dispatch",
        "order.write",
        "worker.read",
        "worker.audit",
        "worker.write",
        "customer_service.read",
        "customer_service.write",
        "settings.read",
        "settings.write"
      ];
    }
    if (role === "admin") {
      return [
        "dashboard.view",
        "product.read",
        "product.write",
        "order.read",
        "order.dispatch",
        "order.write",
        "worker.read",
        "worker.audit",
        "worker.write",
        "customer_service.read",
        "customer_service.write",
        "settings.read",
        "settings.write"
      ];
    }
    return [
      "dashboard.view",
      "product.read",
      "order.read",
      "order.dispatch",
      "worker.read",
      "worker.audit"
    ];
  }

  private cleanExpiredState() {
    const now = Date.now();
    for (const [key, value] of this.challenges) {
      if (value.expiresAt <= now || value.used) this.challenges.delete(key);
    }
    for (const [key, value] of this.refreshTokens) {
      if (value.expiresAt <= now || value.revokedAt) this.refreshTokens.delete(key);
    }
  }

  private findAccount(username: string) {
    const normalized = normalizeUsername(username);
    return this.accounts.find((item) => item.username === normalized) ?? null;
  }

  private toProfile(account: AdminAccount): AdminAuthProfile {
    return {
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      permissions: account.permissions
    };
  }

  private issueTokens(account: AdminAccount): AdminTokenBundle {
    const accessPayload: Omit<AdminAccessPayload, "iat" | "exp"> = {
      sub: account.username,
      role: account.role,
      permissions: account.permissions,
      typ: "admin_access"
    };
    const refreshPayload: Omit<AdminRefreshPayload, "iat" | "exp"> = {
      sub: account.username,
      role: account.role,
      permissions: account.permissions,
      typ: "admin_refresh"
    };

    const accessToken = jwt.sign(accessPayload, this.tokenSecret, {
      expiresIn: this.accessExpiresInSec
    });
    const refreshToken = jwt.sign(refreshPayload, this.tokenSecret, {
      expiresIn: this.refreshExpiresInSec
    });
    this.refreshTokens.set(sha256Hex(refreshToken), {
      username: account.username,
      role: account.role,
      permissions: account.permissions,
      expiresAt: Date.now() + this.refreshExpiresInSec * 1000
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresInSec,
      tokenType: "Bearer"
    };
  }

  private verifyAccessToken(accessToken: string): AdminAccessPayload {
    const payload = jwt.verify(accessToken, this.tokenSecret) as AdminAccessPayload;
    if (payload.typ !== "admin_access" || typeof payload.sub !== "string") {
      throw new UnauthorizedException("Invalid admin access token");
    }
    return payload;
  }

  private verifyRefreshToken(refreshToken: string): AdminRefreshPayload {
    const payload = jwt.verify(refreshToken, this.tokenSecret) as AdminRefreshPayload;
    if (payload.typ !== "admin_refresh" || typeof payload.sub !== "string") {
      throw new UnauthorizedException("Invalid admin refresh token");
    }
    return payload;
  }

  createChallenge(body: { username?: string }): ApiEnvelope<AdminChallengeData> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;
    this.cleanExpiredState();
    const username = normalizeUsername(body?.username ?? "");
    const challengeId = randomUUID();
    const nonce = randomBytes(16).toString("hex");
    this.challenges.set(challengeId, {
      challengeId,
      username,
      nonce,
      expiresAt: Date.now() + this.challengeExpiresInSec * 1000,
      used: false
    });

    return {
      code: 0,
      message: "ok",
      data: {
        challengeId,
        nonce,
        expiresIn: this.challengeExpiresInSec
      }
    };
  }

  adminLogin(body: AdminLoginRequest): ApiEnvelope<AdminAuthResponseData> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;
    this.cleanExpiredState();
    const username = normalizeUsername(body?.username ?? "");
    const proof = (body?.proof ?? "").trim().toLowerCase();
    const challengeId = (body?.challengeId ?? "").trim();
    const challenge = this.challenges.get(challengeId);

    if (!username || !proof || !challengeId || !challenge) {
      return { code: 401, message: "Invalid username or password", data: null };
    }
    if (challenge.used || challenge.expiresAt <= Date.now() || challenge.username !== username) {
      return { code: 401, message: "Invalid username or password", data: null };
    }
    challenge.used = true;

    const account = this.findAccount(username);
    if (!account) {
      return { code: 401, message: "Invalid username or password", data: null };
    }

    const expectedProof = sha256Hex(`${account.passwordHash}.${challenge.nonce}`);
    const valid = safeCompareHex(expectedProof, proof);
    if (!valid) {
      return { code: 401, message: "Invalid username or password", data: null };
    }

    const tokens = this.issueTokens(account);
    return {
      code: 0,
      message: "ok",
      data: {
        ...tokens,
        profile: this.toProfile(account)
      }
    };
  }

  adminRefresh(body: AdminRefreshRequest): ApiEnvelope<AdminAuthResponseData> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;
    this.cleanExpiredState();
    const refreshToken = body?.refreshToken?.trim();
    if (!refreshToken) {
      return { code: 400, message: "Missing refresh token", data: null };
    }

    try {
      const payload = this.verifyRefreshToken(refreshToken);
      const tokenHash = sha256Hex(refreshToken);
      const record = this.refreshTokens.get(tokenHash);
      if (!record || record.revokedAt || record.expiresAt <= Date.now()) {
        return { code: 401, message: "Refresh token revoked or expired", data: null };
      }
      if (record.username !== payload.sub) {
        return { code: 401, message: "Refresh token revoked or expired", data: null };
      }

      const account = this.findAccount(record.username);
      if (!account) {
        return { code: 401, message: "Account not found", data: null };
      }

      record.revokedAt = Date.now();
      const tokens = this.issueTokens(account);
      return {
        code: 0,
        message: "ok",
        data: {
          ...tokens,
          profile: this.toProfile(account)
        }
      };
    } catch {
      return { code: 401, message: "Invalid refresh token", data: null };
    }
  }

  adminLogout(body: AdminLogoutRequest): ApiEnvelope<{ success: true }> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;
    const refreshToken = body?.refreshToken?.trim();
    if (!refreshToken) {
      return { code: 400, message: "Missing refresh token", data: null };
    }
    const tokenHash = sha256Hex(refreshToken);
    const record = this.refreshTokens.get(tokenHash);
    if (record) {
      record.revokedAt = Date.now();
    }
    return {
      code: 0,
      message: "ok",
      data: { success: true }
    };
  }

  parseAccessToken(accessToken: string): AdminAccessPayload {
    return this.verifyAccessToken(accessToken);
  }
}

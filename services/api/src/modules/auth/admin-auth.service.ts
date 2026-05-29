import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma/prisma.service";
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

type AdminManagerItem = {
  id: string;
  name: string;
  username: string;
  status: "active" | "disabled";
  createdAt: string;
};

type AdminManagerCreateRequest = {
  name: string;
  username: string;
  passwordHash: string;
};

type AdminManagerUpdateRequest = {
  name?: string;
  passwordHash?: string;
};

type AdminManagerListFilters = {
  name?: string;
  status?: "active" | "disabled";
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

const isSha256Hex = (value: string) => {
  return /^[a-f0-9]{64}$/.test(value);
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

  // owner 账号硬编码（不入库），manager 账号存数据库
  private readonly ownerAccounts: AdminAccount[] = this.loadOwnerAccountsFromEnv();
  private readonly authConfigured = this.ownerAccounts.length > 0;

  constructor(private readonly prisma: PrismaService) {}

  private loadOwnerAccountsFromEnv(): AdminAccount[] {
    const envRaw = process.env.ADMIN_AUTH_ACCOUNTS_JSON?.trim();
    if (envRaw) {
      try {
        const parsed = JSON.parse(envRaw) as AdminAccount[];
        return parsed
          .filter((item) => item.role === "owner")
          .map((item) => ({
            id: item.id?.trim() || "OWN-ENV",
            username: normalizeUsername(item.username),
            displayName: item.displayName?.trim() || item.username,
            passwordHash: item.passwordHash?.trim().toLowerCase(),
            role: item.role,
            permissions: this.resolveRolePermissions("owner"),
            status: item.status ?? "active",
            createdAt: item.createdAt ?? new Date().toISOString().slice(0, 10)
          }));
      } catch {
        throw new Error("ADMIN_AUTH_ACCOUNTS_JSON is invalid JSON");
      }
    }

    if (process.env.NODE_ENV === "production") return [];

    // dev default account: owner(admin) / Admin#2026
    return [
      {
        id: "OWN-0001",
        username: "admin",
        displayName: "平台老板",
        passwordHash: sha256Hex("Admin#2026"),
        role: "owner",
        permissions: this.resolveRolePermissions("owner"),
        status: "active",
        createdAt: "2023-01-01"
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

  private async findAccount(username: string): Promise<AdminAccount | null> {
    const normalized = normalizeUsername(username);
    // owner 账号优先（in-memory）
    const owner = this.ownerAccounts.find((item) => item.username === normalized);
    if (owner) return owner;
    // manager 账号从数据库查
    const row = await this.prisma.adminAccount.findUnique({ where: { username: normalized } });
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      passwordHash: row.passwordHash,
      role: row.role as AdminRole,
      permissions: this.resolveRolePermissions(row.role as AdminRole),
      status: row.status as "active" | "disabled",
      createdAt: row.createdAt.toISOString().slice(0, 10)
    };
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

  async adminLogin(body: AdminLoginRequest): Promise<ApiEnvelope<AdminAuthResponseData>> {
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

    const account = await this.findAccount(username);
    if (!account) {
      return { code: 401, message: "Invalid username or password", data: null };
    }
    if (account.status !== "active") {
      return { code: 403, message: "登录失败，账号已经被禁用！", data: null };
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

  async adminRefresh(body: AdminRefreshRequest): Promise<ApiEnvelope<AdminAuthResponseData>> {
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

      const account = await this.findAccount(record.username);
      if (!account) {
        return { code: 401, message: "Account not found", data: null };
      }
      if (account.status !== "active") {
        return { code: 403, message: "登录失败，账号已经被禁用！", data: null };
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

  async listAdminManagers(
    filters: AdminManagerListFilters = {}
  ): Promise<ApiEnvelope<{ items: AdminManagerItem[] }>> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;

    const rows = await this.prisma.adminAccount.findMany({
      where: {
        ...(filters.name ? { displayName: { contains: filters.name } } : {}),
        ...(filters.status ? { status: filters.status } : {})
      },
      orderBy: { createdAt: "asc" }
    });

    return {
      code: 0,
      message: "ok",
      data: {
        items: rows.map((row) => ({
          id: row.id,
          name: row.displayName,
          username: row.username,
          status: row.status as "active" | "disabled",
          createdAt: row.createdAt.toISOString().slice(0, 10)
        }))
      }
    };
  }

  async getAdminManager(id: string): Promise<ApiEnvelope<AdminManagerItem>> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;

    const row = await this.prisma.adminAccount.findUnique({ where: { id } });
    if (!row) {
      return { code: 404, message: "Admin manager not found", data: null };
    }
    return {
      code: 0,
      message: "ok",
      data: {
        id: row.id,
        name: row.displayName,
        username: row.username,
        status: row.status as "active" | "disabled",
        createdAt: row.createdAt.toISOString().slice(0, 10)
      }
    };
  }

  async createAdminManager(
    body: AdminManagerCreateRequest
  ): Promise<ApiEnvelope<AdminManagerItem>> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;

    const name = body?.name?.trim();
    const username = normalizeUsername(body?.username ?? "");
    const passwordHash = body?.passwordHash?.trim().toLowerCase() ?? "";
    if (!name || !username || !passwordHash) {
      return { code: 400, message: "Missing required fields", data: null };
    }
    if (!isSha256Hex(passwordHash)) {
      return { code: 400, message: "Invalid password hash", data: null };
    }
    if (await this.findAccount(username)) {
      return { code: 409, message: "Username already exists", data: null };
    }

    const row = await this.prisma.adminAccount.create({
      data: { username, displayName: name, passwordHash, role: "admin", status: "active" }
    });
    return {
      code: 0,
      message: "ok",
      data: {
        id: row.id,
        name: row.displayName,
        username: row.username,
        status: row.status as "active" | "disabled",
        createdAt: row.createdAt.toISOString().slice(0, 10)
      }
    };
  }

  async updateAdminManager(
    id: string,
    body: AdminManagerUpdateRequest
  ): Promise<ApiEnvelope<AdminManagerItem>> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;

    const existing = await this.prisma.adminAccount.findUnique({ where: { id } });
    if (!existing) {
      return { code: 404, message: "Admin manager not found", data: null };
    }

    const nextName = body?.name?.trim();
    const nextPasswordHash = body?.passwordHash?.trim().toLowerCase();
    if (nextPasswordHash && !isSha256Hex(nextPasswordHash)) {
      return { code: 400, message: "Invalid password hash", data: null };
    }

    const row = await this.prisma.adminAccount.update({
      where: { id },
      data: {
        ...(nextName ? { displayName: nextName } : {}),
        ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {})
      }
    });
    return {
      code: 0,
      message: "ok",
      data: {
        id: row.id,
        name: row.displayName,
        username: row.username,
        status: row.status as "active" | "disabled",
        createdAt: row.createdAt.toISOString().slice(0, 10)
      }
    };
  }

  async toggleAdminManagerStatus(
    id: string,
    status: "active" | "disabled"
  ): Promise<ApiEnvelope<AdminManagerItem>> {
    const notConfigured = this.ensureConfigured();
    if (notConfigured) return notConfigured;

    const existing = await this.prisma.adminAccount.findUnique({ where: { id } });
    if (!existing) {
      return { code: 404, message: "Admin manager not found", data: null };
    }

    const row = await this.prisma.adminAccount.update({
      where: { id },
      data: { status }
    });
    return {
      code: 0,
      message: "ok",
      data: {
        id: row.id,
        name: row.displayName,
        username: row.username,
        status: row.status as "active" | "disabled",
        createdAt: row.createdAt.toISOString().slice(0, 10)
      }
    };
  }

  parseAccessToken(accessToken: string): AdminAccessPayload {
    return this.verifyAccessToken(accessToken);
  }
}

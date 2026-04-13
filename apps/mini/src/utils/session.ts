import Taro from "@tarojs/taro";

/** 与 services/api AuthController.miniLogin 返回的 data 对齐 */
export type MiniUserSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: "Bearer";
  role: "user" | "worker";
};

const SESSION_STORAGE_KEY = "playmate.wechat.user";

/** 兼容旧版：曾使用 tokenId / standbyToken 结构 */
type LegacyWechatShape = {
  accessToken?: string;
  token?: string;
  tokenId?: string;
  standbyToken?: string;
  role?: "user" | "worker";
};

/** 将历史存储迁移为 MiniUserSession */
const migrateStoredSessionIfNeeded = () => {
  const raw = Taro.getStorageSync(SESSION_STORAGE_KEY) as unknown;
  if (!raw || typeof raw !== "object") {
    return;
  }

  const legacy = raw as LegacyWechatShape & Partial<MiniUserSession>;
  if (typeof legacy.accessToken === "string" && legacy.accessToken.length > 0) {
    return;
  }

  const fallbackToken =
    (typeof legacy.token === "string" && legacy.token.length > 0 && legacy.token) ||
    (typeof legacy.tokenId === "string" && legacy.tokenId.length > 0 && legacy.tokenId) ||
    "";

  if (fallbackToken) {
    Taro.setStorageSync(SESSION_STORAGE_KEY, {
      accessToken: fallbackToken,
      refreshToken: "",
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      tokenType: "Bearer",
      role: legacy.role === "worker" ? "worker" : "user"
    } satisfies MiniUserSession);
  }
};

migrateStoredSessionIfNeeded();

/** 读取本地登录会话 */
export const getStoredSession = (): MiniUserSession | null => {
  const raw = Taro.getStorageSync(SESSION_STORAGE_KEY) as unknown;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const session = raw as MiniUserSession;
  if (typeof session.accessToken !== "string" || session.accessToken.length === 0) {
    return null;
  }
  if (typeof session.refreshToken !== "string") {
    return null;
  }
  if (typeof session.expiresAt !== "number") {
    return null;
  }
  if (session.tokenType !== "Bearer") {
    return null;
  }
  if (session.role !== "user" && session.role !== "worker") {
    return null;
  }
  return session;
};

/** 写入登录会话 */
export const setStoredSession = (session: MiniUserSession) => {
  Taro.setStorageSync(SESSION_STORAGE_KEY, session);
};

/** 清除本地会话 */
export const clearStoredSession = () => {
  Taro.removeStorageSync(SESSION_STORAGE_KEY);
};

/** 当前 access token，未登录为空字符串 */
export const getToken = (): string => {
  return getStoredSession()?.accessToken ?? "";
};

/** 当前 refresh token */
export const getRefreshToken = (): string => {
  return getStoredSession()?.refreshToken ?? "";
};

/** access token 过期时间（毫秒时间戳） */
export const getTokenExpiresAt = (): number => {
  return getStoredSession()?.expiresAt ?? 0;
};

/** 是否已过期（预留 30 秒缓冲） */
export const isAccessTokenExpired = (): boolean => {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - 30_000;
};

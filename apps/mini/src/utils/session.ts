import Taro from "@tarojs/taro";

/** 与 services/api AuthController.miniLogin 返回的 data 对齐 */
export type MiniUserSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: "Bearer";
  role: "user" | "worker";
};

const SESSION_STORAGE_KEY = "playmate.wechat.user";

/** 兼容旧版：曾使用 tokenId / standbyToken 结构 */
type LegacyWechatShape = {
  tokenId?: string;
  standbyToken?: string;
  token?: string;
};

/** 将历史存储迁移为 MiniUserSession */
const migrateStoredSessionIfNeeded = () => {
  const raw = Taro.getStorageSync(SESSION_STORAGE_KEY) as unknown;
  if (!raw || typeof raw !== "object") {
    return;
  }

  const legacy = raw as LegacyWechatShape & Partial<MiniUserSession>;
  if (typeof legacy.access_token === "string" && legacy.access_token.length > 0) {
    return;
  }

  const token = legacy.tokenId || legacy.token;
  if (typeof token === "string" && token.length > 0) {
    Taro.setStorageSync(SESSION_STORAGE_KEY, {
      access_token: token,
      refresh_token: "",
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
      token_type: "Bearer",
      role: "user"
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
  if (typeof session.access_token !== "string" || session.access_token.length === 0) {
    return null;
  }
  if (session.role !== "user" && session.role !== "worker") {
    return null;
  }
  if (typeof session.expires_at !== "number" || !Number.isFinite(session.expires_at)) {
    return null;
  }
  if (session.token_type !== "Bearer") {
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

export const getAccessToken = (): string => {
  return getStoredSession()?.access_token ?? "";
};

export const getRefreshToken = (): string => {
  return getStoredSession()?.refresh_token ?? "";
};

export const getExpiresAt = (): number => {
  return getStoredSession()?.expires_at ?? 0;
};

export const getTokenType = (): "Bearer" => {
  return "Bearer";
};

import Taro from "@tarojs/taro";

/** 与 services/api AuthController.miniLogin 返回的 data 对齐 */
export type MiniUserSession = {
  token: string;
  role: "user" | "worker";
};

const SESSION_STORAGE_KEY = "playmate.wechat.user";

/** 兼容旧版：曾使用 tokenId / standbyToken 结构 */
type LegacyWechatShape = {
  tokenId?: string;
  standbyToken?: string;
};

/** 将历史存储迁移为 MiniUserSession */
const migrateStoredSessionIfNeeded = () => {
  const raw = Taro.getStorageSync(SESSION_STORAGE_KEY) as unknown;
  if (!raw || typeof raw !== "object") {
    return;
  }

  const legacy = raw as LegacyWechatShape & Partial<MiniUserSession>;
  if (typeof legacy.token === "string" && legacy.token.length > 0) {
    return;
  }

  if (typeof legacy.tokenId === "string" && legacy.tokenId.length > 0) {
    Taro.setStorageSync(SESSION_STORAGE_KEY, {
      token: legacy.tokenId,
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
  if (typeof session.token !== "string" || session.token.length === 0) {
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
  return getStoredSession()?.token ?? "";
};

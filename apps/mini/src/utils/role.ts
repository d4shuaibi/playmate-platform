import Taro from "@tarojs/taro";
import { getToken, setStoredSession, type MiniUserSession } from "./session";

export type AppRole = "user" | "worker";

type WorkerPermissionPayload = {
  hasWorkerPermission?: boolean;
};

const ROLE_STORAGE_KEY = "playmate.role";
const LEGACY_TOKEN_STORAGE_KEY = "playmate.token";
const WORKER_PERMISSION_STORAGE_KEY = "playmate.worker.permission";

/** 启动时迁移旧版仅 token 字符串的存储 */
const migrateLegacyTokenIfNeeded = () => {
  const legacy = Taro.getStorageSync(LEGACY_TOKEN_STORAGE_KEY) as unknown;
  if (typeof legacy === "string" && legacy.length > 0) {
    const next: MiniUserSession = {
      accessToken: legacy,
      refreshToken: "",
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      tokenType: "Bearer",
      role: "user"
    };
    setStoredSession(next);
    Taro.removeStorageSync(LEGACY_TOKEN_STORAGE_KEY);
  }
};

migrateLegacyTokenIfNeeded();

export const getRole = (): AppRole => {
  const tokenFromSession = getToken();
  if (!tokenFromSession) {
    return "user";
  }

  const roleFromStorage = Taro.getStorageSync(ROLE_STORAGE_KEY) as unknown;
  if (roleFromStorage === "worker") {
    return "worker";
  }

  return "user";
};

export const setRole = (role: AppRole) => {
  Taro.setStorageSync(ROLE_STORAGE_KEY, role);
};

export const getWorkerPermission = () => {
  const tokenFromSession = getToken();
  if (!tokenFromSession) {
    return false;
  }

  const workerPermission = Taro.getStorageSync(WORKER_PERMISSION_STORAGE_KEY) as unknown;
  return workerPermission === true;
};

export const setWorkerPermission = (hasPermission: boolean) => {
  Taro.setStorageSync(WORKER_PERMISSION_STORAGE_KEY, hasPermission);
};

export const resolveWorkerPermission = (payload: WorkerPermissionPayload) => {
  return payload.hasWorkerPermission === true;
};

/** 兼容旧调用：写入 token，角色默认 user */
export const setToken = (token: string) => {
  setStoredSession({
    accessToken: token,
    refreshToken: "",
    expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    tokenType: "Bearer",
    role: "user"
  });
};

export { getToken } from "./session";

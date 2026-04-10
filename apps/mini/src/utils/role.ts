import Taro from "@tarojs/taro";

export type AppRole = "user" | "worker";
type WorkerPermissionPayload = {
  hasWorkerPermission?: boolean;
};

const ROLE_STORAGE_KEY = "playmate.role";
const TOKEN_STORAGE_KEY = "playmate.token";
const WORKER_PERMISSION_STORAGE_KEY = "playmate.worker.permission";

export const getRole = (): AppRole => {
  const tokenFromStorage = Taro.getStorageSync(TOKEN_STORAGE_KEY) as unknown;
  if (typeof tokenFromStorage !== "string" || tokenFromStorage.length === 0) {
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
  const tokenFromStorage = Taro.getStorageSync(TOKEN_STORAGE_KEY) as unknown;
  if (typeof tokenFromStorage !== "string" || tokenFromStorage.length === 0) {
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

export const getToken = () => {
  return Taro.getStorageSync(TOKEN_STORAGE_KEY) as string | undefined;
};

export const setToken = (token: string) => {
  Taro.setStorageSync(TOKEN_STORAGE_KEY, token);
};

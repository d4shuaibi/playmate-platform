import Taro from "@tarojs/taro";

export type AppRole = "user" | "worker";

const ROLE_STORAGE_KEY = "playmate.role";
const TOKEN_STORAGE_KEY = "playmate.token";

export const getRole = (): AppRole => {
  const roleFromStorage = Taro.getStorageSync(ROLE_STORAGE_KEY) as unknown;
  if (roleFromStorage === "worker") {
    return "worker";
  }

  return "user";
};

export const setRole = (role: AppRole) => {
  Taro.setStorageSync(ROLE_STORAGE_KEY, role);
};

export const getToken = () => {
  return Taro.getStorageSync(TOKEN_STORAGE_KEY) as string | undefined;
};

export const setToken = (token: string) => {
  Taro.setStorageSync(TOKEN_STORAGE_KEY, token);
};

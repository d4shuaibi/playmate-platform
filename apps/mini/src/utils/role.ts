import Taro from "@tarojs/taro";

export type AppRole = "user" | "worker";

const ROLE_STORAGE_KEY = "playmate.role";

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

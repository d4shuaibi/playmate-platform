import {
  clearStoredSession,
  getRefreshToken,
  setStoredSession,
  type MiniUserSession
} from "../utils/session";
import { setRole, setWorkerPermission } from "../utils/role";
import { request } from "./http";
import { apiPaths } from "./api-paths";

type MiniLoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
  role: "user" | "worker";
};

/**
 * 仅支持手机号登录：将 button `getPhoneNumber` 回调中的 **code**（动态令牌）发到服务端，
 * 与 wx.login 的 code 不同。服务端换手机号后按手机号登录；**新手机号则新建用户**。
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html
 */
export const loginWithPhoneCode = async (phoneCode: string) => {
  if (!phoneCode) {
    throw new Error("未获取到手机号授权");
  }

  const res = await request<MiniLoginResponse>(apiPaths.miniLogin, {
    method: "POST",
    body: { code: phoneCode },
    skipAuth: true
  });

  const data = res.data;
  if (!data || typeof data.access_token !== "string") {
    throw new Error(res.message || "登录返回数据异常");
  }

  const session: MiniUserSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    role: data.role
  };
  setStoredSession(session);
  setRole(data.role);
  setWorkerPermission(data.role === "worker");
  return data;
};

export const refreshSession = async () => {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    throw new Error("Missing refresh_token");
  }
  const res = await request<MiniLoginResponse>(apiPaths.refresh, {
    method: "POST",
    body: { refresh_token },
    skipAuth: true
  });
  const data = res.data;
  if (!data?.access_token) {
    throw new Error(res.message || "刷新失败");
  }
  setStoredSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
    role: data.role
  });
  setRole(data.role);
  setWorkerPermission(data.role === "worker");
  return data;
};

/** 清理本地会话与端内权限标记 */
export const logoutMiniUser = () => {
  // 尝试通知后端注销（失败也不影响本地清理）
  void request(apiPaths.logout, { method: "POST", body: {}, skipAuth: false }).catch(() => {});
  clearStoredSession();
  setWorkerPermission(false);
  setRole("user");
};

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
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  role: "user" | "worker";
};

/**
 * 仅支持手机号登录：将 button `getPhoneNumber` 回调中的 **code**（动态令牌）发到服务端，
 * 与 wx.login 的 code 不同。服务端换手机号后按手机号登录；**新手机号则新建用户**。
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html
 */
export const loginWithPhoneCode = async (phoneCode: string, wxLoginCode?: string) => {
  if (!phoneCode) {
    throw new Error("未获取到手机号授权");
  }

  const res = await request<MiniLoginResponse>(apiPaths.miniLogin, {
    method: "POST",
    body: { code: phoneCode, wxLoginCode },
    skipAuth: true
  });

  const data = res.data;
  if (!data || typeof data.accessToken !== "string") {
    throw new Error(res.message || "登录返回数据异常");
  }

  const session: MiniUserSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
    tokenType: data.tokenType,
    role: data.role
  };
  setStoredSession(session);
  setRole(data.role);
  setWorkerPermission(data.role === "worker");
  return data;
};

/** 清理本地会话与端内权限标记 */
export const logoutMiniUser = () => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    // 主动退出时通知后端吊销 refresh token；失败不阻断本地退出
    void request(apiPaths.miniLogout, {
      method: "POST",
      body: { refreshToken },
      skipAuth: true
    }).catch(() => undefined);
  }

  clearStoredSession();
  setWorkerPermission(false);
  setRole("user");
};

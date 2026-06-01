import { requestAdminRefresh } from "./api";
import { getAdminAuthSession, setAdminAuthSession } from "./session";
import type { AdminAuthSession } from "./types";

/**
 * Returns a valid access token, refreshing it automatically if it is expired
 * or about to expire within the next 60 seconds.
 */
export const getValidAdminAccessToken = async (): Promise<string> => {
  const session = getAdminAuthSession();
  if (!session) throw new Error("未登录或登录已失效");

  if (Date.now() < session.expiresAt - 60_000) {
    return session.accessToken;
  }

  const tokens = await requestAdminRefresh(session.refreshToken);
  const newSession: AdminAuthSession = {
    ...session,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
    profile: tokens.profile
  };
  setAdminAuthSession(newSession);
  return tokens.accessToken;
};

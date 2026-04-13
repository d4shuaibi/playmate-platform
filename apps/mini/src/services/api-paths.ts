/**
 * 与 Nest 全局前缀一致：完整路径接在 apiBaseUrl 后（base 不要含 `/api` 以免重复）。
 */
export const apiPaths = {
  /**
   * POST body: `{ code }` 为 **getPhoneNumber** 动态令牌（非 wx.login）。
   * 服务端按手机号登录或新建用户。
   */
  miniLogin: "/api/auth/mini/login",
  /** POST body: `{ refresh_token }` 刷新 access_token */
  refresh: "/api/auth/refresh",
  /** POST：注销（服务端 tokenVersion +1） */
  logout: "/api/auth/logout"
} as const;

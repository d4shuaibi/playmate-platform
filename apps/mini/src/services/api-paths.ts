/**
 * 与 Nest 全局前缀一致：完整路径接在 apiBaseUrl 后（base 不要含 `/api` 以免重复）。
 */
export const apiPaths = {
  /**
   * POST body: `{ code }` 为 **getPhoneNumber** 动态令牌（非 wx.login）。
   * 服务端按手机号登录或新建用户。
   */
  miniLogin: "/api/auth/mini/login"
} as const;

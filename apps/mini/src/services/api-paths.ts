/**
 * 与 Nest 全局前缀一致：完整路径接在 apiBaseUrl 后（base 不要含 `/api` 以免重复）。
 */
export const apiPaths = {
  /**
   * POST body: `{ code }` 为 **getPhoneNumber** 动态令牌（非 wx.login）。
   * 服务端按手机号登录或新建用户。
   */
  miniLogin: "/api/auth/mini/login",
  /** POST body: `{ refreshToken }` */
  miniRefresh: "/api/auth/mini/refresh",
  /** POST body: `{ refreshToken }` */
  miniLogout: "/api/auth/mini/logout",
  /** GET 小程序商品大类（仅正常） */
  miniProductCategories: "/api/mini/product-categories",
  /** GET 小程序商品列表（仅上架） */
  miniProducts: "/api/mini/products",

  /** GET 当前用户打手入驻进度（需要登录） */
  miniWorkerJoinProgress: "/api/mini/worker-join/progress",
  /** POST 提交打手入驻申请（需要登录） */
  miniWorkerJoinApply: "/api/mini/worker-join/apply"
} as const;

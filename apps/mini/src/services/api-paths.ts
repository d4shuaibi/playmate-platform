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
  miniWorkerJoinApply: "/api/mini/worker-join/apply",
  /** GET 入驻考核类型枚举（无需登录） */
  miniWorkerJoinAssessmentOptions: "/api/mini/worker-join/assessment-options",

  /** GET 当前登录用户「我的」聚合：昵称头像、余额、订单 Tab 统计 */
  miniMe: "/api/mini/me",

  /** GET 公开客服列表（启用账号）：头像、微信、二维码、在线状态（无需登录） */
  miniCustomerServiceAgents: "/api/mini/customer-service/agents",

  /** GET 当前用户订单列表（含 Tab 数量）；POST body `{ productId }` 创建订单。Query：keyword、status、page、pageSize */
  miniOrders: "/api/mini/orders",

  /** GET 打手工作台汇总；PATCH body `{ mode: online | rest }` */
  workerWorkbench: "/api/worker/workbench",
  workerPresence: "/api/worker/presence",
  /** GET 打手订单；详情 `/orders/:id`；接单 POST `/orders/:id/start`；完成 POST `/orders/:id/complete` */
  workerOrders: "/api/worker/orders",

  /** 打手收益：GET summary/months/ledger；流水详情 GET `/ledger/:orderId` */
  workerIncomeSummary: "/api/worker/income/summary",
  workerIncomeMonths: "/api/worker/income/months",
  workerIncomeLedger: "/api/worker/income/ledger"
} as const;

/** 小程序端展示的在线状态（由服务端根据规则映射，便于前台展示） */
export type CustomerServicePresenceStatus = "online" | "busy" | "offline";

export type CustomerServiceAgent = {
  id: string;
  nickname: string;
  wechatId: string;
  /** true 表示账号已禁用 */
  disabled: boolean;
  avatarUrl: string;
  wechatQrUrl: string;
  createdAt: string;
};

/** GET /api/mini/customer-service/agents 单条公开资料（不含 disabled） */
export type MiniCustomerServiceAgentDto = {
  id: string;
  nickname: string;
  wechatId: string;
  avatarUrl: string;
  wechatQrUrl: string;
  presenceStatus: CustomerServicePresenceStatus;
  presenceLabel: string;
};

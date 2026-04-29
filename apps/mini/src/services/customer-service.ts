import { apiPaths } from "./api-paths";
import { request } from "./http";

/** 与后端 MiniCustomerServiceAgentDto 对齐 */
export type MiniCustomerServiceAgent = {
  id: string;
  nickname: string;
  wechatId: string;
  avatarUrl: string;
  wechatQrUrl: string;
  presenceStatus: "online" | "busy" | "offline";
  presenceLabel: string;
};

/**
 * 拉取前台可用客服列表（仅启用账号）。
 */
export const fetchMiniCustomerServiceAgents = async () => {
  const envelope = await request<{ items: MiniCustomerServiceAgent[]; total: number }>(
    apiPaths.miniCustomerServiceAgents,
    { skipAuth: true }
  );
  return envelope.data.items;
};

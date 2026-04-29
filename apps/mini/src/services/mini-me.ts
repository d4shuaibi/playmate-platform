import { apiPaths } from "./api-paths";
import { request } from "./http";
import type { MiniOrderTabCounts } from "./orders";

/** GET /api/mini/me */
export type MiniMePayload = {
  nickname: string;
  avatarUrl: string | null;
  userId: string;
  displayId: string;
  walletBalance: number;
  orderCounts: MiniOrderTabCounts;
};

/**
 * 拉取当前登录用户「我的」聚合数据（资料、余额、订单统计）。
 */
export const fetchMiniMe = async (): Promise<MiniMePayload> => {
  const envelope = await request<MiniMePayload>(apiPaths.miniMe);
  return envelope.data;
};

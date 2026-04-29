import type { MiniOrderTabCounts } from "./order.types";

/** GET /api/mini/me 聚合数据 */
export type MiniMeDto = {
  nickname: string;
  avatarUrl: string | null;
  userId: string;
  /** 展示用短 ID（非敏感掩码） */
  displayId: string;
  walletBalance: number;
  orderCounts: MiniOrderTabCounts;
};

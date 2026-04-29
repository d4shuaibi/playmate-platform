import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { MiniMeDto } from "./mini-me.dto";
import { OrderService } from "./order.service";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

/**
 * 展示用 ID：取用户 id 末尾 8 位，便于与客服对账时口述。
 */
const formatDisplayId = (userId: string): string => {
  const tail = userId.length <= 8 ? userId : userId.slice(-8);
  return `ID_${tail.toUpperCase()}`;
};

/**
 * 无昵称时用手机号后四位生成默认称呼。
 */
const formatNickname = (user: { nickname: string | null; phone: string | null }): string => {
  const nick = user.nickname?.trim();
  if (nick) return nick;
  const ph = user.phone?.replace(/\s/g, "") ?? "";
  if (ph.length >= 4) return `用户${ph.slice(-4)}`;
  return "微信用户";
};

@Injectable()
export class MiniMeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService
  ) {}

  async getMe(userId: string): Promise<ApiEnvelope<MiniMeDto>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { code: 404, message: "user not found", data: null };
    }

    const walletRaw = user.walletBalance as unknown;
    const walletBalance =
      walletRaw !== null &&
      typeof walletRaw === "object" &&
      "toNumber" in walletRaw &&
      typeof (walletRaw as { toNumber: () => number }).toNumber === "function"
        ? (walletRaw as { toNumber: () => number }).toNumber()
        : Number(walletRaw);

    const orderCounts = this.orderService.getMiniOrderTabCounts(userId);

    return {
      code: 0,
      message: "ok",
      data: {
        nickname: formatNickname(user),
        avatarUrl: user.avatarUrl,
        userId: user.id,
        displayId: formatDisplayId(user.id),
        walletBalance: Number.isFinite(walletBalance) ? walletBalance : 0,
        orderCounts
      }
    };
  }
}

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

    const orderCounts = await this.orderService.getMiniOrderTabCounts(userId);

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

  /**
   * 更新「我的」资料：昵称 / 头像。两者均为可选，仅更新传入字段。
   * 昵称去首尾空白后限 1~24 个字符；头像须为我方文件直链（http/https）。
   */
  async updateProfile(
    userId: string,
    input: { nickname?: string; avatarUrl?: string }
  ): Promise<ApiEnvelope<MiniMeDto>> {
    const data: { nickname?: string; avatarUrl?: string } = {};

    if (input.nickname !== undefined) {
      const nick = input.nickname.trim();
      if (nick.length === 0 || nick.length > 24) {
        return { code: 400, message: "昵称需为 1~24 个字符", data: null };
      }
      data.nickname = nick;
    }

    if (input.avatarUrl !== undefined) {
      const url = input.avatarUrl.trim();
      if (!/^https?:\/\/.+/.test(url) || url.length > 512) {
        return { code: 400, message: "头像地址不合法", data: null };
      }
      data.avatarUrl = url;
    }

    if (Object.keys(data).length === 0) {
      return { code: 400, message: "没有可更新的字段", data: null };
    }

    const exists = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    if (!exists) return { code: 404, message: "user not found", data: null };

    await this.prisma.user.update({ where: { id: userId }, data });
    return this.getMe(userId);
  }
}

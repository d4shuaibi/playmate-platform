import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CustomerServicePresenceStatus,
  CustomerServiceAgent,
  MiniCustomerServiceAgentDto
} from "./customer-service.types";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

type ListFilters = {
  keyword?: string;
  disabled?: boolean;
  page?: number;
  pageSize?: number;
};

type CreateAgentRequest = {
  nickname: string;
  wechatId: string;
  avatarUrl: string;
  wechatQrUrl: string;
};

type UpdateAgentRequest = Partial<CreateAgentRequest> & {
  disabled?: boolean;
};

const normalizeKeyword = (value: string | undefined): string => {
  return (value ?? "").trim().toLowerCase();
};

const createAgentId = (): string => {
  return `CS-${Math.floor(1000 + Math.random() * 9000)}`;
};

const mapRowToAgent = (row: {
  id: string;
  nickname: string;
  wechatId: string;
  disabled: boolean;
  avatarUrl: string;
  wechatQrUrl: string;
  createdAt: Date;
}): CustomerServiceAgent => ({
  id: row.id,
  nickname: row.nickname,
  wechatId: row.wechatId,
  disabled: row.disabled,
  avatarUrl: row.avatarUrl,
  wechatQrUrl: row.wechatQrUrl,
  createdAt: row.createdAt.toISOString().slice(0, 10)
});

@Injectable()
export class CustomerServiceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 小程序端可见客服列表：仅未禁用账号；附带 presence（确定性映射，刷新间隙保持稳定）。
   */
  public async listAgentsForMini(): Promise<
    ApiEnvelope<{ items: MiniCustomerServiceAgentDto[]; total: number }>
  > {
    const rows = await this.prisma.customerServiceAgent.findMany({
      where: { disabled: false },
      orderBy: { createdAt: "desc" }
    });

    const cycle: CustomerServicePresenceStatus[] = ["online", "busy", "offline"];
    const labels: Record<CustomerServicePresenceStatus, string> = {
      online: "在线",
      busy: "忙碌中",
      offline: "离线"
    };

    const items: MiniCustomerServiceAgentDto[] = rows.map((agent) => {
      const hash = agent.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const presenceStatus = cycle[Math.abs(hash) % cycle.length];
      return {
        id: agent.id,
        nickname: agent.nickname,
        wechatId: agent.wechatId,
        avatarUrl: agent.avatarUrl,
        wechatQrUrl: agent.wechatQrUrl,
        presenceStatus,
        presenceLabel: labels[presenceStatus]
      };
    });

    return {
      code: 0,
      message: "ok",
      data: {
        items,
        total: items.length
      }
    };
  }

  public async listAgents(
    filters: ListFilters
  ): Promise<ApiEnvelope<{ items: CustomerServiceAgent[]; total: number }>> {
    const keywordRaw = normalizeKeyword(filters.keyword);
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const where: Prisma.CustomerServiceAgentWhereInput = {
      ...(filters.disabled !== undefined ? { disabled: filters.disabled } : {}),
      ...(keywordRaw.length > 0
        ? {
            OR: [
              { nickname: { contains: keywordRaw } },
              { id: { contains: keywordRaw } },
              { wechatId: { contains: keywordRaw } }
            ]
          }
        : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.customerServiceAgent.count({ where }),
      this.prisma.customerServiceAgent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      code: 0,
      message: "ok",
      data: {
        items: rows.map(mapRowToAgent),
        total
      }
    };
  }

  public async createAgent(body: CreateAgentRequest): Promise<ApiEnvelope<CustomerServiceAgent>> {
    const nickname = body.nickname.trim();
    const wechatId = body.wechatId.trim();
    const avatarUrl = body.avatarUrl.trim();
    const wechatQrUrl = body.wechatQrUrl.trim();

    if (!nickname) return { code: 400, message: "nickname is required", data: null };
    if (!wechatId) return { code: 400, message: "wechatId is required", data: null };
    if (!avatarUrl) return { code: 400, message: "avatarUrl is required", data: null };
    if (!wechatQrUrl) return { code: 400, message: "wechatQrUrl is required", data: null };

    let id = "";
    for (let i = 0; i < 8; i += 1) {
      const candidate = createAgentId();
      const hit = await this.prisma.customerServiceAgent.findUnique({ where: { id: candidate } });
      if (!hit) {
        id = candidate;
        break;
      }
    }
    if (!id) id = createAgentId();

    const row = await this.prisma.customerServiceAgent.create({
      data: {
        id,
        nickname,
        wechatId,
        disabled: false,
        avatarUrl,
        wechatQrUrl
      }
    });

    return {
      code: 0,
      message: "ok",
      data: mapRowToAgent(row)
    };
  }

  public async getAgent(id: string): Promise<ApiEnvelope<CustomerServiceAgent>> {
    const row = await this.prisma.customerServiceAgent.findUnique({ where: { id } });
    if (!row) {
      return { code: 404, message: "agent not found", data: null };
    }
    return { code: 0, message: "ok", data: mapRowToAgent(row) };
  }

  public async updateAgent(
    id: string,
    body: UpdateAgentRequest
  ): Promise<ApiEnvelope<CustomerServiceAgent>> {
    const current = await this.prisma.customerServiceAgent.findUnique({ where: { id } });
    if (!current) {
      return { code: 404, message: "agent not found", data: null };
    }

    const nextNickname = body.nickname?.trim() ? body.nickname.trim() : current.nickname;
    const nextWechatId = body.wechatId?.trim() ? body.wechatId.trim() : current.wechatId;
    const nextAvatar = body.avatarUrl?.trim() ? body.avatarUrl.trim() : current.avatarUrl;
    const nextQr = body.wechatQrUrl?.trim() ? body.wechatQrUrl.trim() : current.wechatQrUrl;
    const nextDisabled = body.disabled !== undefined ? body.disabled : current.disabled;

    const row = await this.prisma.customerServiceAgent.update({
      where: { id },
      data: {
        nickname: nextNickname,
        wechatId: nextWechatId,
        avatarUrl: nextAvatar,
        wechatQrUrl: nextQr,
        disabled: nextDisabled
      }
    });

    return { code: 0, message: "ok", data: mapRowToAgent(row) };
  }

  public async disableAgent(id: string): Promise<ApiEnvelope<{ success: true }>> {
    try {
      await this.prisma.customerServiceAgent.update({
        where: { id },
        data: { disabled: true }
      });
      return { code: 0, message: "ok", data: { success: true } };
    } catch {
      return { code: 404, message: "agent not found", data: null };
    }
  }

  public async enableAgent(id: string): Promise<ApiEnvelope<{ success: true }>> {
    try {
      await this.prisma.customerServiceAgent.update({
        where: { id },
        data: { disabled: false }
      });
      return { code: 0, message: "ok", data: { success: true } };
    } catch {
      return { code: 404, message: "agent not found", data: null };
    }
  }
}

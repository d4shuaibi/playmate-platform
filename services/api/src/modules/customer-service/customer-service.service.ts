import { Injectable } from "@nestjs/common";
import { CustomerServiceAgent } from "./customer-service.types";

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

const normalizeKeyword = (value: string | undefined) => {
  return (value ?? "").trim().toLowerCase();
};

const createAgentId = () => {
  return `CS-${Math.floor(1000 + Math.random() * 9000)}`;
};

@Injectable()
export class CustomerServiceService {
  private readonly agents: CustomerServiceAgent[] = [];

  public listAgents(
    filters: ListFilters
  ): ApiEnvelope<{ items: CustomerServiceAgent[]; total: number }> {
    const keyword = normalizeKeyword(filters.keyword);
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const filtered = this.agents.filter((agent) => {
      if (filters.disabled !== undefined && agent.disabled !== filters.disabled) {
        return false;
      }
      if (!keyword) return true;
      return (
        agent.nickname.toLowerCase().includes(keyword) ||
        agent.id.toLowerCase().includes(keyword) ||
        agent.wechatId.toLowerCase().includes(keyword)
      );
    });

    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      code: 0,
      message: "ok",
      data: {
        items,
        total: filtered.length
      }
    };
  }

  public createAgent(body: CreateAgentRequest): ApiEnvelope<CustomerServiceAgent> {
    const nickname = body.nickname.trim();
    const wechatId = body.wechatId.trim();
    const avatarUrl = body.avatarUrl.trim();
    const wechatQrUrl = body.wechatQrUrl.trim();

    if (!nickname) return { code: 400, message: "nickname is required", data: null };
    if (!wechatId) return { code: 400, message: "wechatId is required", data: null };
    if (!avatarUrl) return { code: 400, message: "avatarUrl is required", data: null };
    if (!wechatQrUrl) return { code: 400, message: "wechatQrUrl is required", data: null };

    const agent: CustomerServiceAgent = {
      id: createAgentId(),
      nickname,
      wechatId,
      disabled: false,
      avatarUrl,
      wechatQrUrl,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    this.agents.unshift(agent);

    return {
      code: 0,
      message: "ok",
      data: agent
    };
  }

  public getAgent(id: string): ApiEnvelope<CustomerServiceAgent> {
    const found = this.agents.find((item) => item.id === id) ?? null;
    if (!found) {
      return { code: 404, message: "agent not found", data: null };
    }
    return { code: 0, message: "ok", data: found };
  }

  public updateAgent(id: string, body: UpdateAgentRequest): ApiEnvelope<CustomerServiceAgent> {
    const index = this.agents.findIndex((item) => item.id === id);
    if (index < 0) {
      return { code: 404, message: "agent not found", data: null };
    }

    const current = this.agents[index];
    const next: CustomerServiceAgent = {
      ...current,
      nickname: body.nickname?.trim() ? body.nickname.trim() : current.nickname,
      wechatId: body.wechatId?.trim() ? body.wechatId.trim() : current.wechatId,
      avatarUrl: body.avatarUrl?.trim() ? body.avatarUrl.trim() : current.avatarUrl,
      wechatQrUrl: body.wechatQrUrl?.trim() ? body.wechatQrUrl.trim() : current.wechatQrUrl,
      disabled: body.disabled !== undefined ? body.disabled : current.disabled
    };
    this.agents[index] = next;

    return { code: 0, message: "ok", data: next };
  }

  public disableAgent(id: string): ApiEnvelope<{ success: true }> {
    const index = this.agents.findIndex((item) => item.id === id);
    if (index < 0) {
      return { code: 404, message: "agent not found", data: null };
    }
    this.agents[index] = {
      ...this.agents[index],
      disabled: true
    };
    return { code: 0, message: "ok", data: { success: true } };
  }

  public enableAgent(id: string): ApiEnvelope<{ success: true }> {
    const index = this.agents.findIndex((item) => item.id === id);
    if (index < 0) {
      return { code: 404, message: "agent not found", data: null };
    }
    this.agents[index] = {
      ...this.agents[index],
      disabled: false
    };
    return { code: 0, message: "ok", data: { success: true } };
  }
}

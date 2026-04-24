import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AdminPermissionGuard } from "../auth/admin-permission.guard";
import { RequireAdminPermissions } from "../auth/admin-permission.decorator";
import { CustomerServiceService } from "./customer-service.service";

@Controller("customer-service")
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class CustomerServiceController {
  constructor(private readonly customerServiceService: CustomerServiceService) {}

  /**
   * GET /api/customer-service/agents?keyword=&disabled=&page=&pageSize=
   * disabled: true | false（不传则不过滤）
   */
  @Get("agents")
  @RequireAdminPermissions("customer_service.read")
  async listAgents(
    @Query("keyword") keyword?: string,
    @Query("disabled") disabled?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.customerServiceService.listAgents({
      keyword: keyword ?? "",
      disabled: disabled === "true" ? true : disabled === "false" ? false : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * POST /api/customer-service/agents
   * Body: { nickname, wechatId, avatarUrl, wechatQrUrl }
   */
  @Post("agents")
  @RequireAdminPermissions("customer_service.write")
  async createAgent(
    @Body()
    body: {
      nickname?: string;
      wechatId?: string;
      avatarUrl?: string;
      wechatQrUrl?: string;
    }
  ) {
    return this.customerServiceService.createAgent({
      nickname: body?.nickname ?? "",
      wechatId: body?.wechatId ?? "",
      avatarUrl: body?.avatarUrl ?? "",
      wechatQrUrl: body?.wechatQrUrl ?? ""
    });
  }

  /**
   * GET /api/customer-service/agents/:id
   */
  @Get("agents/:id")
  @RequireAdminPermissions("customer_service.read")
  async getAgent(@Param("id") id: string) {
    return this.customerServiceService.getAgent(id);
  }

  /**
   * PATCH /api/customer-service/agents/:id
   */
  @Patch("agents/:id")
  @RequireAdminPermissions("customer_service.write")
  async updateAgent(
    @Param("id") id: string,
    @Body()
    body: {
      nickname?: string;
      wechatId?: string;
      avatarUrl?: string;
      wechatQrUrl?: string;
      disabled?: boolean;
    }
  ) {
    return this.customerServiceService.updateAgent(id, body);
  }

  /**
   * PATCH /api/customer-service/agents/:id/disable
   */
  @Patch("agents/:id/disable")
  @RequireAdminPermissions("customer_service.write")
  async disableAgent(@Param("id") id: string) {
    return this.customerServiceService.disableAgent(id);
  }

  /**
   * PATCH /api/customer-service/agents/:id/enable
   */
  @Patch("agents/:id/enable")
  @RequireAdminPermissions("customer_service.write")
  async enableAgent(@Param("id") id: string) {
    return this.customerServiceService.enableAgent(id);
  }
}

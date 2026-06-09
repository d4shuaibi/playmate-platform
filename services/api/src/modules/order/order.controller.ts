import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AdminPermissionGuard } from "../auth/admin-permission.guard";
import { RequireAdminPermissions } from "../auth/admin-permission.decorator";
import { OrderStatus } from "./order.types";
import { OrderService } from "./order.service";

@Controller("orders")
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * GET /api/orders?keyword=&status=&page=&pageSize=
   */
  @Get()
  @RequireAdminPermissions("order.read")
  async list(
    @Query("keyword") keyword?: string,
    @Query("status") status?: OrderStatus,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.orderService.listOrders({
      keyword: keyword ?? "",
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * GET /api/orders/:id
   */
  @Get(":id")
  @RequireAdminPermissions("order.read")
  async detail(@Param("id") id: string) {
    return this.orderService.getOrder(id);
  }

  /**
   * POST /api/orders/:id/refund/approve  通过退款申请（退款 + 取消订单）
   */
  @Post(":id/refund/approve")
  @RequireAdminPermissions("order.write")
  async approveRefund(@Param("id") id: string) {
    return this.orderService.approveRefundAdmin(id);
  }

  /**
   * POST /api/orders/:id/refund/reject  驳回退款申请
   */
  @Post(":id/refund/reject")
  @RequireAdminPermissions("order.write")
  async rejectRefund(@Param("id") id: string) {
    return this.orderService.rejectRefundAdmin(id);
  }
}

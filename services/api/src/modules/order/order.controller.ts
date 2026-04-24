import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
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
}

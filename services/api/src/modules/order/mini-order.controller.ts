import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import type { Request } from "express";
import { MiniAuthGuard } from "../auth/mini-auth.guard";
import type { MiniAccessPayload } from "../auth/mini-auth.guard";
import { OrderStatus } from "./order.types";
import { OrderService } from "./order.service";

type RequestWithMini = Request & { miniAuth?: MiniAccessPayload };

/**
 * 小程序订单：列表（含 Tab 统计）、创建、详情、申请退款。
 * 路径前缀：`/api/mini/orders`
 */
@Controller("mini/orders")
@UseGuards(MiniAuthGuard)
export class MiniOrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * GET /api/mini/orders?keyword=&status=&page=&pageSize=
   */
  @Get()
  async list(
    @Req() req: RequestWithMini,
    @Query("keyword") keyword?: string,
    @Query("status") status?: OrderStatus,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const userId = req.miniAuth?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.orderService.listMiniOrders(userId, {
      keyword: keyword ?? "",
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * POST /api/mini/orders  body: `{ productId: string }`
   */
  @Post()
  async create(@Req() req: RequestWithMini, @Body() body: { productId?: string }) {
    const userId = req.miniAuth?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.orderService.createMiniOrder(userId, body.productId ?? "");
  }

  /**
   * GET /api/mini/orders/:id
   */
  @Get(":id")
  async detail(@Req() req: RequestWithMini, @Param("id") id: string) {
    const userId = req.miniAuth?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.orderService.getMiniOrder(userId, id);
  }

  /**
   * POST /api/mini/orders/:id/refund
   */
  @Post(":id/refund")
  async refund(@Req() req: RequestWithMini, @Param("id") id: string) {
    const userId = req.miniAuth?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.orderService.requestRefundMini(userId, id);
  }

  /**
   * POST /api/mini/orders/:id/confirm-close  老板确认结单（pendingDone → done）
   */
  @Post(":id/confirm-close")
  async confirmCloseOrder(@Req() req: RequestWithMini, @Param("id") id: string) {
    const userId = req.miniAuth?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.orderService.confirmCloseOrderMini(userId, id);
  }
}

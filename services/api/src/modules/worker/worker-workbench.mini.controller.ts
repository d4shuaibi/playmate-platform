import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import type { Request } from "express";
import { MiniAuthGuard } from "../auth/mini-auth.guard";
import type { MiniAccessPayload } from "../auth/mini-auth.guard";
import { WorkerRoleGuard } from "../auth/worker-role.guard";
import { WorkerOrderBucket } from "../order/order.types";
import { OrderService } from "../order/order.service";
import { WorkerPresenceMode, WorkerPresenceService } from "./worker-presence.service";

type RequestWithMini = Request & { miniAuth?: MiniAccessPayload };

/**
 * 打手端工作台 / 订单执行。
 * 前缀：`/api/worker/*`，需登录且 `role=worker`。
 */
@Controller("worker")
@UseGuards(MiniAuthGuard, WorkerRoleGuard)
export class WorkerWorkbenchMiniController {
  constructor(
    private readonly orderService: OrderService,
    private readonly presenceService: WorkerPresenceService
  ) {}

  /**
   * GET /api/worker/workbench
   */
  @Get("workbench")
  async workbench(@Req() req: RequestWithMini) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    const mode = this.presenceService.getMode(workerId);
    return this.orderService.getWorkerWorkbench(workerId, mode);
  }

  /**
   * PATCH /api/worker/presence  body: `{ mode: "online" | "rest" }`
   */
  @Patch("presence")
  async presence(@Req() req: RequestWithMini, @Body() body: { mode?: WorkerPresenceMode }) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    const next =
      body?.mode === "online"
        ? ("online" satisfies WorkerPresenceMode)
        : ("rest" satisfies WorkerPresenceMode);
    const saved = this.presenceService.setMode(workerId, next);
    return { code: 0, message: "ok", data: { mode: saved } };
  }

  /**
   * GET /api/worker/orders?bucket=processing|completed|all&page=&pageSize=
   */
  @Get("orders")
  async listOrders(
    @Req() req: RequestWithMini,
    @Query("bucket") bucket?: WorkerOrderBucket,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    return this.orderService.listWorkerOrders(workerId, {
      bucket: bucket ?? "all",
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * GET /api/worker/orders/:id
   */
  @Get("orders/:id")
  async detail(@Req() req: RequestWithMini, @Param("id") id: string) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    return this.orderService.getWorkerOrder(workerId, id);
  }

  /**
   * POST /api/worker/orders/:id/start  接单并开始执行
   */
  @Post("orders/:id/start")
  async start(@Req() req: RequestWithMini, @Param("id") id: string) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    return this.orderService.startWorkerOrder(workerId, id);
  }

  /**
   * POST /api/worker/orders/:id/complete  打手确认完成（进入待老板验收）
   */
  @Post("orders/:id/complete")
  async complete(@Req() req: RequestWithMini, @Param("id") id: string) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    return this.orderService.workerConfirmComplete(workerId, id);
  }
}

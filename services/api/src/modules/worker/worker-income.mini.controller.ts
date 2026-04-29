import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import type { Request } from "express";
import { MiniAuthGuard } from "../auth/mini-auth.guard";
import type { MiniAccessPayload } from "../auth/mini-auth.guard";
import { WorkerRoleGuard } from "../auth/worker-role.guard";
import { WorkerIncomeService } from "./worker-income.service";

type RequestWithMini = Request & { miniAuth?: MiniAccessPayload };

/**
 * 打手收益：月汇总、流水分页、明细（数据派生自承接订单）。
 * 前缀：`/api/worker/income/*`
 */
@Controller("worker/income")
@UseGuards(MiniAuthGuard, WorkerRoleGuard)
export class WorkerIncomeMiniController {
  constructor(private readonly workerIncomeService: WorkerIncomeService) {}

  /**
   * GET /api/worker/income/summary?yearMonth=YYYY-MM
   */
  @Get("summary")
  async summary(@Req() req: RequestWithMini, @Query("yearMonth") yearMonth?: string) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    return this.workerIncomeService.getSummary(workerId, yearMonth);
  }

  /**
   * GET /api/worker/income/months  最近 12 个月已结算汇总（用于核对）
   */
  @Get("months")
  async months(@Req() req: RequestWithMini) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    return this.workerIncomeService.listMonthBuckets(workerId);
  }

  /**
   * GET /api/worker/income/ledger?yearMonth=&keyword=&page=&pageSize=
   */
  @Get("ledger")
  async ledger(
    @Req() req: RequestWithMini,
    @Query("yearMonth") yearMonth?: string,
    @Query("keyword") keyword?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    return this.workerIncomeService.listLedger(workerId, {
      yearMonth: yearMonth ?? "",
      keyword: keyword ?? "",
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * GET /api/worker/income/ledger/:orderId
   */
  @Get("ledger/:orderId")
  async ledgerDetail(@Req() req: RequestWithMini, @Param("orderId") orderId: string) {
    const workerId = req.miniAuth?.sub;
    if (!workerId) throw new UnauthorizedException();
    return this.workerIncomeService.getLedgerDetail(workerId, orderId);
  }
}

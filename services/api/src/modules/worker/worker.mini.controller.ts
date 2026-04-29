import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { MiniAuthGuard } from "../auth/mini-auth.guard";
import { type MiniAccessPayload } from "../auth/mini-auth.guard";
import { WorkerService } from "./worker.service";

type RequestWithMini = {
  miniAuth?: MiniAccessPayload;
};

@Controller("mini/worker-join")
export class WorkerMiniController {
  constructor(private readonly workerService: WorkerService) {}

  /**
   * GET /api/mini/worker-join/assessment-options
   * 入驻考核类型（无需登录，与提交接口校验同源）
   */
  @Get("assessment-options")
  listAssessmentOptions() {
    return this.workerService.listAssessmentOptions();
  }

  /**
   * GET /api/mini/worker-join/progress
   * 返回当前登录用户的入驻申请状态（无申请返回 null）
   */
  @Get("progress")
  @UseGuards(MiniAuthGuard)
  async getProgress(@Req() req: RequestWithMini) {
    const userId = req.miniAuth?.sub ?? "";
    return this.workerService.getApplicationByUserId(userId);
  }

  /**
   * POST /api/mini/worker-join/apply
   */
  @Post("apply")
  @UseGuards(MiniAuthGuard)
  async apply(
    @Req() req: RequestWithMini,
    @Body()
    body: {
      realName?: string;
      age?: number;
      phone?: string;
      idNo?: string;
      assessmentType?: unknown;
    }
  ) {
    const userId = req.miniAuth?.sub ?? "";
    return this.workerService.submitApplication({
      userId,
      realName: body?.realName ?? "",
      age: Number(body?.age),
      phone: body?.phone ?? "",
      idNo: body?.idNo ?? "",
      assessmentType: body?.assessmentType
    });
  }
}

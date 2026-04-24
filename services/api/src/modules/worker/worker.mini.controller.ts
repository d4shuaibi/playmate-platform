import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { MiniAuthGuard } from "../auth/mini-auth.guard";
import { type MiniAccessPayload } from "../auth/mini-auth.guard";
import { type WorkerAssessmentType } from "./worker.types";
import { WorkerService } from "./worker.service";

type RequestWithMini = {
  miniAuth?: MiniAccessPayload;
};

@Controller("mini/worker-join")
@UseGuards(MiniAuthGuard)
export class WorkerMiniController {
  constructor(private readonly workerService: WorkerService) {}

  /**
   * GET /api/mini/worker-join/progress
   * 返回当前登录用户的入驻申请状态（无申请返回 null）
   */
  @Get("progress")
  async getProgress(@Req() req: RequestWithMini) {
    const userId = req.miniAuth?.sub ?? "";
    return this.workerService.getApplicationByUserId(userId);
  }

  /**
   * POST /api/mini/worker-join/apply
   */
  @Post("apply")
  async apply(
    @Req() req: RequestWithMini,
    @Body()
    body: {
      realName: string;
      age: number;
      phone: string;
      idNo: string;
      assessmentType: WorkerAssessmentType;
    }
  ) {
    const userId = req.miniAuth?.sub ?? "";
    return this.workerService.submitApplication({
      userId,
      realName: body?.realName,
      age: Number(body?.age),
      phone: body?.phone,
      idNo: body?.idNo,
      assessmentType: body?.assessmentType
    });
  }
}

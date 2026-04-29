import { Controller, Get, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { MiniAuthGuard } from "../auth/mini-auth.guard";
import type { MiniAccessPayload } from "../auth/mini-auth.guard";
import { MiniMeService } from "./mini-me.service";

type RequestWithMini = Request & { miniAuth?: MiniAccessPayload };

/**
 * 小程序「我的」聚合：资料、余额、订单统计。
 * GET /api/mini/me（需登录）
 */
@Controller("mini/me")
@UseGuards(MiniAuthGuard)
export class MiniMeController {
  constructor(private readonly miniMeService: MiniMeService) {}

  @Get()
  async getMe(@Req() req: RequestWithMini) {
    const userId = req.miniAuth?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.miniMeService.getMe(userId);
  }
}

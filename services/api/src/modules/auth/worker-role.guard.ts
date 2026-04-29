import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { MiniAccessPayload } from "./mini-auth.guard";

type RequestWithMini = Request & { miniAuth?: MiniAccessPayload };

/**
 * 仅允许 JWT `role === "worker"` 访问（需已在 MiniAuthGuard 之后挂载）。
 */
@Injectable()
export class WorkerRoleGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithMini>();
    if (request.miniAuth?.role !== "worker") {
      throw new ForbiddenException("worker role required");
    }
    return true;
  }
}

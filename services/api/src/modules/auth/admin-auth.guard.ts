import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { type Request } from "express";
import { AdminAuthService } from "./admin-auth.service";
import { type AdminAccessPayload } from "./admin-auth.types";

type RequestWithAdmin = Request & {
  adminAuth?: AdminAccessPayload;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const authorization = request.headers?.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    request.adminAuth = this.adminAuthService.parseAccessToken(token);
    return true;
  }
}

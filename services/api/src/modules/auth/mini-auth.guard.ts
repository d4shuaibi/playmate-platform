import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { type Request } from "express";
import { AuthTokenService } from "./auth-token.service";

export type MiniAccessPayload = {
  sub: string;
  role: "user" | "worker";
  typ: "access";
  iat?: number;
  exp?: number;
};

type RequestWithMini = Request & {
  miniAuth?: MiniAccessPayload;
};

@Injectable()
export class MiniAuthGuard implements CanActivate {
  constructor(private readonly tokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithMini>();
    const authorization = request.headers?.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }
    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }
    request.miniAuth = this.tokenService.verifyAccessToken(token);
    return true;
  }
}

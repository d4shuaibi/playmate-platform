import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { type Request } from "express";
import { ADMIN_PERMISSION_KEY } from "./admin-permission.decorator";
import { type AdminAccessPayload, type AdminPermission } from "./admin-auth.types";

type RequestWithAdmin = Request & {
  adminAuth?: AdminAccessPayload;
};

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminPermission[]>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const currentPermissions = request.adminAuth?.permissions ?? [];
    const granted = required.every((permission) => currentPermissions.includes(permission));
    if (!granted) {
      throw new ForbiddenException("Permission denied");
    }
    return true;
  }
}

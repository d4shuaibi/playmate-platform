import { SetMetadata } from "@nestjs/common";
import { type AdminPermission } from "./admin-auth.types";

export const ADMIN_PERMISSION_KEY = "admin:permissions";
export const RequireAdminPermissions = (...permissions: AdminPermission[]) => {
  return SetMetadata(ADMIN_PERMISSION_KEY, permissions);
};

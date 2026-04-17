export type AdminRole = "owner" | "admin" | "customer_service";

export type AdminPermission =
  | "system_overview.view"
  | "admin.manage"
  | "dashboard.view"
  | "product.read"
  | "product.write"
  | "order.read"
  | "order.dispatch"
  | "order.write"
  | "worker.read"
  | "worker.audit"
  | "worker.write"
  | "customer_service.read"
  | "customer_service.write"
  | "settings.read"
  | "settings.write";

export type AdminAccount = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: AdminRole;
  permissions: AdminPermission[];
  status: "active" | "disabled";
  createdAt: string;
};

export type AdminAccessPayload = {
  sub: string;
  role: AdminRole;
  permissions: AdminPermission[];
  typ: "admin_access";
  iat?: number;
  exp?: number;
};

export type AdminRefreshPayload = {
  sub: string;
  role: AdminRole;
  permissions: AdminPermission[];
  typ: "admin_refresh";
  iat?: number;
  exp?: number;
};

export type AdminAuthProfile = {
  username: string;
  displayName: string;
  role: AdminRole;
  permissions: AdminPermission[];
};

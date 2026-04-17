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

export type ApiEnvelope<TData> = {
  code: number;
  message: string;
  data: TData | null;
};

export type AdminAuthProfile = {
  username: string;
  displayName: string;
  role: AdminRole;
  permissions: AdminPermission[];
};

export type AdminAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  profile: AdminAuthProfile;
};

export type AdminAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: AdminAuthProfile;
  remember: boolean;
};

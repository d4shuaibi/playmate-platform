import { type AdminAuthProfile, type AdminAuthSession, type AdminPermission } from "./types";

const ADMIN_AUTH_SESSION_KEY = "playmate_admin_auth_session";

const getStorage = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export const getAdminAuthSession = () => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(ADMIN_AUTH_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminAuthSession;
  } catch {
    storage.removeItem(ADMIN_AUTH_SESSION_KEY);
    return null;
  }
};

export const setAdminAuthSession = (session: AdminAuthSession) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(ADMIN_AUTH_SESSION_KEY, JSON.stringify(session));
};

export const clearAdminAuthSession = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(ADMIN_AUTH_SESSION_KEY);
};

export const isAdminAccessExpired = (session: AdminAuthSession) => {
  return Date.now() >= session.expiresAt;
};

export const hasAdminPermission = (permission: AdminPermission) => {
  const session = getAdminAuthSession();
  if (!session) return false;
  return session.profile.permissions.includes(permission);
};

export const getAdminDefaultPath = (profile: AdminAuthProfile | null | undefined) => {
  if (!profile) return "/login";

  const navOrder: Array<{
    path: string;
    permission?: AdminPermission;
    roles?: AdminAuthProfile["role"][];
  }> = [
    { path: "/system-overview", permission: "system_overview.view" },
    { path: "/admin-management", permission: "admin.manage", roles: ["owner"] },
    { path: "/home", permission: "dashboard.view" },
    { path: "/customer-service-management", permission: "customer_service.write" }
  ];

  const matched = navOrder.find((item) => {
    if (item.roles && !item.roles.includes(profile.role)) return false;
    if (item.permission && !profile.permissions.includes(item.permission)) return false;
    return true;
  });

  return matched?.path ?? "/home";
};

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Result, Spin } from "antd";
import {
  clearAdminAuthSession,
  getAdminAuthSession,
  hasAdminPermission,
  isAdminAccessExpired,
  setAdminAuthSession
} from "../../services/auth/session";
import { requestAdminMe, requestAdminRefresh } from "../../services/auth/api";
import { type AdminPermission, type AdminRole } from "../../services/auth/types";

type AuthStatus = "checking" | "authed" | "guest";

export const RequireAdminAuth = () => {
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    void (async () => {
      const session = getAdminAuthSession();
      if (!session) {
        setStatus("guest");
        return;
      }

      try {
        if (isAdminAccessExpired(session)) {
          const refreshed = await requestAdminRefresh(session.refreshToken);
          setAdminAuthSession({
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            expiresAt: Date.now() + refreshed.expiresIn * 1000,
            profile: refreshed.profile,
            remember: session.remember
          });
        } else {
          await requestAdminMe(session.accessToken);
        }
        setStatus("authed");
      } catch {
        clearAdminAuthSession();
        setStatus("guest");
      }
    })();
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Spin size="large" />
      </div>
    );
  }
  if (status === "guest") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export const RequireAdminPermission = (props: {
  permission: AdminPermission;
  children: ReactNode;
}) => {
  const canAccess = useMemo(() => {
    return hasAdminPermission(props.permission);
  }, [props.permission]);

  if (!canAccess) {
    return (
      <div className="p-8">
        <Result status="403" title="403" subTitle="当前账号无此页面权限，请联系管理员开通。" />
      </div>
    );
  }
  return props.children;
};

export const RequireAdminRole = (props: { role: AdminRole; children: ReactNode }) => {
  const currentRole = getAdminAuthSession()?.profile.role;
  if (currentRole !== props.role) {
    return (
      <div className="p-8">
        <Result status="403" title="403" subTitle="该页面仅管理员可访问。" />
      </div>
    );
  }
  return props.children;
};

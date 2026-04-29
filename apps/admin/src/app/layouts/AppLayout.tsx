import {
  AppstoreOutlined,
  NotificationOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserSwitchOutlined
} from "@ant-design/icons";
import { type ReactNode } from "react";
import { Badge, Button, Input, Tag, Typography } from "antd";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { appEnv } from "../../config/env";
import { clearAdminAuthSession, getAdminAuthSession } from "../../services/auth/session";
import { requestAdminLogout } from "../../services/auth/api";
import { type AdminPermission, type AdminRole } from "../../services/auth/types";

type NavItem = {
  key: string;
  label: string;
  icon: ReactNode;
  path?: string;
  permission?: AdminPermission;
  role?: AdminRole;
};

export const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAdminAuthSession();
  const permissions = session?.profile.permissions ?? [];

  const navItems: NavItem[] = [
    {
      key: "adminManagement",
      label: "管理员管理",
      icon: <SafetyCertificateOutlined />,
      path: "/admin-management",
      permission: "admin.manage",
      role: "owner"
    },
    {
      key: "products",
      label: "商品管理",
      icon: <AppstoreOutlined />,
      path: "/product-management",
      permission: "product.read"
    },
    {
      key: "productCategoryManagement",
      label: "商品大类管理",
      icon: <AppstoreOutlined />,
      path: "/product-category-management",
      permission: "product.write"
    },
    {
      key: "orders",
      label: "订单管理",
      icon: <ShoppingCartOutlined />,
      path: "/order-management",
      permission: "order.read"
    },
    {
      key: "workers",
      label: "打手管理",
      icon: <TeamOutlined />,
      path: "/worker-management",
      permission: "worker.read"
    },
    {
      key: "customerServiceManagement",
      label: "客服管理",
      icon: <UserSwitchOutlined />,
      path: "/customer-service-management",
      permission: "customer_service.write"
    }
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (item.role && session?.profile.role !== item.role) return false;
    if (!item.permission) return true;
    return permissions.includes(item.permission);
  });

  const handleLogout = () => {
    const refreshToken = session?.refreshToken;
    if (refreshToken) {
      void requestAdminLogout(refreshToken);
    }
    clearAdminAuthSession();
    void navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-200/70 bg-slate-50 p-4">
        <div className="mb-4 flex items-center gap-3 px-2 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-white">
            <AppstoreOutlined />
          </div>
          <div>
            <Typography.Title level={5} className="!mb-0">
              Game Services
            </Typography.Title>
            <Typography.Text className="!text-[10px] !uppercase !tracking-widest !text-slate-500">
              Management Console
            </Typography.Text>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleNavItems.map((item) => {
            const isActive = Boolean(item.path) && location.pathname === item.path;
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-l font-medium transition-all ${
                  isActive
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/60 bg-slate-50/80 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <Typography.Title level={4} className="!mb-0 !text-slate-900">
              {appEnv.appName}
            </Typography.Title>
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="搜索订单、商品或用户..."
              className="!w-72 !rounded-full !border-slate-200 !bg-white/70"
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge dot>
              <Button type="text" shape="circle" icon={<NotificationOutlined />} />
            </Badge>
            <Tag
              color={
                session?.profile.role === "owner"
                  ? "gold"
                  : session?.profile.role === "admin"
                    ? "blue"
                    : "default"
              }
            >
              {session?.profile.role === "owner"
                ? "老板"
                : session?.profile.role === "admin"
                  ? "管理员"
                  : "客服"}
            </Tag>
            <Typography.Text className="!text-slate-600">
              {session?.profile.displayName ?? appEnv.appEnv}
            </Typography.Text>
            <Button size="small" onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1280px] p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

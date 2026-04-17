import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LoginPage } from "../pages/LoginPage";
import { RequireAdminAuth, RequireAdminPermission, RequireAdminRole } from "./guards/AdminGuards";
import { SystemOverviewPage } from "../pages/SystemOverviewPage";
import { CustomerServiceManagementPage } from "../pages/CustomerServiceManagementPage";
import { AdminManagementPage } from "../pages/AdminManagementPage";
import { getAdminAuthSession, getAdminDefaultPath } from "../services/auth/session";

const NavigateToDefaultPage = () => {
  const session = getAdminAuthSession();
  return <Navigate to={getAdminDefaultPath(session?.profile)} replace />;
};

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAdminAuth />}>
        <Route path="/" element={<NavigateToDefaultPage />} />
        <Route element={<AppLayout />}>
          <Route
            path="/home"
            element={
              <RequireAdminPermission permission="dashboard.view">
                <HomePage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/system-overview"
            element={
              <RequireAdminPermission permission="system_overview.view">
                <SystemOverviewPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/customer-service-management"
            element={
              <RequireAdminPermission permission="customer_service.write">
                <CustomerServiceManagementPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/admin-management"
            element={
              <RequireAdminRole role="owner">
                <RequireAdminPermission permission="admin.manage">
                  <AdminManagementPage />
                </RequireAdminPermission>
              </RequireAdminRole>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

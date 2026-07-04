import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LoginPage } from "../pages/LoginPage";
import { RequireAdminAuth, RequireAdminPermission, RequireAdminRole } from "./guards/AdminGuards";
import { CustomerServiceManagementPage } from "../pages/customer-service-management/CustomerServiceManagementPage";
import { CreateCustomerServicePage } from "../pages/customer-service-management/CreateCustomerServicePage";
import { EditCustomerServicePage } from "../pages/customer-service-management/EditCustomerServicePage";
import { AdminManagementPage } from "../pages/admin-management/AdminManagementPage";
import { ProductCategoryManagementPage } from "../pages/product-category-management/ProductCategoryManagementPage";
import { CreateProductCategoryPage } from "../pages/product-category-management/CreateProductCategoryPage";
import { ProductManagementPage } from "../pages/product-management/ProductManagementPage";
import { CreateProductPage } from "../pages/product-management/CreateProductPage";
import { EditProductPage } from "../pages/product-management/EditProductPage";
import { OrderManagementPage } from "../pages/order-management/OrderManagementPage";
import { OrderDetailPage } from "../pages/order-management/OrderDetailPage";
import { WorkerManagementPage } from "../pages/worker-management/WorkerManagementPage";
import { EditWorkerPage } from "../pages/worker-management/EditWorkerPage";
import { BannerManagementPage } from "../pages/banner-management/BannerManagementPage";
import { CreateBannerPage } from "../pages/banner-management/CreateBannerPage";
import { EditBannerPage } from "../pages/banner-management/EditBannerPage";
import { NoticeManagementPage } from "../pages/notice-management/NoticeManagementPage";
import { CreateNoticePage } from "../pages/notice-management/CreateNoticePage";
import { EditNoticePage } from "../pages/notice-management/EditNoticePage";
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
            path="/customer-service-management"
            element={
              <RequireAdminPermission permission="customer_service.write">
                <CustomerServiceManagementPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/customer-service-management/create"
            element={
              <RequireAdminPermission permission="customer_service.write">
                <CreateCustomerServicePage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/customer-service-management/edit/:id"
            element={
              <RequireAdminPermission permission="customer_service.write">
                <EditCustomerServicePage />
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
          <Route
            path="/product-category-management"
            element={
              <RequireAdminPermission permission="product.write">
                <ProductCategoryManagementPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/product-category-management/create"
            element={
              <RequireAdminPermission permission="product.write">
                <CreateProductCategoryPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/product-management"
            element={
              <RequireAdminPermission permission="product.write">
                <ProductManagementPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/product-management/create"
            element={
              <RequireAdminPermission permission="product.write">
                <CreateProductPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/product-management/edit/:id"
            element={
              <RequireAdminPermission permission="product.write">
                <EditProductPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/order-management"
            element={
              <RequireAdminPermission permission="order.read">
                <OrderManagementPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/order-management/detail/:id"
            element={
              <RequireAdminPermission permission="order.read">
                <OrderDetailPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/worker-management"
            element={
              <RequireAdminPermission permission="worker.read">
                <WorkerManagementPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/worker-management/edit/:id"
            element={
              <RequireAdminPermission permission="worker.write">
                <EditWorkerPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/banner-management"
            element={
              <RequireAdminPermission permission="product.write">
                <BannerManagementPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/banner-management/create"
            element={
              <RequireAdminPermission permission="product.write">
                <CreateBannerPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/banner-management/edit/:id"
            element={
              <RequireAdminPermission permission="product.write">
                <EditBannerPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/notice-management"
            element={
              <RequireAdminPermission permission="product.write">
                <NoticeManagementPage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/notice-management/create"
            element={
              <RequireAdminPermission permission="product.write">
                <CreateNoticePage />
              </RequireAdminPermission>
            }
          />
          <Route
            path="/notice-management/edit/:id"
            element={
              <RequireAdminPermission permission="product.write">
                <EditNoticePage />
              </RequireAdminPermission>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

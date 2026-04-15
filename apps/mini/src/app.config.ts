export default defineAppConfig({
  lazyCodeLoading: "requiredComponents",
  pages: [
    "pages/home-user/index",
    "pages/home-worker/index",
    "pages/category/index",
    "pages/goods-detail/index",
    "pages/customer-service/index",
    "pages/orders/index",
    "pages/order-detail/index",
    "pages/worker-orders/index",
    "pages/worker-order-detail/index",
    "pages/income/index",
    "pages/worker-income-history/index",
    "pages/worker-income-detail/index",
    "pages/me/index",
    "pages/agreement/index",
    "pages/blank/index"
  ],
  window: {
    backgroundTextStyle: "light",
    backgroundColor: "#0b0c10",
    backgroundColorContent: "#0b0c10",
    backgroundColorTop: "#0b0c10",
    backgroundColorBottom: "#0b0c10",
    navigationBarBackgroundColor: "#0b0c10",
    navigationBarTitleText: "Playmate",
    navigationBarTextStyle: "white"
  }
});

import { request } from "./http";
import { apiPaths } from "./api-paths";

/** 与后端 `OrderStatus` 对齐 */
export type MiniOrderStatus =
  | "pendingPay"
  | "pendingTake"
  | "serving"
  | "pendingDone"
  | "done"
  | "cancelled";

export type MiniRefundStatus = "none" | "pending" | "approved" | "rejected";

export type MiniOrderProgressStep = {
  key: "pendingTake" | "serving" | "pendingDone" | "done";
  label: string;
  done: boolean;
};

export type MiniOrderDeliveryItem = {
  id: string;
  text: string;
  done: boolean;
};

/** 小程序订单行（与后端 Order 一致） */
export type MiniOrder = {
  id: string;
  orderNo: string;
  status: MiniOrderStatus;
  packageTag: string;
  serviceTitle: string;
  amount: number;
  quantityText: string;
  coverImage: string;
  createdAt: string;
  payMethod: string;
  paidAmount: number;
  progress: MiniOrderProgressStep[];
  deliveries: MiniOrderDeliveryItem[];
  createdBy: string;
  userId: string;
  productId: string;
  refundStatus: MiniRefundStatus;
  assignedWorkerId: string;
  assignedAt: string;
  completedAt: string;
  /** 微信支付单号（若有） */
  wxTransactionId?: string;
};

export type MiniOrderTabCounts = {
  all: number;
  pendingPay: number;
  pendingTake: number;
  serving: number;
  pendingDone: number;
  cancelled: number;
  refundAfterSale: number;
};

const EMPTY_TAB_COUNTS: MiniOrderTabCounts = {
  all: 0,
  pendingPay: 0,
  pendingTake: 0,
  serving: 0,
  pendingDone: 0,
  cancelled: 0,
  refundAfterSale: 0
};

export type FetchMiniOrdersParams = {
  keyword?: string;
  status?: MiniOrderStatus;
  page?: number;
  pageSize?: number;
};

/**
 * 拉取当前登录用户订单列表；同一响应内携带各 Tab 订单数量。
 */
export const fetchMiniOrders = async (
  params?: FetchMiniOrdersParams
): Promise<{ items: MiniOrder[]; total: number; counts: MiniOrderTabCounts }> => {
  const search = new URLSearchParams();
  if (params?.keyword?.trim()) search.set("keyword", params.keyword.trim());
  if (params?.status) search.set("status", params.status);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.pageSize != null) search.set("pageSize", String(params.pageSize));
  const query = search.toString();
  const path = query ? `${apiPaths.miniOrders}?${query}` : apiPaths.miniOrders;
  const res = await request<{ items: MiniOrder[]; total: number; counts: MiniOrderTabCounts }>(
    path
  );
  const counts = res.data.counts ?? EMPTY_TAB_COUNTS;
  return { items: res.data.items ?? [], total: res.data.total ?? 0, counts };
};

/** 订单详情（需登录且仅能查看本人订单） */
export const fetchMiniOrderDetail = async (orderId: string): Promise<MiniOrder> => {
  const res = await request<MiniOrder>(`${apiPaths.miniOrders}/${encodeURIComponent(orderId)}`);
  return res.data;
};

/** 创建订单（待付款），返回完整订单 */
export const createMiniOrder = async (productId: string): Promise<MiniOrder> => {
  const res = await request<MiniOrder>(apiPaths.miniOrders, {
    method: "POST",
    body: { productId }
  });
  return res.data;
};

/** 申请退款 */
export const requestMiniOrderRefund = async (orderId: string): Promise<{ success: true }> => {
  const res = await request<{ success: true }>(
    `${apiPaths.miniOrders}/${encodeURIComponent(orderId)}/refund`,
    { method: "POST" }
  );
  return res.data;
};

/** 老板确认结单（陪玩服务场景：pendingDone → done） */
export const confirmMiniOrderClose = async (orderId: string): Promise<MiniOrder> => {
  const res = await request<MiniOrder>(
    `${apiPaths.miniOrders}/${encodeURIComponent(orderId)}/confirm-close`,
    { method: "POST" }
  );
  return res.data;
};

/** POST /api/mini/orders/:id/wechat-prepay */
export type MiniWechatPrepayResult =
  | { mockPaid: true }
  | {
      mockPaid: false;
      payment: {
        timeStamp: string;
        nonceStr: string;
        package: string;
        signType: "RSA";
        paySign: string;
      };
    };

/**
 * 微信支付预下单：未配置商户或 WECHAT_PAY_DEV_SIMULATE 时为模拟支付成功。
 */
export const requestMiniWechatPrepay = async (orderId: string): Promise<MiniWechatPrepayResult> => {
  const res = await request<MiniWechatPrepayResult>(
    `${apiPaths.miniOrders}/${encodeURIComponent(orderId)}/wechat-prepay`,
    { method: "POST" }
  );
  return res.data;
};

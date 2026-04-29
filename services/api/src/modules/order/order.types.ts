export type OrderStatus =
  | "pendingPay"
  | "pendingTake"
  | "serving"
  | "pendingDone"
  | "done"
  | "cancelled";

export type OrderProgressStep = {
  key: "pendingTake" | "serving" | "pendingDone" | "done";
  label: string;
  done: boolean;
};

export type OrderDeliveryItem = {
  id: string;
  text: string;
  done: boolean;
};

/** 退款申请状态（业务闭环，非微信支付真实退款） */
export type RefundStatus = "none" | "pending" | "approved" | "rejected";

export type Order = {
  id: string;
  orderNo: string;
  status: OrderStatus;
  packageTag: string;
  serviceTitle: string;
  amount: number;
  quantityText: string;
  coverImage: string;
  createdAt: string;
  payMethod: string;
  paidAmount: number;
  progress: OrderProgressStep[];
  deliveries: OrderDeliveryItem[];
  createdBy: string;
  /** 下单用户（小程序 JWT sub）；种子订单可为空串 */
  userId: string;
  /** 来源商品 ID */
  productId: string;
  refundStatus: RefundStatus;
  /** 接单打手用户 ID（JWT sub）；空串表示未分配 */
  assignedWorkerId: string;
  /** 打手接单时间展示文案；未接单为空串 */
  assignedAt: string;
  /** 订单完成时间 ISO8601（老板确认结单后）；未完成为空串 */
  completedAt: string;
};

/** 打手端订单 Tab：进行中（含待验收） / 已完成 */
export type WorkerOrderBucket = "processing" | "completed" | "all";

/** 打手侧视角阶段（与老板端 OrderStatus 映射） */
export type WorkerOrderStage = "pool" | "serving" | "pending_done" | "done";

/** 小程序订单 Tab 数量统计（不含「已完成」独立 Tab） */
export type MiniOrderTabCounts = {
  all: number;
  pendingPay: number;
  pendingTake: number;
  serving: number;
  pendingDone: number;
  cancelled: number;
  /** 退款/售后（退款申请中或已通过） */
  refundAfterSale: number;
};

/** 打手端订单列表 Tab 数量 */
export type WorkerOrderTabCounts = {
  processing: number;
  completed: number;
  all: number;
};

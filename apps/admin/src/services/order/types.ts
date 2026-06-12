export type OrderStatus =
  | "pendingPay"
  | "pendingTake"
  | "serving"
  | "pendingDone"
  | "done"
  | "cancelled";

export type RefundStatus = "none" | "pending" | "approved" | "rejected";

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

export type Order = {
  id: string;
  orderNo: string;
  status: OrderStatus;
  refundStatus: RefundStatus;
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
  /** 下单用户展示名（昵称，无昵称回退脱敏手机号）；为空串时仅展示 id */
  creatorName: string;
  assignedWorkerId: string;
};

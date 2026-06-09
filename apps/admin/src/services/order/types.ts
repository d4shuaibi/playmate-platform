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
};

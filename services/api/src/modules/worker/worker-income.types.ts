import type { OrderStatus } from "../order/order.types";

/** 结算展示状态（派生自订单状态） */
export type WorkerIncomeSettlementStatus = "settled" | "pending_close" | "in_service";

/** 流水列表单项（与订单关联） */
export type WorkerIncomeLedgerItemDto = {
  orderId: string;
  orderNo: string;
  serviceTitle: string;
  packageTag: string;
  coverImage: string;
  /** 打手分成后金额（元） */
  workerIncomeAmount: number;
  settlementStatus: WorkerIncomeSettlementStatus;
  settlementStatusLabel: string;
  bossOrderStatus: OrderStatus;
  /** 结单完成时间 ISO8601；未完成可能为空 */
  completedAtIso: string | null;
  /** 展示用完成/结单时间 */
  completedAtDisplay: string | null;
  assignedAtDisplay: string | null;
  createdAtDisplay: string;
};

/** 单月汇总（自然月，YYYY-MM） */
export type WorkerIncomeMonthBucketDto = {
  yearMonth: string;
  settledTotal: number;
  settledOrderCount: number;
};

/** 收益页顶部汇总 */
export type WorkerIncomeSummaryDto = {
  yearMonth: string;
  /** 本月已结算入账合计（done 且 completedAt 落入本月） */
  settledTotal: number;
  /** 本月预估：已结算 + 待老板结单（pendingDone）分成之和（按单归属月） */
  monthEstimateTotal: number;
  growthPercent: number | null;
  settledOrderCount: number;
  pendingSettlementOrderCount: number;
  inServiceOrderCount: number;
  payoutHint: string;
};

/** 流水详情 */
export type WorkerIncomeDetailDto = WorkerIncomeLedgerItemDto & {
  settleNote: string;
};

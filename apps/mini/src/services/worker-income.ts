import { request } from "./http";
import { apiPaths } from "./api-paths";

/** 与后端 WorkerIncomeSettlementStatus 对齐 */
export type WorkerIncomeSettlementStatus = "settled" | "pending_close" | "in_service";

/** 与后端 Mini OrderStatus 对齐的记录字段 */
export type WorkerIncomeLedgerItem = {
  orderId: string;
  orderNo: string;
  serviceTitle: string;
  packageTag: string;
  coverImage: string;
  workerIncomeAmount: number;
  settlementStatus: WorkerIncomeSettlementStatus;
  settlementStatusLabel: string;
  bossOrderStatus: string;
  completedAtIso: string | null;
  completedAtDisplay: string | null;
  assignedAtDisplay: string | null;
  createdAtDisplay: string;
};

export type WorkerIncomeMonthBucket = {
  yearMonth: string;
  settledTotal: number;
  settledOrderCount: number;
};

export type WorkerIncomeSummary = {
  yearMonth: string;
  settledTotal: number;
  monthEstimateTotal: number;
  growthPercent: number | null;
  settledOrderCount: number;
  pendingSettlementOrderCount: number;
  inServiceOrderCount: number;
  payoutHint: string;
};

export type WorkerIncomeDetail = WorkerIncomeLedgerItem & {
  settleNote: string;
};

/** 月汇总 + 涨幅等（Query：yearMonth） */
export const fetchWorkerIncomeSummary = async (
  yearMonth?: string
): Promise<WorkerIncomeSummary> => {
  const search = new URLSearchParams();
  if (yearMonth?.trim()) search.set("yearMonth", yearMonth.trim());
  const q = search.toString();
  const path = q ? `${apiPaths.workerIncomeSummary}?${q}` : apiPaths.workerIncomeSummary;
  const res = await request<WorkerIncomeSummary>(path);
  return res.data;
};

/** 最近至多 12 个月已结算汇总 */
export const fetchWorkerIncomeMonths = async (): Promise<WorkerIncomeMonthBucket[]> => {
  const res = await request<{ months: WorkerIncomeMonthBucket[] }>(apiPaths.workerIncomeMonths);
  return res.data.months ?? [];
};

export type FetchWorkerIncomeLedgerParams = {
  yearMonth?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
};

/** 收益流水分页 */
export const fetchWorkerIncomeLedger = async (
  params?: FetchWorkerIncomeLedgerParams
): Promise<{ items: WorkerIncomeLedgerItem[]; total: number }> => {
  const search = new URLSearchParams();
  if (params?.yearMonth?.trim()) search.set("yearMonth", params.yearMonth.trim());
  if (params?.keyword?.trim()) search.set("keyword", params.keyword.trim());
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.pageSize != null) search.set("pageSize", String(params.pageSize));
  const q = search.toString();
  const path = q ? `${apiPaths.workerIncomeLedger}?${q}` : apiPaths.workerIncomeLedger;
  const res = await request<{ items: WorkerIncomeLedgerItem[]; total: number }>(path);
  return { items: res.data.items ?? [], total: res.data.total ?? 0 };
};

/** 单条流水详情（orderId） */
export const fetchWorkerIncomeDetail = async (orderId: string): Promise<WorkerIncomeDetail> => {
  const res = await request<WorkerIncomeDetail>(
    `${apiPaths.workerIncomeLedger}/${encodeURIComponent(orderId)}`
  );
  return res.data;
};

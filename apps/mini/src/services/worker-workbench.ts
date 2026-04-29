import { request } from "./http";
import { apiPaths } from "./api-paths";
import type { MiniOrder } from "./orders";

export type WorkerPresenceMode = "online" | "rest";

export type WorkerOrderBucket = "processing" | "completed" | "all";

/** 与后端 `WorkerOrderStage` 对齐 */
export type WorkerOrderStage = "pool" | "serving" | "pending_done" | "done";

export type WorkerOrderDetail = MiniOrder & { workerStage: WorkerOrderStage };

export type WorkerOrderTabCounts = {
  processing: number;
  completed: number;
  all: number;
};

export type WorkerWorkbenchSummary = {
  todayIncome: number;
  incomeTrendPercent: number | null;
  completedOrdersToday: number;
  successRatePercent: number;
  pendingPoolCount: number;
  myProcessingCount: number;
};

export type WorkerWorkbenchData = {
  presence: WorkerPresenceMode;
  summary: WorkerWorkbenchSummary;
  pendingOrders: MiniOrder[];
};

/**
 * 打手工作台：今日收益、成功率、待接单池等（需 worker 角色）。
 */
export const fetchWorkerWorkbench = async (): Promise<WorkerWorkbenchData> => {
  const res = await request<WorkerWorkbenchData>(apiPaths.workerWorkbench);
  return res.data;
};

/**
 * 切换在线 / 休整。
 */
export const patchWorkerPresence = async (
  mode: WorkerPresenceMode
): Promise<{ mode: WorkerPresenceMode }> => {
  const res = await request<{ mode: WorkerPresenceMode }>(apiPaths.workerPresence, {
    method: "PATCH",
    body: { mode }
  });
  return res.data;
};

export type FetchWorkerOrdersParams = {
  bucket?: WorkerOrderBucket;
  page?: number;
  pageSize?: number;
};

/**
 * 打手订单列表（进行中含待老板验收；已完成为老板已确认）。
 */
export const fetchWorkerOrders = async (
  params?: FetchWorkerOrdersParams
): Promise<{ items: MiniOrder[]; total: number; counts: WorkerOrderTabCounts }> => {
  const search = new URLSearchParams();
  if (params?.bucket) search.set("bucket", params.bucket);
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.pageSize != null) search.set("pageSize", String(params.pageSize));
  const query = search.toString();
  const path = query ? `${apiPaths.workerOrders}?${query}` : apiPaths.workerOrders;
  const res = await request<{ items: MiniOrder[]; total: number; counts: WorkerOrderTabCounts }>(
    path
  );
  return res.data;
};

/** 打手订单详情（池内订单未接单前也可查看） */
export const fetchWorkerOrderDetail = async (orderId: string): Promise<WorkerOrderDetail> => {
  const res = await request<WorkerOrderDetail>(
    `${apiPaths.workerOrders}/${encodeURIComponent(orderId)}`
  );
  return res.data;
};

/** 接单并开始执行（pendingTake → serving） */
export const startWorkerOrder = async (orderId: string): Promise<WorkerOrderDetail> => {
  const res = await request<WorkerOrderDetail>(
    `${apiPaths.workerOrders}/${encodeURIComponent(orderId)}/start`,
    { method: "POST" }
  );
  return res.data;
};

/** 打手确认完成（serving → pendingDone） */
export const completeWorkerOrder = async (orderId: string): Promise<WorkerOrderDetail> => {
  const res = await request<WorkerOrderDetail>(
    `${apiPaths.workerOrders}/${encodeURIComponent(orderId)}/complete`,
    { method: "POST" }
  );
  return res.data;
};

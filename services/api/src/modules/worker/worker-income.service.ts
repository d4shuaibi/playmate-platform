import { Injectable } from "@nestjs/common";
import type { Order } from "../order/order.types";
import { OrderService } from "../order/order.service";
import type {
  WorkerIncomeDetailDto,
  WorkerIncomeLedgerItemDto,
  WorkerIncomeMonthBucketDto,
  WorkerIncomeSettlementStatus,
  WorkerIncomeSummaryDto
} from "./worker-income.types";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

/** 打手分成比例（业务规则；后续可配置化） */
const WORKER_SHARE = 0.7;

const PAYOUT_HINT =
  "分成金额为订单金额按比例测算；实际到账以财务结算为准。工资由财务通过微信或银行卡统一发放，有疑问请联系调度或客服。";

const workerShareAmount = (orderAmount: number): number =>
  Math.round(orderAmount * WORKER_SHARE * 100) / 100;

const currentYearMonth = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const previousYearMonth = (yearMonth: string): string => {
  const [yStr, mStr] = yearMonth.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = new Date(y, m - 2, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
};

const isoToYearMonth = (iso: string): string | null => {
  const t = iso.trim();
  if (t.length < 7) return null;
  return t.slice(0, 7);
};

const displayToYearMonth = (value: string | undefined): string | null => {
  if (!value?.trim()) return null;
  const s = value.trim();
  const isoHead = /^(\d{4})-(\d{2})-\d{2}/.exec(s);
  if (isoHead) return `${isoHead[1]}-${isoHead[2]}`;
  const dot = /^(\d{4})\.(\d{2})\./.exec(s);
  if (dot) return `${dot[1]}-${dot[2]}`;
  return null;
};

const orderLedgerYearMonth = (order: Order): string | null => {
  if (order.status === "done" && order.completedAt?.trim()) {
    const ym = isoToYearMonth(order.completedAt);
    if (ym) return ym;
  }
  return displayToYearMonth(order.assignedAt) ?? displayToYearMonth(order.createdAt);
};

const orderTimelineMs = (order: Order): number => {
  if (order.completedAt?.trim()) {
    const ms = Date.parse(order.completedAt);
    if (!Number.isNaN(ms)) return ms;
  }
  const dot = /^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})/.exec(
    (order.assignedAt || order.createdAt || "").trim()
  );
  if (dot) {
    return new Date(
      Number(dot[1]),
      Number(dot[2]) - 1,
      Number(dot[3]),
      Number(dot[4]),
      Number(dot[5])
    ).getTime();
  }
  return 0;
};

const mapSettlement = (
  status: Order["status"]
): { key: WorkerIncomeSettlementStatus; label: string } => {
  if (status === "done") return { key: "settled", label: "已结算" };
  if (status === "pendingDone") return { key: "pending_close", label: "待结单" };
  return { key: "in_service", label: "服务中" };
};

const toLedgerItem = (order: Order): WorkerIncomeLedgerItemDto => {
  const income = workerShareAmount(order.amount);
  const sm = mapSettlement(order.status);
  let completedAtIso: string | null = null;
  let completedAtDisplay: string | null = null;
  if (order.completedAt?.trim()) {
    completedAtIso = order.completedAt.trim();
    try {
      completedAtDisplay = new Date(completedAtIso).toLocaleString("zh-CN");
    } catch {
      completedAtDisplay = completedAtIso;
    }
  }

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    serviceTitle: order.serviceTitle,
    packageTag: order.packageTag,
    coverImage: order.coverImage,
    workerIncomeAmount: income,
    settlementStatus: sm.key,
    settlementStatusLabel: sm.label,
    bossOrderStatus: order.status,
    completedAtIso,
    completedAtDisplay,
    assignedAtDisplay: order.assignedAt?.trim() ? order.assignedAt : null,
    createdAtDisplay: order.createdAt
  };
};

const incomeEligible = (o: Order): boolean =>
  o.status === "serving" || o.status === "pendingDone" || o.status === "done";

@Injectable()
export class WorkerIncomeService {
  constructor(private readonly orderService: OrderService) {}

  public listMonthBuckets(workerId: string): ApiEnvelope<{ months: WorkerIncomeMonthBucketDto[] }> {
    const orders = this.orderService.findOrdersAssignedToWorker(workerId).filter(incomeEligible);
    const map = new Map<string, { total: number; count: number }>();

    for (const o of orders) {
      if (o.status !== "done" || !o.completedAt?.trim()) continue;
      const ym = isoToYearMonth(o.completedAt);
      if (!ym) continue;
      const share = workerShareAmount(o.amount);
      const cur = map.get(ym) ?? { total: 0, count: 0 };
      cur.total += share;
      cur.count += 1;
      map.set(ym, cur);
    }

    const months: WorkerIncomeMonthBucketDto[] = Array.from(map.entries())
      .map(([yearMonth, v]) => ({
        yearMonth,
        settledTotal: Math.round(v.total * 100) / 100,
        settledOrderCount: v.count
      }))
      .sort((a, b) => (a.yearMonth < b.yearMonth ? 1 : -1))
      .slice(0, 12);

    return { code: 0, message: "ok", data: { months } };
  }

  public getSummary(workerId: string, yearMonth?: string): ApiEnvelope<WorkerIncomeSummaryDto> {
    const ym = (yearMonth ?? "").trim() || currentYearMonth();
    const orders = this.orderService.findOrdersAssignedToWorker(workerId).filter(incomeEligible);

    let settledTotal = 0;
    let settledOrderCount = 0;
    let pendingSettlementOrderCount = 0;
    let inServiceOrderCount = 0;
    let estimateExtra = 0;

    for (const o of orders) {
      const belongs = orderLedgerYearMonth(o) === ym;
      if (o.status === "done" && o.completedAt?.trim() && isoToYearMonth(o.completedAt) === ym) {
        settledTotal += workerShareAmount(o.amount);
        settledOrderCount += 1;
      }
      if (belongs && o.status === "pendingDone") {
        pendingSettlementOrderCount += 1;
        estimateExtra += workerShareAmount(o.amount);
      }
      if (belongs && o.status === "serving") {
        inServiceOrderCount += 1;
        estimateExtra += workerShareAmount(o.amount);
      }
    }

    settledTotal = Math.round(settledTotal * 100) / 100;
    const monthEstimateTotal = Math.round((settledTotal + estimateExtra) * 100) / 100;

    const prevYm = previousYearMonth(ym);
    let prevSettled = 0;
    for (const o of orders) {
      if (
        o.status === "done" &&
        o.completedAt?.trim() &&
        isoToYearMonth(o.completedAt) === prevYm
      ) {
        prevSettled += workerShareAmount(o.amount);
      }
    }
    prevSettled = Math.round(prevSettled * 100) / 100;

    let growthPercent: number | null = null;
    if (prevSettled <= 0 && settledTotal > 0) growthPercent = 100;
    else if (prevSettled > 0) {
      growthPercent = Math.round(((settledTotal - prevSettled) / prevSettled) * 1000) / 10;
    }

    const summary: WorkerIncomeSummaryDto = {
      yearMonth: ym,
      settledTotal,
      monthEstimateTotal,
      growthPercent,
      settledOrderCount,
      pendingSettlementOrderCount,
      inServiceOrderCount,
      payoutHint: PAYOUT_HINT
    };

    return { code: 0, message: "ok", data: summary };
  }

  public listLedger(
    workerId: string,
    filters: { yearMonth?: string; keyword?: string; page?: number; pageSize?: number }
  ): ApiEnvelope<{ items: WorkerIncomeLedgerItemDto[]; total: number }> {
    const ymFilter = (filters.yearMonth ?? "").trim();
    const keyword = (filters.keyword ?? "").trim().toLowerCase();
    const pageSize = Math.max(1, Math.min(50, Math.floor(filters.pageSize ?? 20)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    let list = this.orderService.findOrdersAssignedToWorker(workerId).filter(incomeEligible);

    if (ymFilter) {
      list = list.filter((o) => orderLedgerYearMonth(o) === ymFilter);
    }

    if (keyword) {
      list = list.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(keyword) ||
          o.serviceTitle.toLowerCase().includes(keyword)
      );
    }

    list = [...list].sort((a, b) => orderTimelineMs(b) - orderTimelineMs(a));

    const total = list.length;
    const start = (page - 1) * pageSize;
    const items = list.slice(start, start + pageSize).map(toLedgerItem);

    return { code: 0, message: "ok", data: { items, total } };
  }

  public getLedgerDetail(workerId: string, orderId: string): ApiEnvelope<WorkerIncomeDetailDto> {
    const trimmed = orderId.trim();
    if (!trimmed) return { code: 400, message: "orderId is required", data: null };

    const orders = this.orderService.findOrdersAssignedToWorker(workerId);
    const order = orders.find((o) => o.id === trimmed) ?? null;
    if (!order) return { code: 404, message: "order not found", data: null };
    if (!incomeEligible(order)) {
      return { code: 400, message: "order has no income record", data: null };
    }

    const base = toLedgerItem(order);
    const detail: WorkerIncomeDetailDto = {
      ...base,
      settleNote: PAYOUT_HINT
    };

    return { code: 0, message: "ok", data: detail };
  }
}

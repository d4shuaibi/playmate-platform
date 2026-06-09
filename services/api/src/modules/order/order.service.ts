import { Injectable, Logger } from "@nestjs/common";
import { randomBytes } from "crypto";
import type { BizOrder, Prisma } from "@prisma/client";
import { BizOrderStatus, BizRefundStatus } from "@prisma/client";
import { decimalLikeToNumber } from "../../lib/decimal-like";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductService } from "../product/product.service";
import {
  MiniOrderTabCounts,
  Order,
  OrderDeliveryItem,
  OrderStatus,
  RefundStatus,
  WorkerOrderBucket,
  WorkerOrderStage,
  WorkerOrderTabCounts
} from "./order.types";
import type { MiniProgramPaymentParams } from "./wechat-pay.service";
import { WechatPayService } from "./wechat-pay.service";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

type ListFilters = {
  keyword?: string;
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
};

type MiniListFilters = {
  keyword?: string;
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
};

/** POST /api/mini/orders/:id/wechat-prepay */
export type MiniWechatPrepayData =
  | { mockPaid: true }
  | { mockPaid: false; payment: MiniProgramPaymentParams };

type WorkerListFilters = {
  bucket?: WorkerOrderBucket;
  page?: number;
  pageSize?: number;
};

const normalizeKeyword = (value: string | undefined): string => {
  return (value ?? "").trim().toLowerCase();
};

const STATUS_LABEL_MAP: Record<OrderStatus, string> = {
  pendingPay: "待付款",
  pendingTake: "待接单",
  serving: "服务中",
  pendingDone: "待结单",
  done: "已完成",
  cancelled: "已取消"
};

const PROGRESS_TEMPLATE: Array<{
  key: "pendingTake" | "serving" | "pendingDone" | "done";
  label: string;
}> = [
  { key: "pendingTake", label: "待接单" },
  { key: "serving", label: "进行中" },
  { key: "pendingDone", label: "待验收" },
  { key: "done", label: "已完成" }
];

const STATUS_STAGE_INDEX: Record<OrderStatus, number> = {
  pendingPay: -1,
  pendingTake: 0,
  serving: 1,
  pendingDone: 2,
  done: 3,
  cancelled: -1
};

/** 根据订单状态生成进度节点勾选状态 */
const buildProgress = (status: OrderStatus) => {
  const stageIndex = STATUS_STAGE_INDEX[status];
  return PROGRESS_TEMPLATE.map((step, index) => ({
    ...step,
    done: stageIndex >= 0 && index <= stageIndex
  }));
};

/** 下单时间展示 */
const formatCreatedAtFromDate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
};

/** 生成短订单号，便于列表展示 */
const createOrderNo = (): string => {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${Date.now().toString(36).toUpperCase()}-${suffix}`;
};

const utcDatePrefix = (d: Date): string => d.toISOString().slice(0, 10);

const todayUtcPrefix = (): string => utcDatePrefix(new Date());

const yesterdayUtcPrefix = (): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDatePrefix(d);
};

const toOrderStatus = (s: BizOrderStatus): OrderStatus => s as OrderStatus;

const toRefundStatus = (s: BizRefundStatus): RefundStatus => s as RefundStatus;

const toBizOrderStatus = (s: OrderStatus): BizOrderStatus => s as BizOrderStatus;

/** 解析交付项 JSON */
const parseDeliveries = (raw: Prisma.JsonValue): OrderDeliveryItem[] => {
  if (!Array.isArray(raw)) return [];
  const out: OrderDeliveryItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as { id?: unknown; text?: unknown; done?: unknown };
    const id = typeof o.id === "string" ? o.id : "";
    const text = typeof o.text === "string" ? o.text : "";
    const done = Boolean(o.done);
    if (!id || !text) continue;
    out.push({ id, text, done });
  }
  return out;
};

const mapRowToOrder = (row: BizOrder): Order => {
  const status = toOrderStatus(row.status);
  return {
    id: row.id,
    orderNo: row.orderNo,
    status,
    packageTag: row.packageTag,
    serviceTitle: row.serviceTitle,
    amount: decimalLikeToNumber(row.amount),
    quantityText: row.quantityText,
    coverImage: row.coverImage,
    createdAt: formatCreatedAtFromDate(row.createdAt),
    payMethod: row.payMethod,
    paidAmount: decimalLikeToNumber(row.paidAmount),
    progress: buildProgress(status),
    deliveries: parseDeliveries(row.deliveries),
    createdBy: row.createdBy,
    userId: row.userId ?? "",
    productId: row.productId ?? "",
    refundStatus: toRefundStatus(row.refundStatus),
    assignedWorkerId: row.assignedWorkerId ?? "",
    assignedAt: row.assignedAt,
    completedAt: row.completedAt,
    wxTransactionId: row.wxTransactionId ?? undefined
  };
};

/** 打手侧订单阶段（pool=待_pool 接单；老板端 pendingTake 且无分配） */
const deriveWorkerStage = (order: Order): WorkerOrderStage => {
  if (order.status === "pendingTake" && !(order.assignedWorkerId ?? "").trim()) {
    return "pool";
  }
  if (order.status === "serving") return "serving";
  if (order.status === "pendingDone") return "pending_done";
  if (order.status === "done") return "done";
  return "done";
};

const incomeSumForWorkerOnDay = (orders: Order[], workerId: string, dayPrefix: string): number => {
  let sum = 0;
  for (const o of orders) {
    if (o.assignedWorkerId !== workerId) continue;
    if (o.status !== "done") continue;
    const iso = (o.completedAt ?? "").trim();
    if (!iso.startsWith(dayPrefix)) continue;
    sum += o.amount;
  }
  return sum;
};

const matchesWorkerBucket = (
  order: Order,
  workerId: string,
  bucket: WorkerOrderBucket
): boolean => {
  if (order.assignedWorkerId !== workerId) return false;
  if (bucket === "processing") return order.status === "serving" || order.status === "pendingDone";
  if (bucket === "completed") return order.status === "done";
  return order.status === "serving" || order.status === "pendingDone" || order.status === "done";
};

const workerAssignedOrders = (orders: Order[], workerId: string): Order[] =>
  orders.filter((o) => o.assignedWorkerId === workerId);

const buildWorkerTabCounts = (orders: Order[], workerId: string): WorkerOrderTabCounts => {
  const mine = workerAssignedOrders(orders, workerId);
  let processing = 0;
  let completed = 0;
  for (const o of mine) {
    if (o.status === "serving" || o.status === "pendingDone") processing += 1;
    else if (o.status === "done") completed += 1;
  }
  return {
    processing,
    completed,
    all: mine.filter((o) => ["serving", "pendingDone", "done"].includes(o.status)).length
  };
};

const orderStatusesMatchingLabelKeyword = (keyword: string): BizOrderStatus[] => {
  if (!keyword.trim()) return [];
  const k = keyword.toLowerCase();
  return (Object.entries(STATUS_LABEL_MAP) as [OrderStatus, string][])
    .filter(([, lbl]) => lbl.toLowerCase().includes(k))
    .map(([s]) => toBizOrderStatus(s));
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
    private readonly wechatPayService: WechatPayService
  ) {}

  /** 管理端：订单列表（全量） */
  public async listOrders(
    filters: ListFilters
  ): Promise<ApiEnvelope<{ items: Order[]; total: number }>> {
    const keywordRaw = normalizeKeyword(filters.keyword);
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const statusesFromChinese = orderStatusesMatchingLabelKeyword(keywordRaw);

    const whereParts: Prisma.BizOrderWhereInput[] = [];
    if (filters.status) whereParts.push({ status: toBizOrderStatus(filters.status) });
    if (keywordRaw.length > 0) {
      whereParts.push({
        OR: [
          { orderNo: { contains: keywordRaw } },
          { serviceTitle: { contains: keywordRaw } },
          ...(statusesFromChinese.length ? [{ status: { in: statusesFromChinese } }] : [])
        ]
      });
    }
    const where: Prisma.BizOrderWhereInput =
      whereParts.length === 0 ? {} : whereParts.length === 1 ? whereParts[0]! : { AND: whereParts };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.bizOrder.count({ where }),
      this.prisma.bizOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      code: 0,
      message: "ok",
      data: {
        items: rows.map(mapRowToOrder),
        total
      }
    };
  }

  /** 管理端 / 调试：按 ID 取单 */
  public async getOrder(id: string): Promise<ApiEnvelope<Order>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id } });
    if (!row) return { code: 404, message: "order not found", data: null };
    return { code: 0, message: "ok", data: mapRowToOrder(row) };
  }

  /** 小程序老板：确认结单（pendingDone → done），虚拟服务无实体收货环节 */
  public async confirmCloseOrderMini(userId: string, orderId: string): Promise<ApiEnvelope<Order>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };
    if ((row.userId ?? "") !== userId) return { code: 403, message: "forbidden", data: null };
    if (toOrderStatus(row.status) !== "pendingDone") {
      return { code: 400, message: "当前订单状态不可结单", data: null };
    }

    const next = await this.prisma.bizOrder.update({
      where: { id: orderId },
      data: {
        status: BizOrderStatus.done,
        completedAt: new Date().toISOString(),
        updatedAt: new Date()
      }
    });
    return { code: 0, message: "ok", data: mapRowToOrder(next) };
  }

  /** 打手工作台：汇总 + 待接单池（pendingTake 且未分配） */
  public async getWorkerWorkbench(
    workerId: string,
    presenceMode: "online" | "rest"
  ): Promise<
    ApiEnvelope<{
      presence: "online" | "rest";
      summary: {
        todayIncome: number;
        incomeTrendPercent: number | null;
        completedOrdersToday: number;
        successRatePercent: number;
        pendingPoolCount: number;
        myProcessingCount: number;
      };
      pendingOrders: Order[];
    }>
  > {
    const pendingPoolRows = await this.prisma.bizOrder.findMany({
      where: {
        status: BizOrderStatus.pendingTake,
        // 退款申请处理中的订单不进入打手可接单池，避免被接走
        refundStatus: { not: BizRefundStatus.pending },
        OR: [{ assignedWorkerId: null }, { assignedWorkerId: "" }]
      },
      orderBy: { createdAt: "desc" }
    });
    const pendingPool = pendingPoolRows.map(mapRowToOrder);

    const workerOrdersFull = await this.prisma.bizOrder.findMany({
      where: { assignedWorkerId: workerId },
      orderBy: { createdAt: "desc" }
    });
    const workerMapped = workerOrdersFull.map(mapRowToOrder);

    const today = todayUtcPrefix();
    const yesterday = yesterdayUtcPrefix();
    const todayIncome = incomeSumForWorkerOnDay(workerMapped, workerId, today);
    const yesterdayIncome = incomeSumForWorkerOnDay(workerMapped, workerId, yesterday);

    let incomeTrendPercent: number | null = null;
    if (yesterdayIncome <= 0 && todayIncome > 0) incomeTrendPercent = 100;
    else if (yesterdayIncome > 0) {
      incomeTrendPercent =
        Math.round(((todayIncome - yesterdayIncome) / yesterdayIncome) * 1000) / 10;
    }

    const mineDone = workerMapped.filter((o) => o.status === "done");
    const mineCancelled = workerMapped.filter((o) => o.status === "cancelled");
    const denom = mineDone.length + mineCancelled.length;
    const successRatePercent =
      denom === 0 ? 100 : Math.round((mineDone.length / denom) * 1000) / 10;

    const completedOrdersToday = mineDone.filter((o) =>
      (o.completedAt ?? "").startsWith(today)
    ).length;

    const myProcessingCount = workerMapped.filter(
      (o) => o.status === "serving" || o.status === "pendingDone"
    ).length;

    return {
      code: 0,
      message: "ok",
      data: {
        presence: presenceMode,
        summary: {
          todayIncome,
          incomeTrendPercent,
          completedOrdersToday,
          successRatePercent,
          pendingPoolCount: pendingPool.length,
          myProcessingCount
        },
        pendingOrders: pendingPool
      }
    };
  }

  /** 打手：订单列表（仅本人接单后的订单） */
  public async listWorkerOrders(
    workerId: string,
    filters: WorkerListFilters
  ): Promise<ApiEnvelope<{ items: Order[]; total: number; counts: WorkerOrderTabCounts }>> {
    const bucket = filters.bucket ?? "all";
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 20)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const workerRows = await this.prisma.bizOrder.findMany({
      where: { assignedWorkerId: workerId },
      orderBy: { createdAt: "desc" }
    });
    const allMine = workerRows.map(mapRowToOrder);
    const filtered = allMine.filter((item) => matchesWorkerBucket(item, workerId, bucket));
    const counts = buildWorkerTabCounts(allMine, workerId);

    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      code: 0,
      message: "ok",
      data: {
        items,
        total: filtered.length,
        counts
      }
    };
  }

  /** 打手：订单详情（池内待接单订单任何人可看详情；已接单仅本人） */
  public async getWorkerOrder(
    workerId: string,
    orderId: string
  ): Promise<ApiEnvelope<Order & { workerStage: WorkerOrderStage }>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };
    const found = mapRowToOrder(row);

    const unassignedPool = found.status === "pendingTake" && !(found.assignedWorkerId ?? "").trim();
    const isAssignee = found.assignedWorkerId === workerId;
    if (!unassignedPool && !isAssignee) {
      return { code: 403, message: "forbidden", data: null };
    }

    return {
      code: 0,
      message: "ok",
      data: { ...found, workerStage: deriveWorkerStage(found) }
    };
  }

  /** 打手：接单并开始执行（pendingTake → serving） */
  public async startWorkerOrder(
    workerId: string,
    orderId: string
  ): Promise<ApiEnvelope<Order & { workerStage: WorkerOrderStage }>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };

    const order = mapRowToOrder(row);
    if (order.status !== "pendingTake") {
      return { code: 400, message: "order is not pending acceptance", data: null };
    }
    if (order.refundStatus === "pending") {
      return { code: 400, message: "订单退款处理中，暂不可接单", data: null };
    }
    if ((order.assignedWorkerId ?? "").trim().length > 0) {
      return { code: 400, message: "order already assigned", data: null };
    }

    const nextRow = await this.prisma.bizOrder.update({
      where: { id: orderId },
      data: {
        status: BizOrderStatus.serving,
        assignedWorkerId: workerId,
        assignedAt: formatCreatedAtFromDate(new Date()),
        updatedAt: new Date()
      }
    });
    const next = mapRowToOrder(nextRow);

    return {
      code: 0,
      message: "ok",
      data: { ...next, workerStage: deriveWorkerStage(next) }
    };
  }

  /** 打手：确认完成服务（serving → pendingDone，等待老板验收） */
  public async workerConfirmComplete(
    workerId: string,
    orderId: string
  ): Promise<ApiEnvelope<Order & { workerStage: WorkerOrderStage }>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };

    const order = mapRowToOrder(row);
    if (order.assignedWorkerId !== workerId) return { code: 403, message: "forbidden", data: null };
    if (order.status !== "serving") {
      return { code: 400, message: "order is not in serving status", data: null };
    }

    const nextRow = await this.prisma.bizOrder.update({
      where: { id: orderId },
      data: {
        status: BizOrderStatus.pendingDone,
        updatedAt: new Date()
      }
    });
    const next = mapRowToOrder(nextRow);

    return {
      code: 0,
      message: "ok",
      data: { ...next, workerStage: deriveWorkerStage(next) }
    };
  }

  /** 小程序「我的」页：当前用户订单 Tab 聚合数量 */
  public async getMiniOrderTabCounts(userId: string): Promise<MiniOrderTabCounts> {
    const rows = await this.prisma.bizOrder.findMany({
      where: { userId },
      select: { status: true, refundStatus: true }
    });
    const mine = rows.map((r) => ({
      status: toOrderStatus(r.status),
      refundStatus: toRefundStatus(r.refundStatus)
    }));
    return this.buildMiniTabCounts(mine);
  }

  /** 小程序：当前用户订单列表 + Tab 数量 */
  public async listMiniOrders(
    userId: string,
    filters: MiniListFilters
  ): Promise<ApiEnvelope<{ items: Order[]; total: number; counts: MiniOrderTabCounts }>> {
    const keywordRaw = normalizeKeyword(filters.keyword);
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 20)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const countRows = await this.prisma.bizOrder.findMany({
      where: { userId },
      select: { status: true, refundStatus: true }
    });
    const counts = this.buildMiniTabCounts(
      countRows.map((r) => ({
        status: toOrderStatus(r.status),
        refundStatus: toRefundStatus(r.refundStatus)
      }))
    );

    const statusesFromChinese = orderStatusesMatchingLabelKeyword(keywordRaw);

    const listWhereBase: Prisma.BizOrderWhereInput = {
      userId,
      ...(filters.status ? { status: toBizOrderStatus(filters.status) } : {})
    };

    const listWhere: Prisma.BizOrderWhereInput =
      keywordRaw.length > 0
        ? ({
            AND: [
              listWhereBase,
              {
                OR: [
                  { orderNo: { contains: keywordRaw } },
                  { serviceTitle: { contains: keywordRaw } },
                  ...(statusesFromChinese.length ? [{ status: { in: statusesFromChinese } }] : [])
                ]
              }
            ]
          } satisfies Prisma.BizOrderWhereInput)
        : listWhereBase;

    const [filteredTotal, pageRows] = await this.prisma.$transaction([
      this.prisma.bizOrder.count({ where: listWhere }),
      this.prisma.bizOrder.findMany({
        where: listWhere,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      code: 0,
      message: "ok",
      data: {
        items: pageRows.map(mapRowToOrder),
        total: filteredTotal,
        counts
      }
    };
  }

  /** 小程序：创建订单（待付款） */
  public async createMiniOrder(userId: string, productId: string): Promise<ApiEnvelope<Order>> {
    const trimmedId = productId.trim();
    if (!trimmedId) return { code: 400, message: "productId is required", data: null };

    const productEnvelope = await this.productService.getProduct(trimmedId);
    if (productEnvelope.code !== 0 || !productEnvelope.data) {
      return { code: productEnvelope.code, message: productEnvelope.message, data: null };
    }
    const product = productEnvelope.data;
    if (product.status !== "enabled") {
      return { code: 400, message: "product is not available", data: null };
    }

    const orderId = `o-${randomBytes(8).toString("hex")}`;
    const packageTag = product.badges[0] ?? product.categoryName ?? "套餐";
    const titleAccent = product.titleAccent.trim();
    const serviceTitle = titleAccent.length > 0 ? `${product.name} ${titleAccent}` : product.name;
    const lines = product.descriptionLines ?? [];
    const deliveriesPayload = lines.slice(0, 12).map((text, index) => ({
      id: `d-${index}`,
      text,
      done: false
    }));

    const row = await this.prisma.bizOrder.create({
      data: {
        id: orderId,
        orderNo: createOrderNo(),
        status: BizOrderStatus.pendingPay,
        packageTag,
        serviceTitle,
        amount: product.price,
        quantityText: "× 1 套服务",
        coverImage: product.heroImages[0] ?? product.imageUrl,
        payMethod: "待支付",
        paidAmount: 0,
        deliveries: deliveriesPayload as unknown as Prisma.InputJsonValue,
        createdBy: userId,
        userId,
        productId: product.id,
        refundStatus: BizRefundStatus.none,
        assignedWorkerId: null,
        assignedAt: "",
        completedAt: "",
        wxTransactionId: null
      }
    });

    return { code: 0, message: "ok", data: mapRowToOrder(row) };
  }

  /** 小程序：订单详情（归属校验） */
  public async getMiniOrder(userId: string, orderId: string): Promise<ApiEnvelope<Order>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };
    if ((row.userId ?? "") !== userId) return { code: 403, message: "forbidden", data: null };
    return { code: 0, message: "ok", data: mapRowToOrder(row) };
  }

  /** 小程序：申请退款（写入退款状态） */
  public async requestRefundMini(
    userId: string,
    orderId: string
  ): Promise<ApiEnvelope<{ success: true }>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };
    if ((row.userId ?? "") !== userId) return { code: 403, message: "forbidden", data: null };

    const found = mapRowToOrder(row);
    if (found.refundStatus === "pending") {
      return { code: 400, message: "退款申请处理中", data: null };
    }
    if (found.refundStatus === "approved") {
      return { code: 400, message: "订单已退款", data: null };
    }
    if (found.status === "cancelled") {
      return { code: 400, message: "订单已取消", data: null };
    }
    if (found.paidAmount <= 0) {
      return { code: 400, message: "订单尚未支付或无可退款金额", data: null };
    }

    await this.prisma.bizOrder.update({
      where: { id: orderId },
      data: { refundStatus: BizRefundStatus.pending, updatedAt: new Date() }
    });

    return { code: 0, message: "ok", data: { success: true } };
  }

  /**
   * 管理端：通过退款申请（refundStatus pending → approved），调用微信退款并取消订单。
   * 未配置商户参数时跳过真实退款，仅推进状态（便于联调）。
   */
  public async approveRefundAdmin(orderId: string): Promise<ApiEnvelope<Order>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };
    const found = mapRowToOrder(row);
    if (found.refundStatus !== "pending") {
      return { code: 400, message: "该订单没有待处理的退款申请", data: null };
    }

    if (!this.wechatPayService.shouldSimulateImmediatePay()) {
      try {
        await this.wechatPayService.refund({
          outTradeNo: found.id,
          outRefundNo: `rf-${randomBytes(8).toString("hex")}`,
          refundFen: Math.max(1, Math.round(found.paidAmount * 100)),
          totalFen: Math.max(1, Math.round(found.amount * 100)),
          reason: "用户申请退款"
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { code: 502, message: `微信退款失败：${msg}`, data: null };
      }
    }

    const nextRow = await this.prisma.bizOrder.update({
      where: { id: orderId },
      data: {
        refundStatus: BizRefundStatus.approved,
        status: BizOrderStatus.cancelled,
        updatedAt: new Date()
      }
    });
    return { code: 0, message: "ok", data: mapRowToOrder(nextRow) };
  }

  /**
   * 管理端：驳回退款申请（refundStatus pending → rejected），订单回到原有流程。
   */
  public async rejectRefundAdmin(orderId: string): Promise<ApiEnvelope<Order>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };
    const found = mapRowToOrder(row);
    if (found.refundStatus !== "pending") {
      return { code: 400, message: "该订单没有待处理的退款申请", data: null };
    }

    const nextRow = await this.prisma.bizOrder.update({
      where: { id: orderId },
      data: { refundStatus: BizRefundStatus.rejected, updatedAt: new Date() }
    });
    return { code: 0, message: "ok", data: mapRowToOrder(nextRow) };
  }

  /** 统计小程序 Tab 数量（基于已筛选的当前用户订单列表） */
  private buildMiniTabCounts(
    mine: { status: OrderStatus; refundStatus: RefundStatus }[]
  ): MiniOrderTabCounts {
    const counts: MiniOrderTabCounts = {
      all: mine.length,
      pendingPay: 0,
      pendingTake: 0,
      serving: 0,
      pendingDone: 0,
      cancelled: 0,
      refundAfterSale: 0
    };

    for (const order of mine) {
      if (order.status === "pendingPay") counts.pendingPay += 1;
      else if (order.status === "pendingTake") counts.pendingTake += 1;
      else if (order.status === "serving") counts.serving += 1;
      else if (order.status === "pendingDone") counts.pendingDone += 1;
      else if (order.status === "cancelled") counts.cancelled += 1;
      if (order.refundStatus === "pending" || order.refundStatus === "approved") {
        counts.refundAfterSale += 1;
      }
    }

    return counts;
  }

  /**
   * 微信支付回调或本地模拟：待付款 → 待接单。
   */
  public async markMiniOrderPaidFromNotify(
    outTradeNo: string,
    wxTransactionId?: string
  ): Promise<boolean> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: outTradeNo } });
    if (!row) return false;
    if (row.status !== BizOrderStatus.pendingPay) return true;
    await this.prisma.bizOrder.update({
      where: { id: outTradeNo },
      data: {
        status: BizOrderStatus.pendingTake,
        paidAmount: row.amount,
        payMethod: "微信支付",
        wxTransactionId: wxTransactionId ?? row.wxTransactionId,
        updatedAt: new Date()
      }
    });
    return true;
  }

  /**
   * 小程序 JSAPI 预下单并生成调起参数；未配置商户或开启 WECHAT_PAY_DEV_SIMULATE 时直接标记已支付。
   */
  public async requestMiniOrderWechatPrepay(
    userId: string,
    orderId: string
  ): Promise<ApiEnvelope<MiniWechatPrepayData>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };
    const found = mapRowToOrder(row);
    if ((row.userId ?? "") !== userId) return { code: 403, message: "forbidden", data: null };
    if (found.status !== "pendingPay") {
      return { code: 400, message: "订单状态不可支付", data: null };
    }

    if (this.wechatPayService.shouldSimulateImmediatePay()) {
      await this.markMiniOrderPaidFromNotify(found.id, "SIMULATED");
      return { code: 0, message: "ok", data: { mockPaid: true } };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { wechatOpenId: true }
    });
    const openid = user?.wechatOpenId?.trim() ?? "";
    if (!openid) {
      return {
        code: 400,
        message: "未绑定微信用户标识：请使用微信小程序登录后再支付",
        data: null
      };
    }

    const amountFen = Math.max(1, Math.round(found.amount * 100));

    try {
      const { prepayId } = await this.wechatPayService.jsapiCreateOrder({
        outTradeNo: found.id,
        description: found.serviceTitle,
        amountFen,
        payerOpenId: openid
      });
      const payment = this.wechatPayService.buildMiniProgramPaymentParams(prepayId);
      return { code: 0, message: "ok", data: { mockPaid: false, payment } };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { code: 502, message: msg, data: null };
    }
  }

  /**
   * 小程序：支付成功后主动查单同步状态，兜底微信异步通知延迟/丢失。
   * 查到 SUCCESS 则标记已支付；其它情况返回当前状态、不报错。
   */
  public async syncMiniOrderPayState(userId: string, orderId: string): Promise<ApiEnvelope<Order>> {
    const row = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    if (!row) return { code: 404, message: "order not found", data: null };
    if ((row.userId ?? "") !== userId) return { code: 403, message: "forbidden", data: null };

    const found = mapRowToOrder(row);
    // 已不是待付款（回调可能已处理）或未配置真实支付（模拟）时，直接返回当前状态
    if (found.status !== "pendingPay" || this.wechatPayService.shouldSimulateImmediatePay()) {
      return { code: 0, message: "ok", data: found };
    }

    try {
      const { tradeState, transactionId } = await this.wechatPayService.queryOrderByOutTradeNo(
        found.id
      );
      if (tradeState === "SUCCESS") {
        await this.markMiniOrderPaidFromNotify(found.id, transactionId || undefined);
      }
    } catch (e) {
      this.logger.warn(`查单同步失败：${e instanceof Error ? e.message : String(e)}`);
    }

    const latest = await this.prisma.bizOrder.findUnique({ where: { id: orderId } });
    return { code: 0, message: "ok", data: mapRowToOrder(latest ?? row) };
  }

  /** 分配给指定打手的订单（用于收益结算聚合） */
  public async findOrdersAssignedToWorker(workerId: string): Promise<Order[]> {
    const rows = await this.prisma.bizOrder.findMany({
      where: { assignedWorkerId: workerId },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(mapRowToOrder);
  }
}

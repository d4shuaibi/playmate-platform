import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductService } from "../product/product.service";
import {
  MiniOrderTabCounts,
  Order,
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

const normalizeKeyword = (value: string | undefined) => {
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

/** 新建订单展示用下单时间 */
const formatCreatedAt = (): string => {
  const d = new Date();
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

@Injectable()
export class OrderService {
  private readonly orders: Order[] = [];

  constructor(
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
    private readonly wechatPayService: WechatPayService
  ) {
    const allowSeed = process.env.SEED_DEMO === "true" || process.env.NODE_ENV !== "production";
    if (!allowSeed) return;

    this.orders.push(
      {
        id: "o1",
        orderNo: "ORD-8829-X",
        status: "pendingTake",
        packageTag: "至尊服务",
        serviceTitle: "暗区突围：全地图红卡带出",
        amount: 2899,
        quantityText: "× 1 套服务",
        coverImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDYi_2hfQ_QdmpZ6R0mEIRmCWANryQA3XfuFHRAshY17FNjeqygj4SItHwCbhseAOQYktoTId8sfzwAndrUsafJXNXzp30xQMB3VMxOeDcysbav0fMG1fXmLNFfkZaH__ly4KkLomU6q3tN0ljl3kdV44q7QkW67QmQuLbkDEPovMEWPHTu7yT_Vwbk2-9GgOhOSorTrrv1cCSqxCZMw-Dc06d256Yzx6naV6K9vwg1-JsOA9OehopSCDGbkvn_r9ZrGpV3o0XskdA",
        createdAt: "2023.11.24 14:30",
        payMethod: "极氪代币支付",
        paidAmount: 2899,
        progress: buildProgress("pendingTake"),
        deliveries: [
          { id: "d1", text: "绝密红卡 (400-1000万价值)", done: false },
          { id: "d2", text: "全套满配装备 & 弹药补给", done: false },
          { id: "d3", text: "角色技能等级经验提升", done: false }
        ],
        createdBy: "seed",
        userId: "",
        productId: "",
        refundStatus: "none",
        assignedWorkerId: "",
        assignedAt: "",
        completedAt: ""
      },
      {
        id: "o2",
        orderNo: "ORD-7741-K",
        status: "pendingPay",
        packageTag: "标准套餐",
        serviceTitle: "使命召唤：现代战争 III 全皮肤解锁",
        amount: 599,
        quantityText: "× 1 套服务",
        coverImage:
          "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=80",
        createdAt: "2023.11.24 12:15",
        payMethod: "待支付",
        paidAmount: 0,
        progress: buildProgress("pendingPay"),
        deliveries: [],
        createdBy: "seed",
        userId: "",
        productId: "",
        refundStatus: "none",
        assignedWorkerId: "",
        assignedAt: "",
        completedAt: ""
      }
    );
  }

  /** 管理端：订单列表（全量） */
  public listOrders(filters: ListFilters): ApiEnvelope<{ items: Order[]; total: number }> {
    const keyword = normalizeKeyword(filters.keyword);
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const filtered = this.orders.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (!keyword) return true;
      const statusLabel = STATUS_LABEL_MAP[item.status];
      return (
        item.orderNo.toLowerCase().includes(keyword) ||
        item.serviceTitle.toLowerCase().includes(keyword) ||
        statusLabel.toLowerCase().includes(keyword)
      );
    });

    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      code: 0,
      message: "ok",
      data: {
        items,
        total: filtered.length
      }
    };
  }

  /** 管理端 / 调试：按 ID 取单 */
  public getOrder(id: string): ApiEnvelope<Order> {
    const found = this.orders.find((item) => item.id === id) ?? null;
    if (!found) return { code: 404, message: "order not found", data: null };
    return { code: 0, message: "ok", data: found };
  }

  /** 小程序老板：确认结单（pendingDone → done），虚拟服务无实体收货环节 */
  public confirmCloseOrderMini(userId: string, orderId: string): ApiEnvelope<Order> {
    const index = this.orders.findIndex((item) => item.id === orderId);
    if (index < 0) return { code: 404, message: "order not found", data: null };
    const found = this.orders[index];
    if (found.userId !== userId) return { code: 403, message: "forbidden", data: null };
    if (found.status !== "pendingDone") {
      return { code: 400, message: "当前订单状态不可结单", data: null };
    }

    const next: Order = {
      ...found,
      status: "done",
      progress: buildProgress("done"),
      completedAt: new Date().toISOString()
    };
    this.orders[index] = next;
    return { code: 0, message: "ok", data: next };
  }

  /** 打手工作台：汇总 + 待接单池（pendingTake 且未分配） */
  public getWorkerWorkbench(
    workerId: string,
    presenceMode: "online" | "rest"
  ): ApiEnvelope<{
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
  }> {
    const pendingPool = this.orders.filter((o) => {
      if (o.status !== "pendingTake") return false;
      if ((o.assignedWorkerId ?? "").trim().length > 0) return false;
      return true;
    });

    const today = todayUtcPrefix();
    const yesterday = yesterdayUtcPrefix();
    const todayIncome = incomeSumForWorkerOnDay(this.orders, workerId, today);
    const yesterdayIncome = incomeSumForWorkerOnDay(this.orders, workerId, yesterday);

    let incomeTrendPercent: number | null = null;
    if (yesterdayIncome <= 0 && todayIncome > 0) incomeTrendPercent = 100;
    else if (yesterdayIncome > 0) {
      incomeTrendPercent =
        Math.round(((todayIncome - yesterdayIncome) / yesterdayIncome) * 1000) / 10;
    }

    const mineDone = this.orders.filter(
      (o) => o.assignedWorkerId === workerId && o.status === "done"
    );
    const mineCancelled = this.orders.filter(
      (o) => o.assignedWorkerId === workerId && o.status === "cancelled"
    );
    const denom = mineDone.length + mineCancelled.length;
    const successRatePercent =
      denom === 0 ? 100 : Math.round((mineDone.length / denom) * 1000) / 10;

    const completedOrdersToday = mineDone.filter((o) =>
      (o.completedAt ?? "").startsWith(today)
    ).length;

    const myProcessingCount = this.orders.filter(
      (o) =>
        o.assignedWorkerId === workerId && (o.status === "serving" || o.status === "pendingDone")
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
  public listWorkerOrders(
    workerId: string,
    filters: WorkerListFilters
  ): ApiEnvelope<{ items: Order[]; total: number; counts: WorkerOrderTabCounts }> {
    const bucket = filters.bucket ?? "all";
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 20)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const filtered = this.orders.filter((item) => matchesWorkerBucket(item, workerId, bucket));
    const counts = buildWorkerTabCounts(this.orders, workerId);

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
  public getWorkerOrder(
    workerId: string,
    orderId: string
  ): ApiEnvelope<Order & { workerStage: WorkerOrderStage }> {
    const found = this.orders.find((item) => item.id === orderId) ?? null;
    if (!found) return { code: 404, message: "order not found", data: null };

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
  public startWorkerOrder(
    workerId: string,
    orderId: string
  ): ApiEnvelope<Order & { workerStage: WorkerOrderStage }> {
    const index = this.orders.findIndex((item) => item.id === orderId);
    if (index < 0) return { code: 404, message: "order not found", data: null };

    const order = this.orders[index];
    if (order.status !== "pendingTake") {
      return { code: 400, message: "order is not pending acceptance", data: null };
    }
    if ((order.assignedWorkerId ?? "").trim().length > 0) {
      return { code: 400, message: "order already assigned", data: null };
    }

    const next: Order = {
      ...order,
      status: "serving",
      assignedWorkerId: workerId,
      assignedAt: formatCreatedAt(),
      progress: buildProgress("serving")
    };
    this.orders[index] = next;

    return {
      code: 0,
      message: "ok",
      data: { ...next, workerStage: deriveWorkerStage(next) }
    };
  }

  /** 打手：确认完成服务（serving → pendingDone，等待老板验收） */
  public workerConfirmComplete(
    workerId: string,
    orderId: string
  ): ApiEnvelope<Order & { workerStage: WorkerOrderStage }> {
    const index = this.orders.findIndex((item) => item.id === orderId);
    if (index < 0) return { code: 404, message: "order not found", data: null };

    const order = this.orders[index];
    if (order.assignedWorkerId !== workerId) return { code: 403, message: "forbidden", data: null };
    if (order.status !== "serving") {
      return { code: 400, message: "order is not in serving status", data: null };
    }

    const next: Order = {
      ...order,
      status: "pendingDone",
      progress: buildProgress("pendingDone")
    };
    this.orders[index] = next;

    return {
      code: 0,
      message: "ok",
      data: { ...next, workerStage: deriveWorkerStage(next) }
    };
  }

  /** 小程序「我的」页：当前用户订单 Tab 聚合数量 */
  public getMiniOrderTabCounts(userId: string): MiniOrderTabCounts {
    const mine = this.orders.filter((item) => item.userId === userId);
    return this.buildMiniTabCounts(mine);
  }

  /** 小程序：当前用户订单列表 + Tab 数量 */
  public listMiniOrders(
    userId: string,
    filters: MiniListFilters
  ): ApiEnvelope<{ items: Order[]; total: number; counts: MiniOrderTabCounts }> {
    const keyword = normalizeKeyword(filters.keyword);
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 20)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const mine = this.orders.filter((item) => item.userId === userId);
    const counts = this.buildMiniTabCounts(mine);

    const filtered = mine.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (!keyword) return true;
      const statusLabel = STATUS_LABEL_MAP[item.status];
      return (
        item.orderNo.toLowerCase().includes(keyword) ||
        item.serviceTitle.toLowerCase().includes(keyword) ||
        statusLabel.toLowerCase().includes(keyword)
      );
    });

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

  /** 小程序：创建订单（待付款） */
  public createMiniOrder(userId: string, productId: string): ApiEnvelope<Order> {
    const trimmedId = productId.trim();
    if (!trimmedId) return { code: 400, message: "productId is required", data: null };

    const productEnvelope = this.productService.getProduct(trimmedId);
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
    const deliveries = lines.slice(0, 12).map((text, index) => ({
      id: `d-${index}`,
      text,
      done: false
    }));

    const order: Order = {
      id: orderId,
      orderNo: createOrderNo(),
      status: "pendingPay",
      packageTag,
      serviceTitle,
      amount: product.price,
      quantityText: "× 1 套服务",
      coverImage: product.heroImages[0] ?? product.imageUrl,
      createdAt: formatCreatedAt(),
      payMethod: "待支付",
      paidAmount: 0,
      progress: buildProgress("pendingPay"),
      deliveries,
      createdBy: userId,
      userId,
      productId: product.id,
      refundStatus: "none",
      assignedWorkerId: "",
      assignedAt: "",
      completedAt: ""
    };

    this.orders.unshift(order);
    return { code: 0, message: "ok", data: order };
  }

  /** 小程序：订单详情（归属校验） */
  public getMiniOrder(userId: string, orderId: string): ApiEnvelope<Order> {
    const found = this.orders.find((item) => item.id === orderId) ?? null;
    if (!found) return { code: 404, message: "order not found", data: null };
    if (found.userId !== userId) return { code: 403, message: "forbidden", data: null };
    return { code: 0, message: "ok", data: found };
  }

  /** 小程序：申请退款（写入退款状态） */
  public requestRefundMini(userId: string, orderId: string): ApiEnvelope<{ success: true }> {
    const found = this.orders.find((item) => item.id === orderId) ?? null;
    if (!found) return { code: 404, message: "order not found", data: null };
    if (found.userId !== userId) return { code: 403, message: "forbidden", data: null };
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

    const next: Order = { ...found, refundStatus: "pending" satisfies RefundStatus };
    const idx = this.orders.findIndex((item) => item.id === orderId);
    if (idx >= 0) this.orders[idx] = next;

    return { code: 0, message: "ok", data: { success: true } };
  }

  /** 统计小程序 Tab 数量（基于已筛选的当前用户订单列表） */
  private buildMiniTabCounts(mine: Order[]): MiniOrderTabCounts {
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
  public markMiniOrderPaidFromNotify(outTradeNo: string, wxTransactionId?: string): boolean {
    const idx = this.orders.findIndex((o) => o.id === outTradeNo);
    if (idx < 0) return false;
    const found = this.orders[idx];
    if (found.status !== "pendingPay") return true;
    const next: Order = {
      ...found,
      status: "pendingTake",
      paidAmount: found.amount,
      payMethod: "微信支付",
      progress: buildProgress("pendingTake"),
      wxTransactionId: wxTransactionId ?? found.wxTransactionId
    };
    this.orders[idx] = next;
    return true;
  }

  /**
   * 小程序 JSAPI 预下单并生成调起参数；未配置商户或开启 WECHAT_PAY_DEV_SIMULATE 时直接标记已支付。
   */
  public async requestMiniOrderWechatPrepay(
    userId: string,
    orderId: string
  ): Promise<ApiEnvelope<MiniWechatPrepayData>> {
    const found = this.orders.find((item) => item.id === orderId) ?? null;
    if (!found) return { code: 404, message: "order not found", data: null };
    if (found.userId !== userId) return { code: 403, message: "forbidden", data: null };
    if (found.status !== "pendingPay") {
      return { code: 400, message: "订单状态不可支付", data: null };
    }

    if (this.wechatPayService.shouldSimulateImmediatePay()) {
      this.markMiniOrderPaidFromNotify(found.id, "SIMULATED");
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

  /** 分配给指定打手的订单（用于收益结算聚合） */
  public findOrdersAssignedToWorker(workerId: string): Order[] {
    return this.orders.filter((item) => item.assignedWorkerId === workerId);
  }
}

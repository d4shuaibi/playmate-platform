import { Injectable } from "@nestjs/common";
import { Order, OrderStatus } from "./order.types";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

type ListFilters = {
  keyword?: string;
  status?: OrderStatus;
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

const buildProgress = (status: OrderStatus) => {
  const stageIndex = STATUS_STAGE_INDEX[status];
  return PROGRESS_TEMPLATE.map((step, index) => ({
    ...step,
    done: stageIndex >= 0 && index <= stageIndex
  }));
};

@Injectable()
export class OrderService {
  private readonly orders: Order[] = [];

  constructor() {
    const allowSeed = process.env.SEED_DEMO === "true" || process.env.NODE_ENV !== "production";
    if (!allowSeed) return;

    this.orders.push(
      {
        id: "o1",
        orderNo: "ORD-8829-X",
        status: "serving",
        packageTag: "至尊服务",
        serviceTitle: "暗区突围：全地图红卡带出",
        amount: 2899,
        quantityText: "× 1 套服务",
        coverImage:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDYi_2hfQ_QdmpZ6R0mEIRmCWANryQA3XfuFHRAshY17FNjeqygj4SItHwCbhseAOQYktoTId8sfzwAndrUsafJXNXzp30xQMB3VMxOeDcysbav0fMG1fXmLNFfkZaH__ly4KkLomU6q3tN0ljl3kdV44q7QkW67QmQuLbkDEPovMEWPHTu7yT_Vwbk2-9GgOhOSorTrrv1cCSqxCZMw-Dc06d256Yzx6naV6K9vwg1-JsOA9OehopSCDGbkvn_r9ZrGpV3o0XskdA",
        createdAt: "2023.11.24 14:30",
        payMethod: "极氪代币支付",
        paidAmount: 2899,
        progress: buildProgress("serving"),
        deliveries: [
          { id: "d1", text: "绝密红卡 (400-1000万价值)", done: true },
          { id: "d2", text: "全套满配装备 & 弹药补给", done: true },
          { id: "d3", text: "角色技能等级经验提升", done: false }
        ],
        createdBy: "seed"
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
        createdBy: "seed"
      }
    );
  }

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

  public getOrder(id: string): ApiEnvelope<Order> {
    const found = this.orders.find((item) => item.id === id) ?? null;
    if (!found) return { code: 404, message: "order not found", data: null };
    return { code: 0, message: "ok", data: found };
  }
}

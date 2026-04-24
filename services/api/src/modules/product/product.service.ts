import { Injectable } from "@nestjs/common";
import { Product, type ProductNotice, ProductStatus } from "./product.types";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

type ListFilters = {
  name?: string;
  categoryId?: string;
  status?: ProductStatus;
  page?: number;
  pageSize?: number;
};

type CreateProductRequest = {
  name: string;
  imageUrl: string;
  heroImages: string[];
  titleAccent?: string;
  categoryId: string;
  categoryName: string;
  price: number;
  originPrice?: number | null;
  stockText?: string;
  badges?: string[];
  descriptionLines?: string[];
  notices?: ProductNotice[];
  createdBy: string;
};

type UpdateProductRequest = {
  name: string;
  imageUrl: string;
  heroImages: string[];
  titleAccent?: string;
  categoryId: string;
  categoryName: string;
  price: number;
  originPrice?: number | null;
  stockText?: string;
  badges?: string[];
  descriptionLines?: string[];
  notices?: ProductNotice[];
};

const normalizeKeyword = (value: string | undefined) => {
  return (value ?? "").trim().toLowerCase();
};

const createProductId = () => {
  return `P-${Math.floor(10000 + Math.random() * 90000)}`;
};

const normalizePrice = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return null;
  return Math.round(num * 100) / 100;
};

const normalizeOptionalPrice = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return null;
  return Math.round(num * 100) / 100;
};

const normalizeStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const normalizeNotices = (value: unknown): ProductNotice[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as { id?: unknown; level?: unknown; text?: unknown };
      const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : "";
      const level =
        raw.level === "warn" || raw.level === "error" || raw.level === "info" ? raw.level : null;
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      if (!id || !level || !text) return null;
      return { id, level, text } as ProductNotice;
    })
    .filter((item): item is ProductNotice => Boolean(item));
};

@Injectable()
export class ProductService {
  private readonly products: Product[] = [];

  constructor() {
    const allowSeed = process.env.SEED_DEMO === "true" || process.env.NODE_ENV !== "production";
    if (!allowSeed) return;
    // dev seed：默认上架 1 个商品，便于小程序联调（分类页 + 详情页）
    this.products.push({
      id: "P-10001",
      name: "绝密保底400-1000万！",
      imageUrl:
        "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=80",
      heroImages: [
        "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80"
      ],
      titleAccent: "赠送转盘",
      categoryId: "PC-1002",
      categoryName: "保底类",
      price: 69.9,
      originPrice: 128,
      stockText: "LIMITED STOCK",
      badges: ["极速接单", "极速响应", "服务至上", "官方严选"],
      descriptionLines: [
        "必须打绝密并且保底400-1000万！（地图由打手选择）",
        "可单护可双护根据打手情况来。",
        "专业打手，稳定产出，极速回款。"
      ],
      notices: [
        {
          id: "notice-1",
          level: "error",
          text: "未成年禁止下单。本店严格执行国家未成年人防沉迷相关规定。"
        },
        {
          id: "notice-2",
          level: "error",
          text: "拒绝卡保底行为。一经发现，立即终止服务且不予退款。"
        },
        {
          id: "notice-3",
          level: "info",
          text: "服务过程中请勿顶号，否则造成的损失由买家自行承担。"
        }
      ],
      status: "enabled",
      createdAt: "2026-04-24",
      createdBy: "seed"
    });
  }

  public listProducts(filters: ListFilters): ApiEnvelope<{ items: Product[]; total: number }> {
    const keyword = normalizeKeyword(filters.name);
    const categoryId = (filters.categoryId ?? "").trim();
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const filtered = this.products.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      if (!keyword) return true;
      return item.name.toLowerCase().includes(keyword) || item.id.toLowerCase().includes(keyword);
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

  public createProduct(body: CreateProductRequest): ApiEnvelope<Product> {
    const name = body.name.trim();
    const imageUrl = body.imageUrl.trim();
    const heroImages = normalizeStringArray(body.heroImages);
    const titleAccent = (body.titleAccent ?? "").trim();
    const categoryId = body.categoryId.trim();
    const categoryName = body.categoryName.trim();
    const createdBy = body.createdBy.trim();
    const price = normalizePrice(body.price);
    const originPrice = normalizeOptionalPrice(body.originPrice);
    const stockText = (body.stockText ?? "").trim();
    const badges = normalizeStringArray(body.badges);
    const descriptionLines = normalizeStringArray(body.descriptionLines);
    const notices = normalizeNotices(body.notices);

    if (!name) return { code: 400, message: "name is required", data: null };
    if (!imageUrl) return { code: 400, message: "imageUrl is required", data: null };
    if (heroImages.length === 0)
      return { code: 400, message: "heroImages is required", data: null };
    if (!categoryId) return { code: 400, message: "categoryId is required", data: null };
    if (!categoryName) return { code: 400, message: "categoryName is required", data: null };
    if (!createdBy) return { code: 400, message: "createdBy is required", data: null };
    if (!price) return { code: 400, message: "price is invalid", data: null };

    const product: Product = {
      id: createProductId(),
      name,
      imageUrl,
      heroImages,
      titleAccent,
      categoryId,
      categoryName,
      price,
      originPrice,
      stockText,
      badges,
      descriptionLines,
      notices,
      status: "enabled",
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy
    };

    this.products.unshift(product);

    return { code: 0, message: "ok", data: product };
  }

  public getProduct(id: string): ApiEnvelope<Product> {
    const found = this.products.find((item) => item.id === id) ?? null;
    if (!found) return { code: 404, message: "product not found", data: null };
    return { code: 0, message: "ok", data: found };
  }

  public updateProduct(id: string, body: UpdateProductRequest): ApiEnvelope<Product> {
    const index = this.products.findIndex((item) => item.id === id);
    if (index < 0) return { code: 404, message: "product not found", data: null };

    const name = body.name.trim();
    const imageUrl = body.imageUrl.trim();
    const heroImages = normalizeStringArray(body.heroImages);
    const titleAccent = (body.titleAccent ?? "").trim();
    const categoryId = body.categoryId.trim();
    const categoryName = body.categoryName.trim();
    const price = normalizePrice(body.price);
    const originPrice = normalizeOptionalPrice(body.originPrice);
    const stockText = (body.stockText ?? "").trim();
    const badges = normalizeStringArray(body.badges);
    const descriptionLines = normalizeStringArray(body.descriptionLines);
    const notices = normalizeNotices(body.notices);

    if (!name) return { code: 400, message: "name is required", data: null };
    if (!imageUrl) return { code: 400, message: "imageUrl is required", data: null };
    if (heroImages.length === 0)
      return { code: 400, message: "heroImages is required", data: null };
    if (!categoryId) return { code: 400, message: "categoryId is required", data: null };
    if (!categoryName) return { code: 400, message: "categoryName is required", data: null };
    if (!price) return { code: 400, message: "price is invalid", data: null };

    const current = this.products[index];
    const next: Product = {
      ...current,
      name,
      imageUrl,
      heroImages,
      titleAccent,
      categoryId,
      categoryName,
      price,
      originPrice,
      stockText,
      badges,
      descriptionLines,
      notices
    };
    this.products[index] = next;
    return { code: 0, message: "ok", data: next };
  }

  public disableProduct(id: string): ApiEnvelope<{ success: true }> {
    const index = this.products.findIndex((item) => item.id === id);
    if (index < 0) return { code: 404, message: "product not found", data: null };
    this.products[index] = { ...this.products[index], status: "disabled" };
    return { code: 0, message: "ok", data: { success: true } };
  }

  public enableProduct(id: string): ApiEnvelope<{ success: true }> {
    const index = this.products.findIndex((item) => item.id === id);
    if (index < 0) return { code: 404, message: "product not found", data: null };
    this.products[index] = { ...this.products[index], status: "enabled" };
    return { code: 0, message: "ok", data: { success: true } };
  }
}

import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { CatalogProductStatus } from "@prisma/client";
import { decimalLikeToNumber } from "../../lib/decimal-like";
import { PrismaService } from "../../prisma/prisma.service";
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

const normalizeKeyword = (value: string | undefined): string => {
  return (value ?? "").trim().toLowerCase();
};

const createProductId = (): string => {
  return `P-${Math.floor(10000 + Math.random() * 90000)}`;
};

const normalizePrice = (value: unknown): number | null => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return null;
  return Math.round(num * 100) / 100;
};

const normalizeOptionalPrice = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return null;
  return Math.round(num * 100) / 100;
};

const normalizeStringArray = (value: unknown): string[] => {
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

const parseNoticesJson = (raw: Prisma.JsonValue): ProductNotice[] => {
  return normalizeNotices(raw);
};

const statusToApi = (s: CatalogProductStatus): ProductStatus =>
  s === CatalogProductStatus.enabled ? "enabled" : "disabled";

const statusToDb = (s: ProductStatus): CatalogProductStatus =>
  s === "enabled" ? CatalogProductStatus.enabled : CatalogProductStatus.disabled;

const mapRowToProduct = (row: {
  id: string;
  name: string;
  imageUrl: string;
  heroImages: Prisma.JsonValue;
  titleAccent: string;
  categoryId: string;
  categoryName: string;
  price: unknown;
  originPrice: unknown | null;
  stockText: string;
  badges: Prisma.JsonValue;
  descriptionLines: Prisma.JsonValue;
  notices: Prisma.JsonValue;
  status: CatalogProductStatus;
  createdAt: Date;
  createdBy: string;
}): Product => ({
  id: row.id,
  name: row.name,
  imageUrl: row.imageUrl,
  heroImages: row.heroImages as string[],
  titleAccent: row.titleAccent,
  categoryId: row.categoryId,
  categoryName: row.categoryName,
  price: decimalLikeToNumber(row.price),
  originPrice: row.originPrice === null ? null : decimalLikeToNumber(row.originPrice),
  stockText: row.stockText,
  badges: row.badges as string[],
  descriptionLines: row.descriptionLines as string[],
  notices: parseNoticesJson(row.notices),
  status: statusToApi(row.status),
  createdAt: row.createdAt.toISOString().slice(0, 10),
  createdBy: row.createdBy
});

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  public async listProducts(
    filters: ListFilters
  ): Promise<ApiEnvelope<{ items: Product[]; total: number }>> {
    const keyword = normalizeKeyword(filters.name);
    const categoryId = (filters.categoryId ?? "").trim();
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const where: Prisma.ProductWhereInput = {
      ...(filters.status ? { status: statusToDb(filters.status) } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(keyword.length > 0
        ? {
            OR: [
              { name: { contains: keyword, mode: "insensitive" } },
              { id: { contains: keyword, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
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
        items: rows.map(mapRowToProduct),
        total
      }
    };
  }

  public async createProduct(body: CreateProductRequest): Promise<ApiEnvelope<Product>> {
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

    const cat = await this.prisma.productCategory.findUnique({ where: { id: categoryId } });
    if (!cat || cat.disabled) {
      return { code: 400, message: "category not found or disabled", data: null };
    }

    let id = "";
    for (let i = 0; i < 8; i += 1) {
      const candidate = createProductId();
      const hit = await this.prisma.product.findUnique({ where: { id: candidate } });
      if (!hit) {
        id = candidate;
        break;
      }
    }
    if (!id) id = createProductId();

    const noticesJson = notices as unknown as Prisma.InputJsonValue;

    const row = await this.prisma.product.create({
      data: {
        id,
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
        notices: noticesJson,
        status: CatalogProductStatus.enabled,
        createdBy
      }
    });

    return { code: 0, message: "ok", data: mapRowToProduct(row) };
  }

  public async getProduct(id: string): Promise<ApiEnvelope<Product>> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    if (!row) return { code: 404, message: "product not found", data: null };
    return { code: 0, message: "ok", data: mapRowToProduct(row) };
  }

  public async updateProduct(
    id: string,
    body: UpdateProductRequest
  ): Promise<ApiEnvelope<Product>> {
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

    const cat = await this.prisma.productCategory.findUnique({ where: { id: categoryId } });
    if (!cat || cat.disabled) {
      return { code: 400, message: "category not found or disabled", data: null };
    }

    try {
      const row = await this.prisma.product.update({
        where: { id },
        data: {
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
          notices: notices as unknown as Prisma.InputJsonValue
        }
      });
      return { code: 0, message: "ok", data: mapRowToProduct(row) };
    } catch {
      return { code: 404, message: "product not found", data: null };
    }
  }

  public async disableProduct(id: string): Promise<ApiEnvelope<{ success: true }>> {
    try {
      await this.prisma.product.update({
        where: { id },
        data: { status: CatalogProductStatus.disabled }
      });
      return { code: 0, message: "ok", data: { success: true } };
    } catch {
      return { code: 404, message: "product not found", data: null };
    }
  }

  public async enableProduct(id: string): Promise<ApiEnvelope<{ success: true }>> {
    try {
      await this.prisma.product.update({
        where: { id },
        data: { status: CatalogProductStatus.enabled }
      });
      return { code: 0, message: "ok", data: { success: true } };
    } catch {
      return { code: 404, message: "product not found", data: null };
    }
  }
}

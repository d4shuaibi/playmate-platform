import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductCategory } from "./product-category.types";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

type ListFilters = {
  keyword?: string;
  disabled?: boolean;
  page?: number;
  pageSize?: number;
};

type CreateCategoryRequest = {
  name: string;
  createdBy: string;
};

type UpdateCategoryRequest = {
  name: string;
};

const normalizeKeyword = (value: string | undefined): string => {
  return (value ?? "").trim().toLowerCase();
};

const createCategoryId = (): string => {
  return `PC-${Math.floor(1000 + Math.random() * 9000)}`;
};

const mapRowToCategory = (row: {
  id: string;
  name: string;
  disabled: boolean;
  createdAt: Date;
  createdBy: string;
}): ProductCategory => ({
  id: row.id,
  name: row.name,
  disabled: row.disabled,
  createdAt: row.createdAt.toISOString().slice(0, 10),
  createdBy: row.createdBy
});

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  public async listCategories(
    filters: ListFilters
  ): Promise<ApiEnvelope<{ items: ProductCategory[]; total: number }>> {
    const keywordRaw = normalizeKeyword(filters.keyword);
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const where: Prisma.ProductCategoryWhereInput = {
      ...(filters.disabled !== undefined ? { disabled: filters.disabled } : {}),
      ...(keywordRaw.length > 0
        ? {
            OR: [{ name: { contains: keywordRaw } }, { id: { contains: keywordRaw } }]
          }
        : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.productCategory.count({ where }),
      this.prisma.productCategory.findMany({
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
        items: rows.map(mapRowToCategory),
        total
      }
    };
  }

  public async createCategory(body: CreateCategoryRequest): Promise<ApiEnvelope<ProductCategory>> {
    const name = body.name.trim();
    const createdBy = body.createdBy.trim();
    if (!name) return { code: 400, message: "name is required", data: null };
    if (!createdBy) return { code: 400, message: "createdBy is required", data: null };

    let id = "";
    for (let i = 0; i < 8; i += 1) {
      const candidate = createCategoryId();
      const hit = await this.prisma.productCategory.findUnique({ where: { id: candidate } });
      if (!hit) {
        id = candidate;
        break;
      }
    }
    if (!id) {
      id = createCategoryId();
    }

    const row = await this.prisma.productCategory.create({
      data: { id, name, disabled: false, createdBy }
    });

    return { code: 0, message: "ok", data: mapRowToCategory(row) };
  }

  public async getCategory(id: string): Promise<ApiEnvelope<ProductCategory>> {
    const row = await this.prisma.productCategory.findUnique({ where: { id } });
    if (!row) return { code: 404, message: "category not found", data: null };
    return { code: 0, message: "ok", data: mapRowToCategory(row) };
  }

  public async updateCategory(
    id: string,
    body: UpdateCategoryRequest
  ): Promise<ApiEnvelope<ProductCategory>> {
    const name = body.name.trim();
    if (!name) return { code: 400, message: "name is required", data: null };

    try {
      const row = await this.prisma.productCategory.update({
        where: { id },
        data: { name }
      });
      return { code: 0, message: "ok", data: mapRowToCategory(row) };
    } catch {
      return { code: 404, message: "category not found", data: null };
    }
  }

  public async disableCategory(id: string): Promise<ApiEnvelope<{ success: true }>> {
    try {
      await this.prisma.productCategory.update({ where: { id }, data: { disabled: true } });
      return { code: 0, message: "ok", data: { success: true } };
    } catch {
      return { code: 404, message: "category not found", data: null };
    }
  }

  public async enableCategory(id: string): Promise<ApiEnvelope<{ success: true }>> {
    try {
      await this.prisma.productCategory.update({ where: { id }, data: { disabled: false } });
      return { code: 0, message: "ok", data: { success: true } };
    } catch {
      return { code: 404, message: "category not found", data: null };
    }
  }
}

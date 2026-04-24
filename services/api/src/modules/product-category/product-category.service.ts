import { Injectable } from "@nestjs/common";
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

const normalizeKeyword = (value: string | undefined) => {
  return (value ?? "").trim().toLowerCase();
};

const createCategoryId = () => {
  return `PC-${Math.floor(1000 + Math.random() * 9000)}`;
};

@Injectable()
export class ProductCategoryService {
  private readonly categories: ProductCategory[] = [];

  constructor() {
    const allowSeed = process.env.SEED_DEMO === "true" || process.env.NODE_ENV !== "production";
    if (!allowSeed) return;
    // dev seed: 便于小程序与管理端联调
    this.categories.push(
      {
        id: "PC-1001",
        name: "带出类",
        disabled: false,
        createdAt: "2026-04-24",
        createdBy: "seed"
      },
      {
        id: "PC-1002",
        name: "保底类",
        disabled: false,
        createdAt: "2026-04-24",
        createdBy: "seed"
      }
    );
  }

  public listCategories(
    filters: ListFilters
  ): ApiEnvelope<{ items: ProductCategory[]; total: number }> {
    const keyword = normalizeKeyword(filters.keyword);
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const filtered = this.categories.filter((item) => {
      if (filters.disabled !== undefined && item.disabled !== filters.disabled) return false;
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

  public createCategory(body: CreateCategoryRequest): ApiEnvelope<ProductCategory> {
    const name = body.name.trim();
    const createdBy = body.createdBy.trim();
    if (!name) return { code: 400, message: "name is required", data: null };
    if (!createdBy) return { code: 400, message: "createdBy is required", data: null };

    const category: ProductCategory = {
      id: createCategoryId(),
      name,
      disabled: false,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy
    };
    this.categories.unshift(category);

    return { code: 0, message: "ok", data: category };
  }

  public getCategory(id: string): ApiEnvelope<ProductCategory> {
    const found = this.categories.find((item) => item.id === id) ?? null;
    if (!found) return { code: 404, message: "category not found", data: null };
    return { code: 0, message: "ok", data: found };
  }

  public updateCategory(id: string, body: UpdateCategoryRequest): ApiEnvelope<ProductCategory> {
    const name = body.name.trim();
    if (!name) return { code: 400, message: "name is required", data: null };
    const index = this.categories.findIndex((item) => item.id === id);
    if (index < 0) return { code: 404, message: "category not found", data: null };

    const current = this.categories[index];
    const next: ProductCategory = {
      ...current,
      name
    };
    this.categories[index] = next;
    return { code: 0, message: "ok", data: next };
  }

  public disableCategory(id: string): ApiEnvelope<{ success: true }> {
    const index = this.categories.findIndex((item) => item.id === id);
    if (index < 0) return { code: 404, message: "category not found", data: null };
    this.categories[index] = { ...this.categories[index], disabled: true };
    return { code: 0, message: "ok", data: { success: true } };
  }

  public enableCategory(id: string): ApiEnvelope<{ success: true }> {
    const index = this.categories.findIndex((item) => item.id === id);
    if (index < 0) return { code: 404, message: "category not found", data: null };
    this.categories[index] = { ...this.categories[index], disabled: false };
    return { code: 0, message: "ok", data: { success: true } };
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { type Request } from "express";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AdminPermissionGuard } from "../auth/admin-permission.guard";
import { RequireAdminPermissions } from "../auth/admin-permission.decorator";
import { ProductStatus } from "./product.types";
import { ProductService } from "./product.service";

type RequestWithAdmin = Request & { adminAuth?: { sub?: string } };

@Controller("products")
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * GET /api/products?name=&categoryId=&status=&page=&pageSize=
   */
  @Get()
  @RequireAdminPermissions("product.read")
  async list(
    @Query("name") name?: string,
    @Query("categoryId") categoryId?: string,
    @Query("status") status?: ProductStatus,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.productService.listProducts({
      name: name ?? "",
      categoryId: categoryId ?? "",
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * POST /api/products
   * Body: { name, imageUrl, heroImages, titleAccent, categoryId, categoryName, price, originPrice, stockText, badges, descriptionLines, notices }
   */
  @Post()
  @RequireAdminPermissions("product.write")
  async create(
    @Body()
    body: {
      name?: string;
      imageUrl?: string;
      heroImages?: string[];
      titleAccent?: string;
      categoryId?: string;
      categoryName?: string;
      price?: number;
      originPrice?: number | null;
      stockText?: string;
      badges?: string[];
      descriptionLines?: string[];
      notices?: Array<{ id?: string; level?: "warn" | "error" | "info"; text?: string }>;
    },
    @Req() req: RequestWithAdmin
  ) {
    return this.productService.createProduct({
      name: body?.name ?? "",
      imageUrl: body?.imageUrl ?? "",
      heroImages: body?.heroImages ?? [],
      titleAccent: body?.titleAccent ?? "",
      categoryId: body?.categoryId ?? "",
      categoryName: body?.categoryName ?? "",
      price: body?.price ?? 0,
      originPrice: body?.originPrice ?? null,
      stockText: body?.stockText ?? "",
      badges: body?.badges ?? [],
      descriptionLines: body?.descriptionLines ?? [],
      notices: (body?.notices ?? []).map((item) => ({
        id: item?.id ?? "",
        level: item?.level ?? "info",
        text: item?.text ?? ""
      })),
      createdBy: req.adminAuth?.sub ?? "admin"
    });
  }

  /**
   * GET /api/products/:id
   */
  @Get(":id")
  @RequireAdminPermissions("product.read")
  async detail(@Param("id") id: string) {
    return this.productService.getProduct(id);
  }

  /**
   * PATCH /api/products/:id
   * Body: { name, imageUrl, heroImages, titleAccent, categoryId, categoryName, price, originPrice, stockText, badges, descriptionLines, notices }
   */
  @Patch(":id")
  @RequireAdminPermissions("product.write")
  async update(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      imageUrl?: string;
      heroImages?: string[];
      titleAccent?: string;
      categoryId?: string;
      categoryName?: string;
      price?: number;
      originPrice?: number | null;
      stockText?: string;
      badges?: string[];
      descriptionLines?: string[];
      notices?: Array<{ id?: string; level?: "warn" | "error" | "info"; text?: string }>;
    }
  ) {
    return this.productService.updateProduct(id, {
      name: body?.name ?? "",
      imageUrl: body?.imageUrl ?? "",
      heroImages: body?.heroImages ?? [],
      titleAccent: body?.titleAccent ?? "",
      categoryId: body?.categoryId ?? "",
      categoryName: body?.categoryName ?? "",
      price: body?.price ?? 0,
      originPrice: body?.originPrice ?? null,
      stockText: body?.stockText ?? "",
      badges: body?.badges ?? [],
      descriptionLines: body?.descriptionLines ?? [],
      notices: (body?.notices ?? []).map((item) => ({
        id: item?.id ?? "",
        level: item?.level ?? "info",
        text: item?.text ?? ""
      }))
    });
  }

  /**
   * PATCH /api/products/:id/disable
   */
  @Patch(":id/disable")
  @RequireAdminPermissions("product.write")
  async disable(@Param("id") id: string) {
    return this.productService.disableProduct(id);
  }

  /**
   * PATCH /api/products/:id/enable
   */
  @Patch(":id/enable")
  @RequireAdminPermissions("product.write")
  async enable(@Param("id") id: string) {
    return this.productService.enableProduct(id);
  }
}

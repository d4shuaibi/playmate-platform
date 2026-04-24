import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { type Request } from "express";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AdminPermissionGuard } from "../auth/admin-permission.guard";
import { RequireAdminPermissions } from "../auth/admin-permission.decorator";
import { ProductCategoryService } from "./product-category.service";

type RequestWithAdmin = Request & { adminAuth?: { sub?: string } };

@Controller("product-categories")
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class ProductCategoryController {
  constructor(private readonly productCategoryService: ProductCategoryService) {}

  /**
   * GET /api/product-categories?keyword=&disabled=&page=&pageSize=
   */
  @Get()
  @RequireAdminPermissions("product.read")
  async list(
    @Query("keyword") keyword?: string,
    @Query("disabled") disabled?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.productCategoryService.listCategories({
      keyword: keyword ?? "",
      disabled: disabled === "true" ? true : disabled === "false" ? false : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * POST /api/product-categories
   * Body: { name }
   */
  @Post()
  @RequireAdminPermissions("product.write")
  async create(@Body() body: { name?: string }, @Req() req: RequestWithAdmin) {
    return this.productCategoryService.createCategory({
      name: body?.name ?? "",
      createdBy: req.adminAuth?.sub ?? "admin"
    });
  }

  /**
   * GET /api/product-categories/:id
   */
  @Get(":id")
  @RequireAdminPermissions("product.read")
  async detail(@Param("id") id: string) {
    return this.productCategoryService.getCategory(id);
  }

  /**
   * PATCH /api/product-categories/:id
   * Body: { name }
   */
  @Patch(":id")
  @RequireAdminPermissions("product.write")
  async update(@Param("id") id: string, @Body() body: { name?: string }) {
    return this.productCategoryService.updateCategory(id, { name: body?.name ?? "" });
  }

  /**
   * PATCH /api/product-categories/:id/disable
   */
  @Patch(":id/disable")
  @RequireAdminPermissions("product.write")
  async disable(@Param("id") id: string) {
    return this.productCategoryService.disableCategory(id);
  }

  /**
   * PATCH /api/product-categories/:id/enable
   */
  @Patch(":id/enable")
  @RequireAdminPermissions("product.write")
  async enable(@Param("id") id: string) {
    return this.productCategoryService.enableCategory(id);
  }
}

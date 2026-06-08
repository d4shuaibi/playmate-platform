import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";
import { type Request } from "express";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AdminPermissionGuard } from "../auth/admin-permission.guard";
import { RequireAdminPermissions } from "../auth/admin-permission.decorator";
import { HomeContentService } from "./home-content.service";
import {
  CreateHomeBannerRequest,
  UpdateHomeBannerRequest,
  CreateHomeNoticeRequest,
  UpdateHomeNoticeRequest
} from "./home-content.types";

type RequestWithAdmin = Request & { adminAuth?: { sub?: string } };

/**
 * 后台管理端 - 首页内容管理（轮播图 + 通知）
 * 需要 admin 认证
 */
@Controller("home-content")
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class HomeContentController {
  constructor(private readonly homeContentService: HomeContentService) {}

  // ==================== Banner ====================

  @Get("banners")
  @RequireAdminPermissions("product.read")
  async listBanners(
    @Query("enabled") enabled?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.homeContentService.listBanners({
      enabled: enabled === undefined ? undefined : enabled === "true",
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10
    });
  }

  @Get("banners/:id")
  @RequireAdminPermissions("product.read")
  async getBanner(@Param("id") id: string) {
    return this.homeContentService.getBanner(id);
  }

  @Post("banners")
  @RequireAdminPermissions("product.write")
  async createBanner(@Body() body: CreateHomeBannerRequest, @Req() req: RequestWithAdmin) {
    const createdBy = req.adminAuth?.sub ?? "system";
    return this.homeContentService.createBanner({ ...body, createdBy });
  }

  @Put("banners/:id")
  @RequireAdminPermissions("product.write")
  async updateBanner(@Param("id") id: string, @Body() body: UpdateHomeBannerRequest) {
    return this.homeContentService.updateBanner(id, body);
  }

  @Delete("banners/:id")
  @RequireAdminPermissions("product.write")
  async deleteBanner(@Param("id") id: string) {
    return this.homeContentService.deleteBanner(id);
  }

  // ==================== Notice ====================

  @Get("notices")
  @RequireAdminPermissions("product.read")
  async listNotices(
    @Query("enabled") enabled?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.homeContentService.listNotices({
      enabled: enabled === undefined ? undefined : enabled === "true",
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10
    });
  }

  @Get("notices/:id")
  @RequireAdminPermissions("product.read")
  async getNotice(@Param("id") id: string) {
    return this.homeContentService.getNotice(id);
  }

  @Post("notices")
  @RequireAdminPermissions("product.write")
  async createNotice(@Body() body: CreateHomeNoticeRequest, @Req() req: RequestWithAdmin) {
    const createdBy = req.adminAuth?.sub ?? "system";
    return this.homeContentService.createNotice({ ...body, createdBy });
  }

  @Put("notices/:id")
  @RequireAdminPermissions("product.write")
  async updateNotice(@Param("id") id: string, @Body() body: UpdateHomeNoticeRequest) {
    return this.homeContentService.updateNotice(id, body);
  }

  @Delete("notices/:id")
  @RequireAdminPermissions("product.write")
  async deleteNotice(@Param("id") id: string) {
    return this.homeContentService.deleteNotice(id);
  }
}

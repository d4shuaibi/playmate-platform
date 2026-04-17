import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { type Request } from "express";
import { AuthService, type MiniLoginRequest } from "./auth.service";
import { AdminAuthService } from "./admin-auth.service";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminPermissionGuard } from "./admin-permission.guard";
import { RequireAdminPermissions } from "./admin-permission.decorator";
import { type AdminAccessPayload } from "./admin-auth.types";

type RequestWithAdmin = Request & {
  adminAuth?: AdminAccessPayload;
};

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminAuthService: AdminAuthService
  ) {}

  /**
   * POST /api/auth/mini/login
   * Body: `{ code }` 为 **getPhoneNumber** 返回的动态令牌；服务端换手机号后按手机号登录或**新建用户**。
   */
  @Post("mini/login")
  async miniLogin(@Body() body: MiniLoginRequest) {
    return this.authService.miniLogin(body);
  }

  /**
   * POST /api/auth/mini/refresh
   * Body: { refreshToken }
   */
  @Post("mini/refresh")
  async miniRefresh(@Body() body: { refreshToken?: string }) {
    return this.authService.miniRefresh({ refreshToken: body?.refreshToken ?? "" });
  }

  /**
   * POST /api/auth/mini/logout
   * Body: { refreshToken }
   */
  @Post("mini/logout")
  async miniLogout(@Body() body: { refreshToken?: string }) {
    return this.authService.miniLogout({ refreshToken: body?.refreshToken ?? "" });
  }

  /**
   * POST /api/auth/admin/challenge
   * Body: { username }
   * 返回一次性 challenge，前端用 `proof = sha256(passwordHash + "." + nonce)` 登录，避免明文密码上传。
   */
  @Post("admin/challenge")
  async adminChallenge(@Body() body: { username?: string }) {
    return this.adminAuthService.createChallenge({ username: body?.username ?? "" });
  }

  /**
   * POST /api/auth/admin/login
   * Body: { username, challengeId, proof }
   */
  @Post("admin/login")
  async adminLogin(@Body() body: { username?: string; challengeId?: string; proof?: string }) {
    return this.adminAuthService.adminLogin({
      username: body?.username ?? "",
      challengeId: body?.challengeId ?? "",
      proof: body?.proof ?? ""
    });
  }

  /**
   * POST /api/auth/admin/refresh
   * Body: { refreshToken }
   */
  @Post("admin/refresh")
  async adminRefresh(@Body() body: { refreshToken?: string }) {
    return this.adminAuthService.adminRefresh({ refreshToken: body?.refreshToken ?? "" });
  }

  /**
   * POST /api/auth/admin/logout
   * Body: { refreshToken }
   */
  @Post("admin/logout")
  async adminLogout(@Body() body: { refreshToken?: string }) {
    return this.adminAuthService.adminLogout({ refreshToken: body?.refreshToken ?? "" });
  }

  /**
   * GET /api/auth/admin/me
   * Header: Authorization: Bearer <accessToken>
   */
  @Get("admin/me")
  @UseGuards(AdminAuthGuard)
  async adminMe(@Req() req: RequestWithAdmin) {
    const payload = req.adminAuth;
    return {
      code: 0,
      message: "ok",
      data: {
        username: payload?.sub ?? "",
        role: payload?.role ?? "customer_service",
        permissions: payload?.permissions ?? []
      }
    };
  }

  /**
   * GET /api/auth/admin/permissions-check
   * 示例：权限守卫用法
   */
  @Get("admin/permissions-check")
  @UseGuards(AdminAuthGuard, AdminPermissionGuard)
  @RequireAdminPermissions("order.read")
  async adminPermissionsCheck() {
    return {
      code: 0,
      message: "ok",
      data: { granted: true }
    };
  }

  /**
   * GET /api/auth/admin/managers
   * 仅老板可见（admin.manage）
   */
  @Get("admin/managers")
  @UseGuards(AdminAuthGuard, AdminPermissionGuard)
  @RequireAdminPermissions("admin.manage")
  async listAdminManagers(
    @Query("name") name?: string,
    @Query("status") status?: "active" | "disabled"
  ) {
    return this.adminAuthService.listAdminManagers({
      name: name ?? "",
      status
    });
  }

  /**
   * GET /api/auth/admin/managers/:id
   */
  @Get("admin/managers/:id")
  @UseGuards(AdminAuthGuard, AdminPermissionGuard)
  @RequireAdminPermissions("admin.manage")
  async getAdminManager(@Param("id") id: string) {
    return this.adminAuthService.getAdminManager(id);
  }

  /**
   * POST /api/auth/admin/managers
   * Body: { name, username, password }
   */
  @Post("admin/managers")
  @UseGuards(AdminAuthGuard, AdminPermissionGuard)
  @RequireAdminPermissions("admin.manage")
  async createAdminManager(@Body() body: { name?: string; username?: string; password?: string }) {
    return this.adminAuthService.createAdminManager({
      name: body?.name ?? "",
      username: body?.username ?? "",
      password: body?.password ?? ""
    });
  }

  /**
   * PATCH /api/auth/admin/managers/:id
   * Body: { name?, password? }
   */
  @Patch("admin/managers/:id")
  @UseGuards(AdminAuthGuard, AdminPermissionGuard)
  @RequireAdminPermissions("admin.manage")
  async updateAdminManager(
    @Param("id") id: string,
    @Body() body: { name?: string; password?: string }
  ) {
    return this.adminAuthService.updateAdminManager(id, {
      name: body?.name ?? "",
      password: body?.password ?? ""
    });
  }

  /**
   * PATCH /api/auth/admin/managers/:id/status
   * Body: { status: active|disabled }
   */
  @Patch("admin/managers/:id/status")
  @UseGuards(AdminAuthGuard, AdminPermissionGuard)
  @RequireAdminPermissions("admin.manage")
  async toggleAdminManagerStatus(
    @Param("id") id: string,
    @Body() body: { status?: "active" | "disabled" }
  ) {
    return this.adminAuthService.toggleAdminManagerStatus(id, body?.status ?? "active");
  }
}

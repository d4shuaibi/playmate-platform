import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthTokenService } from "./auth-token.service";
import { WechatAccessTokenService } from "./wechat-access-token.service";
import { WechatPhoneService } from "./wechat-phone.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminAuthService } from "./admin-auth.service";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminPermissionGuard } from "./admin-permission.guard";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AdminAuthService,
    AdminAuthGuard,
    AdminPermissionGuard,
    WechatAccessTokenService,
    WechatPhoneService,
    PrismaService
  ],
  exports: [AuthService]
})
export class AuthModule {}

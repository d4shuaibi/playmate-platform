import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { WechatAccessTokenService } from "./wechat-access-token.service";
import { WechatPhoneService } from "./wechat-phone.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, WechatAccessTokenService, WechatPhoneService, PrismaService],
  exports: [AuthService]
})
export class AuthModule {}

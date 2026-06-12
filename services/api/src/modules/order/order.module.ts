import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FilesModule } from "../files/files.module";
import { ProductModule } from "../product/product.module";
import { MiniMeController } from "./mini-me.controller";
import { MiniMeService } from "./mini-me.service";
import { MiniOrderController } from "./mini-order.controller";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";
import { WechatPayNotifyController } from "./wechat-pay-notify.controller";
import { WechatPayService } from "./wechat-pay.service";

@Module({
  imports: [AuthModule, ProductModule, FilesModule],
  controllers: [OrderController, MiniOrderController, MiniMeController, WechatPayNotifyController],
  providers: [OrderService, MiniMeService, WechatPayService],
  exports: [OrderService]
})
export class OrderModule {}

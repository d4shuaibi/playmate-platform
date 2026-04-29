import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProductModule } from "../product/product.module";
import { OrderController } from "./order.controller";
import { MiniOrderController } from "./mini-order.controller";
import { MiniMeController } from "./mini-me.controller";
import { MiniMeService } from "./mini-me.service";
import { OrderService } from "./order.service";

@Module({
  imports: [AuthModule, ProductModule],
  controllers: [OrderController, MiniOrderController, MiniMeController],
  providers: [OrderService, MiniMeService],
  exports: [OrderService]
})
export class OrderModule {}

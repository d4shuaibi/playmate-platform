import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CustomerServiceController } from "./customer-service.controller";
import { MiniCustomerServiceController } from "./mini-customer-service.controller";
import { CustomerServiceService } from "./customer-service.service";

@Module({
  imports: [AuthModule],
  controllers: [CustomerServiceController, MiniCustomerServiceController],
  providers: [CustomerServiceService],
  exports: [CustomerServiceService]
})
export class CustomerServiceModule {}

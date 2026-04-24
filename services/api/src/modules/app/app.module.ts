import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "../health/health.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { FilesModule } from "../files/files.module";
import { CustomerServiceModule } from "../customer-service/customer-service.module";
import { ProductCategoryModule } from "../product-category/product-category.module";
import { ProductModule } from "../product/product.module";
import { MiniCatalogModule } from "../mini-catalog/mini-catalog.module";
import { OrderModule } from "../order/order.module";
import { WorkerModule } from "../worker/worker.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    AuthModule,
    FilesModule,
    CustomerServiceModule,
    ProductCategoryModule,
    ProductModule,
    MiniCatalogModule,
    OrderModule,
    WorkerModule,
    HealthModule
  ],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AppModule {}

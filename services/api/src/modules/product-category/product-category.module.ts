import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProductCategoryController } from "./product-category.controller";
import { ProductCategoryService } from "./product-category.service";

@Module({
  imports: [AuthModule],
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService],
  exports: [ProductCategoryService]
})
export class ProductCategoryModule {}

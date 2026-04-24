import { Module } from "@nestjs/common";
import { ProductCategoryModule } from "../product-category/product-category.module";
import { ProductModule } from "../product/product.module";
import { MiniCatalogController } from "./mini-catalog.controller";

@Module({
  imports: [ProductCategoryModule, ProductModule],
  controllers: [MiniCatalogController]
})
export class MiniCatalogModule {}

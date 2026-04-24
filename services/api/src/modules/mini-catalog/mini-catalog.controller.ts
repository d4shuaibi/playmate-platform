import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProductCategoryService } from "../product-category/product-category.service";
import { ProductService } from "../product/product.service";

@Controller("mini")
export class MiniCatalogController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
    private readonly productService: ProductService
  ) {}

  /**
   * GET /api/mini/product-categories
   * 小程序端商品分类（仅返回正常分类）
   */
  @Get("product-categories")
  async listCategories() {
    const data = this.productCategoryService.listCategories({
      disabled: false,
      page: 1,
      pageSize: 100
    });
    return data;
  }

  /**
   * GET /api/mini/products?keyword=&categoryId=
   * 小程序端商品列表（仅返回已上架商品）
   */
  @Get("products")
  async listProducts(@Query("keyword") keyword?: string, @Query("categoryId") categoryId?: string) {
    return this.productService.listProducts({
      name: keyword ?? "",
      categoryId: categoryId ?? "",
      status: "enabled",
      page: 1,
      pageSize: 100
    });
  }

  /**
   * GET /api/mini/products/:id
   * 小程序端商品详情（仅已上架可访问）
   */
  @Get("products/:id")
  async detail(@Param("id") id: string) {
    const result = this.productService.getProduct(id);
    if (result.code !== 0 || !result.data) return result;
    if (result.data.status !== "enabled") {
      return { code: 404, message: "product not found", data: null };
    }
    return result;
  }
}

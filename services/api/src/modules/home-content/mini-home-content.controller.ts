import { Controller, Get } from "@nestjs/common";
import { HomeContentService } from "./home-content.service";

/**
 * 小程序端 - 首页内容（轮播图 + 通知）
 * 无需认证，只返回启用的内容
 */
@Controller("mini")
export class MiniHomeContentController {
  constructor(private readonly homeContentService: HomeContentService) {}

  /**
   * GET /api/mini/banners
   * 获取首页轮播图（仅启用的）
   */
  @Get("banners")
  async listBanners() {
    return this.homeContentService.listBanners({
      enabled: true,
      page: 1,
      pageSize: 10
    });
  }

  /**
   * GET /api/mini/notices
   * 获取首页通知（仅启用的）
   */
  @Get("notices")
  async listNotices() {
    return this.homeContentService.listNotices({
      enabled: true,
      page: 1,
      pageSize: 10
    });
  }
}

import { Module } from "@nestjs/common";
import { HomeContentService } from "./home-content.service";
import { HomeContentController } from "./home-content.controller";
import { MiniHomeContentController } from "./mini-home-content.controller";

@Module({
  controllers: [HomeContentController, MiniHomeContentController],
  providers: [HomeContentService],
  exports: [HomeContentService]
})
export class HomeContentModule {}

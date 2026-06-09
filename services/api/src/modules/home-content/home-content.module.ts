import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { HomeContentService } from "./home-content.service";
import { HomeContentController } from "./home-content.controller";
import { MiniHomeContentController } from "./mini-home-content.controller";

@Module({
  imports: [AuthModule],
  controllers: [HomeContentController, MiniHomeContentController],
  providers: [HomeContentService],
  exports: [HomeContentService]
})
export class HomeContentModule {}

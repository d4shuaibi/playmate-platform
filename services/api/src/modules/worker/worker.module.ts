import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { WorkerAdminController } from "./worker.controller";
import { WorkerMiniController } from "./worker.mini.controller";
import { WorkerService } from "./worker.service";

@Module({
  imports: [AuthModule],
  controllers: [WorkerAdminController, WorkerMiniController],
  providers: [WorkerService],
  exports: [WorkerService]
})
export class WorkerModule {}

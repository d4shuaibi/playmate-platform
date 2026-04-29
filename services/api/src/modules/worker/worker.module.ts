import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OrderModule } from "../order/order.module";
import { WorkerAdminController } from "./worker.controller";
import { WorkerMiniController } from "./worker.mini.controller";
import { WorkerWorkbenchMiniController } from "./worker-workbench.mini.controller";
import { WorkerIncomeMiniController } from "./worker-income.mini.controller";
import { WorkerPresenceService } from "./worker-presence.service";
import { WorkerIncomeService } from "./worker-income.service";
import { WorkerService } from "./worker.service";

@Module({
  imports: [AuthModule, OrderModule],
  controllers: [
    WorkerAdminController,
    WorkerMiniController,
    WorkerWorkbenchMiniController,
    WorkerIncomeMiniController
  ],
  providers: [WorkerService, WorkerPresenceService, WorkerIncomeService],
  exports: [WorkerService]
})
export class WorkerModule {}

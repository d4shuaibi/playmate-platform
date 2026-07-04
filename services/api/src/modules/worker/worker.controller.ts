import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AdminPermissionGuard } from "../auth/admin-permission.guard";
import { RequireAdminPermissions } from "../auth/admin-permission.decorator";
import { type WorkerJoinStatus, type WorkerStatus } from "./worker.types";
import { WorkerService } from "./worker.service";

@Controller()
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class WorkerAdminController {
  constructor(private readonly workerService: WorkerService) {}

  /**
   * GET /api/worker-applications
   */
  @Get("worker-applications")
  @RequireAdminPermissions("worker.audit")
  async listApplications(
    @Query("keyword") keyword?: string,
    @Query("status") status?: WorkerJoinStatus,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.workerService.listApplications({
      keyword: keyword ?? "",
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * PATCH /api/worker-applications/:id/audit
   */
  @Patch("worker-applications/:id/audit")
  @RequireAdminPermissions("worker.audit")
  async auditApplication(
    @Param("id") id: string,
    @Body() body: { action: "approve" | "reject"; rejectReason?: string }
  ) {
    return this.workerService.auditApplication({
      id,
      action: body?.action,
      rejectReason: body?.rejectReason
    });
  }

  /**
   * GET /api/workers
   */
  @Get("workers")
  @RequireAdminPermissions("worker.read")
  async listWorkers(
    @Query("keyword") keyword?: string,
    @Query("joinStatus") joinStatus?: WorkerJoinStatus,
    @Query("status") status?: WorkerStatus,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    return this.workerService.listWorkers({
      keyword: keyword ?? "",
      joinStatus,
      status,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined
    });
  }

  /**
   * GET /api/workers/:id
   */
  @Get("workers/:id")
  @RequireAdminPermissions("worker.read")
  async getWorker(@Param("id") id: string) {
    return this.workerService.getWorker(id);
  }

  /**
   * PATCH /api/workers/:id  修改身份证信息 / 现居住地信息（留底）
   */
  @Patch("workers/:id")
  @RequireAdminPermissions("worker.write")
  async updateWorker(
    @Param("id") id: string,
    @Body()
    body: {
      idNo?: string;
      address?: string;
      idCardFrontUrl?: string;
      idCardBackUrl?: string;
    }
  ) {
    return this.workerService.updateWorkerDetails(id, body ?? {});
  }

  /**
   * PATCH /api/workers/:id/disable
   */
  @Patch("workers/:id/disable")
  @RequireAdminPermissions("worker.write")
  async disableWorker(@Param("id") id: string) {
    return this.workerService.toggleWorkerStatus({ id, status: "disabled" });
  }

  /**
   * PATCH /api/workers/:id/enable
   */
  @Patch("workers/:id/enable")
  @RequireAdminPermissions("worker.write")
  async enableWorker(@Param("id") id: string) {
    return this.workerService.toggleWorkerStatus({ id, status: "active" });
  }
}

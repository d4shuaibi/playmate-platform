import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { MiniAuthGuard } from "../auth/mini-auth.guard";
import { type MiniAccessPayload } from "../auth/mini-auth.guard";
import { CosStorageService } from "../files/cos-storage.service";
import { FilesService } from "../files/files.service";
import { WorkerService } from "./worker.service";

type RequestWithMini = Request & {
  miniAuth?: MiniAccessPayload;
};

@Controller("mini/worker-join")
export class WorkerMiniController {
  constructor(
    private readonly workerService: WorkerService,
    private readonly cosStorage: CosStorageService,
    private readonly filesService: FilesService
  ) {}

  /**
   * GET /api/mini/worker-join/assessment-options
   * 入驻考核类型（无需登录，与提交接口校验同源）
   */
  @Get("assessment-options")
  listAssessmentOptions() {
    return this.workerService.listAssessmentOptions();
  }

  /**
   * GET /api/mini/worker-join/progress
   * 返回当前登录用户的入驻申请状态（无申请返回 null）
   */
  @Get("progress")
  @UseGuards(MiniAuthGuard)
  async getProgress(@Req() req: RequestWithMini) {
    const userId = req.miniAuth?.sub ?? "";
    return this.workerService.getApplicationByUserId(userId);
  }

  /**
   * POST /api/mini/worker-join/apply
   */
  @Post("apply")
  @UseGuards(MiniAuthGuard)
  async apply(
    @Req() req: RequestWithMini,
    @Body()
    body: {
      realName?: string;
      age?: number;
      phone?: string;
      idNo?: string;
      idCardFrontUrl?: string;
      idCardBackUrl?: string;
      assessmentType?: unknown;
    }
  ) {
    const userId = req.miniAuth?.sub ?? "";
    return this.workerService.submitApplication({
      userId,
      realName: body?.realName ?? "",
      age: Number(body?.age),
      phone: body?.phone ?? "",
      idNo: body?.idNo ?? "",
      idCardFrontUrl: body?.idCardFrontUrl ?? "",
      idCardBackUrl: body?.idCardBackUrl ?? "",
      assessmentType: body?.assessmentType
    });
  }

  /**
   * POST /api/mini/worker-join/id-card/upload-url
   * 身份证正反面照片直传凭证；返回 mode=cos 直传 / mode=direct 回退。
   */
  @Post("id-card/upload-url")
  @UseGuards(MiniAuthGuard)
  async createIdCardUploadUrl(@Req() req: RequestWithMini, @Body() body: { filename?: string }) {
    if (!req.miniAuth?.sub) throw new UnauthorizedException();
    if (!this.cosStorage.isEnabled()) {
      return { code: 0, message: "ok", data: { mode: "direct" as const } };
    }

    const meta = await this.cosStorage.createUploadMeta(body?.filename || "id-card");
    const token = Buffer.from(meta.fileId, "utf8").toString("base64url");
    return {
      code: 0,
      message: "ok",
      data: {
        mode: "cos" as const,
        uploadUrl: meta.uploadUrl,
        formFields: meta.formFields,
        fileId: meta.fileId,
        accessUrl: `${this.publicBase(req)}/api/files/cos/${token}`
      }
    };
  }

  /**
   * POST /api/mini/worker-join/id-card/upload
   * multipart/form-data: file=<binary>。仅本地联调（无云存储）回退使用，返回 { url }。
   */
  @Post("id-card/upload")
  @UseGuards(MiniAuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  async uploadIdCard(
    @Req() req: RequestWithMini,
    @UploadedFile()
    file?: { buffer: Buffer; mimetype?: string; originalname?: string }
  ) {
    if (!req.miniAuth?.sub) throw new UnauthorizedException();
    if (!file) return { code: 400, message: "missing file", data: null };

    const saved = this.filesService.saveFile({
      buffer: file.buffer,
      mimeType: file.mimetype || "application/octet-stream",
      originalName: file.originalname || "id-card"
    });
    return {
      code: 0,
      message: "ok",
      data: { url: `${this.publicBase(req)}/api/files/${encodeURIComponent(saved.id)}` }
    };
  }

  /** 依据反代头推断对外可访问的 origin（协议 + host），用于拼接文件访问地址。 */
  private publicBase(req?: Request): string {
    const host = req?.headers?.host ?? "localhost:3000";
    const forwarded = req?.headers?.["x-forwarded-proto"];
    const protocol = (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? "http";
    return `${protocol}://${host}`;
  }
}

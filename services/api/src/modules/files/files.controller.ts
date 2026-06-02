import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { type Request, type Response } from "express";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AdminPermissionGuard } from "../auth/admin-permission.guard";
import { RequireAdminPermissions } from "../auth/admin-permission.decorator";
import { FilesService } from "./files.service";
import { CosStorageService } from "./cos-storage.service";

@Controller("files")
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly cosStorage: CosStorageService
  ) {}

  /**
   * POST /api/files/upload-url
   * 返回对象存储直传凭证（mode=cos）；云托管对象存储不可用时返回 mode=direct，
   * 由前端回退到 /api/files/upload 内存直传（本地联调）。
   */
  @Post("upload-url")
  @UseGuards(AdminAuthGuard, AdminPermissionGuard)
  @RequireAdminPermissions("customer_service.write")
  async createUploadUrl(@Body() body: { filename?: string }, @Req() req: Request) {
    if (!this.cosStorage.isEnabled()) {
      return { code: 0, message: "ok", data: { mode: "direct" as const } };
    }

    const meta = await this.cosStorage.createUploadMeta(body?.filename || "file");
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
   * GET /api/files/cos/:token
   * token 为 base64url(cloud fileId)。换取临时下载直链并 302 跳转，作为稳定展示地址。
   */
  @Get("cos/:token")
  async redirectToCos(@Param("token") token: string, @Res() res: Response) {
    let fileId: string;
    try {
      fileId = Buffer.from(token, "base64url").toString("utf8");
    } catch {
      throw new NotFoundException("invalid file token");
    }
    const url = await this.cosStorage.getDownloadUrl(fileId);
    res.redirect(302, url);
  }

  /**
   * POST /api/files/upload
   * multipart/form-data: file=<binary>
   * 返回 { url }，前端可直接把该 url 提交给其它业务接口。
   */
  @Post("upload")
  @UseGuards(AdminAuthGuard, AdminPermissionGuard)
  @RequireAdminPermissions("customer_service.write")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile()
    file?: { buffer: Buffer; mimetype?: string; originalname?: string },
    @Req() req?: Request
  ) {
    if (!file) {
      return { code: 400, message: "missing file", data: null };
    }

    const saved = this.filesService.saveFile({
      buffer: file.buffer,
      mimeType: file.mimetype || "application/octet-stream",
      originalName: file.originalname || "file"
    });

    const url = `${this.publicBase(req)}/api/files/${encodeURIComponent(saved.id)}`;

    return {
      code: 0,
      message: "ok",
      data: {
        id: saved.id,
        url,
        originalName: saved.originalName,
        mimeType: saved.mimeType
      }
    };
  }

  /**
   * GET /api/files/:id
   * 这里用于本地联调简单回显上传文件（内存存储），生产环境建议接入对象存储。
   */
  @Get(":id")
  @Header("Cache-Control", "public, max-age=31536000, immutable")
  async getFile(@Param("id") id: string, @Res() res: Response) {
    const record = this.filesService.getFile(id);
    if (!record) {
      throw new NotFoundException("file not found");
    }
    res.setHeader("Content-Type", record.mimeType);
    res.setHeader("Content-Length", String(record.buffer.length));
    res.send(record.buffer);
  }

  @Get(":id/meta")
  async getMeta(@Param("id") id: string) {
    const record = this.filesService.getFile(id);
    if (!record) {
      throw new NotFoundException("file not found");
    }
    return {
      code: 0,
      message: "ok",
      data: {
        id: record.id,
        originalName: record.originalName,
        mimeType: record.mimeType,
        createdAt: record.createdAt
      }
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

import {
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

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

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

    const host = req?.headers?.host ?? "localhost:3000";
    const protocol = req?.headers?.["x-forwarded-proto"] ?? "http";
    const url = `${protocol}://${host}/api/files/${encodeURIComponent(saved.id)}`;

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
}

import {
  Body,
  Controller,
  Get,
  Patch,
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
import type { MiniAccessPayload } from "../auth/mini-auth.guard";
import { CosStorageService } from "../files/cos-storage.service";
import { FilesService } from "../files/files.service";
import { MiniMeService } from "./mini-me.service";

type RequestWithMini = Request & { miniAuth?: MiniAccessPayload };

/**
 * 小程序「我的」聚合：资料、余额、订单统计。
 * GET /api/mini/me（需登录）
 */
@Controller("mini/me")
@UseGuards(MiniAuthGuard)
export class MiniMeController {
  constructor(
    private readonly miniMeService: MiniMeService,
    private readonly cosStorage: CosStorageService,
    private readonly filesService: FilesService
  ) {}

  @Get()
  async getMe(@Req() req: RequestWithMini) {
    const userId = req.miniAuth?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.miniMeService.getMe(userId);
  }

  /** PATCH /api/mini/me：更新昵称 / 头像 */
  @Patch()
  async updateProfile(
    @Req() req: RequestWithMini,
    @Body() body: { nickname?: string; avatarUrl?: string }
  ) {
    const userId = req.miniAuth?.sub;
    if (!userId) throw new UnauthorizedException();
    return this.miniMeService.updateProfile(userId, {
      nickname: typeof body?.nickname === "string" ? body.nickname : undefined,
      avatarUrl: typeof body?.avatarUrl === "string" ? body.avatarUrl : undefined
    });
  }

  /**
   * POST /api/mini/me/avatar/upload-url
   * 返回对象存储直传凭证（mode=cos）；云存储不可用时返回 mode=direct，
   * 由前端回退到 /api/mini/me/avatar/upload 内存直传（本地联调）。
   */
  @Post("avatar/upload-url")
  async createAvatarUploadUrl(@Req() req: RequestWithMini, @Body() body: { filename?: string }) {
    if (!req.miniAuth?.sub) throw new UnauthorizedException();
    if (!this.cosStorage.isEnabled()) {
      return { code: 0, message: "ok", data: { mode: "direct" as const } };
    }

    const meta = await this.cosStorage.createUploadMeta(body?.filename || "avatar");
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
   * POST /api/mini/me/avatar/upload
   * multipart/form-data: file=<binary>。仅本地联调（无云存储）回退使用，返回 { url }。
   */
  @Post("avatar/upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @Req() req: RequestWithMini,
    @UploadedFile()
    file?: { buffer: Buffer; mimetype?: string; originalname?: string }
  ) {
    if (!req.miniAuth?.sub) throw new UnauthorizedException();
    if (!file) return { code: 400, message: "missing file", data: null };

    const saved = this.filesService.saveFile({
      buffer: file.buffer,
      mimeType: file.mimetype || "application/octet-stream",
      originalName: file.originalname || "avatar"
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

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  HomeBanner,
  HomeNotice,
  CreateHomeBannerRequest,
  UpdateHomeBannerRequest,
  CreateHomeNoticeRequest,
  UpdateHomeNoticeRequest
} from "./home-content.types";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

@Injectable()
export class HomeContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Banner ====================

  public async listBanners(filters: {
    enabled?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ApiEnvelope<{ items: HomeBanner[]; total: number }>> {
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const where = {
      ...(filters.enabled !== undefined ? { enabled: filters.enabled } : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.homeBanner.count({ where }),
      this.prisma.homeBanner.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      code: 0,
      message: "ok",
      data: {
        items: rows.map(this.mapBanner),
        total
      }
    };
  }

  public async createBanner(body: CreateHomeBannerRequest): Promise<ApiEnvelope<HomeBanner>> {
    const title = body.title.trim();
    const subtitle = body.subtitle.trim();
    const imageUrl = body.imageUrl.trim();
    const linkUrl = body.linkUrl?.trim() || null;
    const sortOrder = body.sortOrder ?? 0;
    const enabled = body.enabled ?? true;
    const createdBy = body.createdBy.trim();

    if (!title) return { code: 400, message: "title is required", data: null };
    if (!imageUrl) return { code: 400, message: "imageUrl is required", data: null };
    if (!createdBy) return { code: 400, message: "createdBy is required", data: null };

    const row = await this.prisma.homeBanner.create({
      data: {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        sortOrder,
        enabled,
        createdBy
      }
    });

    return { code: 0, message: "ok", data: this.mapBanner(row) };
  }

  public async getBanner(id: string): Promise<ApiEnvelope<HomeBanner>> {
    const row = await this.prisma.homeBanner.findUnique({ where: { id } });
    if (!row) return { code: 404, message: "banner not found", data: null };
    return { code: 0, message: "ok", data: this.mapBanner(row) };
  }

  public async updateBanner(
    id: string,
    body: UpdateHomeBannerRequest
  ): Promise<ApiEnvelope<HomeBanner>> {
    const title = body.title.trim();
    const subtitle = body.subtitle.trim();
    const imageUrl = body.imageUrl.trim();
    const linkUrl = body.linkUrl?.trim() || null;
    const sortOrder = body.sortOrder ?? 0;
    const enabled = body.enabled ?? true;

    if (!title) return { code: 400, message: "title is required", data: null };
    if (!imageUrl) return { code: 400, message: "imageUrl is required", data: null };

    try {
      const row = await this.prisma.homeBanner.update({
        where: { id },
        data: {
          title,
          subtitle,
          imageUrl,
          linkUrl,
          sortOrder,
          enabled
        }
      });
      return { code: 0, message: "ok", data: this.mapBanner(row) };
    } catch {
      return { code: 404, message: "banner not found", data: null };
    }
  }

  public async deleteBanner(id: string): Promise<ApiEnvelope<{ success: true }>> {
    try {
      await this.prisma.homeBanner.delete({ where: { id } });
      return { code: 0, message: "ok", data: { success: true } };
    } catch {
      return { code: 404, message: "banner not found", data: null };
    }
  }

  // ==================== Notice ====================

  public async listNotices(filters: {
    enabled?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ApiEnvelope<{ items: HomeNotice[]; total: number }>> {
    const pageSize = Math.max(1, Math.min(100, Math.floor(filters.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(filters.page ?? 1));

    const where = {
      ...(filters.enabled !== undefined ? { enabled: filters.enabled } : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.homeNotice.count({ where }),
      this.prisma.homeNotice.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      code: 0,
      message: "ok",
      data: {
        items: rows.map(this.mapNotice),
        total
      }
    };
  }

  public async createNotice(body: CreateHomeNoticeRequest): Promise<ApiEnvelope<HomeNotice>> {
    const content = body.content.trim();
    const sortOrder = body.sortOrder ?? 0;
    const enabled = body.enabled ?? true;
    const createdBy = body.createdBy.trim();

    if (!content) return { code: 400, message: "content is required", data: null };
    if (!createdBy) return { code: 400, message: "createdBy is required", data: null };

    const row = await this.prisma.homeNotice.create({
      data: {
        content,
        sortOrder,
        enabled,
        createdBy
      }
    });

    return { code: 0, message: "ok", data: this.mapNotice(row) };
  }

  public async getNotice(id: string): Promise<ApiEnvelope<HomeNotice>> {
    const row = await this.prisma.homeNotice.findUnique({ where: { id } });
    if (!row) return { code: 404, message: "notice not found", data: null };
    return { code: 0, message: "ok", data: this.mapNotice(row) };
  }

  public async updateNotice(
    id: string,
    body: UpdateHomeNoticeRequest
  ): Promise<ApiEnvelope<HomeNotice>> {
    const content = body.content.trim();
    const sortOrder = body.sortOrder ?? 0;
    const enabled = body.enabled ?? true;

    if (!content) return { code: 400, message: "content is required", data: null };

    try {
      const row = await this.prisma.homeNotice.update({
        where: { id },
        data: {
          content,
          sortOrder,
          enabled
        }
      });
      return { code: 0, message: "ok", data: this.mapNotice(row) };
    } catch {
      return { code: 404, message: "notice not found", data: null };
    }
  }

  public async deleteNotice(id: string): Promise<ApiEnvelope<{ success: true }>> {
    try {
      await this.prisma.homeNotice.delete({ where: { id } });
      return { code: 0, message: "ok", data: { success: true } };
    } catch {
      return { code: 404, message: "notice not found", data: null };
    }
  }

  // ==================== Mappers ====================

  private mapBanner(row: {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    linkUrl: string | null;
    sortOrder: number;
    enabled: boolean;
    createdAt: Date;
    createdBy: string;
  }): HomeBanner {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      imageUrl: row.imageUrl,
      linkUrl: row.linkUrl,
      sortOrder: row.sortOrder,
      enabled: row.enabled,
      createdAt: row.createdAt.toISOString(),
      createdBy: row.createdBy
    };
  }

  private mapNotice(row: {
    id: string;
    content: string;
    sortOrder: number;
    enabled: boolean;
    createdAt: Date;
    createdBy: string;
  }): HomeNotice {
    return {
      id: row.id,
      content: row.content,
      sortOrder: row.sortOrder,
      enabled: row.enabled,
      createdAt: row.createdAt.toISOString(),
      createdBy: row.createdBy
    };
  }
}

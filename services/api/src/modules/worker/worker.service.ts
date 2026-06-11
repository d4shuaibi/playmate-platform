import { Injectable } from "@nestjs/common";
import type {
  Prisma,
  WorkerAccount as WorkerAccountRow,
  WorkerJoinApplication as WorkerJoinApplicationRow
} from "@prisma/client";
import {
  UserRole,
  WorkerAccountOperationalStatus,
  WorkerAssessmentKind,
  WorkerJoinApplicationStatus
} from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import {
  type Worker,
  type WorkerAssessmentOptionDto,
  type WorkerAssessmentType,
  type WorkerJoinApplication,
  type WorkerJoinStatus,
  type WorkerStatus
} from "./worker.types";

type ApiEnvelope<T> =
  | { code: 0; message: string; data: T }
  | { code: number; message: string; data: null };

/**
 * 入驻考核类型选项（与 WorkerAssessmentType 一致；提交时会校验 value）
 */
const WORKER_ASSESSMENT_OPTIONS: WorkerAssessmentOptionDto[] = [
  { value: "moba", label: "MOBA 技术考核（王者/LOL）", description: "MOBA 品类技术与配合" },
  { value: "fps", label: "FPS 竞技考核（和平/永劫）", description: "FPS 射击与走位" },
  { value: "strategy", label: "战术策略考核", description: "战术指挥与地图理解" },
  { value: "all-around", label: "全能打手综合考核", description: "多品类综合能力" }
];

const buildRefNo = (): string => {
  return `WK-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

const normalizePhone = (value: string): string => value.trim();
const normalizeIdNo = (value: string): string => value.trim();
const normalizeName = (value: string): string => value.trim();

const resolveAssessmentType = (raw: unknown): WorkerAssessmentType | null => {
  const s = typeof raw === "string" ? raw.trim() : "";
  const hit = WORKER_ASSESSMENT_OPTIONS.find((o) => o.value === s && !o.disabled);
  return hit ? hit.value : null;
};

const toPrismaAssessment = (t: WorkerAssessmentType): WorkerAssessmentKind => {
  if (t === "all-around") return WorkerAssessmentKind.all_around;
  if (t === "moba") return WorkerAssessmentKind.moba;
  if (t === "fps") return WorkerAssessmentKind.fps;
  if (t === "strategy") return WorkerAssessmentKind.strategy;
  return WorkerAssessmentKind.all_around;
};

const toApiAssessment = (t: WorkerAssessmentKind): WorkerAssessmentType => {
  if (t === WorkerAssessmentKind.all_around) return "all-around";
  if (t === WorkerAssessmentKind.moba) return "moba";
  if (t === WorkerAssessmentKind.fps) return "fps";
  return "strategy";
};

const formatTs = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const mapJoinStatus = (s: WorkerJoinApplicationStatus): WorkerJoinStatus => {
  if (s === WorkerJoinApplicationStatus.submitted) return "submitted";
  if (s === WorkerJoinApplicationStatus.reviewing) return "reviewing";
  if (s === WorkerJoinApplicationStatus.approved) return "approved";
  return "rejected";
};

const mapApplicationRow = (row: WorkerJoinApplicationRow): WorkerJoinApplication => ({
  id: row.id,
  refNo: row.refNo,
  userId: row.userId,
  realName: row.realName,
  age: row.age,
  phone: row.phone,
  idNo: row.idNo,
  assessmentType: toApiAssessment(row.assessmentType),
  status: mapJoinStatus(row.status),
  rejectReason: row.rejectReason ?? undefined,
  createdAt: formatTs(row.createdAt),
  updatedAt: formatTs(row.updatedAt)
});

const mapWorkerAccountRow = (row: WorkerAccountRow): Worker => ({
  id: row.id,
  userId: row.userId,
  realName: row.realName,
  phone: row.phone,
  assessmentType: toApiAssessment(row.assessmentType),
  joinStatus: mapJoinStatus(row.joinStatus),
  status: row.status === WorkerAccountOperationalStatus.active ? "active" : "disabled",
  createdAt: formatTs(row.createdAt),
  updatedAt: formatTs(row.updatedAt)
});

@Injectable()
export class WorkerService {
  constructor(private readonly prisma: PrismaService) {}

  async listApplications(params?: {
    keyword?: string;
    status?: WorkerJoinStatus;
    page?: number;
    pageSize?: number;
  }): Promise<ApiEnvelope<{ items: WorkerJoinApplication[]; total: number }>> {
    const keyword = (params?.keyword ?? "").trim();
    const pageSize = Math.max(1, Math.min(100, Math.floor(params?.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(params?.page ?? 1));

    const prismaStatus = params?.status
      ? ({
          submitted: WorkerJoinApplicationStatus.submitted,
          reviewing: WorkerJoinApplicationStatus.reviewing,
          approved: WorkerJoinApplicationStatus.approved,
          rejected: WorkerJoinApplicationStatus.rejected
        }[params.status] as WorkerJoinApplicationStatus)
      : undefined;

    const where: Prisma.WorkerJoinApplicationWhereInput = {
      ...(prismaStatus ? { status: prismaStatus } : {}),
      ...(keyword.length > 0
        ? {
            OR: [
              { refNo: { contains: keyword } },
              { realName: { contains: keyword } },
              { phone: { contains: keyword } },
              { userId: { contains: keyword } }
            ]
          }
        : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.workerJoinApplication.count({ where }),
      this.prisma.workerJoinApplication.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      code: 0,
      message: "ok",
      data: {
        items: rows.map(mapApplicationRow),
        total
      }
    };
  }

  async getApplicationByUserId(userId: string): Promise<ApiEnvelope<WorkerJoinApplication | null>> {
    const row = await this.prisma.workerJoinApplication.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" }
    });
    return {
      code: 0,
      message: "ok",
      data: row ? mapApplicationRow(row) : null
    };
  }

  /**
   * GET /api/mini/worker-join/assessment-options — 考核类型枚举（小程序表单）
   */
  listAssessmentOptions(): ApiEnvelope<{ items: WorkerAssessmentOptionDto[] }> {
    return {
      code: 0,
      message: "ok",
      data: { items: [...WORKER_ASSESSMENT_OPTIONS] }
    };
  }

  async submitApplication(input: {
    userId: string;
    realName: string;
    age: number;
    phone: string;
    idNo: string;
    assessmentType: unknown;
  }): Promise<ApiEnvelope<Pick<WorkerJoinApplication, "id" | "refNo" | "status">>> {
    const realName = normalizeName(input.realName);
    const phone = normalizePhone(input.phone);
    const idNo = normalizeIdNo(input.idNo);
    const age = Math.floor(input.age);
    const assessmentType = resolveAssessmentType(input.assessmentType);

    if (!realName) return { code: 400, message: "Missing realName", data: null };
    if (!Number.isFinite(age) || age <= 0) return { code: 400, message: "Invalid age", data: null };
    if (!phone) return { code: 400, message: "Missing phone", data: null };
    if (!idNo) return { code: 400, message: "Missing idNo", data: null };
    if (!assessmentType) {
      return { code: 400, message: "Invalid assessmentType", data: null };
    }

    const existed = await this.prisma.workerJoinApplication.findFirst({
      where: { userId: input.userId },
      orderBy: { updatedAt: "desc" }
    });

    if (existed && mapJoinStatus(existed.status) !== "rejected") {
      return { code: 409, message: "Application already exists", data: null };
    }

    const prismaEnum = toPrismaAssessment(assessmentType);

    if (existed) {
      const row = await this.prisma.workerJoinApplication.update({
        where: { id: existed.id },
        data: {
          realName,
          age,
          phone,
          idNo,
          assessmentType: prismaEnum,
          status: WorkerJoinApplicationStatus.reviewing,
          rejectReason: null,
          updatedAt: new Date()
        }
      });
      return {
        code: 0,
        message: "ok",
        data: {
          id: row.id,
          refNo: row.refNo,
          status: mapJoinStatus(row.status)
        }
      };
    }

    const row = await this.prisma.workerJoinApplication.create({
      data: {
        id: randomUUID(),
        refNo: buildRefNo(),
        userId: input.userId,
        realName,
        age,
        phone,
        idNo,
        assessmentType: prismaEnum,
        status: WorkerJoinApplicationStatus.reviewing
      }
    });

    return {
      code: 0,
      message: "ok",
      data: {
        id: row.id,
        refNo: row.refNo,
        status: mapJoinStatus(row.status)
      }
    };
  }

  async auditApplication(input: {
    id: string;
    action: "approve" | "reject";
    rejectReason?: string;
  }): Promise<ApiEnvelope<{ success: true }>> {
    const found = await this.prisma.workerJoinApplication.findUnique({ where: { id: input.id } });
    if (!found) return { code: 404, message: "Application not found", data: null };

    const ts = new Date();

    if (input.action === "approve") {
      await this.prisma.$transaction([
        this.prisma.workerJoinApplication.update({
          where: { id: input.id },
          data: {
            status: WorkerJoinApplicationStatus.approved,
            rejectReason: null,
            updatedAt: ts
          }
        }),
        this.prisma.workerAccount.upsert({
          where: { userId: found.userId },
          create: {
            id: randomUUID(),
            userId: found.userId,
            realName: found.realName,
            phone: found.phone,
            assessmentType: found.assessmentType,
            joinStatus: WorkerJoinApplicationStatus.approved,
            status: WorkerAccountOperationalStatus.active
          },
          update: {
            realName: found.realName,
            phone: found.phone,
            assessmentType: found.assessmentType,
            joinStatus: WorkerJoinApplicationStatus.approved,
            status: WorkerAccountOperationalStatus.active,
            updatedAt: ts
          }
        }),
        // 通过审核后将账号角色提升为 WORKER，否则登录小程序仍是 user，访问打手接口会 403
        this.prisma.user.update({
          where: { id: found.userId },
          data: { role: UserRole.WORKER }
        }),
        // 吊销旧 refresh token，迫使重新登录，确保新 access token 携带 role=worker
        this.prisma.refreshToken.updateMany({
          where: { userId: found.userId, revokedAt: null },
          data: { revokedAt: ts }
        })
      ]);
      return { code: 0, message: "ok", data: { success: true } };
    }

    const reason = (input.rejectReason ?? "").trim();
    await this.prisma.workerJoinApplication.update({
      where: { id: input.id },
      data: {
        status: WorkerJoinApplicationStatus.rejected,
        rejectReason: reason || "资料不符合要求",
        updatedAt: ts
      }
    });
    return { code: 0, message: "ok", data: { success: true } };
  }

  async listWorkers(params?: {
    keyword?: string;
    joinStatus?: WorkerJoinStatus;
    status?: WorkerStatus;
    page?: number;
    pageSize?: number;
  }): Promise<ApiEnvelope<{ items: Worker[]; total: number }>> {
    const keyword = (params?.keyword ?? "").trim();
    const pageSize = Math.max(1, Math.min(100, Math.floor(params?.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(params?.page ?? 1));

    const joinPrisma = params?.joinStatus
      ? ({
          submitted: WorkerJoinApplicationStatus.submitted,
          reviewing: WorkerJoinApplicationStatus.reviewing,
          approved: WorkerJoinApplicationStatus.approved,
          rejected: WorkerJoinApplicationStatus.rejected
        }[params.joinStatus] as WorkerJoinApplicationStatus)
      : undefined;

    const opStatus =
      params?.status === "active"
        ? WorkerAccountOperationalStatus.active
        : params?.status === "disabled"
          ? WorkerAccountOperationalStatus.disabled
          : undefined;

    const where: Prisma.WorkerAccountWhereInput = {
      ...(joinPrisma ? { joinStatus: joinPrisma } : {}),
      ...(opStatus ? { status: opStatus } : {}),
      ...(keyword.length > 0
        ? {
            OR: [
              { realName: { contains: keyword } },
              { phone: { contains: keyword } },
              { userId: { contains: keyword } }
            ]
          }
        : {})
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.workerAccount.count({ where }),
      this.prisma.workerAccount.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      code: 0,
      message: "ok",
      data: {
        items: rows.map(mapWorkerAccountRow),
        total
      }
    };
  }

  async toggleWorkerStatus(input: {
    id: string;
    status: WorkerStatus;
  }): Promise<ApiEnvelope<{ success: true }>> {
    const op =
      input.status === "active"
        ? WorkerAccountOperationalStatus.active
        : WorkerAccountOperationalStatus.disabled;

    const account = await this.prisma.workerAccount.findUnique({ where: { id: input.id } });
    if (!account) return { code: 404, message: "Worker not found", data: null };

    await this.prisma.$transaction([
      this.prisma.workerAccount.update({
        where: { id: input.id },
        data: {
          status: op,
          updatedAt: new Date()
        }
      }),
      // 启停时同步账号角色：停用后回退为 user，避免仍可访问打手接口
      this.prisma.user.update({
        where: { id: account.userId },
        data: { role: input.status === "active" ? UserRole.WORKER : UserRole.USER }
      }),
      // 吊销旧 refresh token，迫使重新登录，确保新 access token 携带正确 role
      this.prisma.refreshToken.updateMany({
        where: { userId: account.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);
    return { code: 0, message: "ok", data: { success: true } };
  }
}

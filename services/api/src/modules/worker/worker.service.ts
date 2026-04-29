import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
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

const nowText = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const buildRefNo = () => {
  return `WK-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
};

const normalizePhone = (value: string) => value.trim();
const normalizeIdNo = (value: string) => value.trim();
const normalizeName = (value: string) => value.trim();

const resolveAssessmentType = (raw: unknown): WorkerAssessmentType | null => {
  const s = typeof raw === "string" ? raw.trim() : "";
  const hit = WORKER_ASSESSMENT_OPTIONS.find((o) => o.value === s && !o.disabled);
  return hit ? hit.value : null;
};

@Injectable()
export class WorkerService {
  private readonly applications: WorkerJoinApplication[] = [];
  private readonly workers: Worker[] = [];

  constructor() {
    const allowSeed = process.env.SEED_DEMO === "true" || process.env.NODE_ENV !== "production";
    if (!allowSeed) return;

    const createdAt = nowText();
    const updatedAt = createdAt;

    this.applications.push({
      id: "app-1",
      refNo: "WK-2026-DEMO-0001",
      userId: "seed-user-1",
      realName: "张三",
      age: 22,
      phone: "+8613711112222",
      idNo: "110101199001011234",
      assessmentType: "fps",
      status: "reviewing",
      createdAt,
      updatedAt
    });

    this.applications.push({
      id: "app-2",
      refNo: "WK-2026-DEMO-0002",
      userId: "seed-user-2",
      realName: "李四",
      age: 26,
      phone: "+8613812345678",
      idNo: "310101199201011234",
      assessmentType: "moba",
      status: "approved",
      createdAt,
      updatedAt
    });

    this.workers.push({
      id: "worker-1",
      userId: "seed-user-2",
      realName: "李四",
      phone: "+8613812345678",
      assessmentType: "moba",
      joinStatus: "approved",
      status: "active",
      createdAt,
      updatedAt
    });
  }

  listApplications(params?: {
    keyword?: string;
    status?: WorkerJoinStatus;
    page?: number;
    pageSize?: number;
  }): ApiEnvelope<{ items: WorkerJoinApplication[]; total: number }> {
    const keyword = (params?.keyword ?? "").trim();
    const pageSize = Math.max(1, Math.min(100, Math.floor(params?.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(params?.page ?? 1));

    const filtered = this.applications.filter((item) => {
      if (params?.status && item.status !== params.status) return false;
      if (!keyword) return true;
      const hay = `${item.refNo} ${item.realName} ${item.phone}`.toLowerCase();
      return hay.includes(keyword.toLowerCase());
    });

    const start = (page - 1) * pageSize;
    return {
      code: 0,
      message: "ok",
      data: {
        items: filtered.slice(start, start + pageSize),
        total: filtered.length
      }
    };
  }

  getApplicationByUserId(userId: string): ApiEnvelope<WorkerJoinApplication | null> {
    const found = this.applications.find((item) => item.userId === userId) ?? null;
    return { code: 0, message: "ok", data: found };
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

  submitApplication(input: {
    userId: string;
    realName: string;
    age: number;
    phone: string;
    idNo: string;
    assessmentType: unknown;
  }): ApiEnvelope<Pick<WorkerJoinApplication, "id" | "refNo" | "status">> {
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

    const existed = this.applications.find((item) => item.userId === input.userId);
    const ts = nowText();
    if (existed && existed.status !== "rejected") {
      return { code: 409, message: "Application already exists", data: null };
    }

    const app: WorkerJoinApplication = {
      id: existed?.id ?? randomUUID(),
      refNo: existed?.refNo ?? buildRefNo(),
      userId: input.userId,
      realName,
      age,
      phone,
      idNo,
      assessmentType,
      status: "reviewing",
      rejectReason: undefined,
      createdAt: existed?.createdAt ?? ts,
      updatedAt: ts
    };

    if (existed) {
      const idx = this.applications.findIndex((x) => x.id === existed.id);
      this.applications[idx] = app;
    } else {
      this.applications.unshift(app);
    }

    return {
      code: 0,
      message: "ok",
      data: { id: app.id, refNo: app.refNo, status: app.status }
    };
  }

  auditApplication(input: {
    id: string;
    action: "approve" | "reject";
    rejectReason?: string;
  }): ApiEnvelope<{ success: true }> {
    const found = this.applications.find((item) => item.id === input.id);
    if (!found) return { code: 404, message: "Application not found", data: null };

    const ts = nowText();
    if (input.action === "approve") {
      found.status = "approved";
      found.rejectReason = undefined;
      found.updatedAt = ts;

      const existedWorker = this.workers.find((w) => w.userId === found.userId);
      if (existedWorker) {
        existedWorker.joinStatus = "approved";
        existedWorker.status = "active";
        existedWorker.updatedAt = ts;
      } else {
        this.workers.unshift({
          id: randomUUID(),
          userId: found.userId,
          realName: found.realName,
          phone: found.phone,
          assessmentType: found.assessmentType,
          joinStatus: "approved",
          status: "active",
          createdAt: ts,
          updatedAt: ts
        });
      }
      return { code: 0, message: "ok", data: { success: true } };
    }

    const reason = (input.rejectReason ?? "").trim();
    found.status = "rejected";
    found.rejectReason = reason || "资料不符合要求";
    found.updatedAt = ts;
    return { code: 0, message: "ok", data: { success: true } };
  }

  listWorkers(params?: {
    keyword?: string;
    joinStatus?: WorkerJoinStatus;
    status?: WorkerStatus;
    page?: number;
    pageSize?: number;
  }): ApiEnvelope<{ items: Worker[]; total: number }> {
    const keyword = (params?.keyword ?? "").trim();
    const pageSize = Math.max(1, Math.min(100, Math.floor(params?.pageSize ?? 10)));
    const page = Math.max(1, Math.floor(params?.page ?? 1));

    const filtered = this.workers.filter((item) => {
      if (params?.joinStatus && item.joinStatus !== params.joinStatus) return false;
      if (params?.status && item.status !== params.status) return false;
      if (!keyword) return true;
      const hay = `${item.realName} ${item.phone} ${item.userId}`.toLowerCase();
      return hay.includes(keyword.toLowerCase());
    });

    const start = (page - 1) * pageSize;
    return {
      code: 0,
      message: "ok",
      data: {
        items: filtered.slice(start, start + pageSize),
        total: filtered.length
      }
    };
  }

  toggleWorkerStatus(input: { id: string; status: WorkerStatus }): ApiEnvelope<{ success: true }> {
    const found = this.workers.find((w) => w.id === input.id);
    if (!found) return { code: 404, message: "Worker not found", data: null };
    found.status = input.status;
    found.updatedAt = nowText();
    return { code: 0, message: "ok", data: { success: true } };
  }
}

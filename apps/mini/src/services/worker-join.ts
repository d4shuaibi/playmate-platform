import { apiPaths } from "./api-paths";
import { request } from "./http";

export type WorkerAssessmentType = "moba" | "fps" | "strategy" | "all-around";

export type WorkerAssessmentOption = {
  value: WorkerAssessmentType;
  label: string;
  description?: string;
  disabled?: boolean;
};
export type WorkerJoinStatus = "submitted" | "reviewing" | "approved" | "rejected";

export type WorkerJoinProgressData = {
  id: string;
  refNo: string;
  userId: string;
  realName: string;
  age: number;
  phone: string;
  idNo: string;
  assessmentType: WorkerAssessmentType;
  status: WorkerJoinStatus;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
} | null;

/**
 * GET /api/mini/worker-join/assessment-options
 */
export const fetchWorkerAssessmentOptions = async (): Promise<WorkerAssessmentOption[]> => {
  const res = await request<{ items: WorkerAssessmentOption[] }>(
    apiPaths.miniWorkerJoinAssessmentOptions,
    { skipAuth: true }
  );
  return res.data.items ?? [];
};

export const fetchWorkerJoinProgress = async () => {
  const res = await request<WorkerJoinProgressData>(apiPaths.miniWorkerJoinProgress, {
    method: "GET"
  });
  return res.data;
};

export const applyWorkerJoin = async (input: {
  realName: string;
  age: number;
  phone: string;
  idNo: string;
  assessmentType: string;
}) => {
  const res = await request<{ id: string; refNo: string; status: WorkerJoinStatus }>(
    apiPaths.miniWorkerJoinApply,
    {
      method: "POST",
      body: input
    }
  );
  return res.data;
};

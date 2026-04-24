import { apiPaths } from "./api-paths";
import { request } from "./http";

export type WorkerAssessmentType = "moba" | "fps" | "strategy" | "all-around";
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
  assessmentType: WorkerAssessmentType;
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

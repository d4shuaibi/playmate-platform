export type WorkerJoinStatus = "submitted" | "reviewing" | "approved" | "rejected";

export type WorkerStatus = "active" | "disabled";

export type WorkerAssessmentType = "moba" | "fps" | "strategy" | "all-around";

/** GET /api/mini/worker-join/assessment-options 下发（考核类型可在此统一维护） */
export type WorkerAssessmentOptionDto = {
  value: WorkerAssessmentType;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type WorkerJoinApplication = {
  id: string;
  refNo: string;
  userId: string;
  realName: string;
  age: number;
  phone: string;
  idNo: string;
  /** 身份证正反面照片直链 */
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  assessmentType: WorkerAssessmentType;
  status: WorkerJoinStatus;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type Worker = {
  id: string;
  userId: string;
  realName: string;
  phone: string;
  /** 身份证号 / 现居住地址 / 身份证正反面照片（管理端可修改，留底用） */
  idNo?: string;
  address?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  assessmentType: WorkerAssessmentType;
  joinStatus: WorkerJoinStatus;
  status: WorkerStatus;
  createdAt: string;
  updatedAt: string;
};

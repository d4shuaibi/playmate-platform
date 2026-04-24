export type WorkerJoinStatus = "submitted" | "reviewing" | "approved" | "rejected";

export type WorkerStatus = "active" | "disabled";

export type WorkerAssessmentType = "moba" | "fps" | "strategy" | "all-around";

export type WorkerJoinApplication = {
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
};

export type Worker = {
  id: string;
  userId: string;
  realName: string;
  phone: string;
  assessmentType: WorkerAssessmentType;
  joinStatus: WorkerJoinStatus;
  status: WorkerStatus;
  createdAt: string;
  updatedAt: string;
};

import Taro from "@tarojs/taro";
import { miniEnv } from "../config/env";
import { getToken } from "../utils/session";
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
  idCardFrontUrl: string;
  idCardBackUrl: string;
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

type IdCardUploadTicket =
  | { mode: "direct" }
  | {
      mode: "cos";
      uploadUrl: string;
      formFields: Record<string, string>;
      fileId: string;
      accessUrl: string;
    };

/**
 * 上传身份证正/反面临时文件，返回可长期展示的图片直链。
 * 优先走对象存储直传（cos）；云存储不可用时回退本地 multipart 直传（direct）。
 */
export const uploadIdCardPhoto = async (
  tempFilePath: string,
  side: "front" | "back"
): Promise<string> => {
  const ticket = (
    await request<IdCardUploadTicket>(apiPaths.miniWorkerJoinIdCardUploadUrl, {
      method: "POST",
      body: { filename: `id-card-${side}.png` }
    })
  ).data;

  if (ticket.mode === "cos") {
    const res = await Taro.uploadFile({
      url: ticket.uploadUrl,
      filePath: tempFilePath,
      name: "file",
      formData: ticket.formFields
    });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error("身份证照片上传失败");
    }
    return ticket.accessUrl;
  }

  const token = getToken();
  const res = await Taro.uploadFile({
    url: `${miniEnv.apiBaseUrl}${apiPaths.miniWorkerJoinIdCardUpload}`,
    filePath: tempFilePath,
    name: "file",
    header: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error("身份证照片上传失败");
  }
  const payload = JSON.parse(res.data) as {
    code: number;
    message: string;
    data?: { url?: string };
  };
  if (payload.code !== 0 || !payload.data?.url) {
    throw new Error(payload.message || "身份证照片上传失败");
  }
  return payload.data.url;
};

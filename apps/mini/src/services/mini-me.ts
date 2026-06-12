import Taro from "@tarojs/taro";
import { miniEnv } from "../config/env";
import { getToken } from "../utils/session";
import { apiPaths } from "./api-paths";
import { request } from "./http";
import type { MiniOrderTabCounts } from "./orders";

/** GET /api/mini/me */
export type MiniMePayload = {
  nickname: string;
  avatarUrl: string | null;
  userId: string;
  displayId: string;
  walletBalance: number;
  orderCounts: MiniOrderTabCounts;
};

/**
 * 拉取当前登录用户「我的」聚合数据（资料、余额、订单统计）。
 */
export const fetchMiniMe = async (): Promise<MiniMePayload> => {
  const envelope = await request<MiniMePayload>(apiPaths.miniMe);
  return envelope.data;
};

/**
 * 更新「我的」资料（昵称 / 头像），返回更新后的聚合数据。
 */
export const updateMiniProfile = async (input: {
  nickname?: string;
  avatarUrl?: string;
}): Promise<MiniMePayload> => {
  const envelope = await request<MiniMePayload>(apiPaths.miniMe, {
    method: "PATCH",
    body: input
  });
  return envelope.data;
};

type AvatarUploadTicket =
  | { mode: "direct" }
  | {
      mode: "cos";
      uploadUrl: string;
      formFields: Record<string, string>;
      fileId: string;
      accessUrl: string;
    };

/**
 * 上传头像临时文件，返回可长期展示的头像直链。
 * 优先走对象存储直传（cos）；云存储不可用时回退本地 multipart 直传（direct）。
 */
export const uploadAvatar = async (tempFilePath: string): Promise<string> => {
  const ticket = (
    await request<AvatarUploadTicket>(apiPaths.miniMeAvatarUploadUrl, {
      method: "POST",
      body: { filename: "avatar.png" }
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
      throw new Error("头像上传失败");
    }
    return ticket.accessUrl;
  }

  // direct：本地联调回退，直传到容器内存存储
  const token = getToken();
  const res = await Taro.uploadFile({
    url: `${miniEnv.apiBaseUrl}${apiPaths.miniMeAvatarUpload}`,
    filePath: tempFilePath,
    name: "file",
    header: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error("头像上传失败");
  }
  const payload = JSON.parse(res.data) as {
    code: number;
    message: string;
    data?: { url?: string };
  };
  if (payload.code !== 0 || !payload.data?.url) {
    throw new Error(payload.message || "头像上传失败");
  }
  return payload.data.url;
};

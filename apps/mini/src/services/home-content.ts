import { request } from "./http";
import { apiPaths } from "./api-paths";

export type MiniBanner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
};

export type MiniNotice = {
  id: string;
  content: string;
  sortOrder: number;
};

export const fetchMiniBanners = async () => {
  const res = await request<{ items: MiniBanner[]; total: number }>(apiPaths.miniBanners, {
    skipAuth: true
  });
  return res.data.items;
};

export const fetchMiniNotices = async () => {
  const res = await request<{ items: MiniNotice[]; total: number }>(apiPaths.miniNotices, {
    skipAuth: true
  });
  return res.data.items;
};

import type { UploadFile } from "antd/es/upload/interface";
import type { ProductNotice, ProductNoticeLevel } from "../../services/product/types";

export const normalizeUploadFiles = (event: { fileList: UploadFile[] } | UploadFile[]) => {
  if (Array.isArray(event)) return event;
  return event?.fileList ?? [];
};

export const resolveUploadUrlFromFileList = (fileList?: UploadFile[]) => {
  const file = fileList?.[0];
  if (!file || file.status === "error") return undefined;
  if (typeof file.url === "string" && file.url.length > 0) return file.url;
  if (typeof file.thumbUrl === "string" && file.thumbUrl.length > 0) return file.thumbUrl;
  return undefined;
};

export const getOriginFileFromList = (fileList?: UploadFile[]) => {
  const origin = fileList?.[0]?.originFileObj;
  if (origin instanceof File) return origin;
  return undefined;
};

export const buildDoneUploadFileFromUrl = (params: { uid: string; url: string; name?: string }) => {
  const item: UploadFile = {
    uid: params.uid,
    name: params.name ?? "image",
    status: "done",
    url: params.url
  };
  return item;
};

export const splitLines = (raw: string) => {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

export const joinLines = (lines: string[] | undefined) => {
  return (lines ?? []).join("\n");
};

export const parseNoticesText = (raw: string): ProductNotice[] => {
  const lines = splitLines(raw);
  const now = Date.now();
  return lines
    .map((line, index) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex <= 0) return null;
      const levelRaw = line.slice(0, separatorIndex).trim();
      const text = line.slice(separatorIndex + 1).trim();
      const level: ProductNoticeLevel | null =
        levelRaw === "warn" || levelRaw === "error" || levelRaw === "info" ? levelRaw : null;
      if (!level || !text) return null;
      return {
        id: `notice-${now}-${index}`,
        level,
        text
      };
    })
    .filter((item): item is ProductNotice => Boolean(item));
};

export const formatNoticesText = (notices: ProductNotice[] | undefined) => {
  return (notices ?? []).map((item) => `${item.level}:${item.text}`).join("\n");
};

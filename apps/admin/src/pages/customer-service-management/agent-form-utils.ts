import type { UploadFile } from "antd/es/upload/interface";

/** 从已存在的上传项（done + url）解析出可直接提交的地址 */
export const resolveUploadUrlFromFileList = (fileList?: UploadFile[]) => {
  const file = fileList?.[0];
  if (!file || file.status === "error") {
    return undefined;
  }
  if (file.originFileObj instanceof File) {
    return undefined;
  }
  if (typeof file.url === "string" && file.url.length > 0) {
    return file.url;
  }
  if (typeof file.thumbUrl === "string" && file.thumbUrl.length > 0) {
    return file.thumbUrl;
  }
  return undefined;
};

/** 用户新选择的本地文件（未走服务端 url 时） */
export const getOriginFileFromList = (fileList?: UploadFile[]) => {
  const origin = fileList?.[0]?.originFileObj;
  if (origin instanceof File) {
    return origin;
  }
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

export type MiniEnv = {
  /** 后端根地址（不含路径，如 `http://localhost:3000`），与 `apiPaths` 拼成完整 URL，例如 `/api/auth/mini/login` */
  apiBaseUrl: string;
};

export const miniEnv: MiniEnv = {
  apiBaseUrl: __API_BASE_URL__
};

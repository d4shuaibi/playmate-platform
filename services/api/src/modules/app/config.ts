export type AppConfig = {
  port: number;
};

export const getAppConfig = (): AppConfig => {
  const portRaw = process.env.PORT;
  const port = portRaw ? Number(portRaw) : 3001;

  return {
    port: Number.isFinite(port) ? port : 3001
  };
};

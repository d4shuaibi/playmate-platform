type AppEnv = {
  appName: string;
  appEnv: string;
  apiBaseUrl: string;
};

const readEnvValue = (value: string | undefined, fallbackValue: string) => {
  if (!value || value.trim().length === 0) {
    return fallbackValue;
  }

  return value;
};

export const appEnv: AppEnv = {
  appName: readEnvValue(import.meta.env.VITE_APP_NAME, "Playmate Platform"),
  appEnv: readEnvValue(import.meta.env.VITE_APP_ENV, "development"),
  apiBaseUrl: readEnvValue(import.meta.env.VITE_API_BASE_URL, "http://localhost:3000/api")
};

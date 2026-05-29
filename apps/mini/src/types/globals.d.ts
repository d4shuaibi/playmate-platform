declare const __APP_ENV__: "development" | "production";
declare const __API_BASE_URL__: string;
declare const __CLOUD_ENV_ID__: string;
declare const __CLOUD_SERVICE_NAME__: string;

declare module "*.svg" {
  const src: string;
  export default src;
}

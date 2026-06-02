import "./load-env";
import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./modules/app/app.module";
import { getAppConfig } from "./modules/app/config";
import { useWechatOpenApiProxy } from "./lib/wechat-openapi";

const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true
  });

  // 增加请求体大小限制，支持上传大文件（如 base64 图片）
  app.useBodyParser("json", { limit: "50mb" });
  app.useBodyParser("urlencoded", { limit: "50mb", extended: true });

  /** 本地 / H5 / 微信开发者工具联调：允许跨域与常见头（含 Authorization） */
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"]
  });

  app.setGlobalPrefix("api");

  const { port } = getAppConfig();
  Logger.log(
    `WeChat OpenAPI mode: ${useWechatOpenApiProxy() ? "云托管开放接口服务 (http, 免 token)" : "https + access_token"}`,
    "Bootstrap"
  );
  /** 监听 0.0.0.0，便于真机用局域网 IP 访问本机 API */
  await app.listen(port, "0.0.0.0");
};

void bootstrap();

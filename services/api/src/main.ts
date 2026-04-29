import "./load-env";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { getAppConfig } from "./modules/app/config";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });

  /** 本地 / H5 / 微信开发者工具联调：允许跨域与常见头（含 Authorization） */
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"]
  });

  app.setGlobalPrefix("api");

  const { port } = getAppConfig();
  /** 监听 0.0.0.0，便于真机用局域网 IP 访问本机 API */
  await app.listen(port, "0.0.0.0");
};

void bootstrap();

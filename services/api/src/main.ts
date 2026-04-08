import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";
import { getAppConfig } from "./modules/app/config";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix("api");

  const { port } = getAppConfig();
  await app.listen(port);
};

void bootstrap();

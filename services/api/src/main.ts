import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app/app.module";

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(3000);
};

void bootstrap();

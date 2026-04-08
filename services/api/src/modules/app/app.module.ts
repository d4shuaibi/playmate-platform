import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "../health/health.module";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    HealthModule
  ],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AppModule {}

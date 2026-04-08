import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "../health/health.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    AuthModule,
    HealthModule
  ],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AppModule {}

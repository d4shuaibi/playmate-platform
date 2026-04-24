import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "../health/health.module";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthModule } from "../auth/auth.module";
import { FilesModule } from "../files/files.module";
import { CustomerServiceModule } from "../customer-service/customer-service.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    AuthModule,
    FilesModule,
    CustomerServiceModule,
    HealthModule
  ],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AppModule {}

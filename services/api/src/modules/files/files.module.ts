import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { CosStorageService } from "./cos-storage.service";

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [FilesService, CosStorageService],
  exports: [FilesService, CosStorageService]
})
export class FilesModule {}

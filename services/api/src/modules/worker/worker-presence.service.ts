import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export type WorkerPresenceMode = "online" | "rest";

@Injectable()
export class WorkerPresenceService {
  constructor(private readonly prisma: PrismaService) {}

  public async getMode(userId: string): Promise<WorkerPresenceMode> {
    const account = await this.prisma.workerAccount.findUnique({
      where: { userId },
      select: { presenceMode: true }
    });
    return (account?.presenceMode as WorkerPresenceMode) ?? "rest";
  }

  public async setMode(userId: string, mode: WorkerPresenceMode): Promise<WorkerPresenceMode> {
    await this.prisma.workerAccount.update({
      where: { userId },
      data: { presenceMode: mode }
    });
    return mode;
  }
}

import { Injectable } from "@nestjs/common";

export type WorkerPresenceMode = "online" | "rest";

/**
 * 打手在线状态（内存存储；重启后失效）。
 */
@Injectable()
export class WorkerPresenceService {
  private readonly modes = new Map<string, WorkerPresenceMode>();

  public getMode(workerId: string): WorkerPresenceMode {
    return this.modes.get(workerId) ?? "rest";
  }

  public setMode(workerId: string, mode: WorkerPresenceMode): WorkerPresenceMode {
    this.modes.set(workerId, mode);
    return mode;
  }
}

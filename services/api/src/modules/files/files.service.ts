import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

export type StoredFile = {
  id: string;
  mimeType: string;
  originalName: string;
  buffer: Buffer;
  createdAt: number;
};

@Injectable()
export class FilesService {
  private readonly storage = new Map<string, StoredFile>();

  public saveFile(params: { buffer: Buffer; mimeType: string; originalName: string }) {
    const id = randomUUID();
    const record: StoredFile = {
      id,
      mimeType: params.mimeType,
      originalName: params.originalName,
      buffer: params.buffer,
      createdAt: Date.now()
    };
    this.storage.set(id, record);
    return record;
  }

  public getFile(id: string) {
    return this.storage.get(id) ?? null;
  }
}

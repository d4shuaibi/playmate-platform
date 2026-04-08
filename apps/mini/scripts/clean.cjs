"use strict";

const fs = require("fs");
const path = require("path");

/** 相对小程序包根目录、需要清理的构建/缓存目录名 */
const DIR_NAMES = ["dist", ".temp", ".taro"];

const packageRoot = path.join(__dirname, "..");

for (const name of DIR_NAMES) {
  const targetPath = path.join(packageRoot, name);
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`clean: failed to remove ${targetPath}: ${message}`);
    process.exitCode = 1;
  }
}

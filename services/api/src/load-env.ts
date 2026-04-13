import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

/**
 * 必须在其它会触发 Prisma 初始化的 import 之前执行。
 * 编译后 __dirname 为 dist/，上一级为 services/api（.env 与 package.json 同目录）。
 */
const envFile = resolve(__dirname, "..", ".env");
if (existsSync(envFile)) {
  config({ path: envFile });
} else if (existsSync(resolve(process.cwd(), ".env"))) {
  config({ path: resolve(process.cwd(), ".env") });
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    [
      "[playmate/api] 未设置 DATABASE_URL。请执行：",
      `  cp .env.example .env   （在 services/api 目录下）`,
      "并在 .env 中配置 Postgres 连接串，或先在 shell 中 export DATABASE_URL。",
      "示例见 .env.example。"
    ].join("\n")
  );
  process.exit(1);
}

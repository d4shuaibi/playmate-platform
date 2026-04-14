#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const envPath = path.resolve(__dirname, "../.env");

const generateSecret = () => crypto.randomBytes(64).toString("base64");

const upsertEnvValue = (envContent, key, value) => {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(envContent)) {
    return envContent.replace(pattern, line);
  }

  const suffix = envContent.endsWith("\n") || envContent.length === 0 ? "" : "\n";
  return `${envContent}${suffix}${line}\n`;
};

const main = () => {
  if (!fs.existsSync(envPath)) {
    console.error(`[gen:jwt-secret] 未找到文件: ${envPath}`);
    console.error("[gen:jwt-secret] 请先复制 services/api/.env.example 到 services/api/.env");
    process.exit(1);
  }

  const oldContent = fs.readFileSync(envPath, "utf8");
  const nextContent = upsertEnvValue(oldContent, "JWT_SECRET", generateSecret());
  fs.writeFileSync(envPath, nextContent, "utf8");

  console.log(`[gen:jwt-secret] JWT_SECRET 已更新: ${envPath}`);
  console.log("[gen:jwt-secret] 提示: 若使用 Docker 运行 API，请执行 `docker compose up -d --build api` 使其生效。");
};

main();

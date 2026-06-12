FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api/package.json services/api/package.json

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN pnpm install --frozen-lockfile --prod=false

COPY services/api services/api

RUN pnpm -C services/api install --frozen-lockfile --prod=false
RUN pnpm -C services/api prisma:generate
RUN pnpm -C services/api build

RUN pnpm --filter @playmate/api deploy --prod --legacy /out
RUN mkdir -p /out/node_modules && cp -R /repo/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma /out/node_modules/.prisma

FROM node:20-alpine
RUN apk add --no-cache ca-certificates tzdata && update-ca-certificates
WORKDIR /app
# 容器固定使用北京时间，保证日志与本地时间方法（如 Date.getHours）对齐到 UTC+8。
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

COPY --from=build /out/ ./
COPY --from=build /repo/services/api/dist ./dist

EXPOSE 3000
CMD ["sh", "-c", "node dist/main.js & node_modules/.bin/prisma db push --skip-generate || true; wait"]

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
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /out/ ./
COPY --from=build /repo/services/api/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]


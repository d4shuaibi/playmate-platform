FROM node:20-alpine AS build
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/api/package.json services/api/package.json

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN pnpm install --frozen-lockfile

COPY services/api services/api

RUN pnpm -C services/api prisma:generate
RUN pnpm -C services/api build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/services/api/package.json ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/services/api/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]


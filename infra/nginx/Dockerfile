FROM node:20-alpine AS admin-build
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json apps/admin/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN pnpm install --frozen-lockfile

COPY apps/admin apps/admin
COPY packages/shared packages/shared

RUN pnpm -C packages/shared build
RUN pnpm -C apps/admin build

FROM nginx:1.27-alpine
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=admin-build /repo/apps/admin/dist /usr/share/nginx/html


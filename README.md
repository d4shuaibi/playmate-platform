# Playmate Platform（Monorepo）

本仓库使用 **pnpm workspace** 管理多端工程：

- `apps/mini`：小程序端（Taro + React + TypeScript）
- `apps/admin`：管理端（React + TypeScript + Vite + Ant Design）
- `services/api`：后端（NestJS + PostgreSQL + Redis）
- `packages/*`：跨端共享与接口契约

## 技术栈（当前已落地）

- React 18
- TypeScript 5
- Vite 5
- React Router 6
- ESLint 9 + Prettier 3
- Ant Design 5（管理端）

## 快速开始

### 1) 安装依赖

```bash
pnpm install
```

### 2) 初始化环境变量

```bash
cp .env.example .env.local
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env.local
```

### 3) 启动开发环境

```bash
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173)。

## 根工作区脚本

- `pnpm dev`：并行启动各子项目（已实现的子项目）
- `pnpm build`：构建所有子项目
- `pnpm lint`：lint 所有子项目
- `pnpm type-check`：类型检查所有子项目
- `pnpm check`：CI 基线检查（各子项目的 check 聚合）

## 目录结构

```text
apps/
  admin/         # 管理端（已落地）
  mini/          # 小程序端（待补齐最小骨架）
services/
  api/           # 后端（待补齐最小骨架）
packages/
  shared/        # 跨端共享（待补齐最小骨架）
  api-contract/  # 接口契约（可选）
  ui/            # 通用 UI 封装（可选）
openspec/        # OpenSpec 工作流产物
```

## 环境变量说明（示例）

- 每个子项目可有自己的 `.env.example`（如 `apps/admin/.env.example`）
- `VITE_APP_NAME`：应用名称
- `VITE_APP_ENV`：运行环境标识
- `VITE_API_BASE_URL`：后端 API 基础地址

## 提交与 CI 质量基线

- 本地提交前可执行：`pnpm check`
- 已提供 `lint-staged` 与 `.husky/pre-commit`
- CI 推荐命令：`pnpm check`

## 新成员上手清单

1. 克隆仓库后执行 `pnpm install`
2. 按子项目复制 `.env.example`（如 `apps/admin/.env.example` → `apps/admin/.env.local`）
3. 执行 `pnpm dev` 启动（或进入子项目单独启动）
4. 提交前执行 `pnpm check` 确认质量基线通过

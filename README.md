# Playmate Platform

React + TypeScript + Vite 初始化基线，包含路由占位、环境配置约定、工程质量门禁与开发文档。

## 技术栈

- React 18
- TypeScript 5
- Vite 5
- React Router 6
- ESLint 9 + Prettier 3
- TailwindCSS 3

## 快速开始

### 1) 安装依赖

```bash
npm install
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
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173)。

## 工程脚本

- `npm run dev`：启动本地开发服务
- `npm run build`：执行 TypeScript 构建校验并打包
- `npm run preview`：预览构建产物
- `npm run lint`：执行 ESLint 检查
- `npm run lint:fix`：自动修复可修复的 ESLint 问题
- `npm run type-check`：执行 TypeScript 类型检查
- `npm run format`：执行 Prettier 格式化
- `npm run format:check`：检查 Prettier 格式是否通过
- `npm run check`：CI 基线检查（lint + type-check + build）

## 目录结构

```text
src/
  app/           # 路由与布局层
  components/    # 共享组件
  config/        # 环境配置与应用配置读取
  pages/         # 页面层
  services/      # 服务与请求封装
  styles/        # 样式入口
```

## 环境变量说明

- `VITE_APP_NAME`：应用名称
- `VITE_APP_ENV`：运行环境标识
- `VITE_API_BASE_URL`：后端 API 基础地址

## 提交与 CI 质量基线

- 本地提交前可执行：`npm run check`
- 已提供 `lint-staged` 与 `.husky/pre-commit`，用于提交前格式化与代码检查
- CI 推荐命令：`npm run check`

## 新成员上手清单

1. 克隆仓库后执行 `npm install`
2. 从 `.env.example` 复制 `.env.local` 并填写变量
3. 执行 `npm run dev` 启动本地服务
4. 提交前执行 `npm run check` 确认质量基线通过

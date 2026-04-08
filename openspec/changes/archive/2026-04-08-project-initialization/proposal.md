## Why

当前仓库仅包含基础目录，缺少可直接开发与交付的前端工程基线（应用骨架、开发规范、质量门禁与环境约定）。尽快完成项目初始化可以统一团队开发方式，降低后续功能开发和联调成本。

## What Changes

- 初始化 React + TypeScript 前端应用基础骨架（目录结构、入口页面、路由与基础布局）。
- 建立工程规范与质量门禁（ESLint、Prettier、TypeScript 校验、提交前检查与脚本约定）。
- 建立运行环境与配置基线（环境变量模板、构建与启动命令、README 使用说明）。
- 接入基础 UI 能力与通用页面框架，为后续业务模块提供统一扩展点。

## Capabilities

### New Capabilities

- `frontend-app-bootstrap`: 定义前端应用最小可运行骨架、目录组织约定与基础页面框架。
- `engineering-quality-baseline`: 定义代码规范、检查流程、脚本命令与环境配置模板，确保可持续开发与交付。

### Modified Capabilities

- 无

## Impact

- Affected code: 应用入口、页面目录、构建配置、脚本配置、代码规范配置、项目文档。
- APIs: 无新增后端 API 依赖；仅定义后续对接约定。
- Dependencies: 新增前端运行与工程化依赖（React 生态、TypeScript、Lint/Format 工具链）。
- Systems: 影响本地开发、CI 校验与项目初始化流程。

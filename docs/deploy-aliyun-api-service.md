# Playmate API 服务部署阿里云（详细步骤）

本文面向本仓库中的 **`services/api`**（NestJS + Prisma + PostgreSQL + Redis，监听 **`PORT`/`3000`**，路由前缀 **`/api`**）。部署思路对齐仓库现有 **`services/api/Dockerfile`** 与 **`docker-compose.yml`**。

---

## 一、架构与组件对照

| 组件             | 本地 compose             | 生产推荐（阿里云）                               |
| ---------------- | ------------------------ | ------------------------------------------------ |
| API              | `playmate-api` 容器      | ECS / ACK / SAE 等运行同一镜像                   |
| PostgreSQL       | `postgres:16` 容器       | **RDS PostgreSQL**（同 VPC 内网访问）            |
| Redis            | `redis:7` 容器           | **云数据库 Redis 版**（内网）                    |
| 反向代理 / HTTPS | `infra/nginx`（compose） | **SLB + Nginx/Caddy** 或 **阿里云 CDN/WAF** 前置 |

**镜像要点：** Dockerfile 为多阶段构建，运行镜像 **`EXPOSE 3000`**，`CMD ["node","dist/main.js"]`。生产请将 **`DATABASE_URL` / `REDIS_URL`** 指向云上内网地址，勿再用 compose 里的 `postgres`、`redis` 主机名。

环境变量清单以 **`services/api/.env.example`** 为准（含微信小程序、微信支付、JWT、管理端账号等）。

---

## 二、开通账号与基础准备

1. 注册并完成阿里云实名认证。
2. 创建 **专有网络 VPC**、**交换机（与子网）**，规划地域（建议与 RDS/Redis 同一地域以降低延迟与流量费用）。
3. 若对外提供 HTTPS 域名：**完成 ICP 备案**（小程序服务端域名、微信支付回调 URL 通常要求合法备案域名）。

---

## 三、创建托管数据库与缓存（推荐）

### 3.1 RDS PostgreSQL

1. 控制台进入 **云数据库 RDS** → 创建 **PostgreSQL** 实例（版本建议 **14/15/16**，与本地开发接近）。
2. 网络：选择与 ECS **相同的 VPC**；分配内网地址。
3. 创建数据库（库名如 `playmate`）、账号与密码。
4. 连接串示例（仅示意，以控制台为准）：

   ```text
   postgresql://USER:PASSWORD@pg-xxxxx.pg.rds.aliyuncs.com:5432/playmate?schema=public
   ```

5. **安全组**：允许 ECS 安全组或指定内网 CIDR 访问 RDS **5432**（按最小权限配置）。

### 3.2 云数据库 Redis

1. 创建 Redis 实例（VPC 同上）。
2. 连接串示例：

   ```text
   redis://:PASSWORD@r-xxxxx.redis.rds.aliyuncs.com:6379
   ```

3. 安全组同上，放行 ECS → Redis 端口。

---

## 四、构建并推送镜像（容器镜像服务 ACR）

在 **本地或 CI**（如云效流水线）执行：

### 4.1 本地构建（校验）

在仓库根目录：

```bash
docker build -f services/api/Dockerfile -t playmate-api:prod .
```

可选本地冒烟（需自备 Postgres/Redis 或使用 compose 仅起依赖）：

```bash
docker run --rm -e DATABASE_URL=... -e REDIS_URL=... -p 3000:3000 playmate-api:prod
```

### 4.2 创建 ACR 命名空间与镜像仓库

1. 控制台打开 **容器镜像服务 ACR** → 创建 **实例**（个人版或企业版）。
2. 创建 **命名空间**、**镜像仓库**（如 `playmate/api`）。

### 4.3 登录并推送

```bash
docker login --username=<阿里云账号或RAM子账号> registry.cn-<地域>.aliyuncs.com
docker tag playmate-api:prod registry.cn-<地域>.aliyuncs.com/<命名空间>/api:<标签>
docker push registry.cn-<地域>.aliyuncs.com/<命名空间>/api:<标签>
```

后续 ECS/ACK/SAE 拉取同一镜像标签即可完成升级。

---

## 五、ECS 部署（单机 Docker，与 compose 最接近）

适合初期上线；后续可迁 ACK/SAE。

### 5.1 购买 ECS

- **镜像**：推荐 Alibaba Cloud Linux 3 / Ubuntu 22.04。
- **规格**：按 QPS 与 Prisma 负载选择；至少 **2 vCPU / 4 GiB** 起步（按压测调整）。
- **网络**：加入上文 **VPC**，分配 **公网 IP** 或后续绑定 **EIP**（便于 SSH 与出网访问微信接口）。
- **安全组**：
  - **22**：仅运维 IP。
  - **80/443**：若本机跑 Nginx/Caddy，仅开放至 SLB 或公网（按架构）。
  - **勿长期对公网开放 3000**；API 仅由内网或反向代理访问。

### 5.2 安装 Docker

按阿里云文档安装 Docker Engine；启用 `docker` 服务。

### 5.3 首次数据库迁移（Prisma）

在 **能访问 RDS 的机器**上执行（任选其一）：

**方式 A — 在 ECS 上用一次性容器执行（推荐与线上镜像版本一致）：**

```bash
docker run --rm \
  -e DATABASE_URL="postgresql://..." \
  registry.cn-<地域>.aliyuncs.com/<命名空间>/api:<标签> \
  sh -c "cd /app && npx prisma migrate deploy"
```

若镜像内未包含 `prisma` CLI，可在 CI 或运维机构造「含 devDependencies 的构建镜像」单独跑迁移，或在仓库根目录用 **Node 20 + pnpm** 安装依赖后执行：

```bash
cd services/api && pnpm install && pnpm prisma migrate deploy
```

（需保证该环境的 `DATABASE_URL` 指向 RDS。）

### 5.4 运行 API 容器

准备 **`/opt/playmate/api.env`**（勿提交 Git），内容由 `.env.example` 拷贝并改为生产值：

```bash
docker pull registry.cn-<地域>.aliyuncs.com/<命名空间>/api:<标签>

docker run -d --name playmate-api --restart unless-stopped \
  --env-file /opt/playmate/api.env \
  -p 127.0.0.1:3000:3000 \
  registry.cn-<地域>.aliyuncs.com/<命名空间>/api:<标签>
```

说明：

- **`-p 127.0.0.1:3000:3000`**：仅本机可访问，由本机 Nginx 反代到 `http://127.0.0.1:3000`。
- **`JWT_SECRET` / `ADMIN_JWT_SECRET`**：使用高强度随机串。
- **`WECHAT_PAY_NOTIFY_URL`**：必须为 **公网 HTTPS**，路径指向 **`https://你的域名/api/wechat-pay/notify`**（与代码全局前缀一致）。
- **`WECHAT_PAY_DEV_SIMULATE`**：生产完整商户参数齐全后设为 **`false`**。

### 5.5 HTTPS 与反向代理（简要）

在 ECS 安装 Nginx/Caddy：

- `server_name` 指向你的域名。
- `location /api/` → `proxy_pass http://127.0.0.1:3000/api/`（注意末尾斜杠与 Nest 全局前缀一致）。
- 证书：阿里云 **SSL 证书** 或 Let’s Encrypt。

微信小程序「服务器域名」需配置该 HTTPS 域名。

---

## 六、可选：负载均衡 SLB / ALB

- 多台 ECS 跑同一镜像时，前置 **应用型负载均衡 ALB**，后端挂在 **443 → ECS:443** 或 **443 → Nginx**。
- 健康检查路径可设为 **`GET /api/health`**（若项目已暴露；若无则需补充健康检查接口或使用 TCP 检查）。

---

## 七、运维与发布流程建议

1. **新版本**：构建镜像 → 推送新标签 → ECS `docker pull` → `docker stop/rm` 旧容器 → `docker run` 新容器（或 `docker compose up -d` 若你在云上维护精简 compose）。
2. **迁移**：Schema 变更合并后，在发布前或滚动第一步执行 **`prisma migrate deploy`**。
3. **回滚**：沿用上一镜像标签重启容器。
4. **日志**：`docker logs -f playmate-api`；生产建议接 **日志服务 SLS**（Docker log driver 或文件采集）。
5. **监控**：云监控设置 CPU、内存、磁盘、进程；对 **`/api`** 可做合成探测。

---

## 八、安全检查清单

- [ ] RDS/Redis **仅内网**访问，强密码，定期轮转。
- [ ] **RAM 子账号** + **最小权限**操作 ACR、ECS、RDS。
- [ ] 密钥优先 **KMS / 环境变量注入**，勿硬编码进镜像。
- [ ] 微信支付相关：**商户私钥、API v3 Key** 仅存放在服务器侧；回调 **验签** 勿在生产关闭。
- [ ] 安全组 **默认拒绝**，按需放行。
- [ ] 定期系统补丁与镜像漏洞扫描（ACR 镜像扫描）。

---

## 九、其他部署形态（简述）

| 形态                  | 适用场景                                                                     |
| --------------------- | ---------------------------------------------------------------------------- |
| **SAE**               | 托管容器，免运维机器，适合中小流量；配置 VPC、环境变量、镜像地址即可。       |
| **ACK（Kubernetes）** | 需要弹性伸缩、灰度、多集群；将 Deployment + Service + Ingress 指向同一镜像。 |
| **云效 DevOps**       | 代码推送触发构建 ACR、SSH 到 ECS 滚动更新或部署到 ACK。                      |

---

## 十、故障排查速查

| 现象               | 可能原因                                                                |
| ------------------ | ----------------------------------------------------------------------- |
| 容器启动后立即退出 | `DATABASE_URL`/`REDIS_URL` 错误、网络不通、迁移未执行导致启动校验失败   |
| 小程序请求失败     | 域名未加入小程序后台 **request 合法域名**、证书链不全、仅 HTTP 未 HTTPS |
| 支付回调未到账     | `WECHAT_PAY_NOTIFY_URL` 不可达、验签失败、公钥 ID 与平台不一致          |
| Prisma 报错        | RDS 版本过低、连接数满、`migrate deploy` 未执行                         |

---

## 十一、与本仓库文件的对应关系

- **镜像构建**：`services/api/Dockerfile`（构建上下文为**仓库根目录**）。
- **本地联调依赖**：根目录 `docker-compose.yml`（`api`、`postgres`、`redis`、`web`）。
- **环境变量模板**：`services/api/.env.example`。

如需同时部署 **`infra/nginx`** 中的静态站点，可单独再构建该 Dockerfile 或使用 OSS + CDN；本文仅覆盖 **API 服务**上线主线。

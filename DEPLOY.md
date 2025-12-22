# 部署说明（服务器可直接部署）

本项目为 **Vite + Vue3 的纯前端静态站点**。

交付目标：

- 产出可部署的静态文件（`dist/`）
- 产出可直接在服务器运行的 Docker 镜像（Nginx 托管 `dist/`）
- 生产构建默认关闭 sourcemap，并对构建后的 JS 做混淆以提高逆向成本

## 0. 一页式快速清单（从零到上线）

你可以按两条路线部署：

- **Docker 路线（推荐）**：服务器只需要装 Docker/Compose，然后 `docker compose up -d --build`
- **Nginx 静态路线**：你在本地/CI 构建出 `dist/`，上传到服务器 Nginx 目录并配置站点

上线前的必备条件：

- **服务器**：1 台 Linux（推荐 Ubuntu 22.04/24.04）
- **域名（可选但推荐）**：用于 HTTPS
- **开放端口**：
  - HTTP：`80`
  - HTTPS：`443`
  - （如果你走 compose 默认端口）测试端口：`8080`

推荐上线流程（最稳妥）：

1. 服务器初始化（更新系统、防火墙开放 80/443）
2. 选择路线：Docker 或 Nginx
3. 构建发布包（`npm run build:release`）或直接 Docker build
4. 配置域名与 HTTPS
5. 验证：刷新 `/game` 等路由是否正常（SPA 回退到 `index.html`）

## 1. 重要说明（关于“加密/防逆向”）

- 前端代码最终必须下发到浏览器，**无法做到绝对防逆向**。
- 本仓库提供的是“提高逆向成本”的方案：
  - 关闭 sourcemap
  - 生产环境移除 `console` / `debugger`
  - 构建产物文件名哈希
  - 对构建后的 JS 进行混淆
- 任何真正需要保密的内容（例如：AI Key、核心算法、付费校验逻辑）必须放到服务端。

建议你把“必须保密”的内容迁移到服务端的原因：

- `VITE_*` 变量会被打进前端 bundle，属于**明文可见**
- 浏览器端无法安全存储任何“不可泄露”的 key

如果你需要真正的“防滥用/防盗用”：

- 建议加一个同域网关服务（后端持有 Key，前端只访问你自己的域名）
- 或者做授权校验（本项目已经预留了授权配置项 `AUTH_CONFIG`）

## 2. 从零准备服务器（Ubuntu 22.04/24.04 示例）

如果你是新服务器，建议先做这些操作（非必须，但强烈推荐）：

### 2.1 更新系统与基础工具

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install curl ca-certificates gnupg
```

### 2.2 防火墙开放端口

如果你使用 UFW：

```bash
sudo apt -y install ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

如果你临时只做测试（compose 默认 8080）：

```bash
sudo ufw allow 8080/tcp
```

### 2.3 DNS（可选）

如果你有域名：

- 添加 `A` 记录：`your-domain.com` -> `服务器公网 IP`
- 等待解析生效（通常几分钟到几十分钟）

## 3. 获取项目代码

你可以选择两种方式：

- **方式 A：Git 拉取**（推荐）
- **方式 B：直接上传项目压缩包**（适合没有 git 的环境）

### 3.1 Git 拉取（推荐）

```bash
git clone <你的仓库地址>
cd <项目目录>
```

### 3.2 上传压缩包

把项目上传到服务器（SCP / SFTP / 宝塔 / 面板均可），解压后进入项目目录：

```bash
unzip project.zip
cd <项目目录>
```

## 4. 构建发布包（本地或 CI）

### 4.1 安装依赖

```bash
npm install
```

注意：如果你是首次拉取或更新了依赖，请先执行一次 `npm install` 以更新 `package-lock.json`。

### 4.2 生产构建 + 混淆

```bash
npm run build:release
```

产物目录：

- `dist/`

可选：混淆强度（默认 balanced）

```bash
set OBFUSCATE_LEVEL=aggressive && npm run build:release
```

支持值：

- `light`
- `balanced`
- `aggressive`

### 4.3 仅用于本地验证（不是生产部署）

在你的电脑或服务器上临时验证构建产物：

```bash
npm run preview
```

注意：`vite preview` 适用于**本地预览**，生产建议使用 Nginx/Caddy/云静态托管。

## 5. 方案 A：Docker 一键部署（推荐，从零部署最快）

Docker 方案特点：

- **优点**：不污染系统环境，服务器只要装 Docker
- **缺点**：HTTPS/域名通常还要额外再做一层反代（或用云负载均衡）

### 5.1 安装 Docker（Ubuntu 示例）

参考官方做法的简化版：

```bash
sudo apt update
sudo apt -y install docker.io docker-compose-plugin
sudo systemctl enable --now docker
docker --version
docker compose version
```

（可选）把当前用户加入 docker 组，避免每次都 sudo：

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 5.2 构建并启动

在服务器上安装 Docker 与 Docker Compose 后，在项目根目录执行：

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

默认端口映射：

- 宿主机 `8080` -> 容器 `80`

访问：

- `http://你的服务器IP:8080/`

### 5.3 查看日志/排障

```bash
docker compose -f deploy/docker-compose.yml logs -f --tail=200
```

### 5.4 更新版本

```bash
docker compose -f deploy/docker-compose.yml up -d --build
```

### 5.5 停止

```bash
docker compose -f deploy/docker-compose.yml down
```

### 5.6 更新与回滚建议

更新：

```bash
git pull
docker compose -f deploy/docker-compose.yml up -d --build
```

回滚（推荐策略）：

- 用 git tag / commit 固定版本
- 回滚到某个 commit 后重新 build

## 6. 方案 B：直接部署 dist 到 Nginx（推荐生产）

该方案适合：

- 你需要标准 `80/443` 端口
- 你要做 HTTPS（Certbot 一键）
- 你希望使用 Nginx 统一托管多个站点

### 6.1 安装 Nginx（Ubuntu 示例）

```bash
sudo apt update
sudo apt -y install nginx
sudo systemctl enable --now nginx
```

### 6.2 构建与上传

```bash
npm run build:release
```

把 `dist/` 上传到服务器，例如：

- `/var/www/dadao-chaotian/`

示例（在服务器上执行）：

```bash
sudo mkdir -p /var/www/dadao-chaotian
sudo rsync -av --delete dist/ /var/www/dadao-chaotian/
sudo chown -R www-data:www-data /var/www/dadao-chaotian
```

### 6.3 Nginx 配置

参考 `deploy/nginx.conf`，关键点：

- SPA 必须 `try_files ... /index.html`
- `index.html` 建议禁用缓存
- 静态资源（带 hash）启用长期缓存

如果你用域名部署，建议把 `deploy/nginx.conf` 的 `server_name _;` 改成你的域名。

示例站点文件：

- `/etc/nginx/sites-available/dadao-chaotian.conf`

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/dadao-chaotian.conf /etc/nginx/sites-enabled/dadao-chaotian.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 6.4 配置 HTTPS（Certbot，推荐）

前提：

- 域名已解析到服务器 IP
- 服务器已放通 80/443

安装并申请证书：

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

续期检查：

```bash
sudo certbot renew --dry-run
```

## 7. 环境变量与配置（重要）

本项目使用 `import.meta.env`（`VITE_*`）读取配置。

**注意：Vite 的 `VITE_*` 是“构建期注入”**，静态站点部署后无法再通过服务器环境变量动态修改。

推荐做法：

- 在构建机器上准备 `.env.local` 或 `.env.production` 后再构建

常见部署策略：

- **策略 A（推荐）**：CI/本地构建出 `dist/`，上传 `dist/` 到服务器
- **策略 B**：服务器上安装 Node.js，然后在服务器上构建（便于快速改配置，但会污染环境）
- **策略 C**：Docker 构建阶段注入（把 `.env.production` 放进构建上下文）

常用项（示例）：

```ini
VITE_AUTH_SERVER_URL=https://auth.ddct.top
VITE_APP_ID=v32_08f3deaf
VITE_AUTH_VERIFY_ENDPOINT=/server.php
VITE_AI_CUSTOM_API_URL=
VITE_AI_CUSTOM_API_KEY=
VITE_CLOUD_SYNC_URL=
```

## 8. 关于 AI Key / CORS（生产环境建议）

- 浏览器直连第三方 AI 服务通常会遇到 CORS。
- 且 **API Key 放在前端一定会泄露**。

建议在生产上提供一个同域后端（或 Nginx 反代到你自己的网关服务）：

- 前端只请求你的域名 `/api/...`
- 网关在服务端持有 Key，并转发到第三方

如果你需要，我可以在当前仓库里补一个最小的“AI 转发网关”（Node/Go 任一）并配好 Nginx 反代。

## 9. 常见问题（从零部署最常遇到）

### 9.1 页面打开白屏 / 控制台 404

常见原因：

- Nginx 没做 SPA 回退：需要 `try_files $uri $uri/ /index.html;`
- 上传目录不对：`root` 指向了错误的目录

### 9.2 刷新 `/game` 变 404

这也是 SPA 回退没配好。按 `deploy/nginx.conf` 配置即可。

### 9.3 `docker compose` 找不到命令

在 Ubuntu 上建议安装：

- `docker-compose-plugin`

并使用：

- `docker compose ...`（注意没有横杠）

### 9.4 证书申请失败

检查：

- DNS 是否已经指向当前服务器
- 80/443 是否放通（云厂商安全组 + 服务器防火墙）
- Nginx 是否已启动且能用 80 访问

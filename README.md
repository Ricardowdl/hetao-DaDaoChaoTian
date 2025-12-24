# 纵横诸天 0.2（内测）

一个基于 **Vue 3 + Vite + Pinia + Vue Router** 的前端单机修仙文字/叙事类项目，集成 **OpenAI-兼容接口** 的 AI 交互能力，并支持开局世界生成、角色创建、存档/自动存档、提示词管理等功能。

> 说明：本仓库根目录原本无 `README.md`，此文件用于作为“完整项目文档/交付说明”。

---

## 1. 项目概览

### 1.1 主要能力

- **单机模式流程**
  - 模式选择 → 角色创建 → 进入游戏 → 叙事推进/面板操作
- **AI 交互（OpenAI-compat）**
  - 支持流式输出
  - 支持多家兼容提供方预设（DeepSeek/GLM/Kimi/MiniMax）与自定义 Base URL
- **开局世界生成**
  - AI 生成 continents/factions/locations 等结构化世界数据
  - 提供世界生成调试与错误页面
- **提示词管理**
  - 内置提示词集（来自 `prompts_all (1).json`）
  - 支持覆盖与导入导出（存储于 IndexedDB）
- **存档/自动存档**
  - 游戏进度与元数据存储于 IndexedDB
- **UI/可用性**
  - 全局缩放、字体大小、动画速度
  - 顶部 Toast 与全屏

### 1.2 技术栈

- **框架**：Vue 3
- **构建工具**：Vite 7
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **语言**：TypeScript

---

## 2. 快速开始

### 2.1 环境要求

- Node.js：建议 18+（与 Vite 7/TS5 更匹配）
- 包管理器：npm（项目已包含 `package-lock.json`）

### 2.2 安装依赖

```bash
npm install
```

### 2.3 启动开发服务器

```bash
npm run dev
```

- 默认端口：`5173`
- `vite.config.ts` 启用了 `strictPort: true`，若端口被占用会直接启动失败（请关闭占用进程或改端口）。

### 2.4 构建与预览

```bash
npm run build
npm run preview
```

- 构建产物输出目录：`dist/`

---

## 3. 配置与环境变量

项目运行时会从 `import.meta.env` 读取部分配置（见 `src/config/endpoints.ts`、`src/config/auth.ts`）。

### 3.1 `.env` 示例

在项目根目录创建 `.env.local`（或 `.env`）可覆盖默认值：

```ini
# 授权服务
VITE_AUTH_SERVER_URL=https://auth.ddct.top
VITE_APP_ID=v32_08f3deaf
VITE_AUTH_VERIFY_ENDPOINT=/server.php

# AI 自定义接口（当预设=custom 时使用）
VITE_AI_CUSTOM_API_URL=
VITE_AI_CUSTOM_API_KEY=

# 云同步（若实现/启用）
VITE_CLOUD_SYNC_URL=
```

### 3.2 授权开关

见 `src/config/auth.ts`：

- `AUTH_CONFIG.ENABLE_AUTH` 当前为 `false`（用于测试阶段临时关闭授权）
- 如需启用授权：
  - 设置 `AUTH_CONFIG.ENABLE_AUTH = true`
  - 确保 `VITE_AUTH_SERVER_URL` 与 `VITE_AUTH_VERIFY_ENDPOINT` 指向可用服务

---

## 4. AI 接入说明

### 4.1 OpenAI-兼容接口（主要通道）

核心实现：`src/services/aiClient.ts`

支持：

- `/chat/completions`（支持 `stream`）
- `/models` 模型列表
- 额外：对部分供应商做了兼容（例如 GLM 的鉴权 token 处理）

### 4.2 预设提供方

`src/services/aiProviders.ts` 定义了预设：

- `deepseek`
- `glm`
- `kimi`
- `minimax`
- `custom`（自定义 Base URL）

其中 DeepSeek 在开发环境下默认走 Vite 代理：

- Dev：Base URL 为 `/deepseek`
- Prod：Base URL 为 `https://api.deepseek.com`

### 4.3 Vite 代理（解决开发期跨域）

`vite.config.ts` 代理规则：

- 以 `/deepseek` 开头的请求会被转发到 `https://api.deepseek.com`
- 并重写路径：`/deepseek/...` → `/...`

注意：

- 这是 **仅开发环境** 的便利能力；生产环境需要你自己处理 CORS/网关/反代。

### 4.4 常见 AI 配置项（设置页）

由 `src/stores/useSettingsStore.ts` 管理并存储于 localStorage：

- `aiProviderPreset`：提供方预设
- `customApiUrl` / `customApiKey`
- `aiModel`
- `aiTemperature`
- `aiMaxContextTokens` / `aiMaxOutputTokens`

---

## 5. 世界生成（开局初始化）

核心实现：`src/services/worldGeneration.ts`

- 支持的 provider（类型）：
  - `openai_compat`
  - `custom_api`
  - `local`
- 生成目标：只输出 `continents / factions / locations` 三个字段的 JSON（并有解析与校验流程）。
- 相关调试页面路由：
  - `/world-gen-debug`
  - `/world-gen-error`

世界生成提示词来源：

- `prompts_all (1).json`
- `提示词.txt`
- `src/services/promptStore.ts`（IndexedDB 覆盖/合成提示词）

---

## 6. 数据存储说明

### 6.1 localStorage

主要用于：

- 用户设置：`dad_game_settings`（见 `useSettingsStore`）
- 授权信息：`auth_verified` / `auth_*`（见 `useAuthStore`）
- AI 可用模型缓存：`ai_available_models`

### 6.2 IndexedDB

主要用于：

- 游戏存档库：见 `src/config/storage.ts`
  - DB：`GameDatabase`
  - stores：`saves` / `metadata` / `settings`
- 提示词覆盖库：见 `src/services/promptStore.ts`
  - DB：`dad-prompts`
  - store：`prompts`（以及兼容表 `tavern-prompts`）

---

## 7. 路由与页面

路由定义：`src/router/index.ts`

主要页面：

- `/`：模式选择（`ModeSelection`）
- `/creation`：角色创建（`CharacterCreateView`）
- `/login`：登录/授权（`LoginView`）
- `/management`：角色管理（`CharacterManagementView`）
- `/character`：角色详情（`CharacterDetailView`）
- `/game`：主游戏界面（`GameView`）
- `/prompts`：提示词管理（`PromptManagementView`）
- `/world-gen-debug`：世界生成调试
- `/world-gen-error`：世界生成错误展示

---

## 8. 目录结构（推荐阅读顺序）

```text
.
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
├─ prompts_all (1).json
├─ 提示词.txt
├─ src/
│  ├─ main.ts                # 应用入口：createApp + Pinia + Router
│  ├─ App.vue                # RouterView + ProgressPage + Toast；初始化设置/元数据加载
│  ├─ router/                # 路由
│  ├─ views/                 # 页面层
│  ├─ components/            # 面板/弹窗组件（背包、宗门、关系、地图、设置等）
│  ├─ stores/                # Pinia 状态仓库（设置/授权/游戏状态/角色等）
│  ├─ services/              # 业务服务（AI、世界生成、存档调度、指令解析等）
│  ├─ config/                # 运行配置（endpoints/auth/storage/promptDefaults/daoPresets）
│  ├─ styles/                # 全局样式
│  └─ utils/                 # 工具方法
├─ dist/                     # 构建产物
└─ 开发文档/                 # 研发过程文档、反混淆分析、需求/流程等材料
```

---

## 9. 核心模块说明

### 9.1 `src/views/GameView.vue`

- 主游戏 UI 与交互入口
- 左侧为“功能面板”入口（背包/人物详情/宗门/地图/记忆中心/提示词/设置等）

### 9.2 `src/stores/useGameStateStore.ts`

- 定义存档结构 `SaveData`（玩家状态/世界信息/叙事历史/背包/任务系统等）
- 维护游戏时间、寿命/年龄等基础规范化逻辑
- 与指令系统（`tavernCommands`）存在耦合：会将 AI 输出的状态变更应用到游戏状态

### 9.3 `src/services/aiClient.ts`

- OpenAI-compat 请求封装：
  - `chatCompletionText()`：聊天完成（支持 stream）
  - `listModels()`：拉取模型列表
  - `customGenerateText()`：自定义 `/generate` 端点（用于你自建的轻量接口）

### 9.4 `src/services/promptStore.ts`

- 提示词的“默认内容 + 覆盖内容”管理
- 支持按分类加载、导入导出、重置
- 对部分 key 强制使用内置默认（不可覆盖）

### 9.5 `src/services/worldGeneration.ts`

- 开局世界生成：
  - 合成 system prompt
  - 调用 AI
  - 抽取 JSON、宽松解析与修复
  - 归一化/校验 continents/factions/locations

---

## 10. 构建与发布

### 10.1 静态部署

该项目为纯前端产物，可将 `npm run build` 生成的 `dist/` 部署到任意静态站点服务。

### 10.2 生产环境的 AI/CORS

- 浏览器直接请求第三方 AI 服务通常会遇到 CORS 或 HTTPS Mixed Content 限制。
- 建议生产环境使用：
  - 自己的后端网关/反向代理
  - 或在同域下提供 `/v1/chat/completions` 的转发接口

---

## 11. 常见问题（FAQ）

### 11.1 `5173` 端口被占用

- 项目配置了 `strictPort: true`，端口占用会直接报错。
- 解决：关闭占用进程，或修改 `vite.config.ts` 的 `server.port`。

### 11.2 AI 请求 `Failed to fetch` / 跨域

- 检查 Base URL 是否包含协议（`http://` / `https://`）
- HTTPS 页面无法请求 HTTP 接口（会被浏览器拦截）
- Dev 环境使用 DeepSeek 可通过 `/deepseek` 代理规避部分跨域问题

### 11.3 世界生成失败/JSON 解析失败

- 模型输出可能包含非 JSON 文本或格式不严谨
- `worldGeneration.ts` 已做了多次重试与宽松解析；仍失败时可：
  - 降低生成数量（大洲/势力/地点）
  - 更换模型或提高 `maxTokens`
  - 进入 `/world-gen-debug` 查看调试信息

---

## 12. 开发资料

项目根目录包含 `开发文档/`，里面有流程文档、反混淆分析报告、需求材料等，可作为进一步理解游戏逻辑与数据结构的参考。

# 灵画 Artvis - AI 创作平台（前端）

AI 图片/视频生成 Web 前端。用户输入创意描述、选择生成参数，提交异步任务后通过轮询获得生成结果。

技术栈：**React 19 + Vite + TypeScript**，零额外运行时依赖（无 UI 库 / 无状态库 / 无 axios），原生 CSS 变量实现暗色主题。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
```

其他命令：

```bash
npm run lint       # oxlint
npm run build      # tsc -b && vite build
npm run preview    # 本地预览生产构建
```

要求 Node ≥ 20.19。

## 功能

- **图片生成**：提示词 + 模型 / 画幅（1:1、4:3、3:4、16:9、9:16）/ 数量（1、2、4 张）
- **视频生成**：提示词 + 模型 / 画幅（16:9、9:16）/ 时长（5s、10s）/ 运动强度，可上传参考图（图生视频）
- **异步任务流**：提交 → 排队 → 进度 → 结果，可随时取消
- **结果操作**：网格展示、放大预览（Esc 关闭）、下载、同参数重新生成
- **预设提示词**：一键填充示例创意
- 左右分模式独立保存参数，切换图片/视频 tab 不丢设置

## Mock 与真实 API

默认使用内置 Mock 适配器（无需任何后端）：模拟提交延迟、排队、进度爬升，图片耗时约 3–6s、视频约 10–14s。

- **失败路径验证**：提示词中包含「失败」或 `fail`，任务会在 50% 进度处失败，用于检查错误/重试 UI
- Mock 结果图片来自 `picsum.photos`（按 taskId 种子化，重复轮询不闪烁），视频使用公共示例 MP4——**需要网络可用**，完全离线时图片会显示为裂图

### 切换真实 API

1. 复制 `.env.example` 为 `.env.local`
2. 设置：

```bash
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:9999   # 你的服务端代理
VITE_API_KEY=your-proxy-token
```

3. 重启 dev server（env 在启动时静态内联，修改后必须重启）

> ⚠️ **不要**把 `VITE_API_BASE_URL` 指向火山引擎即梦 API 直连地址：官方 API 要求 HMAC-SHA256 签名（需要 SecretKey，绝不能进浏览器代码）且受 CORS 限制。`src/api/volcanoAdapter.ts` 约定的代理契约：`POST /tasks`（提交）、`GET /tasks/:id`（查询）、`DELETE /tasks/:id`（取消），由你的后端完成签名转发。

## 项目结构
```
src/
├── api/            # 服务层：接口 + Mock 适配器 + 真实适配器 stub
├── components/     # UI 组件（jm- 前缀类名）
├── constants/      # 模型/画幅/预设等选项常量
├── hooks/          # useGenerationTask：提交 + 轮询 + 取消
├── styles/         # tokens(主题) / layout(布局) / components(组件)
├── types/          # 领域类型（判别联合，全项目唯一来源）
└── utils/          # 跨域下载工具
```

关键设计：

- **任务生命周期**（`types/generation.ts`）：`GenerationTask` 携带原始 request，「重新生成」直接复用
- **轮询**（`hooks/useGenerationTask.ts`）：effect + 递归 `setTimeout` + `AbortController`，StrictMode 双挂载安全、卸载自动清理、3 分钟硬超时
- **Mock 确定性**：结果 URL 是 taskId 的纯函数，轮询期间不闪烁

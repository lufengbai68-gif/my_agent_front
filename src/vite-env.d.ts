/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'false' 时切换到真实 API 适配器，默认（未设置）为 Mock */
  readonly VITE_USE_MOCK?: string
  /** 真实适配器的代理地址（自己的服务端代理，非火山引擎直连） */
  readonly VITE_API_BASE_URL?: string
  /** 代理的 Bearer Token（仅发给自己的代理） */
  readonly VITE_API_KEY?: string
  /** 轮询间隔毫秒数，默认 1500 */
  readonly VITE_POLL_INTERVAL_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

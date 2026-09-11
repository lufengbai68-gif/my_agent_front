import type {
  GenerationRequest,
  GenerationTask,
  SubmitTaskResponse,
  TaskStatus,
} from '../types/generation'
import type { GenerationService } from './generationService'

/**
 * 真实 API 适配器（STUB）—— 指向你自己的服务端代理。
 *
 * ⚠️ 安全与网络约束（勿改）：
 * - 火山引擎即梦等官方 API 要求 HMAC-SHA256 请求签名且强制 CORS 限制，
 *   签名需要 SecretKey，绝不能进入浏览器端代码。
 * - 因此本适配器只与「你自己的后端代理」通信：
 *     POST   {VITE_API_BASE_URL}/tasks        提交任务
 *     GET    {VITE_API_BASE_URL}/tasks/:id    查询任务
 *     DELETE {VITE_API_BASE_URL}/tasks/:id    取消任务
 * - VITE_API_KEY 只作为 Bearer Token 发给代理，不存放火山密钥。
 *
 * 代理响应体到 GenerationTask 的映射骨架已就位，
 * 具体字段以代理实现为准（见 TODO 标记）。
 */

/** 代理层约定的任务响应体（TODO: 按代理实际返回调整字段） */
interface ProxyTaskPayload {
  id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
  progress?: number
  error?: string
  /** TODO: 代理透传的结果列表，字段按真实 API 映射 */
  results?: Array<{
    kind: 'image' | 'video'
    url: string
    posterUrl?: string
    width?: number
    height?: number
    durationSec?: number
    seed?: number
  }>
}

/** 代理状态 → 领域状态；未知值归为 failed 防止 UI 卡死 */
const STATUS_MAP: Record<string, TaskStatus> = {
  queued: 'queued',
  running: 'running',
  succeeded: 'succeeded',
  failed: 'failed',
  canceled: 'canceled',
}

const STATUS_MESSAGES: Record<TaskStatus, string> = {
  queued: '排队中',
  running: '生成中',
  succeeded: '生成完成',
  failed: '生成失败',
  canceled: '已取消',
}

export class VolcanoGenerationService implements GenerationService {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.authHeader(),
      ...(init.headers as Record<string, string> | undefined),
    }
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers })
    if (!res.ok) {
      throw new Error(`代理请求失败：${res.status} ${res.statusText}`)
    }
    return (await res.json()) as T
  }

  private authHeader(): Record<string, string> {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}
  }

  async submitTask(
    request: GenerationRequest,
    signal?: AbortSignal,
  ): Promise<SubmitTaskResponse> {
    // TODO: 按代理实际入参映射（如火山引擎即梦的 req_key/scale 等）
    return this.request<{ taskId: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(request),
      signal,
    })
  }

  async getTask(taskId: string, signal?: AbortSignal): Promise<GenerationTask> {
    const payload = await this.request<ProxyTaskPayload>(`/tasks/${taskId}`, {
      signal,
    })
    return this.mapTask(taskId, payload)
  }

  async cancelTask(taskId: string, signal?: AbortSignal): Promise<void> {
    await this.request(`/tasks/${taskId}`, { method: 'DELETE', signal })
  }

  /** 代理响应 → 领域对象。payload 缺 request/mode，由 useGenerationTask 缓存补齐 */
  private mapTask(taskId: string, payload: ProxyTaskPayload): GenerationTask {
    const status = STATUS_MAP[payload.status] ?? 'failed'
    return {
      id: payload.id ?? taskId,
      // request/mode 由 useGenerationTask 本地维护的缓存补齐（见调用约定）
      mode: 'image',
      request: {} as GenerationRequest,
      status,
      progress: payload.progress ?? (status === 'succeeded' ? 100 : 0),
      statusMessage: STATUS_MESSAGES[status],
      results:
        payload.results?.map((r) =>
          r.kind === 'video'
            ? {
                kind: 'video' as const,
                url: r.url,
                posterUrl: r.posterUrl,
                width: r.width ?? 1280,
                height: r.height ?? 720,
                durationSec: r.durationSec ?? 5,
              }
            : {
                kind: 'image' as const,
                url: r.url,
                width: r.width ?? 1024,
                height: r.height ?? 1024,
                seed: r.seed ?? 0,
              },
        ) ?? [],
      error:
        payload.error ??
        (status === 'failed' ? '生成失败，请稍后重试' : undefined),
      createdAt: 0,
    }
  }
}

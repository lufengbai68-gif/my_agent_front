import {
  ASPECT_PIXELS,
  SAMPLE_VIDEO_URLS,
} from '../constants/options'
import type {
  GenerationRequest,
  GenerationResult,
  GenerationTask,
  ImageGenerationRequest,
  SubmitTaskResponse,
  VideoGenerationRequest,
} from '../types/generation'
import type { GenerationService } from './generationService'

/** mock 任务的内部记录（不入 UI 类型） */
interface MockTaskRecord {
  task: GenerationTask
  startedAt: number
  /** 模拟总耗时 ms */
  totalMs: number
}

/** 区间内取随机整数 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** 由 taskId 派生稳定的伪随机数（0-1）：保证轮询期间结果 URL 不变 */
function seededRandom(seedStr: string): number {
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) | 0
  }
  return Math.abs(hash % 1000) / 1000
}

/**
 * Mock 生成服务：纯时间驱动模拟（getTask 按 now - startedAt 推导状态），
 * 不持有任何定时器。任务存在内存 Map 中，刷新页面即清空（MVP 可接受）。
 */
export class MockGenerationService implements GenerationService {
  private records = new Map<string, MockTaskRecord>()

  async submitTask(
    request: GenerationRequest,
    _signal?: AbortSignal,
  ): Promise<SubmitTaskResponse> {
    const taskId = `mock_${crypto.randomUUID()}`
    const now = Date.now()
    const totalMs =
      request.mode === 'image'
        ? 3000 + (request.count - 1) * 1200 + randInt(0, 1500)
        : 10000 + randInt(0, 4000)

    const task: GenerationTask = {
      id: taskId,
      mode: request.mode,
      request,
      status: 'queued',
      progress: 0,
      statusMessage: '排队中',
      results: [],
      createdAt: now,
    }
    this.records.set(taskId, { task, startedAt: now, totalMs })
    // 模拟提交网络延迟
    await new Promise((r) => setTimeout(r, 300))
    return { taskId }
  }

  async getTask(taskId: string, _signal?: AbortSignal): Promise<GenerationTask> {
    const record = this.records.get(taskId)
    if (!record) {
      throw new Error(`任务不存在：${taskId}`)
    }

    const elapsed = Date.now() - record.startedAt
    const { task, totalMs } = record

    // 已到终态：直接返回缓存，避免重复计算
    if (
      task.status === 'succeeded' ||
      task.status === 'failed' ||
      task.status === 'canceled'
    ) {
      return { ...task }
    }

    const shouldFail = this.shouldFail(task.request)
    const progress = Math.min(95, Math.round((elapsed / totalMs) * 100))

    // 失败钩子：进度过半后转为 failed
    if (shouldFail && progress >= 50) {
      record.task = {
        ...task,
        status: 'failed',
        progress: 50,
        statusMessage: '生成失败',
        error: '内容生成失败，请修改描述后重试',
        finishedAt: Date.now(),
      }
      return { ...record.task }
    }

    if (elapsed < 800) {
      return { ...task, status: 'queued', progress: Math.min(5, progress), statusMessage: '排队中' }
    }

    if (elapsed < totalMs) {
      return {
        ...task,
        status: 'running',
        progress: Math.max(6, progress),
        statusMessage: '生成中',
      }
    }

    record.task = {
      ...task,
      status: 'succeeded',
      progress: 100,
      statusMessage: '生成完成',
      results: this.buildResults(taskId, task.request),
      finishedAt: Date.now(),
    }
    return { ...record.task }
  }

  async cancelTask(taskId: string, _signal?: AbortSignal): Promise<void> {
    const record = this.records.get(taskId)
    if (record && !isTerminal(record.task.status)) {
      record.task = {
        ...record.task,
        status: 'canceled',
        statusMessage: '已取消',
        finishedAt: Date.now(),
      }
    }
  }

  /** 失败测试钩子：提示词含「失败」或 fail 时任务在 50% 处失败 */
  private shouldFail(request: GenerationRequest): boolean {
    return /失败|fail/i.test(request.prompt)
  }

  /**
   * 结果必须是 taskId 的纯函数（picsum seed = taskId+index），
   * 否则轮询期间 UI 会在不同"结果"间闪烁。
   */
  private buildResults(taskId: string, request: GenerationRequest): GenerationResult[] {
    if (request.mode === 'image') {
      return this.buildImageResults(taskId, request)
    }
    return this.buildVideoResults(taskId, request)
  }

  private buildImageResults(
    taskId: string,
    request: ImageGenerationRequest,
  ): GenerationResult[] {
    const { width, height } = ASPECT_PIXELS[request.aspectRatio]
    return Array.from({ length: request.count }, (_, i) => {
      const seed = `${taskId}-${i}`
      return {
        kind: 'image' as const,
        url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`,
        width,
        height,
        seed: Math.floor(seededRandom(seed) * 1_000_000),
      }
    })
  }

  private buildVideoResults(
    taskId: string,
    request: VideoGenerationRequest,
  ): GenerationResult[] {
    const { width, height } = ASPECT_PIXELS[request.aspectRatio]
    const pick = Math.floor(seededRandom(taskId) * SAMPLE_VIDEO_URLS.length)
    return [
      {
        kind: 'video' as const,
        url: SAMPLE_VIDEO_URLS[pick],
        posterUrl: `https://picsum.photos/seed/${encodeURIComponent(taskId)}/1280/720`,
        width,
        height,
        durationSec: request.durationSec,
      },
    ]
  }
}

function isTerminal(status: GenerationTask['status']): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'canceled'
}

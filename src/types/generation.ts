/**
 * 领域类型 —— 全项目唯一契约来源。
 * api/ 与 components/ 均从此处导入，禁止反向依赖。
 */

// ---------- 基础字面量 ----------

export type GenerationMode = 'image' | 'video'

export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16'

export type MotionLevel = 'static' | 'smooth' | 'dynamic'

// ---------- 请求（以 mode 判别的联合类型）----------

export interface ImageGenerationRequest {
  mode: 'image'
  prompt: string
  /** 模型 id，见 constants/options.ts */
  model: string
  aspectRatio: AspectRatio
  count: 1 | 2 | 4
  seed?: number
}

/** 图生视频的参考图（dataUrl 为本地预览，由真实适配器决定上传方式） */
export interface ReferenceImage {
  fileName: string
  dataUrl: string
}

export interface VideoGenerationRequest {
  mode: 'video'
  prompt: string
  model: string
  /** 视频模式仅开放 16:9 / 9:16 */
  aspectRatio: Extract<AspectRatio, '16:9' | '9:16'>
  durationSec: 5 | 10
  motion: MotionLevel
  /** 携带参考图即为图生视频 */
  referenceImage?: ReferenceImage | null
}

export type GenerationRequest = ImageGenerationRequest | VideoGenerationRequest

// ---------- 结果（以 kind 判别的联合类型）----------

export interface ImageTaskResult {
  kind: 'image'
  url: string
  width: number
  height: number
  seed: number
}

export interface VideoTaskResult {
  kind: 'video'
  url: string
  /** 首帧海报 */
  posterUrl?: string
  width: number
  height: number
  durationSec: number
}

export type GenerationResult = ImageTaskResult | VideoTaskResult

// ---------- 任务聚合体 ----------

/**
 * 轮询返回、UI 渲染的核心对象。
 * 携带原始 request，供"重新生成"复用参数。
 */
export interface GenerationTask {
  id: string
  mode: GenerationMode
  request: GenerationRequest
  status: TaskStatus
  /** 0-100 */
  progress: number
  /** 如「排队中」「生成中」「生成完成」 */
  statusMessage?: string
  /** 成功前为空数组 */
  results: GenerationResult[]
  /** status === 'failed' 时填充 */
  error?: string
  createdAt: number
  finishedAt?: number
}

// ---------- UI 选项描述符 ----------

export type ModelBadge = 'new' | 'fast' | 'pro'

export interface ModelOption {
  id: string
  /** 展示名，如「即梦图片 3.0」 */
  name: string
  mode: GenerationMode
  description: string
  badge?: ModelBadge
}

export interface PromptPreset {
  label: string
  prompt: string
}

// ---------- 服务层传输类型 ----------

export interface SubmitTaskResponse {
  taskId: string
}

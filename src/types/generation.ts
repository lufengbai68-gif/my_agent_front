/**
 * 领域类型 —— 全项目唯一契约来源。
 * api/ 与 components/ 均从此处导入，禁止反向依赖。
 */

// ---------- 基础字面量 ----------

export type GenerationMode = 'image' | 'video'

export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

export type AspectRatio = 'auto' | '1:1' | '2:3' | '3:4' | '4:3' | '3:2' | '16:9' | '9:16' | '21:9'

export type ImageResolution = '1K' | '2K' | '4K'

export type VideoResolution = '720P' | '1080P' | '2K'

export type MotionLevel = 'static' | 'smooth' | 'dynamic'

export type VideoGenerationType = 'first_last_frame' | 'all_in_one'

// ---------- 请求（以 mode 判别的联合类型）----------

export interface ImageGenerationRequest {
  mode: 'image'
  prompt: string
  /** 模型 id，见 constants/options.ts */
  model: string
  aspectRatio: AspectRatio
  resolution: ImageResolution
  count: 1 | 2 | 4
  seed?: number
  /** 携带参考图即为图生图 */
  referenceImage?: ReferenceImage | null
}

/** 图生视频的参考图（dataUrl 为本地预览，由真实适配器决定上传方式） */
export type ReferenceImagePurpose = 'reference' | 'first_frame' | 'last_frame'

export type ReferenceImageRole = '' | 'subject' | 'style' | 'first_frame' | 'last_frame'

export interface ReferenceImage {
  /** 后端上传记录 ID */
  uploadId: string
  /** 输入框里的短引用，例如 img_1 */
  referenceId: string
  fileName: string
  url: string
  mimeType: string
  size: number
  width: number
  height: number
  expiresAt: number
}

export interface VideoGenerationRequest {
  mode: 'video'
  prompt: string
  model: string
  generationType?: VideoGenerationType
  aspectRatio: AspectRatio
  durationSec: 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  resolution: VideoResolution
  motion: MotionLevel
  /** 携带参考图即为图生视频 */
  referenceImage?: ReferenceImage | null
  /** 首尾帧模式的尾帧；仅 UI 支持，后端代理可按需透传 */
  lastFrame?: ReferenceImage | null
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
  /** 展示名，如「灵画图片 3.0」 */
  name: string
  mode: GenerationMode
  description: string
  badge?: ModelBadge
  capabilities?: {
    text: boolean
    image: boolean
    audio: boolean
    video: boolean
    file: boolean
  }
}

// ---------- 服务层传输类型 ----------

export interface SubmitTaskResponse {
  taskId: string
}

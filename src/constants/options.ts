import type {
  AspectRatio,
  ImageResolution,
  ModelOption,
  VideoGenerationType,
  VideoGenerationRequest,
  VideoResolution,
} from '../types/generation'

// ---------- 模型 ----------

export const IMAGE_MODELS: ModelOption[] = [
  {
    id: 'artvis-image-3.0',
    name: '灵画图片 3.0',
    mode: 'image',
    description: '画质细腻，语义理解强，适合海报与人像',
    badge: 'pro',
  },
  {
    id: 'artvis-image-2.1',
    name: '灵画图片 2.1',
    mode: 'image',
    description: '生成速度快，适合快速出草稿',
    badge: 'fast',
  },
  {
    id: 'general-v2',
    name: '通用 2.0',
    mode: 'image',
    description: '风格百搭，性价比之选',
  },
]

export const VIDEO_MODELS: ModelOption[] = [
  {
    id: 'artvis-video-3.0',
    name: '灵画视频 3.0',
    mode: 'video',
    description: '运动流畅，支持图生视频',
    badge: 'new',
  },
  {
    id: 'artvis-video-2.0',
    name: '灵画视频 2.0',
    mode: 'video',
    description: '画面稳定，适合风景与产品',
  },
]

// ---------- 视频类型 ----------

export interface VideoTypeOption {
  value: VideoGenerationType
  label: string
  icon: string
}

export const VIDEO_GENERATION_TYPES: VideoTypeOption[] = [
  {
    value: 'first_last_frame',
    label: '首尾帧',
    icon: '/icons/drama-image-black.svg',
  },
  {
    value: 'all_in_one',
    label: '全能模式',
    icon: '/icons/all-in-one-robot.svg',
  },
]

// ---------- 画幅 ----------

export interface AspectRatioOption {
  value: AspectRatio
  /** 宽/高，用于占位与 mock 出图尺寸 */
  ratio: number
  icon: string
}

export const IMAGE_ASPECT_RATIOS: AspectRatioOption[] = [
  { value: 'auto', ratio: 1, icon: 'Auto' },
  { value: '9:16', ratio: 9 / 16, icon: '9:16' },
  { value: '2:3', ratio: 2 / 3, icon: '2:3' },
  { value: '3:4', ratio: 3 / 4, icon: '3:4' },
  { value: '1:1', ratio: 1, icon: '1:1' },
  { value: '4:3', ratio: 4 / 3, icon: '4:3' },
  { value: '3:2', ratio: 3 / 2, icon: '3:2' },
  { value: '16:9', ratio: 16 / 9, icon: '16:9' },
  { value: '21:9', ratio: 21 / 9, icon: '21:9' },
]

export const VIDEO_ASPECT_RATIOS: AspectRatioOption[] = [
  { value: 'auto', ratio: 1, icon: 'Auto' },
  { value: '9:16', ratio: 9 / 16, icon: '9:16' },
  { value: '3:4', ratio: 3 / 4, icon: '3:4' },
  { value: '1:1', ratio: 1, icon: '1:1' },
  { value: '4:3', ratio: 4 / 3, icon: '4:3' },
  { value: '16:9', ratio: 16 / 9, icon: '16:9' },
  { value: '21:9', ratio: 21 / 9, icon: '21:9' },
]

export const IMAGE_RESOLUTIONS: Array<{ value: ImageResolution; label: string }> = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
]

export const VIDEO_RESOLUTIONS: Array<{ value: VideoResolution; label: string }> = [
  { value: '720P', label: '720P' },
  { value: '1080P', label: '1080P' },
  { value: '2K', label: '2K' },
]

export const VIDEO_DURATIONS: Array<{ value: VideoGenerationRequest['durationSec']; label: string }> = Array.from(
  { length: 9 },
  (_, index) => {
    const duration = (index + 4) as VideoGenerationRequest['durationSec']
    return { value: duration, label: `${duration}s` }
  },
)

/** 各画幅下 mock 出图的基准像素（长边 1280） */
export const ASPECT_PIXELS: Record<AspectRatio, { width: number; height: number }> = {
  auto: { width: 1024, height: 1024 },
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 854, height: 1280 },
  '4:3': { width: 1280, height: 960 },
  '3:4': { width: 960, height: 1280 },
  '3:2': { width: 1280, height: 854 },
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '21:9': { width: 1280, height: 549 },
}

export const MOTION_LEVELS: Array<{
  value: 'static' | 'smooth' | 'dynamic'
  label: string
}> = [
  { value: 'static', label: '静止' },
  { value: 'smooth', label: '平滑' },
  { value: 'dynamic', label: '强烈' },
]

// ---------- 图片数量 ----------

export const IMAGE_COUNTS: Array<1 | 2 | 4> = [1, 2, 4]

// ---------- Mock 素材 ----------

/** 公共 CORS 友好的示例视频，按 seed 取模选取 */
export const SAMPLE_VIDEO_URLS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
]

// ---------- 其他 ----------

export const PROMPT_MAX_LENGTH = 500

/** 图片生成参考图上限 */
export const REFERENCE_IMAGE_MAX_BYTES = 10 * 1024 * 1024

export const REFERENCE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

import type {
  AspectRatio,
  ModelOption,
  PromptPreset,
} from '../types/generation'

// ---------- 模型 ----------

export const IMAGE_MODELS: ModelOption[] = [
  {
    id: 'jimeng-image-3.0',
    name: '即梦图片 3.0',
    mode: 'image',
    description: '画质细腻，语义理解强，适合海报与人像',
    badge: 'pro',
  },
  {
    id: 'jimeng-image-2.1',
    name: '即梦图片 2.1',
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
    id: 'jimeng-video-3.0',
    name: '即梦视频 3.0',
    mode: 'video',
    description: '运动流畅，支持图生视频',
    badge: 'new',
  },
  {
    id: 'jimeng-video-2.0',
    name: '即梦视频 2.0',
    mode: 'video',
    description: '画面稳定，适合风景与产品',
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
  { value: '1:1', ratio: 1, icon: '1:1' },
  { value: '4:3', ratio: 4 / 3, icon: '4:3' },
  { value: '3:4', ratio: 3 / 4, icon: '3:4' },
  { value: '16:9', ratio: 16 / 9, icon: '16:9' },
  { value: '9:16', ratio: 9 / 16, icon: '9:16' },
]

export const VIDEO_ASPECT_RATIOS: Array<{
  value: Extract<AspectRatio, '16:9' | '9:16'>
  ratio: number
  icon: string
}> = [
  { value: '16:9', ratio: 16 / 9, icon: '16:9' },
  { value: '9:16', ratio: 9 / 16, icon: '9:16' },
]

/** 各画幅下 mock 出图的基准像素（长边 1280） */
export const ASPECT_PIXELS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1280, height: 960 },
  '3:4': { width: 960, height: 1280 },
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
}

// ---------- 视频参数 ----------

export const VIDEO_DURATIONS: Array<{ value: 5 | 10; label: string }> = [
  { value: 5, label: '5 秒' },
  { value: 10, label: '10 秒' },
]

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

// ---------- 预设提示词 ----------

export const IMAGE_PROMPT_PRESETS: PromptPreset[] = [
  {
    label: '赛博城市',
    prompt:
      '赛博朋克风格的城市夜景，霓虹灯倒映在雨后的街道上，远处高楼林立，电影感光效，超高清细节',
  },
  {
    label: '水彩猫咪',
    prompt:
      '一只橘猫趴在窗台上晒太阳，水彩画风格，柔和的暖色调，背景是虚化的花园，清新治愈',
  },
  {
    label: '国风山水',
    prompt:
      '中国水墨画风格，云雾缭绕的青色山峦，一叶扁舟行于江上，留白构图，意境悠远',
  },
]

export const VIDEO_PROMPT_PRESETS: PromptPreset[] = [
  {
    label: '海浪延时',
    prompt:
      '海浪拍打礁石的慢镜头，夕阳余晖洒在海面，水花飞溅细节清晰，电影级调色',
  },
  {
    label: '城市延时',
    prompt:
      '城市夜景延时摄影，车流光轨穿梭，云层快速流动，镜头缓慢推进，史诗感',
  },
  {
    label: '产品展示',
    prompt:
      '一只香水瓶在纯色背景上缓缓旋转，柔光打亮瓶身，光斑流动，商业广告质感',
  },
]

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
export const REFERENCE_IMAGE_MAX_BYTES = 5 * 1024 * 1024

export const REFERENCE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

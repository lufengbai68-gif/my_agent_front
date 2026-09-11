import { useCallback, useMemo, useState } from 'react'
import { GenerateButton } from './components/GenerateButton'
import { Header } from './components/Header'
import { ModeTabs } from './components/ModeTabs'
import { ParamPanel } from './components/ParamPanel'
import { PreviewModal } from './components/PreviewModal'
import { PromptInput } from './components/PromptInput'
import { ResultGrid } from './components/ResultGrid'
import {
  IMAGE_MODELS,
  IMAGE_PROMPT_PRESETS,
  VIDEO_MODELS,
  VIDEO_PROMPT_PRESETS,
} from './constants/options'
import { useGenerationTask } from './hooks/useGenerationTask'
import type {
  GenerationMode,
  GenerationRequest,
  GenerationResult,
  ImageGenerationRequest,
  VideoGenerationRequest,
} from './types/generation'

/** 各模式默认参数（App 内部使用，prompt 由独立 state 管理） */
const DEFAULT_IMAGE_PARAMS: ImageGenerationRequest = {
  mode: 'image',
  prompt: '',
  model: IMAGE_MODELS[0].id,
  aspectRatio: '1:1',
  count: 4,
}

const DEFAULT_VIDEO_PARAMS: VideoGenerationRequest = {
  mode: 'video',
  prompt: '',
  model: VIDEO_MODELS[0].id,
  aspectRatio: '16:9',
  durationSec: 5,
  motion: 'smooth',
  referenceImage: null,
}

/** 当前预览项 + 其在结果列表中的序号（用于下载命名） */
interface PreviewState {
  item: GenerationResult
  index: number
}

function App() {
  const [mode, setMode] = useState<GenerationMode>('image')
  // prompt 与参数分模式独立保存：切换 tab 不丢设置
  const [imagePrompt, setImagePrompt] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [imageParams, setImageParams] = useState(DEFAULT_IMAGE_PARAMS)
  const [videoParams, setVideoParams] = useState(DEFAULT_VIDEO_PARAMS)
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const { task, isBusy, submitError, submit, cancel, reset } = useGenerationTask()

  const prompt = mode === 'image' ? imagePrompt : videoPrompt
  const setPrompt = mode === 'image' ? setImagePrompt : setVideoPrompt
  const presets = mode === 'image' ? IMAGE_PROMPT_PRESETS : VIDEO_PROMPT_PRESETS

  const buildRequest = useCallback((): GenerationRequest | null => {
    if (!prompt.trim()) return null
    return mode === 'image'
      ? { ...imageParams, prompt: prompt.trim() }
      : { ...videoParams, prompt: prompt.trim() }
  }, [mode, prompt, imageParams, videoParams])

  const handleGenerate = useCallback(() => {
    const request = buildRequest()
    if (request) {
      setPreview(null)
      submit(request)
    }
  }, [buildRequest, submit])

  /** 重新生成 / 重试：复用上一任务的原始参数 */
  const handleRegenerate = useCallback(() => {
    if (!task) return
    setPreview(null)
    submit(task.request)
  }, [task, submit])

  const patchImageParams = useCallback((patch: Partial<ImageGenerationRequest>) => {
    setImageParams((prev) => ({ ...prev, ...patch }))
  }, [])

  const patchVideoParams = useCallback((patch: Partial<VideoGenerationRequest>) => {
    setVideoParams((prev) => ({ ...prev, ...patch }))
  }, [])

  const canGenerate = useMemo(
    () => prompt.trim().length > 0 && !isBusy,
    [prompt, isBusy],
  )

  return (
    <div className="jm-shell">
      <Header />

      <main className="jm-main">
        {/* 左栏：创作面板 */}
        <section className="jm-panel" aria-label="创作面板">
          <ModeTabs mode={mode} onChange={setMode} />
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            disabled={isBusy}
            presets={presets}
          />
          <ParamPanel
            mode={mode}
            imageParams={imageParams}
            videoParams={videoParams}
            onImageParamsChange={patchImageParams}
            onVideoParamsChange={patchVideoParams}
            disabled={isBusy}
          />
          {submitError && <p className="jm-submit-error">{submitError}</p>}
          <GenerateButton
            disabled={!canGenerate}
            isBusy={isBusy}
            onGenerate={handleGenerate}
            onCancel={cancel}
          />
        </section>

        {/* 右栏：画布 */}
        <section className="jm-canvas" aria-label="生成结果">
          <ResultGrid
            task={task}
            onPreview={(item) => {
              const index = task?.results.indexOf(item) ?? 0
              setPreview({ item, index })
            }}
            onRegenerate={handleRegenerate}
            onRetry={handleRegenerate}
          />
          {task?.status === 'succeeded' && (
            <div className="jm-canvas__footer">
              <button type="button" className="jm-btn-ghost" onClick={reset}>
                清空画布
              </button>
            </div>
          )}
        </section>
      </main>

      <PreviewModal
        item={preview?.item ?? null}
        taskId={task?.id ?? ''}
        index={preview?.index ?? 0}
        onClose={() => setPreview(null)}
        onRegenerate={handleRegenerate}
      />
    </div>
  )
}

export default App

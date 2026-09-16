import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConversationPanel } from './components/ConversationPanel'
import { HeroCard } from './components/HeroCard'
import { useConversation } from './hooks/useConversation'
import { useChatModels } from './hooks/useChatModels'
import type {
  GenerationMode,
  GenerationRequest,
  ImageGenerationRequest,
  VideoGenerationRequest,
} from './types/generation'

const DEFAULT_IMAGE_PARAMS: ImageGenerationRequest = {
  mode: 'image',
  prompt: '',
  model: '',
  aspectRatio: 'auto',
  resolution: '1K',
  count: 4,
  referenceImage: null,
}

const DEFAULT_VIDEO_PARAMS: VideoGenerationRequest = {
  mode: 'video',
  prompt: '',
  model: '',
  generationType: 'first_last_frame',
  aspectRatio: 'auto',
  durationSec: 5,
  resolution: '720P',
  motion: 'smooth',
  referenceImage: null,
  lastFrame: null,
}

function App() {
  const [mode, setMode] = useState<GenerationMode>('image')
  // prompt 与参数分模式独立保存：切换 tab 不丢设置
  const [imagePrompt, setImagePrompt] = useState('')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [imageParams, setImageParams] = useState(DEFAULT_IMAGE_PARAMS)
  const [videoParams, setVideoParams] = useState(DEFAULT_VIDEO_PARAMS)
  const { models: backendModels, isLoading: modelsLoading } = useChatModels()

  const imageModels = useMemo(
    () => backendModels.filter((model) => model.mode === 'image'),
    [backendModels],
  )
  const videoModels = useMemo(
    () => backendModels.filter((model) => model.mode === 'video'),
    [backendModels],
  )

  useEffect(() => {
    if (modelsLoading || backendModels.length === 0 || mode !== 'image') return
    if (imageModels.length === 0 && videoModels.length > 0) {
      setMode('video')
    }
  }, [backendModels.length, imageModels.length, mode, modelsLoading, videoModels.length])

  useEffect(() => {
    if (
      imageModels.length &&
      !imageModels.some((model) => model.id === imageParams.model)
    ) {
      setImageParams((prev) => ({ ...prev, model: imageModels[0].id }))
    }
  }, [imageModels, imageParams.model])

  useEffect(() => {
    if (
      videoModels.length &&
      !videoModels.some((model) => model.id === videoParams.model)
    ) {
      setVideoParams((prev) => ({ ...prev, model: videoModels[0].id }))
    }
  }, [videoModels, videoParams.model])

  const {
    messages,
    isBusy,
    submitMessage,
    cancelMessage,
  } = useConversation()

  const prompt = mode === 'image' ? imagePrompt : videoPrompt
  const setPrompt = mode === 'image' ? setImagePrompt : setVideoPrompt
  const hasConversation = messages.length > 0

  const buildRequest = useCallback((): GenerationRequest | null => {
    if (!prompt.trim()) return null
    return mode === 'image'
      ? { ...imageParams, prompt: prompt.trim() }
      : { ...videoParams, prompt: prompt.trim() }
  }, [mode, prompt, imageParams, videoParams])

  const handleGenerate = useCallback(() => {
    const request = buildRequest()
    if (request) {
      submitMessage(request)
      setPrompt('')
    }
  }, [buildRequest, submitMessage, setPrompt])

  /** 重新生成 / 重试：复用消息中的原始参数 */
  const handleRegenerate = useCallback((request: GenerationRequest) => {
    if (isBusy) return
    submitMessage(request)
  }, [isBusy, submitMessage])

  const handleEditRequest = useCallback((request: GenerationRequest) => {
    if (request.mode === 'image') {
      setMode('image')
      setImagePrompt(request.prompt)
      setImageParams(request)
      return
    }

    setMode('video')
    setVideoPrompt(request.prompt)
    setVideoParams({
      ...DEFAULT_VIDEO_PARAMS,
      ...request,
      generationType: request.generationType ?? 'first_last_frame',
    })
  }, [])

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
      <main className={`jm-main ${hasConversation ? 'is-conversation' : ''}`}>
        {/* 对话结果：按用户/模型流式展示 */}
        {hasConversation && (
          <ConversationPanel
            messages={messages}
          onEditRequest={handleEditRequest}
          onRegenerate={handleRegenerate}
          onRetry={handleRegenerate}
        />
        )}

        {/* 创作入口 */}
        <HeroCard
          mode={mode}
          onModeChange={setMode}
          prompt={prompt}
          onPromptChange={setPrompt}
          imageParams={imageParams}
          videoParams={videoParams}
          imageModels={imageModels}
          videoModels={videoModels}
          modelsLoading={modelsLoading}
          onImageParamsChange={patchImageParams}
          onVideoParamsChange={patchVideoParams}
          isBusy={isBusy}
          canGenerate={canGenerate}
          onGenerate={handleGenerate}
          onCancel={cancelMessage}
          hasConversation={hasConversation}
        />
      </main>

    </div>
  )
}

export default App

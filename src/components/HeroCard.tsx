import type {
  GenerationMode,
  ImageGenerationRequest,
  ModelOption,
  VideoGenerationRequest,
} from '../types/generation'
import { FrameUploaders } from './FrameUploaders'
import { GenerateButton } from './GenerateButton'
import { ImageUploader } from './ImageUploader'
import { ParamPanel } from './ParamPanel'
import { PromptInput } from './PromptInput'
import type { ReferenceImage } from '../types/generation'

interface HeroCardProps {
  mode: GenerationMode
  onModeChange: (mode: GenerationMode) => void
  prompt: string
  onPromptChange: (value: string) => void
  imageParams: ImageGenerationRequest
  videoParams: VideoGenerationRequest
  imageModels: ModelOption[]
  videoModels: ModelOption[]
  modelsLoading?: boolean
  onImageParamsChange: (patch: Partial<ImageGenerationRequest>) => void
  onVideoParamsChange: (patch: Partial<VideoGenerationRequest>) => void
  isBusy: boolean
  canGenerate: boolean
  onGenerate: () => void
  onCancel: () => void
  hasConversation?: boolean
}

/** 居中创作入口卡片：提示词画布 + 底部参数栏 + 生成 */
export function HeroCard({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  imageParams,
  videoParams,
  imageModels,
  videoModels,
  modelsLoading = false,
  onImageParamsChange,
  onVideoParamsChange,
  isBusy,
  canGenerate,
  onGenerate,
  onCancel,
  hasConversation = false,
}: HeroCardProps) {
  const usesFrameUploaders =
    mode === 'video' && videoParams.generationType !== 'all_in_one'
  const removeReferenceToken = (fileName: string) => {
    onPromptChange(
      prompt
        .replace(new RegExp(`@${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'), '')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    )
  }

  const attachments =
    mode === 'image' || (mode === 'video' && !usesFrameUploaders) ? (
      <div className="jm-image-reference">
        <ImageUploader
          className="jm-uploader--image"
          value={
            mode === 'image'
              ? imageParams.referenceImage ?? null
              : videoParams.referenceImage ?? null
          }
          referenceId="img_1"
          purpose="reference"
          onChange={(referenceImage) => {
            if (mode === 'image') {
              onImageParamsChange({ referenceImage })
              if (!referenceImage && imageParams.referenceImage) {
                removeReferenceToken(imageParams.referenceImage.fileName)
              }
            } else {
              onVideoParamsChange({ referenceImage })
              if (!referenceImage && videoParams.referenceImage) {
                removeReferenceToken(videoParams.referenceImage.fileName)
              }
            }
          }}
          disabled={isBusy}
          title="上传参考图"
        />
      </div>
    ) : usesFrameUploaders ? (
      <FrameUploaders
        firstFrame={videoParams.referenceImage ?? null}
        lastFrame={videoParams.lastFrame ?? null}
          onFirstFrameChange={(referenceImage) => {
            onVideoParamsChange({ referenceImage })
            if (!referenceImage && videoParams.referenceImage) {
              removeReferenceToken(videoParams.referenceImage.fileName)
            }
          }}
        onLastFrameChange={(lastFrame) => {
          onVideoParamsChange({ lastFrame })
          if (!lastFrame && videoParams.lastFrame) {
            removeReferenceToken(videoParams.lastFrame.fileName)
          }
        }}
        disabled={isBusy}
      />
    ) : undefined

  return (
    <section
      className={`jm-hero ${hasConversation ? 'jm-hero--conversation' : ''}`}
      aria-label="创作入口"
    >
      {!hasConversation && (
        <h1 className="jm-hero__title">
          <span>释放您的创造力，</span>
          <em>立即将想法变为现实！</em>
        </h1>
      )}
      <div
        className={`jm-hero-card ${
          hasConversation ? 'jm-hero-card--conversation' : ''
        }`}
      >
        <PromptInput
          value={prompt}
          onChange={onPromptChange}
          disabled={isBusy}
          onSubmit={canGenerate ? onGenerate : undefined}
          attachments={attachments}
          attachmentsLabel={!usesFrameUploaders ? '上传参考图' : '首尾帧上传'}
          references={
            !usesFrameUploaders
              ? (mode === 'image'
                  ? imageParams.referenceImage
                  : videoParams.referenceImage)
                ? [mode === 'image' ? imageParams.referenceImage : videoParams.referenceImage]
                  .filter((image): image is ReferenceImage => Boolean(image))
                : []
              : [videoParams.referenceImage, videoParams.lastFrame].filter(
                  (image): image is ReferenceImage => Boolean(image),
                )
          }
        />
        <div className="jm-hero-card__footer">
          <ParamPanel
            mode={mode}
            onModeChange={onModeChange}
          imageParams={imageParams}
          videoParams={videoParams}
          imageModels={imageModels}
          videoModels={videoModels}
          modelsLoading={modelsLoading}
            onImageParamsChange={onImageParamsChange}
            onVideoParamsChange={onVideoParamsChange}
          disabled={isBusy}
        />
        <GenerateButton
            disabled={!canGenerate}
            isBusy={isBusy}
            onGenerate={onGenerate}
            onCancel={onCancel}
          />
        </div>
      </div>
    </section>
  )
}

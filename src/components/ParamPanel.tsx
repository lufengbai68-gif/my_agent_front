import { VIDEO_GENERATION_TYPES } from '../constants/options'
import { SettingsModal } from './SettingsModal'
import type {
  GenerationMode,
  ImageGenerationRequest,
  ModelOption,
  VideoGenerationRequest,
  VideoGenerationType,
} from '../types/generation'
import { useEffect, useRef, useState } from 'react'

interface ParamPanelProps {
  mode: 'image' | 'video'
  onModeChange: (mode: GenerationMode) => void
  imageParams: ImageGenerationRequest
  videoParams: VideoGenerationRequest
  imageModels: ModelOption[]
  videoModels: ModelOption[]
  modelsLoading?: boolean
  onImageParamsChange: (patch: Partial<ImageGenerationRequest>) => void
  onVideoParamsChange: (patch: Partial<VideoGenerationRequest>) => void
  disabled?: boolean
}

const BADGE_LABELS: Record<string, string> = {
  new: 'NEW',
  fast: '极速',
  pro: 'PRO',
}

const MODE_OPTIONS: Array<{
  value: GenerationMode
  label: string
  icon: string
}> = [
  { value: 'image', label: '图片生成', icon: '/icons/mode-image-generation.svg' },
  { value: 'video', label: '视频生成', icon: '/icons/mode-video-generation.svg' },
]

const VIDEO_TYPE_OPTIONS = VIDEO_GENERATION_TYPES

function ModeSelect({
  value,
  onChange,
  disabled,
}: {
  value: GenerationMode
  onChange: (mode: GenerationMode) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedMode = MODE_OPTIONS.find((option) => option.value === value)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen])

  return (
    <div className={`jm-mode ${isOpen ? 'is-open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="jm-mode__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <img
          className="jm-mode__icon"
          src={selectedMode?.icon}
          alt=""
          aria-hidden="true"
        />
        <span className="jm-mode__label">{selectedMode?.label}</span>
        {isOpen ? (
          <svg
            className="jm-mode__arrow"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.4697 7.96973C11.7626 7.67684 12.2373 7.67684 12.5302 7.96973L19.5302 14.9697C19.823 15.2626 19.8231 15.7374 19.5302 16.0303C19.2374 16.3231 18.7626 16.3231 18.4697 16.0303L11.9999 9.56055L5.53022 16.0303C5.23736 16.3231 4.76257 16.3231 4.46967 16.0303C4.17678 15.7374 4.17678 15.2626 4.46967 14.9697L11.4697 7.96973Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg
            className="jm-mode__arrow"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M18.4697 7.96973C18.7626 7.67684 19.2373 7.67684 19.5302 7.96973C19.823 8.26263 19.8231 8.73742 19.5302 9.03028L12.5302 16.0303C12.2374 16.3231 11.7626 16.3231 11.4697 16.0303L4.46967 9.03028C4.17678 8.73738 4.17678 8.26262 4.46967 7.96973C4.76256 7.67684 5.23732 7.67684 5.53022 7.96973L11.9999 14.4395L18.4697 7.96973Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
      {isOpen && (
        <div className="jm-mode__menu" role="listbox" aria-label="选择生成模式">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`jm-mode__option ${value === option.value ? 'is-active' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <img
                className="jm-mode__option-icon"
                src={option.icon}
                alt=""
                aria-hidden="true"
              />
              {option.label}
              {value === option.value && (
                <img
                  className="jm-mode__option-check"
                  src="/icons/select-check.svg"
                  alt=""
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ModelSelect({
  models,
  value,
  onChange,
  disabled,
  loading = false,
}: {
  models: ModelOption[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  loading?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedModel = models.find((model) => model.id === value)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen])

  return (
    <div className={`jm-mode jm-model ${isOpen ? 'is-open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="jm-mode__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={selectedModel?.description}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="jm-mode__label">
          {selectedModel?.name ??
            (loading
              ? '加载模型…'
              : models.length
                ? '选择模型'
                : '暂无可用模型')}
        </span>
        {isOpen ? (
          <svg
            className="jm-mode__arrow"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.4697 7.96973C11.7626 7.67684 12.2373 7.67684 12.5302 7.96973L19.5302 14.9697C19.823 15.2626 19.8231 15.7374 19.5302 16.0303C19.2374 16.3231 18.7626 16.3231 18.4697 16.0303L11.9999 9.56055L5.53022 16.0303C5.23736 16.3231 4.76257 16.3231 4.46967 16.0303C4.17678 15.7374 4.17678 15.2626 4.46967 14.9697L11.4697 7.96973Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg
            className="jm-mode__arrow"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M18.4697 7.96973C18.7626 7.67684 19.2373 7.67684 19.5302 7.96973C19.823 8.26263 19.8231 8.73742 19.5302 9.03028L12.5302 16.0303C12.2374 16.3231 11.7626 16.3231 11.4697 16.0303L4.46967 9.03028C4.17678 8.73738 4.17678 8.26262 4.46967 7.96973C4.76256 7.67684 5.23732 7.67684 5.53022 7.96973L11.9999 14.4395L18.4697 7.96973Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
      {isOpen && (
        <div className="jm-mode__menu" role="listbox" aria-label="选择模型">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              role="option"
              aria-selected={value === model.id}
              title={model.description}
              className={`jm-mode__option ${value === model.id ? 'is-active' : ''}`}
              onClick={() => {
                onChange(model.id)
                setIsOpen(false)
              }}
            >
              <span className="jm-mode__option-text">
                {model.name}
                {model.badge ? `（${BADGE_LABELS[model.badge]}）` : ''}
              </span>
              {value === model.id && (
                <img
                  className="jm-mode__option-check"
                  src="/icons/select-check.svg"
                  alt=""
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function VideoTypeSelect({
  value,
  onChange,
  disabled,
}: {
  value?: VideoGenerationType
  onChange: (value: VideoGenerationType) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentValue = value ?? VIDEO_TYPE_OPTIONS[0].value
  const selectedType = VIDEO_TYPE_OPTIONS.find((option) => option.value === currentValue)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  return (
    <div className={`jm-mode ${isOpen ? 'is-open' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="jm-mode__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="选择视频类型"
        onClick={() => setIsOpen((open) => !open)}
      >
        <img
          className="jm-mode__icon"
          src="/icons/video-type-select.svg"
          alt=""
          aria-hidden="true"
        />
        <span className="jm-mode__label">{selectedType?.label}</span>
        {isOpen ? (
          <svg
            className="jm-mode__arrow"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.4697 7.96973C11.7626 7.67684 12.2373 7.67684 12.5302 7.96973L19.5302 14.9697C19.823 15.2626 19.8231 15.7374 19.5302 16.0303C19.2374 16.3231 18.4697 16.3231 18.4697 16.0303L11.9999 9.56055L5.53022 16.0303C5.23736 16.3231 4.46967 16.0303 4.46967 16.0303C4.17678 15.7374 4.17678 15.2626 4.46967 14.9697L11.4697 7.96973Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg
            className="jm-mode__arrow"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M18.4697 7.96973C18.7626 7.67684 19.2373 7.67684 19.5302 7.96973C19.823 8.26263 19.8231 8.73742 19.5302 9.03028L12.5302 16.0303C12.2374 16.3231 11.4697 16.0303 11.4697 16.0303L4.46967 9.03028C4.17678 8.73738 4.17678 8.26262 4.46967 7.96973C4.76256 7.67684 5.23732 7.67684 5.53022 7.96973L11.9999 14.4395L18.4697 7.96973Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
      {isOpen && (
        <div className="jm-mode__menu" role="listbox" aria-label="选择视频类型">
          {VIDEO_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={currentValue === option.value}
              className={`jm-mode__option ${currentValue === option.value ? 'is-active' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <img
                className="jm-mode__option-icon"
                src={option.icon}
                alt=""
                aria-hidden="true"
              />
              {option.label}
              {currentValue === option.value && (
                <img
                  className="jm-mode__option-check"
                  src="/icons/select-check.svg"
                  alt=""
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ParamPanel({
  mode,
  onModeChange,
  imageParams,
  videoParams,
  onImageParamsChange,
  onVideoParamsChange,
  imageModels,
  videoModels,
  modelsLoading = false,
  disabled,
}: ParamPanelProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const imageSummary = `${imageParams.aspectRatio}｜${imageParams.resolution}`
  const videoSummary = `${videoParams.aspectRatio}｜${videoParams.durationSec}s｜${videoParams.resolution}`

  return (
    <>
      <div className="jm-params">
        <ModeSelect
          value={mode}
          onChange={onModeChange}
          disabled={disabled}
        />
        {mode === 'image' ? (
          <ModelSelect
            models={imageModels}
            value={imageParams.model}
            onChange={(model) => onImageParamsChange({ model })}
            disabled={disabled || modelsLoading}
            loading={modelsLoading}
          />
        ) : (
          <ModelSelect
            models={videoModels}
            value={videoParams.model}
            onChange={(model) => onVideoParamsChange({ model })}
            disabled={disabled || modelsLoading}
            loading={modelsLoading}
          />
        )}
        {mode === 'video' && (
          <VideoTypeSelect
            value={videoParams.generationType ?? VIDEO_GENERATION_TYPES[0].value}
            onChange={(generationType) => onVideoParamsChange({ generationType })}
            disabled={disabled}
          />
        )}
        <button
          type="button"
          className="jm-settings__trigger"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-label={`打开设置，当前参数：${mode === 'image' ? imageSummary : videoSummary}`}
          onClick={() => setSettingsOpen(true)}
        >
          <img src="/icons/video-type-select-open.svg" alt="" aria-hidden="true" />
          {(mode === 'image'
            ? imageSummary.split('｜')
            : videoSummary.split('｜')
          ).map((value) => (
            <span key={value} className="jm-settings__value">
              {value}
            </span>
          ))}
        </button>
      </div>
      {settingsOpen && (
        <SettingsModal
          mode={mode}
          imageParams={imageParams}
          videoParams={videoParams}
          onImageParamsChange={onImageParamsChange}
          onVideoParamsChange={onVideoParamsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}

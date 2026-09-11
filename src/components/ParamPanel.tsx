import {
  IMAGE_ASPECT_RATIOS,
  IMAGE_COUNTS,
  IMAGE_MODELS,
  MOTION_LEVELS,
  VIDEO_ASPECT_RATIOS,
  VIDEO_DURATIONS,
  VIDEO_MODELS,
} from '../constants/options'
import type {
  ImageGenerationRequest,
  ModelOption,
  VideoGenerationRequest,
} from '../types/generation'
import { ImageUploader } from './ImageUploader'

interface ParamPanelProps {
  mode: 'image' | 'video'
  imageParams: ImageGenerationRequest
  videoParams: VideoGenerationRequest
  onImageParamsChange: (patch: Partial<ImageGenerationRequest>) => void
  onVideoParamsChange: (patch: Partial<VideoGenerationRequest>) => void
  disabled?: boolean
}

const BADGE_LABELS: Record<string, string> = {
  new: 'NEW',
  fast: '极速',
  pro: 'PRO',
}

function ModelSelect({
  models,
  value,
  onChange,
  disabled,
}: {
  models: ModelOption[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}) {
  return (
    <div className="jm-field">
      <span className="jm-field__label">模型</span>
      <div className="jm-model-select">
        <select
          className="jm-model-select__control"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.badge ? `（${BADGE_LABELS[m.badge]}）` : ''}
            </option>
          ))}
        </select>
        <p className="jm-model-select__desc">
          {models.find((m) => m.id === value)?.description}
        </p>
      </div>
    </div>
  )
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <div className="jm-segmented" role="radiogroup">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`jm-segmented__item ${value === opt.value ? 'is-active' : ''}`}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function ParamPanel({
  mode,
  imageParams,
  videoParams,
  onImageParamsChange,
  onVideoParamsChange,
  disabled,
}: ParamPanelProps) {
  return (
    <div className="jm-params">
      {mode === 'image' ? (
        <>
          <ModelSelect
            models={IMAGE_MODELS}
            value={imageParams.model}
            onChange={(model) => onImageParamsChange({ model })}
            disabled={disabled}
          />
          <div className="jm-field">
            <span className="jm-field__label">画幅</span>
            <SegmentedControl
              options={IMAGE_ASPECT_RATIOS.map((r) => ({
                value: r.value,
                label: r.icon,
              }))}
              value={imageParams.aspectRatio}
              onChange={(aspectRatio) => onImageParamsChange({ aspectRatio })}
              disabled={disabled}
            />
          </div>
          <div className="jm-field">
            <span className="jm-field__label">生成数量</span>
            <SegmentedControl
              options={IMAGE_COUNTS.map((c) => ({ value: c, label: `${c} 张` }))}
              value={imageParams.count}
              onChange={(count) => onImageParamsChange({ count })}
              disabled={disabled}
            />
          </div>
        </>
      ) : (
        <>
          <ModelSelect
            models={VIDEO_MODELS}
            value={videoParams.model}
            onChange={(model) => onVideoParamsChange({ model })}
            disabled={disabled}
          />
          <div className="jm-field">
            <span className="jm-field__label">画幅</span>
            <SegmentedControl
              options={VIDEO_ASPECT_RATIOS.map((r) => ({
                value: r.value,
                label: r.icon,
              }))}
              value={videoParams.aspectRatio}
              onChange={(aspectRatio) => onVideoParamsChange({ aspectRatio })}
              disabled={disabled}
            />
          </div>
          <div className="jm-field">
            <span className="jm-field__label">时长</span>
            <SegmentedControl
              options={VIDEO_DURATIONS.map((d) => ({ value: d.value, label: d.label }))}
              value={videoParams.durationSec}
              onChange={(durationSec) => onVideoParamsChange({ durationSec })}
              disabled={disabled}
            />
          </div>
          <div className="jm-field">
            <span className="jm-field__label">运动强度</span>
            <SegmentedControl
              options={MOTION_LEVELS.map((m) => ({ value: m.value, label: m.label }))}
              value={videoParams.motion}
              onChange={(motion) => onVideoParamsChange({ motion })}
              disabled={disabled}
            />
          </div>
          <ImageUploader
            value={videoParams.referenceImage ?? null}
            onChange={(referenceImage) => onVideoParamsChange({ referenceImage })}
            disabled={disabled}
          />
        </>
      )}
    </div>
  )
}

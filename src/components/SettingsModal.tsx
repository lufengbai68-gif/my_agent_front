import {
  IMAGE_ASPECT_RATIOS,
  IMAGE_RESOLUTIONS,
  VIDEO_ASPECT_RATIOS,
  VIDEO_DURATIONS,
  VIDEO_RESOLUTIONS,
} from '../constants/options'
import type {
  GenerationMode,
  ImageGenerationRequest,
  VideoGenerationRequest,
} from '../types/generation'

interface SettingsModalProps {
  mode: GenerationMode
  imageParams: ImageGenerationRequest
  videoParams: VideoGenerationRequest
  onImageParamsChange: (patch: Partial<ImageGenerationRequest>) => void
  onVideoParamsChange: (patch: Partial<VideoGenerationRequest>) => void
  onClose: () => void
}

function OptionGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="jm-settings__group">
      <h3 className="jm-settings__group-title">{label}</h3>
      <div className="jm-settings__options">{children}</div>
    </section>
  )
}

function RatioButton({
  value,
  label,
  ratio,
  active,
  onSelect,
}: {
  value: string
  label: string
  ratio: number
  active: boolean
  onSelect: () => void
}) {
  const shapeWidth = ratio >= 1 ? 18 : 18 * ratio
  const shapeHeight = ratio >= 1 ? 18 / ratio : 18

  return (
    <button
      key={value}
      type="button"
      className={`jm-settings__option ${active ? 'is-active' : ''}`}
      aria-checked={active}
      role="radio"
      onClick={onSelect}
    >
      <span className="jm-settings__ratio-box">
        {value === 'auto' ? (
          <img
            className="jm-settings__ratio-icon"
            src="/icons/input-auto.svg"
            alt=""
            aria-hidden="true"
          />
        ) : (
          <span
            className="jm-settings__ratio-shape"
            style={{
              width: `${shapeWidth}px`,
              height: `${shapeHeight}px`,
            }}
          />
        )}
      </span>
      <span className="jm-settings__option-label">{label}</span>
    </button>
  )
}

function TextButton({
  value,
  label,
  active,
  onSelect,
}: {
  value: string | number
  label: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      key={value}
      type="button"
      className={`jm-settings__option ${active ? 'is-active' : ''}`}
      aria-checked={active}
      role="radio"
      onClick={onSelect}
    >
      {label}
    </button>
  )
}

export function SettingsModal({
  mode,
  imageParams,
  videoParams,
  onImageParamsChange,
  onVideoParamsChange,
  onClose,
}: SettingsModalProps) {
  const isImage = mode === 'image'

  return (
    <div
      className="jm-settings"
      role="dialog"
      aria-modal="true"
      aria-label="生成设置"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="jm-settings__panel">
        <header className="jm-settings__header">
          <h2>设置</h2>
        </header>

        <OptionGroup label="比例">
          {(isImage ? IMAGE_ASPECT_RATIOS : VIDEO_ASPECT_RATIOS).map((option) => (
            <RatioButton
              key={option.value}
              value={option.value}
              label={option.icon}
              ratio={option.ratio}
              active={
                isImage
                  ? imageParams.aspectRatio === option.value
                  : videoParams.aspectRatio === option.value
              }
              onSelect={() =>
                isImage
                  ? onImageParamsChange({ aspectRatio: option.value })
                  : onVideoParamsChange({ aspectRatio: option.value })
              }
            />
          ))}
        </OptionGroup>

        {isImage ? (
          <OptionGroup label="分辨率">
            {IMAGE_RESOLUTIONS.map((option) => (
              <TextButton
                key={option.value}
                value={option.value}
                label={option.label}
                active={imageParams.resolution === option.value}
                onSelect={() => onImageParamsChange({ resolution: option.value })}
              />
            ))}
          </OptionGroup>
        ) : (
          <>
            <OptionGroup label="时长">
              {VIDEO_DURATIONS.map((option) => (
                <TextButton
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  active={videoParams.durationSec === option.value}
                  onSelect={() => onVideoParamsChange({ durationSec: option.value })}
                />
              ))}
            </OptionGroup>
            <OptionGroup label="分辨率">
              {VIDEO_RESOLUTIONS.map((option) => (
                <TextButton
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  active={videoParams.resolution === option.value}
                  onSelect={() => onVideoParamsChange({ resolution: option.value })}
                />
              ))}
            </OptionGroup>
          </>
        )}
      </div>
    </div>
  )
}

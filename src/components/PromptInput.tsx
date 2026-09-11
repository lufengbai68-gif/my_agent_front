import { PROMPT_MAX_LENGTH } from '../constants/options'
import type { PromptPreset } from '../types/generation'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  presets: PromptPreset[]
}

export function PromptInput({ value, onChange, disabled, presets }: PromptInputProps) {
  return (
    <div className="jm-prompt">
      <label className="jm-field__label" htmlFor="jm-prompt-input">
        创意描述
      </label>
      <textarea
        id="jm-prompt-input"
        className="jm-prompt__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, PROMPT_MAX_LENGTH))}
        placeholder="描述你想要的画面，例如：赛博朋克风格的城市夜景，霓虹灯倒映在雨后的街道上…"
        rows={5}
        disabled={disabled}
      />
      <div className="jm-prompt__meta">
        <div className="jm-prompt__presets">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="jm-chip"
              title={preset.prompt}
              disabled={disabled}
              onClick={() => onChange(preset.prompt)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <span className="jm-prompt__counter">
          {value.length}/{PROMPT_MAX_LENGTH}
        </span>
      </div>
    </div>
  )
}

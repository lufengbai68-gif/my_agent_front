import type { GenerationMode } from '../types/generation'

const TABS: Array<{ value: GenerationMode; label: string; icon: string }> = [
  { value: 'image', label: '图片生成', icon: '🖼' },
  { value: 'video', label: '视频生成', icon: '🎬' },
]

interface ModeTabsProps {
  mode: GenerationMode
  onChange: (mode: GenerationMode) => void
}

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div className="jm-tabs" role="tablist" aria-label="生成模式">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={mode === tab.value}
          className={`jm-tabs__item ${mode === tab.value ? 'is-active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          <span className="jm-tabs__icon" aria-hidden="true">
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

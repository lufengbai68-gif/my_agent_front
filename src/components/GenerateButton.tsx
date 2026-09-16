interface GenerateButtonProps {
  disabled: boolean
  isBusy: boolean
  onGenerate: () => void
  onCancel: () => void
}

export function GenerateButton({
  disabled,
  isBusy,
  onGenerate,
  onCancel,
}: GenerateButtonProps) {
  if (isBusy) {
    return (
      <button
        type="button"
        className="jm-btn-generate is-busy"
        onClick={onCancel}
        aria-label="取消生成"
      >
        <img src="/icons/input-stop.svg" alt="" aria-hidden="true" />
      </button>
    )
  }
  return (
    <button
      type="button"
      className="jm-btn-generate"
      disabled={disabled}
      aria-label="立即生成"
      onClick={onGenerate}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

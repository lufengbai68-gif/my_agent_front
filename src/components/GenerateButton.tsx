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
      <img src="/icons/input-up-current.svg" alt="" aria-hidden="true" />
    </button>
  )
}

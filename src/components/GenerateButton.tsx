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
      >
        <span className="jm-spinner" aria-hidden="true" />
        取消生成
      </button>
    )
  }
  return (
    <button
      type="button"
      className="jm-btn-generate"
      disabled={disabled}
      onClick={onGenerate}
    >
      ✨ 立即生成
    </button>
  )
}

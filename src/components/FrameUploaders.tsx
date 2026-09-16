import type { ReferenceImage } from '../types/generation'
import { ImageUploader } from './ImageUploader'

interface FrameUploadersProps {
  firstFrame: ReferenceImage | null
  lastFrame: ReferenceImage | null
  onFirstFrameChange: (image: ReferenceImage | null) => void
  onLastFrameChange: (image: ReferenceImage | null) => void
  disabled?: boolean
}

export function FrameUploaders({
  firstFrame,
  lastFrame,
  onFirstFrameChange,
  onLastFrameChange,
  disabled,
}: FrameUploadersProps) {
  const swap = () => {
    const nextFirst = lastFrame
      ? { ...lastFrame, referenceId: 'img_1' }
      : null
    const nextLast = firstFrame
      ? { ...firstFrame, referenceId: 'img_2' }
      : null
    onLastFrameChange(nextLast)
    onFirstFrameChange(nextFirst)
  }

  return (
    <div className="jm-frame-group">
      <label className="jm-frame-slot">
        <ImageUploader
          value={firstFrame}
          onChange={onFirstFrameChange}
          disabled={disabled}
          label="首帧"
          referenceId="img_1"
          purpose="first_frame"
        />
      </label>
      <button
        type="button"
        className="jm-frame-swap"
        aria-label="交换首尾帧"
        disabled={disabled || (!firstFrame && !lastFrame)}
        onClick={swap}
      >
        ⇄
      </button>
      <label className="jm-frame-slot">
        <ImageUploader
          value={lastFrame}
          onChange={onLastFrameChange}
          disabled={disabled}
          label="尾帧"
          referenceId="img_2"
          purpose="last_frame"
        />
      </label>
    </div>
  )
}

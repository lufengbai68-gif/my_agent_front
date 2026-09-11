import type { VideoTaskResult } from '../types/generation'
import { buildFileName, downloadUrl } from '../utils/download'

interface VideoCardProps {
  result: VideoTaskResult
  taskId: string
  index: number
  onPreview: (result: VideoTaskResult) => void
}

export function VideoCard({ result, taskId, index, onPreview }: VideoCardProps) {
  return (
    <figure className="jm-card jm-card--video">
      {/* controls + poster + muted + playsInline：无 autoplay 策略问题 */}
      <video
        className="jm-card__media"
        src={result.url}
        poster={result.posterUrl}
        controls
        muted
        playsInline
        preload="metadata"
      />
      <div className="jm-card__overlay jm-card__overlay--video">
        <button
          type="button"
          className="jm-card__action"
          onClick={() => onPreview(result)}
        >
          🔍 放大
        </button>
        <button
          type="button"
          className="jm-card__action"
          onClick={() =>
            void downloadUrl(result.url, buildFileName('video', taskId, index))
          }
        >
          ⬇ 下载
        </button>
      </div>
      <figcaption className="jm-card__badge">{result.durationSec}s</figcaption>
    </figure>
  )
}

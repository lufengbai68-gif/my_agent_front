import type { ImageTaskResult } from '../types/generation'
import { buildFileName, downloadUrl } from '../utils/download'

interface ImageCardProps {
  result: ImageTaskResult
  taskId: string
  index: number
  onPreview: (result: ImageTaskResult) => void
}

export function ImageCard({ result, taskId, index, onPreview }: ImageCardProps) {
  return (
    <figure className="jm-card">
      <img
        className="jm-card__media"
        src={result.url}
        alt={`生成结果 ${index + 1}`}
        width={result.width}
        height={result.height}
        loading="lazy"
      />
      <div className="jm-card__overlay">
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
            void downloadUrl(result.url, buildFileName('image', taskId, index))
          }
        >
          ⬇ 下载
        </button>
      </div>
    </figure>
  )
}

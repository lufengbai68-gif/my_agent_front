import { useEffect } from 'react'
import type { GenerationResult } from '../types/generation'
import { buildFileName, downloadUrl } from '../utils/download'

interface PreviewModalProps {
  item: GenerationResult | null
  taskId: string
  index: number
  onClose: () => void
  onRegenerate: () => void
}

/** 大图 / 全视频预览：Esc 与背景点击关闭 */
export function PreviewModal({
  item,
  taskId,
  index,
  onClose,
  onRegenerate,
}: PreviewModalProps) {
  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // 打开时锁定页面滚动
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [item, onClose])

  if (!item) return null

  return (
    <div
      className="jm-modal"
      role="dialog"
      aria-modal="true"
      aria-label="预览"
      onClick={onClose}
    >
      <div className="jm-modal__content" onClick={(e) => e.stopPropagation()}>
        {item.kind === 'image' ? (
          <img className="jm-modal__media" src={item.url} alt="预览" />
        ) : (
          <video
            className="jm-modal__media"
            src={item.url}
            poster={item.posterUrl}
            controls
            autoPlay
            muted
            playsInline
          />
        )}
        <div className="jm-modal__footer">
          <button
            type="button"
            className="jm-btn-primary"
            onClick={() =>
              void downloadUrl(item.url, buildFileName(item.kind, taskId, index))
            }
          >
            ⬇ 下载
          </button>
          <button
            type="button"
            className="jm-btn-ghost"
            onClick={() => {
              onClose()
              onRegenerate()
            }}
          >
            🔄 重新生成
          </button>
          <button type="button" className="jm-btn-ghost" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

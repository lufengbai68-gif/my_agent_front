import { ASPECT_PIXELS } from '../constants/options'
import type { GenerationResult, GenerationTask } from '../types/generation'
import { ImageCard } from './ImageCard'
import { TaskProgress } from './TaskProgress'
import { VideoCard } from './VideoCard'

interface ResultGridProps {
  task: GenerationTask
  onPreview: (result: GenerationResult) => void
  onRegenerate: () => void
  onRetry: () => void
}

/** 按所选画幅与数量生成 shimmer 占位 */
function Placeholders({ task }: { task: GenerationTask }) {
  const { request } = task
  const { width, height } = ASPECT_PIXELS[request.aspectRatio]
  const count = request.mode === 'image' ? request.count : 1
  return (
    <div className={`jm-grid ${count === 1 ? 'is-single' : ''}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="jm-shimmer"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      ))}
    </div>
  )
}

export function ResultGrid({
  task,
  onPreview,
  onRegenerate,
  onRetry,
}: ResultGridProps) {
  const { status } = task

  // ---- 进行中（含提交占位）----
  if (status === 'queued' || status === 'running' || task.id === 'pending') {
    return (
      <div className="jm-results jm-results--busy">
        <TaskProgress task={task} />
        <Placeholders task={task} />
      </div>
    )
  }

  // ---- 失败 / 取消 ----
  if (status === 'failed' || status === 'canceled') {
    return (
      <div className="jm-results jm-results--error">
        <div className="jm-error-card">
          <span className="jm-error-card__icon" aria-hidden="true">
            {status === 'failed' ? '⚠️' : '🚫'}
          </span>
          <h3>{status === 'failed' ? '生成失败' : '已取消生成'}</h3>
          <p>{task.error ?? (status === 'canceled' ? '任务已取消' : '请稍后重试')}</p>
          <div className="jm-error-card__actions">
            {status === 'failed' && (
              <button type="button" className="jm-btn-primary" onClick={onRetry}>
                重试
              </button>
            )}
            <button type="button" className="jm-btn-ghost" onClick={onRegenerate}>
              重新生成
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- 成功 ----
  const isImage = task.request.mode === 'image'
  return (
    <div className="jm-results">
      <div className="jm-results__bar">
        <span className="jm-results__meta">
          {task.statusMessage}
          {isImage ? ` · ${task.results.length} 张` : ' · 1 个视频'}
        </span>
        <button type="button" className="jm-btn-ghost" onClick={onRegenerate}>
          🔄 重新生成
        </button>
      </div>
      <div className={`jm-grid ${task.results.length === 1 ? 'is-single' : ''}`}>
        {task.results.map((result, i) =>
          result.kind === 'image' ? (
            <ImageCard
              key={`${result.url}-${i}`}
              result={result}
              taskId={task.id}
              index={i}
              onPreview={onPreview}
            />
          ) : (
            <VideoCard
              key={`${result.url}-${i}`}
              result={result}
              taskId={task.id}
              index={i}
              onPreview={onPreview}
            />
          ),
        )}
      </div>
    </div>
  )
}
